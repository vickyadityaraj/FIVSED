'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  Device, 
  DeviceStatus,
  FirmwareVerification, 
  SecurityAlert, 
  SecurityEvent
} from '@/types/fivsed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface FIVSEDContextType {
  devices: Device[];
  verifications: FirmwareVerification[];
  latestVerification: FirmwareVerification | null;
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  activeAlertsCount: number;
  lastSync: Date;
  isRealtimeConnected: boolean;
  isHardwareConnected: boolean;
  stm32Active: boolean;
  piActive: boolean;
  esp32Active: boolean;
  secondsSinceLastPacket: number | null;
  isLoading: boolean;
  isSimulating: boolean;
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => Promise<void>;
  triggerSimulatedVerification: (type: 'PASS' | 'FAIL') => Promise<void>;
}

const FIVSEDContext = createContext<FIVSEDContextType | undefined>(undefined);

export function FIVSEDProvider({ children }: { children: React.ReactNode }) {
  // Start with clean dynamic state (NO STATIC DATA)
  const [devices, setDevices] = useState<Device[]>([]);
  const [verifications, setVerifications] = useState<FirmwareVerification[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isRealtimeConnected, setIsRealtimeConnected] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // 1-second continuous clock ticker for precise live heartbeat countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const latestVerification = verifications.length > 0 ? verifications[0] : null;
  const activeAlertsCount = alerts.filter(a => a.status === 'ACTIVE').length;

  // Find the latest telemetry packet time across verifications, heartbeat events, and device last_seen
  const latestVerificationTime = latestVerification ? new Date(latestVerification.verified_at).getTime() : 0;
  const latestEventTime = events.length > 0 ? new Date(events[0].created_at).getTime() : 0;
  const latestDeviceSeenTime = devices.reduce(
    (max, d) => Math.max(max, d.last_seen ? new Date(d.last_seen).getTime() : 0), 
    0
  );

  const lastPacketTime = Math.max(latestVerificationTime, latestEventTime, latestDeviceSeenTime);
  const secondsSinceLastPacket = lastPacketTime > 0 ? Math.max(0, Math.floor((now - lastPacketTime) / 1000)) : null;

  // DYNAMIC HEARTBEAT:
  // Hardware transmits every 15-30s. If any packet/heartbeat received within 45s or any device status is ONLINE:
  const isHardwareConnected = (lastPacketTime > 0 && (now - lastPacketTime) < 45000) ||
    devices.some(d => d.status === 'ONLINE' || d.status === 'WARNING');

  const refreshData = useCallback(async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        const [devRes, verRes, evtRes, altRes] = await Promise.all([
          supabase.from('devices').select('*').order('device_id'),
          supabase.from('firmware_verifications').select('*').order('verified_at', { ascending: false }).limit(50),
          supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(50),
          supabase.from('alerts').select('*').order('created_at', { ascending: false })
        ]);

        const currentTimestamp = Date.now();

        if (devRes.data) {
          const computed = (devRes.data as Device[]).map(d => {
            const lastSeenTime = d.last_seen ? new Date(d.last_seen).getTime() : 0;
            const isOnline = (currentTimestamp - lastSeenTime) < 45000;
            const status: DeviceStatus = (d.status === 'OFFLINE' || !isOnline)
              ? 'OFFLINE'
              : (d.status === 'WARNING' ? 'WARNING' : 'ONLINE');
            return {
              ...d,
              status
            };
          });
          setDevices(computed);
        }

        if (verRes.data) setVerifications(verRes.data as FirmwareVerification[]);
        if (evtRes.data) setEvents(evtRes.data as SecurityEvent[]);
        if (altRes.data) setAlerts(altRes.data as SecurityAlert[]);
      } else {
        // Query live dynamic API ingestion endpoint
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json();
          if (data.devices) setDevices(data.devices);
          if (data.verifications) setVerifications(data.verifications);
          if (data.events) setEvents(data.events);
          if (data.alerts) setAlerts(data.alerts);
        }
      }
      setLastSync(new Date());
    } catch (err) {
      console.error('Error fetching live FIVSED monitoring data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearAllData = async () => {
    try {
      await fetch('/api/events', { method: 'DELETE' });
      setDevices([]);
      setVerifications([]);
      setEvents([]);
      setAlerts([]);
      await refreshData();
    } catch (err) {
      console.error('Failed to clear FIVSED telemetry data:', err);
    }
  };

  useEffect(() => {
    refreshData();

    // Auto-poll every 3 seconds to guarantee real-time updates as ESP32 transmits
    const pollInterval = setInterval(() => {
      refreshData();
    }, 3000);

    const client = supabase;
    if (isSupabaseConfigured && client) {
      const channel = client
        .channel('fivsed-realtime-monitoring')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'firmware_verifications' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'security_events' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
          refreshData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
          refreshData();
        })
        .subscribe((status) => {
          setIsRealtimeConnected(status === 'SUBSCRIBED');
        });

      return () => {
        clearInterval(pollInterval);
        client.removeChannel(channel);
      };
    }

    return () => clearInterval(pollInterval);
  }, [refreshData]);

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'ACKNOWLEDGE' })
      });
      await refreshData();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch('/api/events', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId, action: 'RESOLVE' })
      });
      await refreshData();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const stm32Device = devices.find(d => d.device_type === 'STM32' || d.device_id === 'FIVSED-001');
  const piDevice = devices.find(d => d.device_type === 'RASPBERRY_PI' || d.device_id === 'FIVSED-003');
  const esp32Device = devices.find(d => d.device_type === 'ESP32' || d.device_id === 'FIVSED-002');

  const stm32Active = Boolean(stm32Device && stm32Device.status !== 'OFFLINE');
  const piActive = Boolean(piDevice && piDevice.status !== 'OFFLINE');
  const esp32Active = isHardwareConnected;

  const triggerSimulatedVerification = async (type: 'PASS' | 'FAIL') => {
    setIsSimulating(true);
    const nextVerId = (latestVerification?.verification_id || 40) + 1;
    const isPass = type === 'PASS';

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'fivsed_sec_key_77e9b812a4309c48'
        },
        body: JSON.stringify({
          device_id: 'FIVSED-001',
          event: isPass ? 'FIRMWARE_VERIFICATION' : 'HASH_MISMATCH',
          status: type,
          verification_id: nextVerId,
          verification_duration_ms: Math.floor(380 + Math.random() * 30),
          severity: isPass ? 'INFO' : 'CRITICAL',
          message: isPass 
            ? `Authoritative firmware integrity verified on-chip by STM32 Security Authority. Decision: MATCH (Verification #${nextVerId}).`
            : `Authoritative firmware integrity mismatch detected on-chip by STM32 Security Authority. Decision: HASH_MISMATCH (Verification #${nextVerId}).`
        })
      });
      await refreshData();
    } catch (err) {
      console.error('Failed to trigger verification via API:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <FIVSEDContext.Provider value={{
      devices,
      verifications,
      latestVerification,
      events,
      alerts,
      activeAlertsCount,
      lastSync,
      isRealtimeConnected,
      isHardwareConnected,
      stm32Active,
      piActive,
      esp32Active,
      secondsSinceLastPacket,
      isLoading,
      isSimulating,
      refreshData,
      clearAllData,
      acknowledgeAlert,
      resolveAlert,
      triggerSimulatedVerification
    }}>
      {children}
    </FIVSEDContext.Provider>
  );
}

export function useFIVSED() {
  const context = useContext(FIVSEDContext);
  if (!context) {
    throw new Error('useFIVSED must be used within a FIVSEDProvider');
  }
  return context;
}
