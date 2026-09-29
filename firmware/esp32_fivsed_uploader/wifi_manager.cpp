#include "wifi_manager.h"
#include "config_storage.h"
#include <WiFi.h>

bool WifiManager::connect(const Esp32Config& cfg) {
  if (cfg.ssid.isEmpty()) {
    Serial.println("[WIFI] No SSID configured. Type SET SSID=<name> and SAVE in Serial Monitor.");
    return false;
  }
  
  Serial.printf("[WIFI] Connecting to SSID: '%s'...\n", cfg.ssid.c_str());
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfg.ssid.c_str(), cfg.password.c_str());

  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 15000) {
    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
    return true;
  } else {
    Serial.println("\n[WIFI] Connection failed or timed out.");
    return false;
  }
}

bool WifiManager::connected() const {
  return WiFi.status() == WL_CONNECTED;
}
