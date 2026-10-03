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

  // 1. Maintain dynamic registration and liveness of all 3 hardware architectural nodes
  // Device 1: ESP32-WROOM-32 Telemetry & Controller Node
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
    esp32.updated_at = eventTime;
  }

  // Device 2: STM32F407 Security Authority
  const stm32ActiveInHeartbeat = payload.event === 'COMPONENT_HEARTBEAT' 
    ? Boolean(payload.metadata?.stm32_active) 
    : true;
  let stm32 = store.devices.find(d => d.device_id === 'FIVSED-001' || d.device_type === 'STM32');
  if (!stm32) {
    stm32 = {
      id: 'dev-fivsed-001',
      device_id: 'FIVSED-001',
      device_type: 'STM32',
      device_name: 'STM32F407 Security Verifier',
      role_title: 'Security Authority',
      role_description: 'Authoritative firmware integrity verifier. Measures target firmware locally, computes SHA-256 on-chip, compares against trusted golden reference internally, and transmits decision with HMAC.',
      status: stm32ActiveInHeartbeat ? 'ONLINE' : 'OFFLINE',
      communication_method: 'Direct Hardware Bus / Dual UART',
      verification_interval_minutes: 10,
      last_seen: stm32ActiveInHeartbeat ? eventTime : new Date(0).toISOString(),
      created_at: eventTime,
      updated_at: eventTime,
      is_security_authority: true
    };
    store.devices.push(stm32);
  } else {
    if (stm32ActiveInHeartbeat) {
      stm32.last_seen = eventTime;
      stm32.status = isFailure ? 'WARNING' : 'ONLINE';
    } else if (payload.event === 'COMPONENT_HEARTBEAT') {
      stm32.status = 'OFFLINE';
    }
    stm32.updated_at = eventTime;
  }

  // Device 3: Raspberry Pi 3 Model B+ (Main System)
  const piActiveInHeartbeat = payload.event === 'COMPONENT_HEARTBEAT'
    ? Boolean(payload.metadata?.raspberry_pi_active)
    : false;
  let pi = store.devices.find(d => d.device_id === 'FIVSED-003' || d.device_type === 'RASPBERRY_PI');
  if (!pi) {
    pi = {
      id: 'dev-fivsed-003',
      device_id: 'FIVSED-003',
      device_type: 'RASPBERRY_PI',
      device_name: 'Raspberry Pi 3 Model B+',
      role_title: 'FIVSED Main System',
      role_description: 'Runs on-premise local operator interface and system supervisory telemetry.',
      status: piActiveInHeartbeat ? 'ONLINE' : 'OFFLINE',
      communication_method: 'Internal Bus / UART',
      verification_interval_minutes: 10,
      last_seen: piActiveInHeartbeat ? eventTime : new Date(0).toISOString(),
      created_at: eventTime,
      updated_at: eventTime,
      is_security_authority: false
    };
    store.devices.push(pi);
  } else {
    if (piActiveInHeartbeat) {
      pi.last_seen = eventTime;
      pi.status = 'ONLINE';
    } else if (payload.event === 'COMPONENT_HEARTBEAT') {
      pi.status = 'OFFLINE';
    }
    pi.updated_at = eventTime;
  }

  // 2. Record verification scan report if applicable (from authoritative STM32 frame)
  let newVerification: FirmwareVerification | undefined;
  if (payload.verification_id) {
    newVerification = {
      id: `ver-${Date.now()}-${payload.verification_id}`,
      verification_id: payload.verification_id,
      device_id: payload.device_id,
      stm32_hmac: (payload.metadata?.stm32_hmac as string) || undefined,
      status: payload.status,
      verification_result: isFailure ? 'HASH_MISMATCH' : 'INTEGRITY_PASS',
      verification_duration_ms: payload.verification_duration_ms || 390,
      verified_at: eventTime,
      created_at: eventTime,
      source: 'STM32',
      notes: payload.message || (payload.metadata?.result 
        ? `Authoritative STM32 Security Decision: ${payload.metadata.result}`
        : (isPass 
          ? 'Authoritative firmware integrity verified on-chip by STM32 Security Authority. Decision: MATCH.' 
          : 'Authoritative firmware integrity mismatch detected on-chip by STM32 Security Authority. Decision: HASH_MISMATCH.'))
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
      ? `Authoritative firmware integrity verification failed on target ${payload.device_id} (Verification #${payload.verification_id || 'N/A'}).`
      : payload.event === 'COMPONENT_HEARTBEAT'
      ? `Heartbeat liveness received: ESP32=ACTIVE STM32=${stm32ActiveInHeartbeat ? 'ACTIVE' : 'DISCONNECTED'} PI=${piActiveInHeartbeat ? 'ACTIVE' : 'NOT_DETECTED'}`
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
