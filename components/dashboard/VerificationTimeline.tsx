'use client';

import React from 'react';
import Link from 'next/link';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { FirmwareVerification } from '@/types/fivsed';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashDisplay } from '@/components/ui/HashDisplay';

interface VerificationTimelineProps {
  verifications: FirmwareVerification[];
  limit?: number;
}

export function VerificationTimeline({ verifications, limit = 5 }: VerificationTimelineProps) {
  const displayed = verifications.slice(0, limit);

  return (
    <div className="soc-card p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-bold tracking-wider uppercase text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Verification Timeline</span>
          </h3>
          <p className="text-xs text-slate-400">
            Authoritative STM32 verification cycles executed every 10 minutes
          </p>
        </div>

        <Link
          href="/history"
          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {displayed.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">No verification cycles recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Timeline will populate automatically as STM32 measurements are received.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {displayed.map((item, index) => {
          const isPass = item.status === 'PASS';
          const timeStr = new Date(item.verified_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div key={item.id || index} className="relative group">
              {/* Timeline Bullet Node */}
              <div
                className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isPass
                    ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-sm shadow-emerald-500/50'
                    : 'bg-slate-900 border-rose-500 text-rose-400 shadow-sm shadow-rose-500/60 animate-pulse'
                }`}
              >
                {isPass ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </div>

              {/* Timeline Card */}
              <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-300">
                      {timeStr}
                    </span>
                    <span className="text-slate-600">•</span>
                    <StatusBadge status={item.verification_result} size="sm" />
                    <span className="text-xs font-mono text-cyan-400">
                      #{item.verification_id}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400">
                    Authority: <span className="text-emerald-400 font-semibold">{item.source}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.notes || (isPass ? 'STM32 verification successful. Measured firmware digest matched reference.' : 'Firmware hash mismatch detected.')}
                </p>

                <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span>Hash:</span>
                    <HashDisplay hash={item.current_hash} length={6} showCopy={true} />
                  </div>
                  <div>
                    Device: <span className="font-mono text-slate-200">{item.device_id}</span> ({item.verification_duration_ms}ms)
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
