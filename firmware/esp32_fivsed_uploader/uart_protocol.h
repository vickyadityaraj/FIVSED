#pragma once
#include <Arduino.h>

enum Stm32MessageType {
  MSG_NONE = 0,
  MSG_HEARTBEAT,
  MSG_STATUS
};

struct Stm32Message {
  Stm32MessageType type;
  String text;
  bool piOnline;
  String verdict; // "MATCH", "HASH_MISMATCH", "READ_ERROR"
};

// Reads incoming ASCII text lines from STM32 (PA9/USART TX -> ESP32 GPIO 16)
bool readStm32Line(HardwareSerial& uart, Stm32Message& msg);
