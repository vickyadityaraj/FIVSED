'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  Device, 
  FirmwareVerification, 
  SecurityAlert, 
  SecurityEvent
} from '@/types/fivsed';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const GOLDEN_REFERENCE_HASH = '8f4a7c1b5e2d9a03b6e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2b5e8d1f4c7a2';
export const TAMPERED_HASH = '9c2b4d8e1f0a5b7c3e9a1d2f4b6c8e0a2d4f6b8c0e2a4d6f8a0b2d4e6f8a0b2c';

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
  const lastPacketTime = latestVerification ? new Date(latestVerification.verified_at).getTime() : 0;
  const secondsSinceLastPacket = lastPacketTime > 0 ? Math.max(0, Math.floor((now - lastPacketTime) / 1000)) : null;

  // STRICT DYNAMIC HEARTBEAT:
  // Hardware transmits every 30 seconds. If no packet received within 45 seconds, hardware is OFFLINE.
  const isHardwareConnected = lastPacketTime > 0 && (now - lastPacketTime) < 45000;

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
            return {
              ...d,
              status: isOnline ? (d.status === 'WARNING' ? 'WARNING' : 'ONLINE') : 'OFFLINE'
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

  const triggerSimulatedVerification = async (type: 'PASS' | 'FAIL') => {
    setIsSimulating(true);
    const nextVerId = (latestVerification?.verification_id || 40) + 1;
    const isPass = type === 'PASS';
    const currentHash = isPass ? GOLDEN_REFERENCE_HASH : TAMPERED_HASH;

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
          current_hash: currentHash,
          reference_hash: GOLDEN_REFERENCE_HASH,
          verification_duration_ms: Math.floor(380 + Math.random() * 30),
          severity: isPass ? 'INFO' : 'CRITICAL',
          message: isPass 
            ? `Periodic firmware verification cycle #${nextVerId} completed: SHA-256 match confirmed.`
            : `Firmware integrity verification failed because the measured hash did not match the trusted reference on FIVSED-001 (Verification #${nextVerId}).`
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
