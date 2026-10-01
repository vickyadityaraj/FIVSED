#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <WiFiClient.h>
#include "config_storage.h"
#include "wifi_manager.h"

#define PIN_ONBOARD_LED 2
#define PIN_GREEN_LED   21
#define PIN_RED_LED     22
#define PIN_BUZZER      23

#define STM32_HEARTBEAT_TIMEOUT_MS 30000UL
#define LOCAL_HEARTBEAT_INTERVAL_MS 15000UL
#define WIFI_RETRY_INTERVAL_MS      15000UL

// Hardware UART2: GPIO 16 (RX2), GPIO 17 (TX2)
HardwareSerial Safety(2);
WifiManager wifi;
Esp32Config cfg;

static uint32_t lastStm32HeartbeatMs = 0;
static uint32_t lastLocalHeartbeatMs = 0;
static uint32_t lastWifiAttemptMs = 0;
static bool lastPiActive = false;
static bool haveStm32Heartbeat = false;
static uint32_t verificationCycle = 100;

static void setIndicators(const String& result) {
  const bool verified = (result == "MATCH");
  const bool mismatch = (result == "HASH_MISMATCH");
  const bool error    = (result == "READ_ERROR");

  digitalWrite(PIN_GREEN_LED, verified ? HIGH : LOW);
  digitalWrite(PIN_RED_LED, (mismatch || error) ? HIGH : LOW);
  digitalWrite(PIN_ONBOARD_LED, mismatch ? HIGH : LOW);

  if (mismatch || error) {
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(120);
      digitalWrite(PIN_BUZZER, LOW);
      delay(80);
    }
  } else if (verified) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(100);
    digitalWrite(PIN_BUZZER, LOW);
  }
}

static bool postEvent(const String& payload) {
  if (!cfg.uploadEnabled || cfg.endpoint.isEmpty() || cfg.apiKey.isEmpty() || cfg.deviceId.isEmpty()) {
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  bool isHttps = cfg.endpoint.startsWith("https://");
  bool success = false;

  if (isHttps) {
    WiFiClientSecure secureClient;
    if (!cfg.caPem.isEmpty()) secureClient.setCACert(cfg.caPem.c_str());
    else secureClient.setInsecure();

    if (http.begin(secureClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(payload);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] Event upload HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  } else {
    WiFiClient plainClient;
    if (http.begin(plainClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(payload);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] Event upload HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  }
  return success;
}

static void uploadVerdict(const String& verdict) {
  verificationCycle++;
  String body = String("{\"version\":1,\"event\":\"FIRMWARE_VERIFICATION\",\"device_id\":\"")
    + cfg.deviceId
    + String("\",\"result\":\"") + verdict
    + String("\",\"status\":\"") + (verdict == "MATCH" ? "PASS" : "FAIL")
    + String("\",\"verification_id\":") + String(verificationCycle)
    + String(",\"message\":\"Authoritative STM32 measurement completed.\"}");
  postEvent(body);
}

static void processLine(String line) {
  line.trim();
  if (line.length() == 0) return;
  Serial.printf("[STM32 RAW] %s\n", line.c_str());

  // 1. Process COMPONENT_HEARTBEAT & respond with ACK to STM32 (PA10)
  if (line.startsWith("COMPONENT_HEARTBEAT")) {
    haveStm32Heartbeat = true;
    lastStm32HeartbeatMs = millis();
    lastPiActive = (line.indexOf("PI=OK") >= 0);
    Serial.printf("COMPONENT_HEARTBEAT: STM32=ACTIVE, PI=%s\n", lastPiActive ? "ACTIVE" : "OFFLINE");

    // Transmit ACK back to STM32
    Safety.print("ACK: ESP32_ACTIVE\r\n");
    return;
  }

  // 2. Process STATUS: MATCH / HASH_MISMATCH / READ_ERROR
  if (line.startsWith("STATUS:")) {
    String verdict = line.substring(7);
    verdict.trim();
    setIndicators(verdict);
    uploadVerdict(verdict);
  }
}

static void handleUsbConsole() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
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
  Safety.setTimeout(50);
  delay(200);

  Serial.println("FIVSED_ESP32_READY");
  cfg = loadConfig();
  printConfig(cfg);

  if (cfg.uploadEnabled && !cfg.ssid.isEmpty()) {
    wifi.connect(cfg);
    lastWifiAttemptMs = millis();
  }
}

void loop() {
  handleUsbConsole();
  const uint32_t now = millis();

  // Maintain Wi-Fi
  if (cfg.uploadEnabled && !wifi.connected() && !cfg.ssid.isEmpty() && (now - lastWifiAttemptMs) >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiAttemptMs = now;
    wifi.connect(cfg);
  }
  digitalWrite(PIN_ONBOARD_LED, wifi.connected() ? HIGH : LOW);

  // Process incoming lines from STM32 PA9
  while (Safety.available() > 0) {
    String line = Safety.readStringUntil('\n');
    processLine(line);
  }

  // Periodic Local Heartbeat upload
  if (cfg.uploadEnabled && WiFi.status() == WL_CONNECTED && (now - lastLocalHeartbeatMs) >= LOCAL_HEARTBEAT_INTERVAL_MS) {
    lastLocalHeartbeatMs = now;
    const bool stm32Active = haveStm32Heartbeat && ((now - lastStm32HeartbeatMs) <= STM32_HEARTBEAT_TIMEOUT_MS);
    const bool piActive = stm32Active && lastPiActive;

    String body = String("{\"version\":1,\"event\":\"COMPONENT_HEARTBEAT\",\"device_id\":\"")
      + cfg.deviceId
      + String("\",\"source\":\"ESP32_GATEWAY\",\"status\":\"ACTIVE\",\"esp32_active\":true,\"stm32_active\":")
      + (stm32Active ? "true" : "false")
      + String(",\"raspberry_pi_active\":")
      + (piActive ? "true" : "false")
      + String(",\"esp32_uptime_ms\":")
      + String(now)
      + String("}");

    postEvent(body);
  }
  delay(2);
}
