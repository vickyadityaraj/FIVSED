'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Cpu, 
  ShieldCheck, 
  Wifi, 
  Server, 
  Clock, 
  Activity, 
  Key, 
  AlertTriangle,
  Radio,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashDisplay } from '@/components/ui/HashDisplay';
import { useFIVSED } from '@/lib/context/fivsed-context';

export default function DeviceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { devices, verifications, events } = useFIVSED();

  const deviceId = params.id as string;
  const device = devices.find(d => d.device_id.toLowerCase() === deviceId?.toLowerCase());

  if (!device) {
    return (
      <AppLayout title="Device Details">
        <div className="soc-card p-12 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Device Not Found</h2>
          <p className="text-xs text-slate-400">
            No hardware module registered with ID: <span className="font-mono text-cyan-400">{deviceId}</span>
          </p>
          <Link
            href="/devices"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Devices</span>
          </Link>
        </div>
      </AppLayout>
    );
  }

  const isAuthority = device.is_security_authority;
  const deviceEvents = events.filter(e => e.device_id === device.device_id);
  const deviceVerifications = verifications.filter(v => v.device_id === device.device_id);

  return (
    <AppLayout
      title={`${device.device_name} (${device.device_id})`}
      subtitle={`Detailed hardware telemetry, communication interfaces, and role specifications`}
    >
      <div className="space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/devices"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Devices</span>
          </Link>

          <div className="flex items-center gap-2">
            <StatusBadge status={device.status} size="md" />
            {isAuthority && (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                SECURITY AUTHORITY
              </span>
            )}
          </div>
        </div>

        {/* 4 Separate Visual Sections: Device Information, Communication, Integrity, Recent Events */}
        
        {/* Section 1: Device Information */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>1. Device Information & Hardware Specifications</span>
            </h3>
            <span className="text-xs font-mono text-cyan-400">ID: {device.device_id}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Device Name</span>
              <span className="font-semibold text-slate-200">{device.device_name}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Architecture Type</span>
              <span className="font-mono font-bold text-cyan-300">{device.device_type}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Hardware Model</span>
              <span className="font-mono text-slate-200">{device.hardware_version}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Firmware Version</span>
              <span className="font-mono text-slate-200">{device.firmware_version}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">First Registered</span>
              <span className="text-slate-300">{new Date(device.created_at).toLocaleDateString()}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Last Seen</span>
              <span className="text-slate-300">{new Date(device.last_seen).toLocaleString()}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Assigned Role</span>
              <span className="font-bold text-slate-200">{device.role_title}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verification Interval</span>
              <span className="font-mono text-emerald-400 font-bold">{device.verification_interval_minutes} Minutes</span>
            </div>
          </div>
        </div>

        {/* Section 2: Communication */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Wifi className="w-4 h-4 text-cyan-400" />
              <span>2. Network & Communication Configuration</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">TELEMETRY UPLINK</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Primary Interface</span>
              <span className="font-mono text-slate-200">{device.communication_method}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">IP Address</span>
              <span className="font-mono text-cyan-300">{device.ip_address || 'Non-IP (Hardware Serial Bus)'}</span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">MAC Address</span>
              <span className="font-mono text-slate-300">{device.mac_address || 'Hardware Dedicated'}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Integrity */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>3. Firmware Integrity Authority & Recent Verification Decisions</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">AUTHORITATIVE DIGEST</span>
          </div>

          {deviceVerifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Verification ID</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3">Current SHA-256</th>
                    <th className="py-2.5 px-3">Reference SHA-256</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                  {deviceVerifications.slice(0, 5).map(ver => (
                    <tr key={ver.id || ver.verification_id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">#{ver.verification_id}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={ver.verification_result} size="sm" />
                      </td>
                      <td className="py-2.5 px-3">
                        <HashDisplay hash={ver.current_hash} length={6} showCopy={true} />
                      </td>
                      <td className="py-2.5 px-3">
                        <HashDisplay hash={ver.reference_hash} length={6} showCopy={true} />
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(ver.verified_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{ver.verification_duration_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              Verification telemetry is generated by the STM32 Security Authority.
            </p>
          )}
        </div>

        {/* Section 4: Recent Events */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>4. Recent Security & Operational Events</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">EVENT AUDIT LOG</span>
          </div>

          <div className="space-y-2">
            {deviceEvents.length > 0 ? (
              deviceEvents.slice(0, 6).map(evt => (
                <div
                  key={evt.id}
                  className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge status={evt.severity} size="sm" />
                    <div>
                      <p className="font-semibold text-slate-200">{evt.event_type}</p>
                      <p className="text-slate-400 text-[11px]">{evt.message}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(evt.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No events recorded for this device.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
