#pragma once
#include <Arduino.h>
#include "uart_protocol.h"

struct Esp32Config;

bool uploadStm32Event(const Esp32Config& cfg, const Stm32EventFrame& event);
bool uploadLocalHeartbeat(const Esp32Config& cfg, bool stm32Active, bool piActive, uint32_t uptimeMs);
