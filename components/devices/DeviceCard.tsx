'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Wifi, 
  Terminal, 
  Clock, 
  Activity, 
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Device } from '@/types/fivsed';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DeviceCardProps {
  device: Device;
}

export function DeviceCard({ device }: DeviceCardProps) {
  const isAuthority = device.is_security_authority;
  const isEsp32 = device.device_type === 'ESP32';
  const isPi = device.device_type === 'RASPBERRY_PI';

  let Icon = Terminal;
  if (isAuthority) Icon = ShieldCheck;
  if (isEsp32) Icon = Wifi;

  const responsibilities = isAuthority
    ? [
        'Authoritative firmware measurement (SHA-256)',
        'Comparison against protected trusted reference',
        'Generates definitive PASS / FAIL decisions',
        'Independent transmission to ESP32 and Pi',
        'Autonomous 10-minute verification cycle'
      ]
    : isEsp32
    ? [
        'Receives verification result directly from STM32',
        'Controls physical indicator LEDs and buzzer',
        'Transmits status & events to Web App via Wi-Fi',
        'Maintains REST / HTTPS uplink to Cloud',
        '⚠️ Does NOT determine firmware trust'
      ]
    : [
        'Runs local FIVSED operator GUI & backend',
        'Maintains on-premise local audit logs',
        'Direct serial link with STM32',
        'Local system status visualization',
        'Local administrative controls'
      ];

  return (
    <div
      className={`soc-card p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
        isAuthority
          ? 'border-emerald-700/60 bg-gradient-to-b from-[#0a1b24] to-[#0a121f]'
          : isEsp32
          ? 'border-cyan-700/50 bg-gradient-to-b from-[#08182b] to-[#0a121f]'
          : 'border-slate-700/60 bg-gradient-to-b from-[#13192b] to-[#0a121f]'
      }`}
    >
      <div className="space-y-4">
        {/* Top Card Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                isAuthority
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-lg shadow-emerald-950/50'
                  : isEsp32
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-700/60 shadow-lg shadow-cyan-950/50'
                  : 'bg-indigo-950/80 text-indigo-400 border-indigo-700/60 shadow-lg shadow-indigo-950/50'
              }`}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{device.device_name}</h3>
              </div>
              <p className="text-xs font-mono text-cyan-400 font-semibold">{device.device_id}</p>
            </div>
          </div>

          <StatusBadge status={device.status} size="sm" />
        </div>

        {/* Role & Distinctive Badge */}
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Assigned System Role:</span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] border ${
                isAuthority
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                  : isEsp32
                  ? 'bg-cyan-950/80 text-cyan-400 border-cyan-800/60'
                  : 'bg-indigo-950/80 text-indigo-400 border-indigo-800/60'
              }`}
            >
              {device.role_title}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pt-1">
            {device.role_description}
          </p>
        </div>

        {/* ESP32 Special Warning / Clarification */}
        {isEsp32 && (
          <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <p className="font-semibold text-[11px]">
              CRITICAL: ESP32 does not determine firmware trust. It functions purely as a peripheral controller and web uploader.
            </p>
          </div>
        )}

        {/* Responsibilities list */}
        <div className="space-y-1.5 pt-1">
          <p className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Key Responsibilities
          </p>
          <ul className="space-y-1 text-xs text-slate-300">
            {responsibilities.map((resp, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <span className={resp.startsWith('⚠️') ? 'text-amber-300 font-medium' : ''}>{resp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hardware & Telemetry Specs */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs text-slate-400">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Communication</span>
            <span className="text-slate-300 text-[11px] font-mono">{device.communication_method.split('(')[0]}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Firmware Version</span>
            <span className="text-slate-300 text-[11px] font-mono">{device.firmware_version || 'N/A'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">IP Address</span>
            <span className="text-slate-300 text-[11px] font-mono">{device.ip_address || 'Internal Serial / UART'}</span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Last Seen</span>
            <span className="text-slate-300 text-[11px]">
              {new Date(device.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">
          Uptime: <strong className="text-slate-300">{Math.floor((device.uptime_seconds || 86400) / 3600)}h</strong>
        </span>

        <Link
          href={`/devices/${device.device_id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-all"
        >
          <span>Device Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
