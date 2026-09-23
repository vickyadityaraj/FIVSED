-- ============================================================================
-- FIVSED: Firmware Integrity Verification and Security Event Detection
-- Seed Data for Supabase
-- ============================================================================

-- 1. Insert System Devices
INSERT INTO public.devices (
    device_id,
    device_type,
    device_name,
    role_title,
    role_description,
    status,
    ip_address,
    mac_address,
    firmware_version,
    hardware_version,
    communication_method,
    verification_interval_minutes,
    last_seen
) VALUES 
(
    'FIVSED-001',
    'STM32',
    'STM32F407 Security Verifier',
    'Security Authority',
    'Authoritative firmware integrity verifier. Measures protected target firmware, computes SHA-256, compares against secure trusted reference, and produces authoritative PASS/FAIL decisions.',
    'ONLINE',
    NULL,
    NULL,
    'v2.4.1-sec',
    'STM32F4-DISCOVERY',
    'Internal HW Bus / Dual UART to ESP32 & Raspberry Pi',
    10,
    NOW() - INTERVAL '1 minute'
),
(
    'FIVSED-002',
    'ESP32',
    'ESP32-WROOM-32 Node',
    'Controller & Web Uploader',
    'Receives authoritative verification results from STM32 over UART, controls physical indicator LEDs and piezo buzzer, and uploads verification records/security events to the FIVSED Web App over Wi-Fi.',
    'ONLINE',
    '192.168.1.142',
    '24:6F:28:8A:BC:10',
    'v1.8.0-net',
    'ESP32 DevKit V1',
    'Wi-Fi 802.11 b/g/n (HTTPS REST to Next.js API)',
    10,
    NOW() - INTERVAL '45 seconds'
),
(
    'FIVSED-003',
    'RASPBERRY_PI',
    'Raspberry Pi 3 Model B+',
    'FIVSED Main System',
    'Runs the local FIVSED GUI and background service on-premise, archives historical audit logs locally, and provides local system diagnostics directly connected to the STM32 via USB-Serial.',
    'ONLINE',
    '192.168.1.105',
    'B8:27:EB:4A:21:8F',
    'v3.1.2-linux',
    'Raspberry Pi 3 Model B+ Rev 1.3',
    'Ethernet / Local USB Serial UART',
    10,
    NOW() - INTERVAL '30 seconds'
)
ON CONFLICT (device_id) DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = EXCLUDED.last_seen;

-- 2. Insert Firmware Verifications (Authoritative STM32 output)
-- Reference Hash: 8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2
INSERT INTO public.firmware_verifications (
    verification_id,
    device_id,
    current_hash,
    reference_hash,
    status,
    verification_result,
    verification_duration_ms,
    source,
    verified_at
) VALUES
(
    42,
    'FIVSED-001',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'PASS',
    'INTEGRITY_PASS',
    384,
    'STM32',
    NOW() - INTERVAL '2 minutes'
),
(
    41,
    'FIVSED-001',
    '9c2b4d8e1f0a5b7c3e9a1d2f4b6c8e0a2d4f6b8c0e2a4d6f8a0b2d4e6f8a0b2c',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'FAIL',
    'HASH_MISMATCH',
    412,
    'STM32',
    NOW() - INTERVAL '12 minutes'
),
(
    40,
    'FIVSED-001',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'PASS',
    'INTEGRITY_PASS',
    391,
    'STM32',
    NOW() - INTERVAL '22 minutes'
),
(
    39,
    'FIVSED-001',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'PASS',
    'INTEGRITY_PASS',
    388,
    'STM32',
    NOW() - INTERVAL '32 minutes'
),
(
    38,
    'FIVSED-001',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'PASS',
    'INTEGRITY_PASS',
    395,
    'STM32',
    NOW() - INTERVAL '42 minutes'
),
(
    37,
    'FIVSED-001',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2',
    'PASS',
    'INTEGRITY_PASS',
    382,
    'STM32',
    NOW() - INTERVAL '52 minutes'
);

-- 3. Insert Security Events
INSERT INTO public.security_events (
    device_id,
    event_type,
    status,
    severity,
    message,
    verification_id,
    source,
    created_at
) VALUES
(
    'FIVSED-001',
    'FIRMWARE_VERIFICATION',
    'PASS',
    'INFO',
    'Periodic firmware verification cycle completed. SHA-256 matches trusted golden reference.',
    42,
    'STM32',
    NOW() - INTERVAL '2 minutes'
),
(
    'FIVSED-002',
    'HEARTBEAT',
    'SUCCESS',
    'INFO',
    'ESP32 Wi-Fi telemetry synchronization successful. RSSI: -54 dBm.',
    NULL,
    'ESP32',
    NOW() - INTERVAL '45 seconds'
),
(
    'FIVSED-001',
    'HASH_MISMATCH',
    'FAIL',
    'CRITICAL',
    'Firmware integrity verification failed because the measured hash did not match the trusted reference on FIVSED-001.',
    41,
    'STM32',
    NOW() - INTERVAL '12 minutes'
),
(
    'FIVSED-002',
    'SECURITY_ALERT_ACKNOWLEDGED',
    'SUCCESS',
    'WARNING',
    'ESP32 physical alarm buzzer silenced by operator console command.',
    41,
    'ESP32',
    NOW() - INTERVAL '10 minutes'
),
(
    'FIVSED-003',
    'DEVICE_ONLINE',
    'SUCCESS',
    'INFO',
    'Raspberry Pi local FIVSED daemon started successfully.',
    NULL,
    'RASPBERRY_PI',
    NOW() - INTERVAL '4 hours'
);

-- 4. Insert Alerts
INSERT INTO public.alerts (
    device_id,
    event_type,
    severity,
    title,
    description,
    status,
    verification_id,
    created_at
) VALUES
(
    'FIVSED-001',
    'HASH_MISMATCH',
    'CRITICAL',
    'Firmware Integrity Failure Detected',
    'Firmware integrity verification failed because the measured hash did not match the trusted reference on FIVSED-001 (Verification #41).',
    'ACTIVE',
    41,
    NOW() - INTERVAL '12 minutes'
),
(
    'FIVSED-002',
    'COMMUNICATION_TIMEOUT',
    'WARNING',
    'ESP32 Wi-Fi Uplink Warning',
    'Upload latency exceeded 1200ms during routine telemetry transmission.',
    'RESOLVED',
    NULL,
    NOW() - INTERVAL '2 hours'
);
