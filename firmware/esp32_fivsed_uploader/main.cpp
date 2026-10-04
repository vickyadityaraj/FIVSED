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
#define STM32_HEARTBEAT_TIMEOUT_MS 15000UL
#define STM32_COMPONENT_TIMEOUT_MS 30000UL
// Change heartbeat ping interval from 5000 to 3000
#define ESP32_PING_INTERVAL_MS 3000UL
#define ESP32_HEARTBEAT_INTERVAL_MS ESP32_PING_INTERVAL_MS
#define LOCAL_HEARTBEAT_INTERVAL_MS 15000UL
#define WIFI_RETRY_INTERVAL_MS 15000UL

HardwareSerial Safety(2);  // ESP32 UART2: GPIO16 RX <- STM32 PA9 TX, GPIO17 TX -> STM32 PA10 RX.
WifiManager wifi;
Esp32Config cfg;
static uint32_t lastStm32AckMs = 0;
static uint32_t lastStm32ComponentMs = 0;
static uint32_t lastLocalHeartbeatMs = 0;
static uint32_t lastWifiAttemptMs = 0;
static uint32_t lastHeartbeatSent = 0;
static uint32_t esp32HeartbeatSequence = 0;
static bool lastPiActive = false;
static bool haveStm32Ack = false;
static bool haveStm32ComponentHeartbeat = false;

static String resultFromPayload(const Stm32EventFrame& frame) {
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  const int key = p.indexOf("\"result\"");
  if (key < 0) return "INVALID_RESULT";
  const int colon = p.indexOf(':', key);
  const int q1 = p.indexOf('"', colon + 1);
  const int q2 = p.indexOf('"', q1 + 1);
  if (colon < 0 || q1 < 0 || q2 < 0) return "INVALID_RESULT";
  return p.substring(q1 + 1, q2);
}

static bool jsonBool(const Stm32EventFrame& frame, const char* key) {
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  const int k = p.indexOf(key);
  if (k < 0) return false;
  const int colon = p.indexOf(':', k);
  if (colon < 0) return false;
  const int t = p.indexOf("true", colon);
  const int f = p.indexOf("false", colon);
  return (t >= 0 && (f < 0 || t < f));
}

static void processComponentHeartbeat(const Stm32EventFrame& frame) {
  haveStm32ComponentHeartbeat = true;
  lastStm32ComponentMs = millis();
  lastPiActive = jsonBool(frame, "raspberry_pi_active");
  Serial.print("COMPONENT_HEARTBEAT: STM32=ACTIVE PI=");
  Serial.println(lastPiActive ? "ACTIVE" : "NOT_DETECTED");
}

static void processEsp32HeartbeatAck(const Stm32EventFrame&) {
  haveStm32Ack = true;
  lastStm32AckMs = millis();
  Serial.println("STM32_HEARTBEAT_ACK: ACK: ESP32_ACTIVE");
}

static bool stm32Active() {
  const uint32_t now = millis();
  const bool ackFresh = haveStm32Ack && (static_cast<uint32_t>(now - lastStm32AckMs) <= STM32_HEARTBEAT_TIMEOUT_MS);
  const bool componentFresh = haveStm32ComponentHeartbeat && (static_cast<uint32_t>(now - lastStm32ComponentMs) <= STM32_COMPONENT_TIMEOUT_MS);
  return ackFresh || componentFresh;
}

static bool piActive() {
  return stm32Active() && lastPiActive;
}

static void triggerBuzzerChirp() {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(100);
  digitalWrite(PIN_BUZZER, LOW);
}

static void triggerBuzzerAlarm() {
  for (int i = 0; i < 3; ++i) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(150);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < 2) delay(100);
  }
}

static bool isVerificationPass(const Stm32EventFrame& frame) {
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);

  const int statusIdx = p.indexOf("\"status\"");
  if (statusIdx >= 0) {
    const int colon = p.indexOf(':', statusIdx);
    if (colon >= 0) {
      const int passIdx = p.indexOf("\"PASS\"", colon);
      const int failIdx = p.indexOf("\"FAIL\"", colon);
      if (passIdx >= 0 && (failIdx < 0 || passIdx < failIdx)) return true;
      if (failIdx >= 0) return false;
    }
  }

  const int resultIdx = p.indexOf("\"result\"");
  if (resultIdx >= 0) {
    const int colon = p.indexOf(':', resultIdx);
    if (colon >= 0) {
      if (p.indexOf("\"MATCH\"", colon) >= 0 ||
          p.indexOf("\"NEW_TARGET_REGISTERED\"", colon) >= 0 ||
          p.indexOf("\"REFERENCE_UPDATED\"", colon) >= 0) {
        return true;
      }
      if (p.indexOf("\"HASH_MISMATCH\"", colon) >= 0) {
        return false;
      }
    }
  }

  return false;
}

static void handleFirmwareVerificationIndicators(bool isPass) {
  if (isPass) {
    digitalWrite(PIN_GREEN_LED, HIGH);
    digitalWrite(PIN_RED_LED, LOW);
    triggerBuzzerChirp();
  } else {
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_GREEN_LED, LOW);
    triggerBuzzerAlarm();
  }
}

static void handleCaProvisioning() {
  String pem;
  const uint32_t deadline = millis() + 30000UL;
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
  Safety.setRxBufferSize(1024);
  Safety.begin(115200, SERIAL_8N1, 16, 17);
  delay(200);

  Serial.println("FIVSED_ESP32_READY");
  Serial.println("ESP32 relay/controller only: STM32 owns SHA-256 and trusted reference");
  Serial.println("UART: GPIO16 RX <- STM32 PA9 TX; GPIO17 TX -> STM32 PA10 RX");
  cfg = loadConfig();
  printConfig(cfg);

  if (cfg.uploadEnabled && !cfg.ssid.isEmpty()) {
    const bool ok = wifi.connect(cfg);
    Serial.println(ok ? "WIFI_CONNECTED" : "WIFI_CONNECT_FAILED");
    lastWifiAttemptMs = millis();
  }

  // Send first heartbeat immediately on boot to establish link with STM32
  sendEsp32Heartbeat(Safety, ++esp32HeartbeatSequence);
  lastHeartbeatSent = millis();
  Serial.println("ESP32_HEARTBEAT seq=1 send=OK (initial)");
}

void loop() {
  handleUsbConsole();

  const uint32_t now = millis();

  // 1. Prioritize transmission of Heartbeat to STM32 every 3s
  if ((now - lastHeartbeatSent) >= ESP32_PING_INTERVAL_MS) {
    lastHeartbeatSent = now;
    const bool sent = sendEsp32Heartbeat(Safety, ++esp32HeartbeatSequence);
    if (sent) {
      Serial.printf("ESP32_HEARTBEAT seq=%lu send=OK\n", static_cast<unsigned long>(esp32HeartbeatSequence));
    } else {
      Serial.printf("ESP32_HEARTBEAT seq=%lu send=FAILED\n", static_cast<unsigned long>(esp32HeartbeatSequence));
    }
  }

  // 2. Read incoming frames from STM32 without delay
  while (Safety.available() > 0) {
    Stm32EventFrame frame{};
    if (readStm32Event(Safety, frame, 50)) {
      if (payloadContainsEvent(frame, "ESP32_HEARTBEAT_ACK")) {
        processEsp32HeartbeatAck(frame);
      } else if (payloadContainsEvent(frame, "COMPONENT_HEARTBEAT")) {
        processComponentHeartbeat(frame);
      } else if (payloadContainsEvent(frame, "FIRMWARE_VERIFICATION")) {
        const bool isPass = isVerificationPass(frame);
        handleFirmwareVerificationIndicators(isPass);
        const String result = resultFromPayload(frame);
        Serial.print("STM32_RESULT: ");
        Serial.println(isPass ? "PASS" : (result.isEmpty() ? "FAIL" : result));
        // Forward the STM32-authenticated verdict without changing the signed JSON or MAC.
        (void)uploadStm32Event(cfg, frame);
      }
    } else {
      break;
    }
  }

  // Periodic Wi-Fi retry
  if (cfg.uploadEnabled && !wifi.connected() && !cfg.ssid.isEmpty() &&
      (static_cast<uint32_t>(now - lastWifiAttemptMs) >= WIFI_RETRY_INTERVAL_MS)) {
    lastWifiAttemptMs = now;
    Serial.println("WIFI_RECONNECT_ATTEMPT");
    Serial.println(wifi.connect(cfg) ? "WIFI_CONNECTED" : "WIFI_CONNECT_FAILED");
  }

  digitalWrite(PIN_ONBOARD_LED, wifi.connected() ? HIGH : LOW);

  // 3. Network operations (Keep delays minimal)
  if (cfg.uploadEnabled && WiFi.status() == WL_CONNECTED &&
      (now - lastLocalHeartbeatMs) >= LOCAL_HEARTBEAT_INTERVAL_MS) {
    lastLocalHeartbeatMs = now;
    const bool stm32 = stm32Active();
    const bool pi = stm32 && piActive();
    const bool uploaded = uploadLocalHeartbeat(cfg, stm32, pi, now);
    Serial.printf("COMPONENT_HEARTBEAT_UPLOAD: ESP32=ACTIVE STM32=%s PI=%s RESULT=%s\n",
                  stm32 ? "ACTIVE" : "DISCONNECTED",
                  pi ? "ACTIVE" : "NOT_DETECTED",
                  uploaded ? "OK" : "FAILED");
  }

  delay(2);
}
