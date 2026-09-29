'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Fingerprint, 
  CheckCircle2, 
  XCircle, 
  RotateCw, 
  Clock, 
  Cpu, 
  AlertTriangle,
  Info,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashDisplay } from '@/components/ui/HashDisplay';
import { useFIVSED } from '@/lib/context/fivsed-context';

export default function FirmwareIntegrityPage() {
  const { 
    latestVerification, 
    verifications
  } = useFIVSED();

  const [selectedVerification, setSelectedVerification] = useState(latestVerification || verifications[0]);
  const activeVer = selectedVerification || latestVerification;

  if (!activeVer) {
    return (
      <AppLayout
        title="Authoritative Firmware Integrity Analysis"
        subtitle="Hardware-level cryptographic measurement and golden reference comparison performed by STM32"
      >
        <div className="soc-card p-12 text-center text-slate-400 space-y-4 max-w-xl mx-auto">
          <Fingerprint className="w-12 h-12 text-cyan-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Awaiting Firmware Integrity Telemetry</h2>
          <p className="text-xs leading-relaxed text-slate-400">
            No verification attempts have been ingested from the STM32 Security Authority yet. The STM32 evaluates protected firmware hash every 10 minutes and transmits results to ESP32 for web upload.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Awaiting hardware transmission from ESP32</span>
            </span>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isPass = activeVer.status === 'PASS';

  return (
    <AppLayout
      title="Authoritative Firmware Integrity Analysis"
      subtitle="Hardware-level cryptographic measurement and verification verdict performed on-chip by STM32"
    >
      <div className="space-y-6">
        {/* Verification Control & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Authoritative Security Authority: <span className="text-cyan-400 font-mono">STM32F407</span>
              </p>
              <p className="text-xs text-slate-400">
                On-Chip Isolated Hash Comparator • Decision transmitted with HMAC-SHA256 frame authentication
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ISOLATED REFERENCE SECURE</span>
            </span>
          </div>
        </div>

        {/* Selected Verification Deep Dive Card */}
        <div className={`soc-card p-6 border-slate-800 space-y-6 ${
          isPass ? 'border-emerald-900/70 glow-emerald' : 'border-rose-900/80 glow-crimson'
        }`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={activeVer.verification_result} size="lg" />
                <span className="font-mono text-xs font-bold text-cyan-400">
                  Cycle #{activeVer.verification_id}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(activeVer.verified_at).toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-black text-white pt-1">
                {isPass ? 'Cryptographic Integrity Confirmed (MATCH)' : 'Integrity Mismatch Detected (HASH_MISMATCH)'}
              </h3>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="text-slate-400 block text-[10px] uppercase">Execution Duration</span>
              <span className="text-emerald-400 font-bold text-sm">{activeVer.verification_duration_ms} ms</span>
            </div>
          </div>

          {/* STM32 Security Isolation & Verification Mechanism */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Security Boundary</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Golden reference hashes are securely held in STM32 internal protected flash memory and are never exposed over external buses to prevent reference theft or extraction.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Fingerprint className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">On-Chip Decision</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The STM32 measures target flash memory, calculates SHA-256 in hardware, compares against the trusted baseline, and outputs solely the authoritative verdict ({activeVer.verification_result}).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Frame Authentication</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Verification packets are signed with HMAC-SHA256 (<span className="font-mono text-cyan-300 text-[11px]">X-FIVSED-STM32-HMAC</span>) before being relayed by the ESP32 to prevent spoofing.
              </p>
            </div>
          </div>

          {/* Verification Audit Statement */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
            <span className="font-bold text-slate-200 block uppercase text-[11px] tracking-wider">
              Verification Audit Statement
            </span>
            <p className="text-slate-300 leading-relaxed font-mono">
              {activeVer.notes || (isPass 
                ? 'Authoritative firmware integrity verified on-chip by STM32 Security Authority. Decision: MATCH confirmed.'
                : 'Authoritative firmware integrity mismatch detected on-chip by STM32 Security Authority. Decision: HASH_MISMATCH on target ' + activeVer.device_id + '.')}
            </p>
          </div>
        </div>

        {/* Verification History Selector Table */}
        <div className="soc-card p-6 border-slate-800 space-y-4">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Select Historical Verification Cycle to Inspect</span>
            </h3>
            <span className="text-xs text-slate-400">Total {verifications.length} Recorded Cycles</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Select</th>
                  <th className="py-2.5 px-3">Report ID</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Authority</th>
                  <th className="py-2.5 px-3">Execution Time</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {verifications.map(ver => {
                  const isSelected = activeVer.verification_id === ver.verification_id;
                  return (
                    <tr
                      key={ver.id || ver.verification_id}
                      onClick={() => setSelectedVerification(ver)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/40 text-cyan-300' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <input
                          type="radio"
                          name="selected_ver"
                          checked={isSelected}
                          onChange={() => setSelectedVerification(ver)}
                          className="text-cyan-500"
                        />
                      </td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">#{ver.verification_id}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={ver.verification_result} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400">STM32F407 (On-Chip)</td>
                      <td className="py-2.5 px-3 text-slate-400">{ver.verification_duration_ms} ms</td>
                      <td className="py-2.5 px-3 text-slate-400">{new Date(ver.verified_at).toLocaleTimeString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
