'use client';

import React from 'react';
import Link from 'next/link';
import { AlertOctagon, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SecurityAlert } from '@/types/fivsed';

interface ActiveAlertsBannerProps {
  alerts: SecurityAlert[];
  onAcknowledge: (id: string) => void;
}

export function ActiveAlertsBanner({ alerts, onAcknowledge }: ActiveAlertsBannerProps) {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');

  if (activeAlerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {activeAlerts.map(alert => (
        <div
          key={alert.id}
          className="p-4 rounded-xl border border-rose-800/80 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/40 glow-crimson flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-rose-900/60 text-rose-300 border border-rose-700/60 shrink-0 mt-0.5 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2 py-0.5 rounded bg-rose-500 text-white tracking-wider uppercase">
                  {alert.severity}
                </span>
                <span className="text-sm font-bold text-white">
                  {alert.title}
                </span>
                <span className="text-xs font-mono text-rose-300">
                  [{alert.device_id}]
                </span>
              </div>
              <p className="text-xs text-rose-200/90 leading-relaxed max-w-3xl">
                {alert.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
            <button
              onClick={() => onAcknowledge(alert.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 border border-rose-700/80 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
            <Link
              href="/alerts"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
