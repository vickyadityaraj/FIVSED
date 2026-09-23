'use client';

import React, { useState } from 'react';
import { 
  Bell, 
  AlertOctagon, 
  CheckCircle2, 
  Clock, 
  Check, 
  ShieldAlert, 
  Filter,
  RefreshCw,
  Archive
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFIVSED } from '@/lib/context/fivsed-context';
import { AlertStatus } from '@/types/fivsed';

export default function AlertsPage() {
  const { alerts, acknowledgeAlert, resolveAlert, refreshData } = useFIVSED();
  const [activeTab, setActiveTab] = useState<'ALL' | AlertStatus>('ACTIVE');

  const filteredAlerts = alerts.filter(a => {
    if (activeTab === 'ALL') return true;
    return a.status === activeTab;
  });

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  return (
    <AppLayout
      title="Security Operations Alert Center"
      subtitle="Triage, acknowledge, and resolve firmware integrity violations and communication alerts"
    >
      <div className="space-y-6">
        {/* Top Summary & Filter Tabs */}
        <div className="soc-card p-4 sm:p-5 border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ACTIVE'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Active</span>
                {activeCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                    {activeCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('ACKNOWLEDGED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ACKNOWLEDGED'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Acknowledged</span>
                {acknowledgedCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                    {acknowledgedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === 'RESOLVED'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Resolved</span>
                <span className="text-[10px] text-slate-400">({resolvedCount})</span>
              </button>

              <button
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({alerts.length})
              </button>
            </div>

            <button
              onClick={() => refreshData()}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors self-start sm:self-auto"
              title="Refresh alerts"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map(alert => {
              const isCritical = alert.severity === 'CRITICAL';
              const isActive = alert.status === 'ACTIVE';

              return (
                <div
                  key={alert.id}
                  className={`soc-card p-5 border transition-all ${
                    isCritical && isActive
                      ? 'border-rose-800/80 bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 glow-crimson'
                      : 'border-slate-800 bg-slate-900/60'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Alert Information */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`p-3 rounded-xl border shrink-0 mt-0.5 ${
                          isCritical
                            ? 'bg-rose-950 text-rose-400 border-rose-800 animate-soc-pulse'
                            : 'bg-amber-950 text-amber-400 border-amber-800'
                        }`}
                      >
                        <AlertOctagon className="w-6 h-6" />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={alert.severity} size="sm" />
                          <StatusBadge status={alert.status} size="sm" />
                          <span className="font-mono text-xs font-bold text-slate-300">
                            {alert.device_id}
                          </span>
                          {alert.verification_id && (
                            <span className="font-mono text-xs text-cyan-400">
                              (Ver #{alert.verification_id})
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-white">
                          {alert.title}
                        </h3>

                        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                          {alert.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                          <span>Alert ID: {alert.id}</span>
                          <span>•</span>
                          <span>Timestamp: {new Date(alert.created_at).toLocaleString()}</span>
                          {alert.acknowledged_by && (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-sans">
                                Acknowledged by: {alert.acknowledged_by} ({new Date(alert.acknowledged_at!).toLocaleTimeString()})
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                      {alert.status === 'ACTIVE' && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-slate-950 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledge Incident</span>
                        </button>
                      )}

                      {alert.status !== 'RESOLVED' && (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-slate-950 transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}

                      {alert.status === 'RESOLVED' && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Incident Resolved</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="soc-card p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="font-semibold text-white">No alerts found in category '{activeTab}'</p>
              <p className="text-xs">Security operations system operating in nominal status.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
