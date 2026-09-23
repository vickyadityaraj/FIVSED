# FIVSED — Firmware Integrity Verification and Security Event Detection

A remote cybersecurity dashboard for embedded firmware security systems, deployed directly to **Vercel** with **Supabase PostgreSQL & Realtime**.

---

## 1. System Architecture

The FIVSED system enforces strict hierarchical authority:

```
┌────────────────────────────────────────────────────────┐
│           Protected Firmware (Target Device)           │
└───────────────────────────┬────────────────────────────┘
                            │ (Direct measurement)
                            ▼
┌────────────────────────────────────────────────────────┐
│             STM32 — SECURITY AUTHORITY                 │
│  • Measures protected firmware binary                  │
│  • Calculates SHA-256 cryptographic digest             │
│  • Compares against trusted golden reference           │
│  • Authoritative PASS / FAIL / ERROR decision          │
│  • Autonomous 10-minute scheduled verification cycle   │
└───────────────┬────────────────────────┬───────────────┘
                │ UART                   │ UART/USB
                ▼                        ▼
┌──────────────────────────────┐ ┌──────────────────────┐
│  ESP32 Controller & Uploader │ │ Raspberry Pi 3 B+    │
│  • Receives STM32 decision   │ │ FIVSED Main System   │
│  • Controls LEDs & buzzer    │ │ • Local GUI / logs   │
│  • Uploads status via Wi-Fi  │ │ • Direct serial link │
│  • DOES NOT determine trust  │ └──────────────────────┘
└───────────────┬──────────────┘
                │ Wi-Fi (HTTPS / JSON POST)
                ▼
┌────────────────────────────────────────────────────────┐
│           FIVSED Web Application (Next.js)             │
│  • Deployed on Vercel                                  │
│  • Ingestion Endpoint: POST /api/events                │
│  • Displays Scan Reports & Tampered Alerts             │
└───────────────┬────────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────────────────┐
│             Supabase Cloud / PostgreSQL                │
│  • Stores Scan Reports & Tampered Alerts               │
└────────────────────────────────────────────────────────┘
```

> **CRITICAL ARCHITECTURAL RULE**: The STM32 is the sole **Security Authority**. The ESP32 is strictly a peripheral controller and web uploader.

---

## 2. Core Stored Data: Scan Reports & Tamper Alerts

The application is streamlined to store and monitor two critical datasets:

1. **Firmware Scan Reports (`firmware_verifications`)**:
   - `verification_id`: Sequential cycle identifier (e.g., #42)
   - `device_id`: Monitored device (`FIVSED-001`)
   - `current_hash`: Measured 256-bit SHA-256 digest
   - `reference_hash`: Authoritative golden reference digest
   - `status`: `PASS` or `FAIL`
   - `verification_result`: `INTEGRITY_PASS` or `HASH_MISMATCH`
   - `duration_ms`: Hardware execution duration
   - `verified_at`: Timestamp

2. **Tampered Alerts (`alerts`)**:
   - `device_id`: Affected device
   - `event_type`: `HASH_MISMATCH`
   - `severity`: `CRITICAL`
   - `title`: Firmware Integrity Failure Detected
   - `description`: Factual audit description of the mismatch
   - `status`: `ACTIVE`, `ACKNOWLEDGED`, `RESOLVED`

---

## 3. Deploying to Vercel

### Step 1: Push Code to GitHub / Git Provider
Push this repository to GitHub, GitLab, or Bitbucket.

### Step 2: Import Project in Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your repository.
3. Framework preset will automatically detect **Next.js**.

### Step 3: Add Environment Variables in Vercel
In the Vercel project settings, add:
* `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (`https://your-id.supabase.co`)
* `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key
* `DEVICE_API_KEY`: `fivsed_sec_key_77e9b812a4309c48` (or your chosen key for the ESP32)

Click **Deploy**!

---

## 4. Supabase Setup

1. In your Supabase Dashboard, open the **SQL Editor**.
2. Run the script in `supabase/schema.sql` to create the tables, indexes, and RLS policies.
3. Your database is now ready to receive live scan reports and tamper alerts from the ESP32.

---

## 5. ESP32 Microcontroller Integration

The ESP32 Arduino C++ code is in `firmware/esp32_fivsed_uploader/esp32_fivsed_uploader.ino`.

### Endpoint & Authentication
* **HTTP Method**: `POST`
* **URL**: `https://<your-vercel-domain>.vercel.app/api/events`
* **Header**: `x-api-key: fivsed_sec_key_77e9b812a4309c48`

### Example ESP32 Ingestion Payload:
```json
{
  "device_id": "FIVSED-001",
  "event": "FIRMWARE_VERIFICATION",
  "status": "PASS",
  "verification_id": 42,
  "current_hash": "8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2",
  "reference_hash": "8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2",
  "verification_duration_ms": 384
}
```

---

## 6. Live Dynamic Telemetry & Hardware Connection

* **Dynamic Offline State**: When no hardware is transmitting, the application displays **Hardware Offline** and **Awaiting Telemetry**.
* **Dynamic Active State**: When the STM32 performs a firmware integrity scan and sends the decision via UART to the ESP32, the ESP32 uploads the result via HTTPS `POST /api/events`. The dashboard immediately updates to **Hardware Active** with the live scan report.
* **Data Reset**: An operator can clear stored scan telemetry and alerts at any time via the **Clear Data** button in the top navigation bar or `DELETE /api/events`.
