#include "uart_protocol.h"

bool readStm32Line(HardwareSerial& uart, Stm32Message& msg) {
  if (uart.available() <= 0) return false;

  String line = uart.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return false;

  msg.text = line;
  msg.type = MSG_NONE;
  msg.piOnline = false;
  msg.verdict = "";

  // 1. Parse COMPONENT_HEARTBEAT: STM32=OK, PI=OK (or PI=OFFLINE)
  if (line.startsWith("COMPONENT_HEARTBEAT")) {
    msg.type = MSG_HEARTBEAT;
    msg.piOnline = (line.indexOf("PI=OK") >= 0);
    return true;
  }

  // 2. Parse STATUS: MATCH / HASH_MISMATCH / READ_ERROR
  if (line.startsWith("STATUS:")) {
    msg.type = MSG_STATUS;
    String v = line.substring(7);
    v.trim();
    msg.verdict = v;
    return true;
  }

  return true;
}
