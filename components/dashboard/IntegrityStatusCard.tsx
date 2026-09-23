'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Cpu, 
  ArrowRight, 
  AlertTriangle,
  Fingerprint,
  RotateCw
} from 'lucide-react';
import { FirmwareVerification } from '@/types/fivsed';
import { HashDisplay } from '@/components/ui/HashDisplay';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface IntegrityStatusCardProps {
  verification: FirmwareVerification | null;
  onViewDetails?: () => void;
}

export function IntegrityStatusCard({ verification, onViewDetails }: IntegrityStatusCardProps) {
  if (!verification) {
    return (
      <div className="soc-card p-6 sm:p-7 border-slate-800 bg-gradient-to-br from-[#0c1424] to-[#070b14] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-cyan-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Current Firmware Integrity
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  AWAITING TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
                Waiting for the authoritative STM32 firmware integrity measurement. The STM32 evaluates protected firmware hash every 10 minutes and uploads through the ESP32 Wi-Fi node.
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
                <span>Authority: <strong className="text-slate-200">STM32F407</strong></span>
                <span>•</span>
                <span>Interval: <strong className="text-slate-200">10 min</strong></span>
                <span>•</span>
                <span>Uplink: <strong className="text-cyan-400">ESP32 REST API</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isPass = verification.status === 'PASS';
  const isVerifying = verification.status === 'VERIFYING';
  const isFail = verification.status === 'FAIL';

  return (
    <div
      className={`soc-card p-6 sm:p-7 relative overflow-hidden transition-all duration-300 ${
        isPass
          ? 'border-emerald-900/60 bg-gradient-to-br from-[#0a1626] to-[#07131e] glow-emerald'
          : isFail
          ? 'border-rose-900/80 bg-gradient-to-br from-[#1e0a12] to-[#120509] glow-crimson'
          : 'border-amber-900/60 bg-gradient-to-br from-[#1c1407] to-[#0f0c05] glow-amber'
      }`}
    >
      {/* Decorative cyber grid accent */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        {isPass ? (
          <ShieldCheck className="w-64 h-64 text-emerald-400" />
        ) : (
          <ShieldAlert className="w-64 h-64 text-rose-500" />
        )}
      </div>

      <div className="relative z-10 space-y-6">
        {/* Card Header & Authority Tag */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-cyan-400">
              <Fingerprint className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Current Firmware Integrity Status
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Verified by</span>
                <span className="text-cyan-400 font-semibold font-mono">STM32 Security Authority</span>
                <span className="text-slate-600">•</span>
                <span>Uploaded via ESP32</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={verification.verification_result} size="lg" />
          </div>
        </div>

        {/* Large Prominent Status Display */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`p-3.5 rounded-2xl border ${
                isPass
                  ? 'bg-emerald-950/80 text-emerald-400 border-emerald-700/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-rose-950/90 text-rose-400 border-rose-700/70 shadow-lg shadow-rose-950/60 animate-soc-pulse'
              }`}
            >
              {isPass ? <ShieldCheck className="w-9 h-9" /> : <ShieldAlert className="w-9 h-9" />}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    isPass ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPass ? '✓ INTEGRITY PASS' : '✕ INTEGRITY FAIL'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {isPass
                  ? 'Firmware integrity verified successfully. Current SHA-256 measurement matches the trusted golden reference stored in protected STM32 memory.'
                  : 'Firmware integrity verification failed because the measured hash did not match the trusted reference on ' + verification.device_id + '.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <Link
              href="/integrity"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-800/60 hover:border-cyan-500 transition-all shadow-sm"
            >
              <span>View Integrity Details</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Critical Tamper Alert Banner (Displayed when FAIL) */}
        {isFail && (
          <div className="p-4 rounded-lg bg-rose-950/60 border border-rose-800/80 flex items-start gap-3 text-rose-200">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-rose-300">
                AUTHORITATIVE MISMATCH DETECTED (Result: HASH_MISMATCH)
              </p>
              <p className="text-rose-200/90 leading-relaxed">
                The STM32 security verifier reported an integrity discrepancy during execution of verification cycle #{verification.verification_id}. 
                Flash memory block digest diverges from the baseline golden hash. ESP32 physical alarm output has been triggered.
              </p>
            </div>
          </div>
        )}

        {/* Detailed Verification Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Device ID */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Device ID</span>
            <p className="text-xs font-mono font-bold text-slate-200">{verification.device_id}</p>
          </div>

          {/* Verification ID */}
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Verification ID</span>
            <p className="text-xs font-mono font-bold text-cyan-400">#{verification.verification_id}</p>
          </div>

          {/* Current Measured Hash */}
          <div className="col-span-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current SHA-256</span>
            <div>
              <HashDisplay hash={verification.current_hash} length={7} showCopy={true} />
            </div>
          </div>

          {/* Reference Hash */}
          <div className="col-span-2 p-3 rounded-lg bg-slate-950/60 border border-slate-800 space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Trusted Reference</span>
            <div>
              <HashDisplay hash={verification.reference_hash} length={7} showCopy={true} />
            </div>
          </div>
        </div>

        {/* Operational Footer Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/70">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Last Verified: <strong className="text-slate-200">{new Date(verification.verified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</strong> ({new Date(verification.verified_at).toLocaleDateString()})</span>
            </span>

            <span className="flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-slate-400" />
              <span>Interval: <strong className="text-slate-200">10 minutes</strong></span>
            </span>

            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span>Execution Time: <strong className="text-slate-200">{verification.verification_duration_ms} ms</strong></span>
            </span>
          </div>

          <div className="text-[11px] font-mono text-cyan-400">
            Source: <span className="font-bold underline decoration-cyan-600">STM32 (Security Authority)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
