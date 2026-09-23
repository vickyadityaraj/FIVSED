/*
 * ============================================================================
 * FIVSED — Firmware Integrity Verification and Security Event Detection
 * Node: ESP32 Controller and Web Uploader
 * 
 * IMPORTANT ARCHITECTURE RULE:
 * The STM32 is the sole SECURITY AUTHORITY. It calculates the SHA-256 hash,
 * compares it against its trusted reference, and determines the PASS/FAIL decision.
 * The ESP32 NEVER determines firmware trust. It merely receives the STM32's result,
 * drives the physical status indicators (LEDs/buzzer), and uploads the event
 * to the FIVSED Web Application over Wi-Fi.
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Wi-Fi Configuration
const char* WIFI_SSID = "Abhishek";
const char* WIFI_PASSWORD = "9640060290";

// FIVSED Web Application Ingestion Endpoint
const char* SERVER_ENDPOINT = "http://192.168.1.100:3000/api/events";
const char* DEVICE_API_KEY = "fivsed_sec_key_77e9b812a4309c48";
const char* DEVICE_ID = "FIVSED-001"; // Monitored Target Unit

// Hardware Pin Definitions
#define PIN_GREEN_LED 21   // Lights up solid when STM32 reports INTEGRITY_PASS
#define PIN_RED_LED   22   // Lights up solid when STM32 reports HASH_MISMATCH (FAIL)
#define PIN_BUZZER    19   // Optional audible alarm for FAIL/TAMPER

// UART2 Interface to STM32 Security Authority
#define STM32_RX_PIN 16
#define STM32_TX_PIN 17

HardwareSerial SerialSTM32(2);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[FIVSED ESP32] Initializing Controller & Web Uploader Node...");

  // Configure physical indicator GPIOs
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  // Initialize UART to STM32 (115200 baud, 8-N-1)
  SerialSTM32.begin(115200, SERIAL_8N1, STM32_RX_PIN, STM32_TX_PIN);
  Serial.println("[FIVSED ESP32] STM32 UART2 bus active on RX=16, TX=17.");

  // Connect to Local Wi-Fi
  connectWiFi();
}

void loop() {
  // Ensure Wi-Fi connection is maintained
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  // Check for incoming authoritative payload from STM32
  if (SerialSTM32.available()) {
    String incomingLine = SerialSTM32.readStringUntil('\n');
    incomingLine.trim();

    if (incomingLine.length() > 0) {
      Serial.print("[FIVSED ESP32] Received STM32 Packet: ");
      Serial.println(incomingLine);

      // Parse JSON packet received from STM32
      // Expected format from STM32:
      // {"device_id":"FIVSED-001","status":"PASS","verification_id":43,"current_hash":"8f4a...","reference_hash":"8f4a..."}
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, incomingLine);

      if (!error) {
        const char* status = doc["status"]; // "PASS", "FAIL", "VERIFYING", "ERROR"
        int verificationId = doc["verification_id"] | 0;
        const char* currentHash = doc["current_hash"] | "";
        const char* refHash = doc["reference_hash"] | "";

        // 1. Update Physical Indicators (LEDs & Buzzer)
        updatePhysicalIndicators(status);

        // 2. Upload verification result to FIVSED Web Application
        uploadEventToWebApp(status, verificationId, currentHash, refHash);
      } else {
        Serial.print("[FIVSED ESP32] JSON parse error: ");
        Serial.println(error.c_str());
      }
    }
  }

  delay(50);
}

void connectWiFi() {
  Serial.print("[FIVSED ESP32] Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[FIVSED ESP32] Wi-Fi Connected!");
    Serial.print("[FIVSED ESP32] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[FIVSED ESP32] Wi-Fi Connection Failed. Will retry.");
  }
}

void updatePhysicalIndicators(const char* status) {
  if (strcmp(status, "PASS") == 0) {
    // PASS: Green LED ON, Red LED OFF, Buzzer OFF
    digitalWrite(PIN_GREEN_LED, HIGH);
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_BUZZER, LOW);
    Serial.println("[FIVSED ESP32] Physical State: GREEN ON (Integrity PASS)");
  } 
  else if (strcmp(status, "FAIL") == 0) {
    // FAIL / HASH_MISMATCH: Red LED ON, Green LED OFF, Buzzer ON pulse
    digitalWrite(PIN_GREEN_LED, LOW);
    digitalWrite(PIN_RED_LED, HIGH);
    // Pulse buzzer alarm
    for (int i = 0; i < 3; i++) {
      digitalWrite(PIN_BUZZER, HIGH);
      delay(150);
      digitalWrite(PIN_BUZZER, LOW);
      delay(100);
    }
    Serial.println("[FIVSED ESP32] Physical State: RED ON + ALARM (Integrity FAIL)");
  } 
  else if (strcmp(status, "VERIFYING") == 0) {
    // VERIFYING: Blink Green LED
    digitalWrite(PIN_RED_LED, LOW);
    for (int i = 0; i < 4; i++) {
      digitalWrite(PIN_GREEN_LED, HIGH);
      delay(100);
      digitalWrite(PIN_GREEN_LED, LOW);
      delay(100);
    }
  }
}

void uploadEventToWebApp(const char* status, int verId, const char* curHash, const char* refHash) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[FIVSED ESP32] Cannot upload: Wi-Fi disconnected.");
    return;
  }

  HTTPClient http;
  http.begin(SERVER_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);

  // Construct JSON payload
  StaticJsonDocument<512> postDoc;
  postDoc["device_id"] = DEVICE_ID;
  postDoc["event"] = strcmp(status, "PASS") == 0 ? "FIRMWARE_VERIFICATION" : "HASH_MISMATCH";
  postDoc["status"] = status;
  postDoc["verification_id"] = verId;
  postDoc["current_hash"] = curHash;
  postDoc["reference_hash"] = refHash;
  postDoc["verification_duration_ms"] = 392;

  String jsonString;
  serializeJson(postDoc, jsonString);

  Serial.print("[FIVSED ESP32] Posting to Web App: ");
  Serial.println(jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.print("[FIVSED ESP32] Server Response Code: ");
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.print("[FIVSED ESP32] HTTP POST Error: ");
    Serial.println(http.errorToString(httpResponseCode).c_str());
  }

  http.end();
}
