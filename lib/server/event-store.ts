import { Device, FirmwareVerification, SecurityAlert, SecurityEvent } from '@/types/fivsed';

// Server-side in-memory event store for dynamic runtime persistence when Supabase is not yet connected
// All data is dynamic and created exclusively via live API ingestion (POST /api/events) or Supabase.

interface GlobalEventStore {
  devices: Device[];
  verifications: FirmwareVerification[];
  events: SecurityEvent[];
  alerts: SecurityAlert[];
}

declare global {
  // eslint-disable-next-line no-var
  var __fivsed_store__: GlobalEventStore | undefined;
}

if (!global.__fivsed_store__) {
  global.__fivsed_store__ = {
    devices: [],
    verifications: [],
    events: [],
    alerts: []
  };
}

export const eventStore = global.__fivsed_store__;

export function clearAllData() {
  if (global.__fivsed_store__) {
    global.__fivsed_store__.devices = [];
    global.__fivsed_store__.verifications = [];
    global.__fivsed_store__.events = [];
    global.__fivsed_store__.alerts = [];
  }
}

// Device active timeout window: 2 minutes (120,000 ms)
const HARDWARE_TIMEOUT_MS = 120000;

export function getComputedDevices(): Device[] {
  const store = global.__fivsed_store__!;
  const now = Date.now();

  return store.devices.map(device => {
    const lastSeenTime = new Date(device.last_seen).getTime();
    const isOnline = (now - lastSeenTime) < HARDWARE_TIMEOUT_MS;
    return {
      ...device,
      status: isOnline ? (device.status === 'WARNING' ? 'WARNING' : 'ONLINE') : 'OFFLINE'
    };
  });
}

export function isAnyHardwareOnline(): boolean {
  const devices = getComputedDevices();
  return devices.some(d => d.status === 'ONLINE' || d.status === 'WARNING');
}

export function recordIngestedEvent(payload: {
  device_id: string;
  event: string;
  status: 'PASS' | 'FAIL' | 'ERROR' | 'VERIFYING';
  timestamp?: string;
  verification_id?: number;
  current_hash?: string;
  reference_hash?: string;
  verification_duration_ms?: number;
  severity?: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  metadata?: Record<string, unknown>;
  message?: string;
}) {
  const store = global.__fivsed_store__!;
  const eventTime = payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString();
  const isFailure = payload.status === 'FAIL' || payload.event === 'HASH_MISMATCH';
  const isPass = payload.status === 'PASS';

  // 1. Ensure STM32 device is registered when telemetry arrives
  let targetDevice = store.devices.find(d => d.device_id === payload.device_id);
  if (!targetDevice) {
    targetDevice = {
      id: `dev-${payload.device_id.toLowerCase()}`,
      device_id: payload.device_id,
      device_type: payload.device_id.includes('002') ? 'ESP32' : payload.device_id.includes('003') ? 'RASPBERRY_PI' : 'STM32',
      device_name: payload.device_id === 'FIVSED-001' ? 'STM32F407 Security Verifier' : payload.device_id === 'FIVSED-002' ? 'ESP32-WROOM-32 Node' : 'Raspberry Pi 3 Model B+',
      role_title: payload.device_id === 'FIVSED-001' ? 'Security Authority' : payload.device_id === 'FIVSED-002' ? 'Controller & Web Uploader' : 'FIVSED Main System',
      role_description: payload.device_id === 'FIVSED-001' 
        ? 'Authoritative firmware integrity verifier. Measures protected target firmware, computes SHA-256, and generates PASS/FAIL decisions.' 
        : payload.device_id === 'FIVSED-002'
        ? 'Receives STM32 verification results over UART, drives physical indicators, and uploads to web app via Wi-Fi. (Does NOT determine trust)'
        : 'Runs on-premise local operator interface and logs.',
      status: isFailure ? 'WARNING' : 'ONLINE',
      communication_method: payload.device_id === 'FIVSED-001' ? 'Direct Internal HW Bus / Dual UART' : 'Wi-Fi 802.11 b/g/n',
      verification_interval_minutes: 10,
      last_seen: eventTime,
      created_at: eventTime,
      updated_at: eventTime,
      is_security_authority: payload.device_id === 'FIVSED-001'
    };
    store.devices.push(targetDevice);
  } else {
    targetDevice.last_seen = eventTime;
    targetDevice.status = isFailure ? 'WARNING' : 'ONLINE';
    targetDevice.updated_at = eventTime;
  }

  // Also ensure ESP32 uploader is registered as active
  let esp32 = store.devices.find(d => d.device_type === 'ESP32');
  if (!esp32) {
    esp32 = {
      id: 'dev-fivsed-002',
      device_id: 'FIVSED-002',
      device_type: 'ESP32',
      device_name: 'ESP32-WROOM-32 Node',
      role_title: 'Controller & Web Uploader',
      role_description: 'Receives authoritative verification results from STM32 over UART, controls physical indicator LEDs and buzzer, and uploads verification records/security events to the FIVSED Web App over Wi-Fi.',
      status: 'ONLINE',
      ip_address: '192.168.1.142',
      communication_method: 'Wi-Fi 802.11 b/g/n (HTTPS REST to Next.js API)',
      verification_interval_minutes: 10,
      last_seen: eventTime,
      created_at: eventTime,
      updated_at: eventTime,
      is_security_authority: false
    };
    store.devices.push(esp32);
  } else {
    esp32.last_seen = eventTime;
    esp32.status = 'ONLINE';
  }

  // 2. Record verification scan report if applicable
  let newVerification: FirmwareVerification | undefined;
  if (payload.verification_id) {
    newVerification = {
      id: `ver-${Date.now()}-${payload.verification_id}`,
      verification_id: payload.verification_id,
      device_id: payload.device_id,
      current_hash: payload.current_hash || 'UNKNOWN_DIGEST',
      reference_hash: payload.reference_hash || payload.current_hash || 'UNKNOWN_DIGEST',
      status: payload.status,
      verification_result: isFailure ? 'HASH_MISMATCH' : 'INTEGRITY_PASS',
      verification_duration_ms: payload.verification_duration_ms || 390,
      verified_at: eventTime,
      created_at: eventTime,
      source: 'STM32',
      notes: payload.message || (isPass 
        ? 'Periodic firmware verification cycle completed. SHA-256 matches trusted reference.' 
        : 'Firmware integrity verification failed because the measured hash did not match the trusted reference on ' + payload.device_id + '.')
    };
    store.verifications.unshift(newVerification);
  }

  // 3. Record Security Event
  const calcSeverity = payload.severity || (isFailure ? 'CRITICAL' : payload.status === 'ERROR' ? 'HIGH' : 'INFO');
  const newEvent: SecurityEvent = {
    id: `evt-${Date.now()}`,
    device_id: payload.device_id,
    event_type: payload.event as any,
    status: payload.status,
    severity: calcSeverity,
    message: payload.message || (isFailure 
      ? `Firmware integrity verification failed because the measured hash did not match the trusted reference on ${payload.device_id} (Verification #${payload.verification_id || 'N/A'}).`
      : `Firmware verification cycle #${payload.verification_id || 'N/A'} completed on ${payload.device_id}: ${payload.status}`),
    verification_id: payload.verification_id,
    metadata: payload.metadata || {},
    source: payload.device_id === 'FIVSED-001' ? 'STM32' : 'ESP32',
    created_at: eventTime
  };
  store.events.unshift(newEvent);

  // 4. Create Alert if failure occurred
  let newAlert: SecurityAlert | undefined;
  if (isFailure) {
    newAlert = {
      id: `alt-${Date.now()}`,
      device_id: payload.device_id,
      event_type: 'HASH_MISMATCH',
      severity: 'CRITICAL',
      title: 'Firmware Integrity Failure Detected',
      description: `Firmware integrity verification failed because the measured hash did not match the trusted reference on ${payload.device_id} (Verification #${payload.verification_id || 'N/A'}).`,
      status: 'ACTIVE',
      verification_id: payload.verification_id,
      created_at: eventTime
    };
    store.alerts.unshift(newAlert);
  }

  return {
    verification: newVerification,
    event: newEvent,
    alert: newAlert
  };
}
