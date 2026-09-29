#pragma once
#include <Arduino.h>

struct Esp32Config;

class WifiManager {
public:
  bool connect(const Esp32Config& cfg);
  bool connected() const;
};
