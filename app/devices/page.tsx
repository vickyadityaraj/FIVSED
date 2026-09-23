'use client';

import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Wifi, 
  Server, 
  Info, 
  RefreshCw, 
  ShieldAlert,
  AlertTriangle
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { useFIVSED } from '@/lib/context/fivsed-context';

export default function DevicesPage() {
  const { devices, refreshData } = useFIVSED();

  return (
    <AppLayout
      title="Connected Hardware Infrastructure"
      subtitle="Operational status and architectural role definitions for STM32, ESP32, and Raspberry Pi"
    >
      <div className="space-y-6">
        {/* Core Architecture Callout Banner */}
        <div className="p-4 sm:p-5 rounded-xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Hierarchical Authority Separation</span>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 font-semibold px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60">
              STRICT SEC ENFORCEMENT
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
            In the FIVSED architecture, the <strong>STM32</strong> is the sole <strong>Security Authority</strong> responsible for cryptographic firmware measurement, reference comparison, and PASS/FAIL determinations. The <strong>ESP32</strong> acts strictly as a peripheral controller and Wi-Fi uploader, while the <strong>Raspberry Pi</strong> serves as the on-premise operator interface. The ESP32 does not make firmware trust decisions.
          </p>
        </div>

        {/* Device Cards Grid */}
        {devices.length === 0 ? (
          <div className="soc-card p-12 text-center text-slate-400 space-y-3">
            <Cpu className="w-10 h-10 text-cyan-400 mx-auto" />
            <p className="font-bold text-white text-base">No Hardware Nodes Registered Yet</p>
            <p className="text-xs max-w-md mx-auto leading-relaxed">
              Hardware nodes (STM32 Security Authority, ESP32 Controller, Raspberry Pi) are registered automatically when telemetry arrives via the ESP32 ingestion endpoint <code className="text-cyan-400 font-mono">POST /api/events</code>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((device) => (
              <DeviceCard key={device.id || device.device_id} device={device} />
            ))}
          </div>
        )}

        {/* Technical Communication Protocol Specification */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Inter-Device Physical Interconnect Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Independent hardware transmission channels between security authority and nodes
              </p>
            </div>
            <button
              onClick={() => refreshData()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Physical Link</th>
                  <th className="py-2.5 px-3">Direction</th>
                  <th className="py-2.5 px-3">Operational Purpose</th>
                  <th className="py-2.5 px-3">Hardware Interface</th>
                  <th className="py-2.5 px-3">Payload Structure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-bold text-cyan-400">STM32 ↔ ESP32</td>
                  <td className="py-3 px-3 text-emerald-400">STM32 → ESP32</td>
                  <td className="py-3 px-3 font-sans">Authoritative verification result, hashes, and indicators</td>
                  <td className="py-3 px-3">UART (115200 baud, 8N1)</td>
                  <td className="py-3 px-3 text-slate-400">Framed binary / JSON packet</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-bold text-indigo-400">STM32 ↔ Raspberry Pi</td>
                  <td className="py-3 px-3 text-emerald-400">STM32 → Pi</td>
                  <td className="py-3 px-3 font-sans">Local GUI status display and on-premise persistent logging</td>
                  <td className="py-3 px-3">USB-CDC / Direct Serial</td>
                  <td className="py-3 px-3 text-slate-400">Full audit log packet</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-3 px-3 font-bold text-cyan-400">ESP32 ↔ Next.js Web App</td>
                  <td className="py-3 px-3 text-cyan-300">ESP32 → Web Server</td>
                  <td className="py-3 px-3 font-sans">Remote telemetry synchronization and alert ingestion</td>
                  <td className="py-3 px-3">Wi-Fi (HTTPS REST POST /api/events)</td>
                  <td className="py-3 px-3 text-slate-400">JSON + API Key Header</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
