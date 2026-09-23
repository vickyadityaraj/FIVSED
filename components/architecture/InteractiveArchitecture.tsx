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
    PROTECTED_FIRMWARE: {
      title: 'Target Protected Firmware',
      subtitle: 'Flash Memory & Operating Code',
      role: 'Monitored Target Image',
      details: [
        'Resides in designated target micro-controller / system memory partition.',
        'Read out directly across internal secure bus during scheduled verification cycle.',
        'Binary contents are measured through SHA-256 cryptographic digest calculation.'
      ],
      connections: 'Readout via Internal Bus to STM32 Verifier'
    },
    STM32: {
      title: 'STM32 Security Authority',
      subtitle: 'STM32F407 High-Performance ARM Cortex-M4',
      role: 'SECURITY AUTHORITY',
      details: [
        'Computes authoritative SHA-256 cryptographic hash of protected target firmware.',
        'Stores immutable golden reference digest in hardware-protected internal storage.',
        'Compares measured hash with reference hash to issue definitive PASS/FAIL decision.',
        'Executes autonomous verification cycle every 10 minutes.',
        'Sends independent verification results to ESP32 (UART) and Raspberry Pi (USB/UART).'
      ],
      connections: 'Dual Independent Links: UART to ESP32, UART/USB to Raspberry Pi'
    },
    ESP32: {
      title: 'ESP32 Controller & Web Uploader',
      subtitle: 'ESP32-WROOM Wi-Fi + Bluetooth SoC',
      role: 'CONTROLLER & WEB UPLOADER',
      details: [
        'Receives verification results directly from STM32 over UART.',
        'Controls physical indicators: Green LED (PASS), Red LED (FAIL), Piezo Buzzer (Alarm).',
        'Uploads verification records and security events to the FIVSED Next.js Web Application via Wi-Fi (HTTPS REST POST /api/events).',
        '⚠️ CRITICAL: Does NOT make trust decisions; only conveys the STM32 decision.'
      ],
      connections: 'Wi-Fi 802.11 b/g/n to Cloud Next.js API'
    },
    RASPBERRY_PI: {
      title: 'Raspberry Pi 3 Model B+',
      subtitle: 'FIVSED On-Premises Main System',
      role: 'MAIN SYSTEM & LOCAL GUI',
      details: [
        'Runs local FIVSED operator GUI on attached physical touchscreen/display.',
        'Maintains persistent local audit logs on-premise.',
        'Direct connection to STM32 for independent redundancy and operator overrides.',
        'Does not depend on external Internet connectivity for local status monitoring.'
      ],
      connections: 'Direct Hardware Serial link from STM32'
    },
    WEB_APP: {
      title: 'FIVSED Web Application',
      subtitle: 'Next.js App Router SOC Dashboard',
      role: 'REMOTE MONITORING & INCIDENT RESPONSE',
      details: [
        'Receives ESP32 telemetry events via secure server-side endpoint POST /api/events.',
        'Displays real-time firmware verification status, SHA-256 hashes, and timelines.',
        'Dispatches immediate critical alerts upon HASH_MISMATCH detection.',
        'Provides security analysts with full audit logs and historical analytics.'
      ],
      connections: 'HTTPS Ingestion & Realtime Supabase Client'
    },
    SUPABASE: {
      title: 'Supabase Cloud Infrastructure',
      subtitle: 'PostgreSQL + Auth + Realtime Engine',
      role: 'DATA PERSISTENCE & REALTIME DISPATCH',
      details: [
        'Stores structured relational data across verifications, events, alerts, and devices.',
        'Enforces Row Level Security (RLS) based on user roles (Admin, Operator, Viewer).',
        'Pushes real-time WebSocket updates to the Web App dashboard on table changes.'
      ],
      connections: 'PostgreSQL Database & Realtime WebSockets'
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
            Click any architecture module to inspect technical specifications, interfaces, and operational roles.
          </p>
        </div>

        {/* The Diagram Flow */}
        <div className="flex flex-col items-center space-y-5 max-w-3xl mx-auto">
          
          {/* Node 1: Protected Firmware */}
          <button
            onClick={() => setSelectedNode('PROTECTED_FIRMWARE')}
            className={`w-72 p-4 rounded-xl border text-center transition-all ${
              selectedNode === 'PROTECTED_FIRMWARE'
                ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-105'
                : 'bg-slate-900/90 border-slate-700 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase text-slate-300">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Target Protected Firmware</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">Flash Image Memory</p>
          </button>

          {/* Arrow */}
          <div className="flex flex-col items-center text-cyan-500">
            <span className="text-[10px] font-mono text-slate-400">Firmware Readout</span>
            <ArrowDown className="w-5 h-5 animate-bounce" />
          </div>

          {/* Node 2: STM32 Security Authority (The Core Centerpiece) */}
          <button
            onClick={() => setSelectedNode('STM32')}
            className={`w-full sm:w-96 p-5 rounded-2xl border text-center transition-all relative ${
              selectedNode === 'STM32'
                ? 'bg-emerald-950/70 border-emerald-400 glow-emerald scale-105'
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
            <div className="mt-2 text-xs text-slate-300 font-mono space-y-0.5">
              <p>• SHA-256 Digest Calculation</p>
              <p>• Trusted Golden Reference Match</p>
              <p className="text-emerald-400 font-bold">• Authoritative PASS / FAIL Decision</p>
            </div>
          </button>

          {/* Dual Split Arrows to ESP32 and Pi */}
          <div className="w-full max-w-lg flex items-center justify-between text-slate-400 text-[11px] font-mono px-4">
            <div className="flex flex-col items-center">
              <span>UART Bus</span>
              <ArrowDown className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-[10px] text-slate-400 italic">Independent Dual Transmission</div>
            <div className="flex flex-col items-center">
              <span>UART / USB</span>
              <ArrowDown className="w-5 h-5 text-indigo-400" />
            </div>
          </div>

          {/* Level 3: ESP32 and Raspberry Pi side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
            {/* ESP32 */}
            <button
              onClick={() => setSelectedNode('ESP32')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedNode === 'ESP32'
                  ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-105'
                  : 'bg-slate-900/90 border-slate-700 hover:border-cyan-600'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase">
                <Wifi className="w-4 h-4" />
                <span>ESP32 Node</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-200 mt-1">Controller & Web Uploader</p>
              <p className="text-[10px] text-slate-400 mt-1">LEDs/Buzzer • Wi-Fi Upload</p>
              <p className="text-[9px] text-amber-400/90 mt-1 italic font-medium">No trust decision</p>
            </button>

            {/* Raspberry Pi */}
            <button
              onClick={() => setSelectedNode('RASPBERRY_PI')}
              className={`p-4 rounded-xl border text-left transition-all ${
                selectedNode === 'RASPBERRY_PI'
                  ? 'bg-indigo-950/80 border-indigo-400 shadow-lg shadow-indigo-950/50 scale-105'
                  : 'bg-slate-900/90 border-slate-700 hover:border-indigo-600'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase">
                <Server className="w-4 h-4" />
                <span>Raspberry Pi 3</span>
              </div>
              <p className="text-[11px] font-semibold text-slate-200 mt-1">FIVSED Main System</p>
              <p className="text-[10px] text-slate-400 mt-1">Local GUI • On-premise Logs</p>
              <p className="text-[9px] text-indigo-300 mt-1">Direct STM32 Serial Link</p>
            </button>
          </div>

          {/* Arrow from ESP32 to Web App */}
          <div className="flex flex-col items-center text-cyan-400 pt-1">
            <span className="text-[10px] font-mono text-cyan-300">Wi-Fi (HTTPS REST POST /api/events)</span>
            <ArrowDown className="w-5 h-5 animate-pulse" />
          </div>

          {/* Level 4: FIVSED Web Application */}
          <button
            onClick={() => setSelectedNode('WEB_APP')}
            className={`w-full sm:w-96 p-4 rounded-xl border text-center transition-all ${
              selectedNode === 'WEB_APP'
                ? 'bg-cyan-950/80 border-cyan-400 shadow-lg shadow-cyan-950/50 scale-105'
                : 'bg-slate-900/90 border-slate-700 hover:border-cyan-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-white uppercase">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>FIVSED Web Application</span>
            </div>
            <p className="text-[11px] text-cyan-300 mt-0.5">Remote Monitoring & SOC Dashboard</p>
            <p className="text-[10px] text-slate-400 mt-1">Dashboard • Alerts • Timeline • History</p>
          </button>

          {/* Arrow to Supabase */}
          <div className="flex flex-col items-center text-emerald-400">
            <span className="text-[10px] font-mono text-slate-400">Database & Realtime WebSockets</span>
            <ArrowDown className="w-5 h-5" />
          </div>

          {/* Level 5: Supabase */}
          <button
            onClick={() => setSelectedNode('SUPABASE')}
            className={`w-72 p-4 rounded-xl border text-center transition-all ${
              selectedNode === 'SUPABASE'
                ? 'bg-emerald-950/80 border-emerald-400 shadow-lg shadow-emerald-950/50 scale-105'
                : 'bg-slate-900/90 border-slate-700 hover:border-emerald-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400 uppercase">
              <Database className="w-4 h-4" />
              <span>Supabase Cloud</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">PostgreSQL • Auth • Realtime</p>
          </button>
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
