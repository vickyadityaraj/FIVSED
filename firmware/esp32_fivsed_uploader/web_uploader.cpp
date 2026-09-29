#include "web_uploader.h"
#include "config_storage.h"
#include <WiFiClientSecure.h>
#include <WiFiClient.h>
#include <HTTPClient.h>
#include <WiFi.h>

static String hmacHex(const uint8_t* data, size_t len) {
  static const char hex[] = "0123456789abcdef";
  String out;
  out.reserve(len * 2);
  for (size_t i = 0; i < len; ++i) {
    out += hex[data[i] >> 4];
    out += hex[data[i] & 0x0F];
  }
  return out;
}

bool uploadStm32Event(const Esp32Config& cfg, const Stm32EventFrame& event) {
  if (!cfg.uploadEnabled || cfg.endpoint.isEmpty() || cfg.apiKey.isEmpty() || cfg.deviceId.isEmpty()) {
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  bool isHttps = cfg.endpoint.startsWith("https://");
  bool success = false;

  String body;
  body.reserve(event.payloadLen + 1);
  for (uint16_t i = 0; i < event.payloadLen; ++i) body += static_cast<char>(event.payload[i]);

  if (isHttps) {
    WiFiClientSecure secureClient;
    if (!cfg.caPem.isEmpty()) {
      secureClient.setCACert(cfg.caPem.c_str());
    } else {
      secureClient.setInsecure(); // Permits HTTPS without bundling full root CA cert
    }
    if (http.begin(secureClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-STM32-HMAC", hmacHex(event.hmac, sizeof(event.hmac)));
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(body);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] STM32 event upload HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  } else {
    WiFiClient plainClient;
    if (http.begin(plainClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-STM32-HMAC", hmacHex(event.hmac, sizeof(event.hmac)));
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(body);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] STM32 event upload HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  }

  return success;
}

bool uploadLocalHeartbeat(const Esp32Config& cfg, bool stm32Active, bool piActive, uint32_t uptimeMs) {
  if (!cfg.uploadEnabled || cfg.endpoint.isEmpty() || cfg.apiKey.isEmpty() || cfg.deviceId.isEmpty()) {
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  bool isHttps = cfg.endpoint.startsWith("https://");
  bool success = false;

  String body = String("{\"version\":1,\"event\":\"COMPONENT_HEARTBEAT\",\"device_id\":\"")
    + cfg.deviceId
    + String("\",\"source\":\"ESP32_LOCAL\",\"status\":\"ACTIVE\",\"esp32_active\":true,\"stm32_active\":")
    + (stm32Active ? "true" : "false")
    + String(",\"raspberry_pi_active\":")
    + (piActive ? "true" : "false")
    + String(",\"esp32_uptime_ms\":")
    + String(uptimeMs)
    + String(",\"message\":\"ESP32 local liveness heartbeat; STM32-originated heartbeat active.\"}");

  if (isHttps) {
    WiFiClientSecure secureClient;
    if (!cfg.caPem.isEmpty()) {
      secureClient.setCACert(cfg.caPem.c_str());
    } else {
      secureClient.setInsecure();
    }
    if (http.begin(secureClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(body);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] Local heartbeat HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  } else {
    WiFiClient plainClient;
    if (http.begin(plainClient, cfg.endpoint)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
      http.addHeader("X-FIVSED-API-Key", cfg.apiKey);
      int code = http.POST(body);
      success = (code >= 200 && code < 300);
      Serial.printf("[UPLOADER] Local heartbeat HTTP %d (%s)\n", code, success ? "OK" : "FAIL");
      http.end();
    }
  }

  return success;
}
