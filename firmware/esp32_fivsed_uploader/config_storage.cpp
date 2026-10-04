#include "config_storage.h"
#include <Preferences.h>

static Preferences prefs;

Esp32Config loadConfig() {
  Esp32Config cfg;
  prefs.begin("fivsed", true);
  cfg.ssid = prefs.getString("ssid", "Abhishek");
  if (cfg.ssid.isEmpty()) cfg.ssid = "Abhishek";
  cfg.password = prefs.getString("password", "9640060290");
  if (cfg.password.isEmpty()) cfg.password = "9640060290";
  cfg.endpoint = prefs.getString("endpoint", "https://fivsed.vercel.app/api/events");
  if (cfg.endpoint.isEmpty()) cfg.endpoint = "https://fivsed.vercel.app/api/events";
  cfg.apiKey = prefs.getString("api_key", "fivsed_sec_key_77e9b812a4309c48");
  if (cfg.apiKey.isEmpty()) cfg.apiKey = "fivsed_sec_key_77e9b812a4309c48";
  cfg.deviceId = prefs.getString("device_id", "FIVSED-001");
  if (cfg.deviceId.isEmpty()) cfg.deviceId = "FIVSED-001";
  cfg.caPem = prefs.getString("ca_pem", "");
  cfg.uploadEnabled = prefs.getBool("upload", true);
  prefs.end();
  return cfg;
}

void saveConfig(const Esp32Config& cfg) {
  prefs.begin("fivsed", false);
  prefs.putString("ssid", cfg.ssid);
  prefs.putString("password", cfg.password);
  prefs.putString("endpoint", cfg.endpoint);
  prefs.putString("api_key", cfg.apiKey);
  prefs.putString("device_id", cfg.deviceId);
  prefs.putString("ca_pem", cfg.caPem);
  prefs.putBool("upload", cfg.uploadEnabled);
  prefs.end();
}

void printConfig(const Esp32Config& cfg) {
  Serial.printf("SSID configured: %s\n", cfg.ssid.isEmpty() ? "NO" : "YES");
  Serial.printf("Endpoint configured: %s\n", cfg.endpoint.isEmpty() ? "NO" : "YES");
  Serial.printf("API key configured: %s\n", cfg.apiKey.isEmpty() ? "NO" : "YES");
  Serial.printf("Device ID configured: %s\n", cfg.deviceId.isEmpty() ? "NO" : "YES");
  Serial.printf("CA certificate configured: %s\n", cfg.caPem.isEmpty() ? "NO" : "YES");
  Serial.printf("Upload enabled: %s\n", cfg.uploadEnabled ? "YES" : "NO");
}

static void setKey(Esp32Config& cfg, const String& key, const String& value) {
  if (key == "SSID") cfg.ssid = value;
  else if (key == "PASSWORD") cfg.password = value;
  else if (key == "ENDPOINT") cfg.endpoint = value;
  else if (key == "API_KEY") cfg.apiKey = value;
  else if (key == "DEVICE_ID") cfg.deviceId = value;
  else if (key == "UPLOAD") cfg.uploadEnabled = (value == "1" || value.equalsIgnoreCase("true"));
}

void processProvisioningCommand(Esp32Config& cfg, const String& command, Print& out) {
  String cmd = command; cmd.trim();
  if (cmd.equalsIgnoreCase("SHOW")) { printConfig(cfg); return; }
  if (cmd.equalsIgnoreCase("SAVE")) { saveConfig(cfg); out.println("SAVED"); return; }
  if (cmd.equalsIgnoreCase("FACTORY_RESET")) { cfg = Esp32Config{}; saveConfig(cfg); out.println("CLEARED"); return; }
  if (!cmd.startsWith("SET ")) { out.println("Use SET KEY=VALUE, SAVE, SHOW or FACTORY_RESET"); return; }
  String kv = cmd.substring(4);
  int eq = kv.indexOf('=');
  if (eq <= 0) { out.println("Invalid SET command"); return; }
  String key = kv.substring(0, eq); String value = kv.substring(eq + 1); key.trim(); value.trim();
  if (key.equalsIgnoreCase("CA_PEM")) { out.println("CA_PEM is provisioned with CA_BEGIN/CA_END mode."); return; }
  setKey(cfg, key, value); out.println("OK");
}
