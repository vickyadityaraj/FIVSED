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
  const currentHash = activeVer.current_hash;
  const referenceHash = activeVer.reference_hash;

  // Split hashes into 8-character chunks to visualize bitwise/block comparison
  const chunkString = (str: string, size: number) => {
    const numChunks = Math.ceil(str.length / size);
    const chunks = new Array(numChunks);
    for (let i = 0, o = 0; i < numChunks; ++i, o += size) {
      chunks[i] = str.substr(o, size);
    }
    return chunks;
  };

  const currentChunks = chunkString(currentHash, 8);
  const refChunks = chunkString(referenceHash, 8);

  return (
    <AppLayout
      title="Authoritative Firmware Integrity Analysis"
      subtitle="Hardware-level cryptographic measurement and golden reference comparison performed by STM32"
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
                Authoritative Measurement Engine: <span className="text-cyan-400 font-mono">STM32F407</span>
              </p>
              <p className="text-xs text-slate-400">
                Automatic scheduled execution: Every 10 minutes • Algorithm: SHA-256 (FIPS PUB 180-4)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>STM32 SEC CORE ACTIVE</span>
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
                {isPass ? 'Cryptographic Integrity Confirmed' : 'Integrity Mismatch Detected'}
              </h3>
            </div>

            <div className="text-right text-xs font-mono">
              <span className="text-slate-400 block text-[10px] uppercase">Execution Duration</span>
              <span className="text-emerald-400 font-bold text-sm">{activeVer.verification_duration_ms} ms</span>
            </div>
          </div>

          {/* SHA-256 Block-by-Block Comparison Visualizer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-cyan-400" />
                <span>Cryptographic Digest Comparison (64 Hex Characters)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isPass ? '100% Chunk Match' : 'Discrepancy in Blocks 0-7'}
              </span>
            </div>

            {/* Current Measured Hash Blocks */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Measured Firmware SHA-256 (Flash Target):</span>
                </span>
                <HashDisplay hash={currentHash} showExpand={true} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono text-xs text-center">
                {currentChunks.map((chunk, idx) => {
                  const match = chunk === refChunks[idx];
                  return (
                    <div
                      key={idx}
                      className={`p-2 rounded border font-semibold tracking-wider ${
                        match
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                          : 'bg-rose-950/90 text-rose-300 border-rose-600 animate-pulse'
                      }`}
                    >
                      <span className="block text-[9px] text-slate-400 uppercase">Block {idx}</span>
                      <span>{chunk}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Golden Trusted Reference Hash Blocks */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Trusted Golden Reference (Protected STM32 Storage):</span>
                </span>
                <HashDisplay hash={referenceHash} showExpand={true} />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-1 font-mono text-xs text-center">
                {refChunks.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded border font-semibold tracking-wider bg-slate-900/90 text-cyan-300 border-slate-700"
                  >
                    <span className="block text-[9px] text-slate-400 uppercase">Block {idx}</span>
                    <span>{chunk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Factual Analysis Notes */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5 text-xs">
            <span className="font-bold text-slate-200 block uppercase text-[11px] tracking-wider">
              Verification Audit Statement
            </span>
            <p className="text-slate-300 leading-relaxed font-mono">
              {activeVer.notes || (isPass 
                ? 'Firmware integrity verification succeeded. Measured target flash memory digest matches the authoritative reference stored in STM32 hardware-protected flash.'
                : 'Firmware integrity verification failed because the measured hash did not match the trusted reference on ' + activeVer.device_id + '.')}
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
                  <th className="py-2.5 px-3">Verification ID</th>
                  <th className="py-2.5 px-3">Result</th>
                  <th className="py-2.5 px-3">Measured SHA-256</th>
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
                      <td className="py-2.5 px-3">
                        <HashDisplay hash={ver.current_hash} length={6} showCopy={false} />
                      </td>
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
