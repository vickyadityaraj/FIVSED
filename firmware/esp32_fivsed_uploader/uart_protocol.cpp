#include "uart_protocol.h"
#include <cstring>
#include <cstdio>

namespace {
constexpr uint8_t STM32_SYNC = 0xA5;
constexpr uint8_t ESP32_SYNC = 0x5A;
constexpr uint8_t PROTOCOL_VERSION = 1;
constexpr size_t STM32_MAX_PAYLOAD = 768;
constexpr size_t ESP32_MAX_PAYLOAD = 256;

uint16_t crc16Ccitt(const uint8_t* data, size_t len) {
  uint16_t crc = 0xFFFF;
  for (size_t i = 0; i < len; ++i) {
    crc ^= static_cast<uint16_t>(data[i]) << 8;
    for (uint8_t b = 0; b < 8; ++b) {
      crc = (crc & 0x8000U) ? static_cast<uint16_t>((crc << 1) ^ 0x1021U)
                            : static_cast<uint16_t>(crc << 1);
    }
  }
  return crc;
}

bool readExact(HardwareSerial& uart, uint8_t* dst, size_t len, uint32_t timeoutMs) {
  size_t got = 0;
  const uint32_t start = millis();
  while (got < len && static_cast<uint32_t>(millis() - start) < timeoutMs) {
    const int c = uart.read();
    if (c >= 0) {
      dst[got++] = static_cast<uint8_t>(c);
    } else {
      delay(1);
    }
  }
  return got == len;
}

bool writeAll(HardwareSerial& uart, const uint8_t* data, size_t len, uint32_t timeoutMs) {
  const uint32_t start = millis();
  size_t sent = 0;
  while (sent < len) {
    const size_t n = uart.write(data + sent, len - sent);
    if (n > 0) {
      sent += n;
      continue;
    }
    if (static_cast<uint32_t>(millis() - start) >= timeoutMs) return false;
    delay(1);
  }
  uart.flush();
  return true;
}
}  // namespace

bool readStm32Event(HardwareSerial& uart, Stm32EventFrame& out, uint32_t timeoutMs) {
  if (uart.available() <= 0 && timeoutMs == 0) return false;

  uint8_t b = 0;
  bool found = false;
  const uint32_t start = millis();
  while (static_cast<uint32_t>(millis() - start) < timeoutMs) {
    const int c = uart.read();
    if (c >= 0) {
      b = static_cast<uint8_t>(c);
      if (b == STM32_SYNC) {
        found = true;
        break;
      }
    } else {
      delay(1);
    }
  }
  if (!found) return false;

  uint8_t lenBytes[2];
  if (!readExact(uart, lenBytes, sizeof(lenBytes), 250)) return false;
  const uint16_t len = static_cast<uint16_t>(lenBytes[0]) |
                       (static_cast<uint16_t>(lenBytes[1]) << 8);
  if (len == 0 || len > STM32_MAX_PAYLOAD) return false;
  if (!readExact(uart, out.payload, len, 250)) return false;
  if (!readExact(uart, out.hmac, sizeof(out.hmac), 250)) return false;
  out.payloadLen = len;
  return true;
}

bool payloadContainsEvent(const Stm32EventFrame& frame, const char* eventName) {
  if (!eventName || frame.payloadLen == 0) return false;
  String p;
  p.reserve(frame.payloadLen + 1);
  for (uint16_t i = 0; i < frame.payloadLen; ++i) p += static_cast<char>(frame.payload[i]);
  // Robust match handles formatting with or without spaces after the colon
  return p.indexOf(eventName) >= 0;
}

bool sendEsp32Heartbeat(HardwareSerial& uart, uint32_t sequence) {
  char payload[180];
  const int n = snprintf(payload, sizeof(payload),
                         "{\"version\":1,\"event\":\"ESP32_HEARTBEAT\",\"source\":\"ESP32\",\"status\":\"ACTIVE\",\"sequence\":%lu,\"esp32_uptime_ms\":%lu}",
                         static_cast<unsigned long>(sequence),
                         static_cast<unsigned long>(millis()));
  if (n <= 0 || static_cast<size_t>(n) >= sizeof(payload)) return false;

  const uint16_t len = static_cast<uint16_t>(n);
  uint8_t frame[ESP32_MAX_PAYLOAD + 8];
  size_t pos = 0;
  frame[pos++] = ESP32_SYNC;
  frame[pos++] = PROTOCOL_VERSION;
  frame[pos++] = static_cast<uint8_t>(len);
  frame[pos++] = static_cast<uint8_t>(len >> 8);
  memcpy(frame + pos, payload, len);
  pos += len;

  uint8_t crcInput[ESP32_MAX_PAYLOAD + 4];
  crcInput[0] = PROTOCOL_VERSION;
  crcInput[1] = static_cast<uint8_t>(len);
  crcInput[2] = static_cast<uint8_t>(len >> 8);
  memcpy(crcInput + 3, payload, len);
  const uint16_t crc = crc16Ccitt(crcInput, static_cast<size_t>(len) + 3);
  frame[pos++] = static_cast<uint8_t>(crc);
  frame[pos++] = static_cast<uint8_t>(crc >> 8);

  return writeAll(uart, frame, pos, 250);
}
