'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Wifi, 
  Database, 
  Monitor, 
  ArrowDown, 
  ArrowRight,
  Server,
  Terminal,
  Activity,
  Zap,
  Info
} from 'lucide-react';

export function InteractiveArchitecture() {
  const [selectedNode, setSelectedNode] = useState<string>('STM32');

  const nodeDetails: Record<string, { title: string; subtitle: string; role: string; details: string[]; connections: string }> = {
    TARGET_W25Q64: {
      title: 'Target SPI Flash (W25Q64)',
      subtitle: 'Winbond W25Q64 64M-bit (8MB) Serial NOR Flash Memory',
      role: 'MONITORED TARGET FIRMWARE',
      details: [
        'Physical hardware flash chip hosting operational firmware and application code.',
        'Target device remains passive during inspection cycle without requiring execution.',
        'Direct hardware connection to Raspberry Pi over standard 4-wire SPI bus.',
        'Interrogated by SPI commands (0x9F JEDEC ID detection, 0x03 / 0x0B high-speed read).'
      ],
      connections: 'SPI Bus (MOSI, MISO, SCK, CS) to Raspberry Pi'
    },
    RPI_STREAMER: {
      title: 'Raspberry Pi (Detection & Flash Streamer)',
      subtitle: 'Raspberry Pi Controller Subsystem',
      role: 'DETECT • READ • STREAM',
      details: [
        'Detects target W25Q64 chip presence and validates manufacturer/device JEDEC ID.',
        'Reads raw binary firmware sectors directly from W25Q64 across hardware SPI.',
        'Streams binary image chunk-by-chunk over USB CDC (Communications Device Class) to STM32.',
        'Operates purely as an acquisition and streaming agent — does NOT compute or evaluate hash authenticity.'
      ],
      connections: 'SPI Ingest from W25Q64 | USB CDC Streaming Out to STM32'
    },
    STM32: {
      title: 'STM32 Security Authority',
      subtitle: 'STM32 High-Performance ARM Cortex-M4 Verifier',
      role: 'SHA-256 • REFERENCE • COMPARE • DECISION',
      details: [
        'Authoritative security core and trusted execution root of the FIVSED architecture.',
        'Computes streaming 256-bit cryptographic SHA-256 hash across incoming binary data.',
        'Stores trusted golden reference digest inside protected internal non-volatile memory.',
        'Executes strict cryptographic comparison to determine definitive MATCH or HASH_MISMATCH.',
        'Dispatches independent results across two isolated channels: USB CDC to Raspberry Pi and UART TX to ESP32.'
      ],
      connections: 'USB CDC In/Out with Raspberry Pi | Dedicated UART TX to ESP32'
    },
    RPI_GUI: {
      title: 'Raspberry Pi (Local GUI & Audit History)',
      subtitle: 'On-Premises Operator Terminal & Local Storage',
      role: 'GUI DISPLAY & AUDIT HISTORY',
      details: [
        'Receives authoritative verification results returned from STM32 over USB CDC.',
        'Displays real-time integrity status and timeline on local on-premises display/terminal.',
        'Maintains local persistent historical audit logs on solid-state storage.',
        'Operates independently of Internet connectivity for air-gapped security monitoring.'
      ],
      connections: 'USB CDC Result Stream from STM32'
    },
    ESP32: {
      title: 'ESP32 Peripheral Controller & Wi-Fi Gateway',
      subtitle: 'ESP32-WROOM-32 Peripheral & Telemetry Unit',
      role: 'LED / BUZZER INDICATORS • WI-FI TELEMETRY',
      details: [
        'Receives authoritative result frames from STM32 over UART RX (GPIO 16).',
        'Directly controls physical indicators: Green LED (GPIO 21), Red LED (GPIO 22), Piezo Buzzer (GPIO 23), Onboard LED (GPIO 2).',
        'Uploads telemetry events and verification status to Web Application over Wi-Fi (HTTPS REST POST /api/events).',
        '⚠️ ZERO TRUST DECISION: Holds no reference hashes and cannot alter verification outcomes; acts as peripheral driver.'
      ],
      connections: 'UART RX from STM32 | Wi-Fi 802.11 b/g/n to Web Application'
    },
    WEB_APP: {
      title: 'FIVSED Cloud Web Application',
      subtitle: 'Next.js App Router SOC Monitoring Dashboard',
      role: 'REMOTE MONITORING & SECURITY INCIDENT MANAGEMENT',
      details: [
        'Ingests authenticated ESP32 telemetry events via POST /api/events API.',
        'Displays real-time SOC dashboard, peripheral telemetry (Green/Red LED, Buzzer), and verification timeline.',
        'Dispatches instant critical notifications when HASH_MISMATCH is detected.',
        'Provides security engineers with tamper logs, device telemetry, and verification audit trails.'
      ],
      connections: 'HTTPS REST Ingestion & Realtime WebSocket Subscriptions'
    }
  };

  const current = nodeDetails[selectedNode] || nodeDetails.STM32;

  return (
    <div className="space-y-6">
      {/* Visual Architectural Map */}
      <div className="soc-card p-6 sm:p-8 bg-[#080e1b] border-slate-800 space-y-8 relative overflow-hidden">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            System Topology & Physical Data Flow
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Authoritative Embedded Security Pipeline
          </h2>
          <p className="text-xs text-slate-400">
            Click any architecture module to inspect technical specifications, physical interfaces, and security roles.
          </p>
        </div>

        {/* The Diagram Flow */}
        <div className="flex flex-col items-center space-y-4 max-w-3xl mx-auto">
          
          {/* Level 1: Target W25Q64 Flash */}
          <button
            onClick={() => setSelectedNode('TARGET_W25Q64')}
            className={`w-full sm:w-80 p-4 rounded-xl border text-center transition-all ${
              selectedNode === 'TARGET_W25Q64'
                ? 'bg-slate-800 border-amber-400 shadow-lg shadow-amber-950/50 scale-105'
                : 'bg-slate-900/90 border-slate-700 hover:border-amber-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-amber-300">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>TARGET: W25Q64</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 font-semibold">SPI NOR Flash Memory (64M-bit)</p>
            <p className="text-[10px] text-slate-400 font-mono">Protected Firmware Image</p>
          </button>

          {/* Arrow 1: SPI Link */}
          <div className="flex flex-col items-center text-amber-400">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
              SPI (4-Wire Bus)
            </span>
            <ArrowDown className="w-5 h-5 animate-bounce mt-1" />
          </div>

          {/* Level 2: Raspberry Pi (Detect, Read, Stream) */}
          <button
            onClick={() => setSelectedNode('RPI_STREAMER')}
            className={`w-full sm:w-88 p-4 rounded-xl border text-center transition-all ${
              selectedNode === 'RPI_STREAMER'
                ? 'bg-indigo-950/80 border-indigo-400 shadow-lg shadow-indigo-950/50 scale-105'
                : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-300 uppercase">
              <Server className="w-4 h-4 text-indigo-400" />
              <span>Raspberry Pi (Acquisition)</span>
            </div>
            <div className="mt-2 text-xs text-slate-200 font-mono flex items-center justify-center gap-3">
              <span className="text-indigo-300 font-semibold">• Detect</span>
              <span className="text-indigo-300 font-semibold">• Read</span>
              <span className="text-indigo-300 font-semibold">• Stream</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Reads SPI flash & streams binary to STM32</p>
          </button>

          {/* Arrow 2: USB CDC Link */}
          <div className="flex flex-col items-center text-cyan-400">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              USB CDC (High-Speed Binary Stream)
            </span>
            <ArrowDown className="w-5 h-5 mt-1 animate-pulse" />
          </div>

          {/* Level 3: STM32 Security Authority (The Core Centerpiece) */}
          <button
            onClick={() => setSelectedNode('STM32')}
            className={`w-full sm:w-96 p-5 rounded-2xl border text-center transition-all relative ${
              selectedNode === 'STM32'
                ? 'bg-emerald-950/80 border-emerald-400 glow-emerald scale-105'
                : 'bg-emerald-950/40 border-emerald-700/60 hover:border-emerald-500'
            }`}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] tracking-wider uppercase">
              SECURITY AUTHORITY
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-black text-white mt-1">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>STM32 Verifier</span>
            </div>
            <div className="mt-2 text-xs text-slate-200 font-mono space-y-0.5">
              <p>• SHA-256 Digest Calculation</p>
              <p>• Internal Golden Reference Comparison</p>
              <p className="text-emerald-400 font-bold">• Authoritative PASS / FAIL Decision</p>
            </div>
          </button>

          {/* Split Transmission Header */}
          <div className="w-full max-w-2xl flex items-center justify-center pt-2">
            <span className="text-[11px] font-mono text-slate-400 px-3.5 py-1 rounded-full bg-slate-900/90 border border-slate-800">
              Dual Independent Output Transmission
            </span>
          </div>

          {/* Two-Column Branch Container: Local On-Prem vs Peripheral & Web App */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl items-start">
            
            {/* LEFT BRANCH: Raspberry Pi (Local GUI & Audit History) */}
            <div className="flex flex-col items-center space-y-3">
              {/* Connector Link */}
              <div className="flex flex-col items-center text-indigo-400">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-800/80 text-indigo-300 font-semibold">
                  USB Result (CDC Stream)
                </span>
                <ArrowDown className="w-4 h-4 text-indigo-400 mt-1" />
              </div>

              {/* Node: Raspberry Pi GUI */}
              <button
                onClick={() => setSelectedNode('RPI_GUI')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedNode === 'RPI_GUI'
                    ? 'bg-indigo-950/90 border-indigo-400 shadow-lg shadow-indigo-950/50 scale-[1.02]'
                    : 'bg-slate-900/90 border-slate-700 hover:border-indigo-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase">
                    <Monitor className="w-4 h-4" />
                    <span>Raspberry Pi</span>
                  </div>
                  <span className="text-[9px] font-mono text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-800/60">
                    ON-PREMISES
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-100 mt-1.5">GUI & History</p>
                <div className="mt-2 text-[11px] text-slate-300 font-mono space-y-1">
                  <p>• Local Touch Interface</p>
                  <p>• Persistent On-site Audit Log</p>
                  <p className="text-indigo-300 font-semibold">• Air-Gapped Verification Display</p>
                </div>
              </button>

              <div className="w-full p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-center text-[10px] text-indigo-300/80 font-mono">
                Independent on-site terminal (No cloud dependency)
              </div>
            </div>

            {/* RIGHT BRANCH: ESP32 -> Web Application */}
            <div className="flex flex-col items-center space-y-3">
              {/* Connector Link: STM32 to ESP32 */}
              <div className="flex flex-col items-center text-cyan-400">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-950/90 border border-cyan-800/80 text-cyan-300 font-semibold">
                  UART TX (Result Frame)
                </span>
                <ArrowDown className="w-4 h-4 text-cyan-400 mt-1" />
              </div>

              {/* Node: ESP32 */}
              <button
                onClick={() => setSelectedNode('ESP32')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedNode === 'ESP32'
                    ? 'bg-cyan-950/90 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-[1.02]'
                    : 'bg-slate-900/90 border-slate-700 hover:border-cyan-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase">
                    <Cpu className="w-4 h-4" />
                    <span>ESP32</span>
                  </div>
                  <span className="text-[9px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800/60">
                    PERIPHERAL
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-100 mt-1.5">LED / Buzzer Controller</p>
                <div className="mt-2 text-[11px] text-slate-300 font-mono space-y-1">
                  <p>• GPIO 21 (Green) & 22 (Red)</p>
                  <p>• GPIO 23 Piezo Buzzer (2N7000)</p>
                  <p className="text-amber-300 font-semibold">• No reference hash / no decision</p>
                </div>
              </button>

              {/* Connector Link: ESP32 to Web App */}
              <div className="flex flex-col items-center text-cyan-400 py-0.5">
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                  Wi-Fi (HTTPS POST /api/events)
                </span>
                <ArrowDown className="w-4 h-4 text-cyan-400 animate-pulse mt-1" />
              </div>

              {/* Node: Web Application */}
              <button
                onClick={() => setSelectedNode('WEB_APP')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  selectedNode === 'WEB_APP'
                    ? 'bg-sky-950/90 border-sky-400 shadow-lg shadow-sky-950/50 scale-[1.02]'
                    : 'bg-slate-900/90 border-slate-700 hover:border-sky-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase">
                    <Monitor className="w-4 h-4" />
                    <span>Web Application</span>
                  </div>
                  <span className="text-[9px] font-mono text-sky-300 px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800/60">
                    CLOUD SOC
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-100 mt-1.5">Remote SOC Dashboard</p>
                <div className="mt-2 text-[11px] text-slate-300 font-mono space-y-1">
                  <p>• Real-time Verification Telemetry</p>
                  <p>• Immediate Tamper Alerts</p>
                  <p className="text-sky-300 font-semibold">• SOC History & Audit Trail</p>
                </div>
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Selected Node Technical Drill-Down Panel */}
      <div className="soc-card p-6 border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{current.title}</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                {current.role}
              </span>
            </div>
            <p className="text-xs text-slate-400">{current.subtitle}</p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Interface: <span className="text-slate-200">{current.connections}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Architecture Specification & Responsibilities
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {current.details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
