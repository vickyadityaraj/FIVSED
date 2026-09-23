'use client';

import React from 'react';
import { 
  Network, 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Server, 
  Database, 
  Info,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { InteractiveArchitecture } from '@/components/architecture/InteractiveArchitecture';

export default function ArchitecturePage() {
  return (
    <AppLayout
      title="System Architecture & Data Flow"
      subtitle="Complete hardware topology, authority boundaries, and communication protocols"
    >
      <div className="space-y-6">
        {/* Interactive Diagram Component */}
        <InteractiveArchitecture />

        {/* 10-Minute Verification Cycle Breakdown Table (from PDF document) */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Standard 10-Minute Verification Cycle Sequence</span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous execution flow defined in the FIVSED engineering specification
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Subsystem</th>
                  <th className="py-2.5 px-3">Action Description</th>
                  <th className="py-2.5 px-3">Security Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 1</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Starts internal hardware timer or waits for scheduled 10-minute cycle interval.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Autonomous hardware RTC; immune to web latency.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 2</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Measures protected firmware flash target across internal dedicated bus.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Direct bus readout with read-out protection.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 3</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Calculates 256-bit cryptographic SHA-256 hash across the binary image.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Hardware cryptographic acceleration.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 4</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Compares calculated hash with trusted golden reference in secure storage.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Protected storage inaccessible to network peers.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 5</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Generates authoritative PASS, FAIL, or ERROR status decision.</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-400 font-semibold">Authoritative Decision Point.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 6</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32</td>
                  <td className="py-2.5 px-3 font-sans">Sends result simultaneously & independently to ESP32 and Raspberry Pi.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">ESP32 is NOT a mediator for Raspberry Pi.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 7</td>
                  <td className="py-2.5 px-3 text-cyan-300">ESP32</td>
                  <td className="py-2.5 px-3 font-sans">Updates physical LEDs/buzzer and uploads telemetry event to Web App via Wi-Fi.</td>
                  <td className="py-2.5 px-3 font-sans text-amber-300">Peripheral execution; no trust decision.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 8</td>
                  <td className="py-2.5 px-3 text-indigo-300">Raspberry Pi</td>
                  <td className="py-2.5 px-3 font-sans">Updates local FIVSED GUI display and writes to local on-premise logs.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Local audit persistence.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* LED & Physical Status Logic Reference */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Physical Indicator Logic Matrix (ESP32 Peripheral Controller)
            </h3>
            <p className="text-xs text-slate-400">
              Hardware indicator states driven by the ESP32 based on the authoritative STM32 result
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">STM32 Status</th>
                  <th className="py-2.5 px-3">Green LED</th>
                  <th className="py-2.5 px-3">Red LED</th>
                  <th className="py-2.5 px-3">Piezo Buzzer</th>
                  <th className="py-2.5 px-3">System Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-400">PASS</td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">ON</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 font-sans">Firmware integrity verification successful</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-rose-400">FAIL / HASH_MISMATCH</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">Optional ON (Pulsed)</td>
                  <td className="py-2.5 px-3 font-sans text-rose-300 font-medium">Integrity verification failed (Tamper Alert)</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-amber-400">VERIFYING</td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">Blink (1Hz)</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 font-sans">Verification in progress</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-amber-500">ERROR / TIMEOUT</td>
                  <td className="py-2.5 px-3 text-slate-400">OFF</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON</td>
                  <td className="py-2.5 px-3 text-amber-400">Optional ON</td>
                  <td className="py-2.5 px-3 font-sans">Verification or communication timeout</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
