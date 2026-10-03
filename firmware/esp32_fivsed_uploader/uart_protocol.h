#pragma once
#include <Arduino.h>

struct Stm32EventFrame {
  uint16_t payloadLen;
  uint8_t payload[768];
  uint8_t hmac[32];
};

/* STM32 -> ESP32 authenticated event path. */
bool readStm32Event(HardwareSerial& uart, Stm32EventFrame& out, uint32_t timeoutMs);
bool payloadContainsEvent(const Stm32EventFrame& frame, const char* eventName);

/* ESP32 -> STM32 heartbeat/control path. */
bool sendEsp32Heartbeat(HardwareSerial& uart, uint32_t sequence);
