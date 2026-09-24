/*
 * ==============================================================================
 * FIVSED - Firmware Integrity Verification and Security Event Detection
 * STANDALONE ESP32 TEST SKETCH (FOR LIVE HARDWARE CONNECTION VERIFICATION)
 * ==============================================================================
 * 
 * Purpose:
 * Tests that your ESP32 connects to your Wi-Fi network and successfully
 * transmits authenticated telemetry to your live Vercel web application
 * (https://fivsed.vercel.app/api/events) without needing the STM32 connected yet.
 * 
 * When this sketch runs:
 * 1. Connects to Wi-Fi ("Abhishek")
 * 2. Transmits an authenticated verification scan report via HTTPS POST
 * 3. Prints the HTTP 200 response to the Arduino Serial Monitor (115200 baud)
 * 4. Your web application dashboard (https://fivsed.vercel.app/dashboard)
 *    will immediately turn "Hardware Active" and show the live scan report!
 * ==============================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

extern "C" {
  #include "lwip/dns.h"
}

// Forward Function Prototypes (Required by PlatformIO / Standard C++)
void connectWiFi();
void sendTestScanReport();

// Wi-Fi Configuration
const char* WIFI_SSID     = "Abhishek";
const char* WIFI_PASSWORD = "9640060290";

// FIVSED Web Application Ingestion Endpoint
const char* SERVER_ENDPOINT = "https://fivsed.vercel.app/api/events";
const char* DEVICE_API_KEY  = "fivsed_sec_key_77e9b812a4309c48";
const char* DEVICE_ID       = "FIVSED-001"; // Target STM32 Unit

// Hardware Pin Definitions (Default ESP32 pins)
#define PIN_ONBOARD_LED 2    // Built-in blue LED on most ESP32 DevKit boards
#define PIN_GREEN_LED   21   // External Green LED (Optional)
#define PIN_RED_LED     22   // External Red LED (Optional)

// SHA-256 Golden Reference Hash
const char* GOLDEN_HASH = "8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2";

int verificationCycle = 101;

void setup() {
  Serial.begin(115200);
  delay(1500);

  Serial.println("\n=======================================================");
  Serial.println("  FIVSED ESP32 Standalone Web Connection Test Node");
  Serial.println("=======================================================");

  pinMode(PIN_ONBOARD_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);
  pinMode(PIN_RED_LED, OUTPUT);

  digitalWrite(PIN_ONBOARD_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  digitalWrite(PIN_RED_LED, LOW);

  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[FIVSED] Wi-Fi connection lost. Reconnecting...");
    connectWiFi();
  }

  // Send a live test verification report
  sendTestScanReport();

  // Wait 30 seconds before sending the next heartbeat / verification cycle
  Serial.println("[FIVSED] Next telemetry report in 30 seconds...\n");
  for (int i = 0; i < 30; i++) {
    delay(1000);
  }
}

void connectWiFi() {
  Serial.print("[WiFi] Connecting to: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    digitalWrite(PIN_ONBOARD_LED, !digitalRead(PIN_ONBOARD_LED)); // Blink while connecting
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_ONBOARD_LED, HIGH); // Solid ON when connected
    Serial.println("\n[WiFi] Connected successfully!");
    Serial.print("[WiFi] IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WiFi] Signal Strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    // Fix mobile hotspot DNS issue: explicitly set Google DNS (8.8.8.8) and Cloudflare DNS (1.1.1.1)
    ip_addr_t primaryDns;
    IP_ADDR4(&primaryDns, 8, 8, 8, 8);
    dns_setserver(0, &primaryDns);

    ip_addr_t secondaryDns;
    IP_ADDR4(&secondaryDns, 1, 1, 1, 1);
    dns_setserver(1, &secondaryDns);

    Serial.println("[DNS] Configured Public DNS (8.8.8.8, 1.1.1.1) to bypass mobile hotspot DNS blocks.");
    delay(1000); // Allow DNS routing table to settle
  } else {
    digitalWrite(PIN_ONBOARD_LED, LOW);
    Serial.println("\n[WiFi] Failed to connect. Check Wi-Fi credentials or router distance.");
  }
}

void sendTestScanReport() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("-------------------------------------------------------");
  Serial.printf("[FIVSED] Preparing Scan Report #%d...\n", verificationCycle);

  // Use WiFiClientSecure for HTTPS connection to Vercel
  WiFiClientSecure secureClient;
  secureClient.setInsecure(); // Allows HTTPS connection to Vercel without root cert installation

  HTTPClient http;
  if (!http.begin(secureClient, SERVER_ENDPOINT)) {
    Serial.println("[HTTP] Failed to initialize connection to endpoint.");
    return;
  }

  // Add mandatory headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", DEVICE_API_KEY);

  // Construct JSON payload
  String payload = "{\n"
    "  \"device_id\": \"" + String(DEVICE_ID) + "\",\n"
    "  \"event\": \"FIRMWARE_VERIFICATION\",\n"
    "  \"status\": \"PASS\",\n"
    "  \"verification_id\": " + String(verificationCycle) + ",\n"
    "  \"current_hash\": \"" + String(GOLDEN_HASH) + "\",\n"
    "  \"reference_hash\": \"" + String(GOLDEN_HASH) + "\",\n"
    "  \"verification_duration_ms\": 385,\n"
    "  \"message\": \"ESP32 Hardware Test: Authoritative STM32 SHA-256 match confirmed. Target firmware intact.\"\n"
    "}";

  Serial.print("[HTTP] Sending POST to: ");
  Serial.println(SERVER_ENDPOINT);
  Serial.println("[HTTP] Payload:");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  if (httpCode > 0) {
    Serial.printf("[HTTP] Success! Server HTTP Response Code: %d\n", httpCode);
    String response = http.getString();
    Serial.println("[HTTP] Server Response Body:");
    Serial.println(response);

    if (httpCode == 200 || httpCode == 201) {
      // Indicate SUCCESS on physical LEDs
      digitalWrite(PIN_GREEN_LED, HIGH);
      digitalWrite(PIN_RED_LED, LOW);
      digitalWrite(PIN_ONBOARD_LED, HIGH);

      Serial.println("\n>>> [SUCCESS] Web Application received telemetry!");
      Serial.println(">>> Check your live dashboard: https://fivsed.vercel.app/dashboard");
      Serial.println(">>> Status will now show: [Hardware Active] (Green pulsing indicator)");

      verificationCycle++;
    } else {
      digitalWrite(PIN_RED_LED, HIGH);
    }
  } else {
    Serial.printf("[HTTP] POST failed. Error: %s\n", http.errorToString(httpCode).c_str());
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_GREEN_LED, LOW);
  }

  http.end();
  Serial.println("-------------------------------------------------------");
}
