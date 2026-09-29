#include "uart_protocol.h"

static bool readExact(HardwareSerial& uart, uint8_t* dst, size_t len, uint32_t timeoutMs) {
  size_t got = 0;
  uint32_t start = millis();
  while (got < len && (millis() - start) < timeoutMs) {
    int c = uart.read();
    if (c >= 0) dst[got++] = static_cast<uint8_t>(c);
    else delay(1);
  }
  return got == len;
}

bool readStm32Event(HardwareSerial& uart, Stm32EventFrame& out, uint32_t timeoutMs) {
  uint8_t b = 0;
  uint32_t start = millis();
  while ((millis() - start) < timeoutMs) {
    if (uart.readBytes(&b, 1) == 1 && b == 0xA5) break;
    delay(1);
  }
  if (b != 0xA5) return false;

  uint8_t lenBytes[2];
  if (!readExact(uart, lenBytes, 2, timeoutMs)) return false;
  uint16_t len = static_cast<uint16_t>(lenBytes[0]) | (static_cast<uint16_t>(lenBytes[1]) << 8);
  if (len == 0 || len > sizeof(out.payload)) return false;
  if (!readExact(uart, out.payload, len, timeoutMs)) return false;
  if (!readExact(uart, out.hmac, sizeof(out.hmac), timeoutMs)) return false;
  out.payloadLen = len;
  return true;
}

bool payloadContainsEvent(const Stm32EventFrame& frame, const char* eventName) {
  if (!eventName || frame.payloadLen == 0) return false;
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  return p.indexOf("\"event\":\"" + String(eventName) + "\"") >= 0;
}
