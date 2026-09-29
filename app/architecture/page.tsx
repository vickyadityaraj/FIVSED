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

        {/* 10-Minute Verification Cycle Breakdown Table */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Standard 10-Minute Verification Cycle Sequence</span>
            </h3>
            <p className="text-xs text-slate-400">
              Autonomous execution flow across the physical hardware pipeline (Target W25Q64 → Raspberry Pi → STM32 → ESP32 & Pi GUI)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Subsystem</th>
                  <th className="py-2.5 px-3">Action Description</th>
                  <th className="py-2.5 px-3">Interface / Security Implication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 1</td>
                  <td className="py-2.5 px-3 text-indigo-400">Raspberry Pi</td>
                  <td className="py-2.5 px-3 font-sans">Autonomous hardware timer triggers scheduled 10-minute inspection cycle or accepts manual operator trigger.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Deterministic interval execution; immune to cloud latency.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 2</td>
                  <td className="py-2.5 px-3 text-amber-400">Target W25Q64</td>
                  <td className="py-2.5 px-3 font-sans">Raspberry Pi interrogates target W25Q64 SPI flash via JEDEC ID (0x9F) and reads sectors directly over hardware SPI.</td>
                  <td className="py-2.5 px-3 font-sans text-amber-300">Target host CPU remains halted/passive; no firmware evasion possible.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 3</td>
                  <td className="py-2.5 px-3 text-cyan-400">Pi ➔ STM32</td>
                  <td className="py-2.5 px-3 font-sans">Raspberry Pi streams raw firmware binary image chunk-by-chunk over USB CDC (virtual serial) to STM32.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">High-speed DMA transmission. Pi acts purely as transport; holds no authority.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 4</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32 Verifier</td>
                  <td className="py-2.5 px-3 font-sans">STM32 ingests raw byte stream into internal memory and calculates streaming cryptographic SHA-256 digest.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Hardware-accelerated cryptographic computation within protected silicon.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 5</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32 Verifier</td>
                  <td className="py-2.5 px-3 font-sans">Compares calculated SHA-256 digest against trusted golden reference stored in hardware-protected internal flash.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Golden reference physically isolated from network interfaces.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 6</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32 Verifier</td>
                  <td className="py-2.5 px-3 font-sans">Generates authoritative decision: MATCH, HASH_MISMATCH, or ERROR.</td>
                  <td className="py-2.5 px-3 font-sans text-emerald-400 font-semibold">Authoritative Decision Point; cannot be overridden by peripherals.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 7</td>
                  <td className="py-2.5 px-3 text-emerald-400">STM32 Verifier</td>
                  <td className="py-2.5 px-3 font-sans">Simultaneously transmits verification outcome via dual independent channels: USB CDC to Raspberry Pi and UART TX to ESP32.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Parallel isolated reporting guarantees redundancy without cross-dependency.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 8</td>
                  <td className="py-2.5 px-3 text-cyan-300">ESP32 Controller</td>
                  <td className="py-2.5 px-3 font-sans">Drives physical indicators (Green/Red LEDs, Buzzer) and uploads telemetry event to Web App via Wi-Fi (HTTPS REST).</td>
                  <td className="py-2.5 px-3 font-sans text-cyan-300">Peripheral execution only; forwards STM32 payload without tampering.</td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-cyan-400">Stage 9</td>
                  <td className="py-2.5 px-3 text-indigo-300">Raspberry Pi</td>
                  <td className="py-2.5 px-3 font-sans">Updates local operator GUI on touch display and writes record to persistent local audit log.</td>
                  <td className="py-2.5 px-3 font-sans text-slate-400">Air-gapped on-premises audit trail available even during network loss.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Physical Indicator Logic Matrix */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Physical Indicator Logic Matrix (ESP32 Peripheral Controller)</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 font-semibold">
                Firmware Verified: esp32_fivsed_uploader
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Hardware indicator states driven by the ESP32 strictly based on the authoritative STM32 result frame.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">STM32 Payload Result</th>
                  <th className="py-2.5 px-3">Green LED (GPIO 21)</th>
                  <th className="py-2.5 px-3">Red LED (GPIO 22)</th>
                  <th className="py-2.5 px-3">Piezo Buzzer (GPIO 23)</th>
                  <th className="py-2.5 px-3">Onboard LED (GPIO 2)</th>
                  <th className="py-2.5 px-3">Physical & Security Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    MATCH <span className="text-[10px] text-slate-400 font-normal">(Verified PASS)</span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">ON (HIGH)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (LOW)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (Silent)</td>
                  <td className="py-2.5 px-3 text-cyan-400">Wi-Fi State</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    Target W25Q64 firmware perfectly matches the trusted golden reference. System integrity verified.
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    NEW_TARGET_REGISTERED
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">ON (HIGH)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (LOW)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (Silent)</td>
                  <td className="py-2.5 px-3 text-cyan-400">Wi-Fi State</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    First-time target baseline enrolled and registered into STM32 internal storage.
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-emerald-400">
                    REFERENCE_UPDATED
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">ON (HIGH)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (LOW)</td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (Silent)</td>
                  <td className="py-2.5 px-3 text-cyan-400">Wi-Fi State</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    Authorized firmware golden reference updated in STM32 secure flash.
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50 bg-rose-950/20">
                  <td className="py-2.5 px-3 font-bold text-rose-400">
                    HASH_MISMATCH <span className="text-[10px] text-rose-300 font-semibold">(Tamper Alarm)</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (LOW)</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON (HIGH)</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON (Active Alarm)</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON (Alert)</td>
                  <td className="py-2.5 px-3 font-sans text-rose-300 font-medium">
                    CRITICAL SECURITY VIOLATION: Flash image hash does NOT match golden reference! Immediate audible alarm (via 2N7000 MOSFET) and visual alert.
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 font-bold text-amber-400">
                    INVALID_RESULT / ERROR
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">OFF (LOW)</td>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">ON (HIGH)</td>
                  <td className="py-2.5 px-3 text-amber-400 font-bold">ON (Warning Alarm)</td>
                  <td className="py-2.5 px-3 text-cyan-400">Wi-Fi State</td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    Malformed UART frame, HMAC authentication failure, or communication timeout between STM32 and ESP32.
                  </td>
                </tr>
                <tr className="hover:bg-slate-900/50 bg-slate-900/40">
                  <td className="py-2.5 px-3 font-semibold text-cyan-400">
                    Wi-Fi Status <span className="text-[10px] text-slate-400 font-normal">(Background Link)</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px]">Unchanged</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px]">Unchanged</td>
                  <td className="py-2.5 px-3 text-slate-400 font-sans text-[10px]">Unchanged</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-bold">
                    ON = Connected<br />OFF = Offline / Retrying
                  </td>
                  <td className="py-2.5 px-3 font-sans text-slate-300">
                    Onboard LED (GPIO 2) continuously reflects Wi-Fi network and cloud API reachability in the ESP32 main event loop.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
