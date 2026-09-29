#include <Arduino.h>
#include <WiFi.h>
#include <cstring>
#include "config_storage.h"
#include "uart_protocol.h"
#include "wifi_manager.h"
#include "web_uploader.h"

#define PIN_ONBOARD_LED 2
#define PIN_GREEN_LED   21
#define PIN_RED_LED     22
#define PIN_BUZZER      23
#define STM32_HEARTBEAT_TIMEOUT_MS 30000UL
#define LOCAL_HEARTBEAT_INTERVAL_MS 15000UL
#define WIFI_RETRY_INTERVAL_MS 15000UL

HardwareSerial Safety(2); // GPIO16 RX2, GPIO17 TX2; TX2 is left physically unconnected in final mode.
WifiManager wifi;
Esp32Config cfg;
static uint32_t lastStm32HeartbeatMs = 0;
static uint32_t lastLocalHeartbeatMs = 0;
static uint32_t lastWifiAttemptMs = 0;
static bool lastPiActive = false;
static bool haveStm32Heartbeat = false;

static String resultFromPayload(const Stm32EventFrame& frame) {
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  int key = p.indexOf("\"result\"");
  if (key < 0) return "INVALID_RESULT";
  int colon = p.indexOf(':', key);
  int q1 = p.indexOf('"', colon + 1);
  int q2 = p.indexOf('"', q1 + 1);
  if (colon < 0 || q1 < 0 || q2 < 0) return "INVALID_RESULT";
  return p.substring(q1 + 1, q2);
}

static bool jsonBool(const Stm32EventFrame& frame, const char* key) {
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  String needle = String("\"") + key + "\":true";
  return p.indexOf(needle) >= 0;
}

static void processComponentHeartbeat(const Stm32EventFrame& frame) {
  haveStm32Heartbeat = true;
  lastStm32HeartbeatMs = millis();
  lastPiActive = jsonBool(frame, "raspberry_pi_active");
  Serial.print("COMPONENT_HEARTBEAT: STM32=ACTIVE PI=");
  Serial.println(lastPiActive ? "ACTIVE" : "NOT_DETECTED");
}

static void setIndicators(const String& result) {
  const bool verified = result == "MATCH" || result == "NEW_TARGET_REGISTERED" || result == "REFERENCE_UPDATED";
  const bool mismatch = result == "HASH_MISMATCH";
  const bool error = !verified && !mismatch;

  digitalWrite(PIN_GREEN_LED, verified ? HIGH : LOW);
  digitalWrite(PIN_RED_LED, (mismatch || error) ? HIGH : LOW);
  digitalWrite(PIN_ONBOARD_LED, mismatch ? HIGH : LOW);
  digitalWrite(PIN_BUZZER, (mismatch || error) ? HIGH : LOW);
}

static void handleCaProvisioning() {
  String pem;
  uint32_t deadline = millis() + 30000UL;
  while (millis() < deadline) {
    if (Serial.available()) {
      String line = Serial.readStringUntil('\n');
      line.trim();
      if (line == "CA_END") {
        cfg.caPem = pem;
        Serial.println("CA_CERT_RECEIVED");
        return;
      }
      pem += line;
      pem += '\n';
    } else {
      delay(5);
    }
  }
  Serial.println("CA_CERT_TIMEOUT");
}

static void handleUsbConsole() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.equalsIgnoreCase("CA_BEGIN")) {
    handleCaProvisioning();
    return;
  }
  processProvisioningCommand(cfg, line, Serial);
}

void setup() {
  pinMode(PIN_ONBOARD_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_ONBOARD_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.begin(115200);
  Safety.begin(115200, SERIAL_8N1, 16, 17);
  delay(200);

  Serial.println("FIVSED_ESP32_READY");
  Serial.println("ESP32 relay/controller only: no reference hash and no integrity decision");
  cfg = loadConfig();
  printConfig(cfg);

  // FIX: Allow Wi-Fi to connect as long as upload is enabled and SSID is set (no caPem requirement)
  if (cfg.uploadEnabled && !cfg.ssid.isEmpty()) {
    const bool ok = wifi.connect(cfg);
    Serial.println(ok ? "WIFI_CONNECTED" : "WIFI_CONNECT_FAILED");
    lastWifiAttemptMs = millis();
  }
}

void loop() {
  handleUsbConsole();

  const uint32_t now = millis();
  // FIX: Allow Wi-Fi retry without caPem requirement
  if (cfg.uploadEnabled && !wifi.connected() && !cfg.ssid.isEmpty() && (now - lastWifiAttemptMs) >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiAttemptMs = now;
    Serial.println("WIFI_RECONNECT_ATTEMPT");
    Serial.println(wifi.connect(cfg) ? "WIFI_CONNECTED" : "WIFI_CONNECT_FAILED");
  }
  digitalWrite(PIN_ONBOARD_LED, wifi.connected() ? HIGH : LOW);

  Stm32EventFrame frame{};
  if (readStm32Event(Safety, frame, 25)) {
    if (payloadContainsEvent(frame, "COMPONENT_HEARTBEAT")) {
      processComponentHeartbeat(frame);
    } else {
      String result = resultFromPayload(frame);
      setIndicators(result);

      Serial.print("STM32_RESULT: ");
      Serial.println(result);

      // The body and HMAC are forwarded from STM32 without creating or changing the result.
      (void)uploadStm32Event(cfg, frame);
    }
  }

  // 15-second heartbeat timer
  if (cfg.uploadEnabled && WiFi.status() == WL_CONNECTED && (now - lastLocalHeartbeatMs) >= LOCAL_HEARTBEAT_INTERVAL_MS) {
    lastLocalHeartbeatMs = now;
    const bool stm32Active = haveStm32Heartbeat && ((now - lastStm32HeartbeatMs) <= STM32_HEARTBEAT_TIMEOUT_MS);
    const bool piActive = stm32Active && lastPiActive;
    const bool uploaded = uploadLocalHeartbeat(cfg, stm32Active, piActive, now);
    Serial.printf("COMPONENT_HEARTBEAT_UPLOAD: ESP32=ACTIVE STM32=%s PI=%s RESULT=%s\n",
      stm32Active ? "ACTIVE" : "DISCONNECTED",
      piActive ? "ACTIVE" : "NOT_DETECTED",
      uploaded ? "OK" : "FAILED");
  }
  delay(2);
}
