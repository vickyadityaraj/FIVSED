#include "web_uploader.h"
#include "config_storage.h"
#include <WiFiClientSecure.h>
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
  if (!cfg.uploadEnabled || cfg.endpoint.isEmpty() || cfg.apiKey.isEmpty() || cfg.deviceId.isEmpty() || cfg.caPem.isEmpty()) {
    return false;
  }
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setCACert(cfg.caPem.c_str());

  HTTPClient http;
  if (!http.begin(client, cfg.endpoint)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
  http.addHeader("X-FIVSED-STM32-HMAC", hmacHex(event.hmac, sizeof(event.hmac)));
  http.addHeader("X-FIVSED-API-Key", cfg.apiKey);

  String body;
  body.reserve(event.payloadLen + 1);
  for (uint16_t i = 0; i < event.payloadLen; ++i) body += static_cast<char>(event.payload[i]);

  int code = http.POST(body);
  http.end();
  return code >= 200 && code < 300;
}


bool uploadLocalHeartbeat(const Esp32Config& cfg, bool stm32Active, bool piActive, uint32_t uptimeMs) {
  if (!cfg.uploadEnabled || cfg.endpoint.isEmpty() || cfg.apiKey.isEmpty() || cfg.deviceId.isEmpty() || cfg.caPem.isEmpty()) return false;
  if (WiFi.status() != WL_CONNECTED) return false;

  WiFiClientSecure client;
  client.setCACert(cfg.caPem.c_str());
  HTTPClient http;
  if (!http.begin(client, cfg.endpoint)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-FIVSED-Device-ID", cfg.deviceId);
  http.addHeader("X-FIVSED-API-Key", cfg.apiKey);

  String body = String("{\"version\":1,\"event\":\"COMPONENT_HEARTBEAT\",\"device_id\":\"")
    + cfg.deviceId
    + String("\",\"source\":\"ESP32_GATEWAY\",\"status\":\"ACTIVE\",\"esp32_active\":true,\"stm32_active\":")
    + (stm32Active ? "true" : "false")
    + String(",\"raspberry_pi_active\":")
    + (piActive ? "true" : "false")
    + String(",\"esp32_uptime_ms\":")
    + String(uptimeMs)
    + String(",\"message\":\"ESP32 local liveness heartbeat; STM32 status is derived from the bidirectional UART handshake.\"}");

  int code = http.POST(body);
  http.end();
  return code >= 200 && code < 300;
}
