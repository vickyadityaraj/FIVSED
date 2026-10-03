#include "wifi_manager.h"
#include "config_storage.h"
#include <WiFi.h>

bool WifiManager::connect(const Esp32Config& cfg) {
  if (cfg.ssid.isEmpty()) return false;
  WiFi.mode(WIFI_STA);
  WiFi.begin(cfg.ssid.c_str(), cfg.password.c_str());
  uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < 15000) {
    delay(250);
  }
  return WiFi.status() == WL_CONNECTED;
}

bool WifiManager::connected() const {
  return WiFi.status() == WL_CONNECTED;
}
