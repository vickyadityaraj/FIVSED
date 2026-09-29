#pragma once
#include <Arduino.h>

struct Esp32Config {
  String ssid;
  String password;
  String endpoint;
  String apiKey;
  String deviceId;
  String caPem;
  bool uploadEnabled;
};

Esp32Config loadConfig();
void saveConfig(const Esp32Config& cfg);
void printConfig(const Esp32Config& cfg);
void processProvisioningCommand(Esp32Config& cfg, const String& command, Print& out);
