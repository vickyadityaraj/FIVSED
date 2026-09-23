export type SystemRole = 'STM32_SECURITY_AUTHORITY' | 'ESP32_CONTROLLER_UPLOADER' | 'RASPBERRY_PI_MAIN_SYSTEM';

export type DeviceType = 'STM32' | 'ESP32' | 'RASPBERRY_PI';

export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';

export type VerificationStatus = 'PASS' | 'FAIL' | 'ERROR' | 'VERIFYING';

export type VerificationResult = 
  | 'INTEGRITY_PASS'
  | 'HASH_MISMATCH'
  | 'VERIFICATION_ERROR'
  | 'TIMEOUT';

export type EventType =
  | 'FIRMWARE_VERIFICATION'
  | 'HASH_MISMATCH'
  | 'VERIFICATION_ERROR'
  | 'COMMUNICATION_TIMEOUT'
  | 'DEVICE_ONLINE'
  | 'DEVICE_OFFLINE'
  | 'HEARTBEAT'
  | 'CONFIGURATION_CHANGE'
  | 'SECURITY_ALERT_ACKNOWLEDGED';

export type EventSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type UserRole = 'admin' | 'security_operator' | 'viewer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  avatar_url?: string;
}

export interface Device {
  id: string;
  device_id: string;
  device_type: DeviceType;
  device_name: string;
  role_title: string;
  role_description: string;
  status: DeviceStatus;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  hardware_version?: string;
  communication_method: string;
  verification_interval_minutes: number;
  last_seen: string;
  created_at: string;
  updated_at: string;
  uptime_seconds?: number;
  is_security_authority: boolean;
}

export interface FirmwareVerification {
  id: string;
  verification_id: number;
  device_id: string;
  current_hash: string;
  reference_hash: string;
  status: VerificationStatus;
  verification_result: VerificationResult;
  verification_duration_ms: number;
  verified_at: string;
  created_at: string;
  source: 'STM32'; // Always STM32 as Security Authority
  notes?: string;
  mismatch_byte_offset?: number;
}

export interface SecurityEvent {
  id: string;
  device_id: string;
  event_type: EventType;
  status: VerificationStatus | 'SUCCESS' | 'ERROR';
  severity: EventSeverity;
  message: string;
  verification_id?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  source: 'STM32' | 'ESP32' | 'RASPBERRY_PI' | 'WEB_APP';
}

export interface SecurityAlert {
  id: string;
  device_id: string;
  event_type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  verification_id?: number;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
}

export interface DeviceHeartbeat {
  id: string;
  device_id: string;
  status: DeviceStatus;
  ip_address?: string;
  metadata?: Record<string, unknown>;
  recorded_at: string;
}

export interface EventIngestionPayload {
  device_id: string;
  event: EventType | string;
  status: VerificationStatus;
  timestamp?: string;
  verification_id?: number;
  current_hash?: string;
  reference_hash?: string;
  verification_duration_ms?: number;
  severity?: EventSeverity;
  metadata?: Record<string, unknown>;
  message?: string;
}

export interface EventIngestionResponse {
  success: boolean;
  message: string;
  event_id?: string;
  verification_id?: number;
  alert_created?: boolean;
}
