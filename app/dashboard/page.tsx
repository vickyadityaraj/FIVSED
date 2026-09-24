'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Wifi, 
  Radio, 
  Server
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/ui/MetricCard';
import { IntegrityStatusCard } from '@/components/dashboard/IntegrityStatusCard';
import { VerificationTimeline } from '@/components/dashboard/VerificationTimeline';
import { SecurityEventChart } from '@/components/dashboard/SecurityEventChart';
import { ActiveAlertsBanner } from '@/components/dashboard/ActiveAlertsBanner';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFIVSED } from '@/lib/context/fivsed-context';

export default function DashboardPage() {
  const { 
    latestVerification, 
    verifications, 
    events, 
    alerts, 
    isHardwareConnected,
    secondsSinceLastPacket,
    acknowledgeAlert
  } = useFIVSED();

  const isPass = latestVerification?.status === 'PASS';
  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <AppLayout
      title="FIVSED Security Dashboard"
      subtitle="Real-time firmware integrity scan reports and security event detection"
    >
      <div className="space-y-6">
        {/* Dynamic Hardware Ingestion Status Banner */}
        <div 
          className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
            isHardwareConnected
              ? 'bg-emerald-950/20 border-emerald-900/60 text-emerald-200'
              : 'bg-slate-900/80 border-slate-800/90 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              {isHardwareConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isHardwareConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
            </span>
            <span className={`font-semibold ${isHardwareConnected ? 'text-emerald-300' : 'text-slate-300'}`}>
              {isHardwareConnected ? 'Hardware Telemetry Link Active' : 'Hardware Offline / Awaiting Heartbeat'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              {isHardwareConnected 
                ? `Actively receiving live scan reports from ESP32 node (last report ${secondsSinceLastPacket ?? 0}s ago)` 
                : secondsSinceLastPacket !== null 
                  ? `Last report was received ${secondsSinceLastPacket}s ago. Hardware is disconnected or powered off.` 
                  : 'Power on your ESP32 to begin streaming live telemetry to /api/events.'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Node: <strong className="text-cyan-400 font-semibold">ESP32</strong></span>
            <span>•</span>
            <span>Target: <strong className="text-slate-200">FIVSED-001</strong></span>
          </div>
        </div>

        {/* Active Alerts Banner if there are active incidents */}
        <ActiveAlertsBanner alerts={alerts} onAcknowledge={acknowledgeAlert} />

        {/* 6 Real Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Firmware Integrity */}
          <MetricCard
            title="Firmware Integrity"
            value={latestVerification ? (isPass ? 'PASS' : 'FAIL') : 'AWAITING SCAN'}
            subtitle={latestVerification ? `Report #${latestVerification.verification_id}` : 'No reports ingested'}
            icon={latestVerification ? (isPass ? ShieldCheck : ShieldAlert) : ShieldCheck}
            variant={latestVerification ? (isPass ? 'pass' : 'fail') : 'default'}
            badge={
              latestVerification ? (
                <StatusBadge status={latestVerification.verification_result} size="sm" />
              ) : (
                <span className="text-[10px] font-mono text-slate-500">NO SCANS</span>
              )
            }
            note={latestVerification ? 'Hash comparison result' : 'Waiting for hardware scan'}
          />

          {/* Card 2: ESP32 Hardware Link */}
          <MetricCard
            title="ESP32 Telemetry Link"
            value={isHardwareConnected ? 'ONLINE' : 'OFFLINE'}
            subtitle={
              isHardwareConnected 
                ? `Active (${secondsSinceLastPacket ?? 0}s ago)` 
                : secondsSinceLastPacket !== null 
                  ? `Last seen ${secondsSinceLastPacket}s ago` 
                  : 'No connection'
            }
            icon={Wifi}
            variant={isHardwareConnected ? 'pass' : 'default'}
            badge={
              <span className={`text-[10px] font-mono font-bold ${isHardwareConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isHardwareConnected ? 'STREAMING' : 'OFFLINE'}
              </span>
            }
            note="Heartbeat window: 45s"
          />

          {/* Card 3: Total Scans Ingested */}
          <MetricCard
            title="Total Ingested Scans"
            value={`${verifications.length} Scans`}
            subtitle={latestVerification ? `Latest: #${latestVerification.verification_id}` : '0 reports in database'}
            icon={Radio}
            variant="info"
            badge={<span className="text-[10px] font-mono text-cyan-300">ESP32 Uplink</span>}
          />

          {/* Card 4: Verification Duration */}
          <MetricCard
            title="Verification Duration"
            value={latestVerification ? `${latestVerification.verification_duration_ms} ms` : '-- ms'}
            subtitle={latestVerification ? 'Measured scan time' : 'Awaiting data'}
            icon={Clock}
            variant="default"
            badge={
              <span className="font-mono text-[10px] text-cyan-400">
                {latestVerification ? `#${latestVerification.verification_id}` : '--'}
              </span>
            }
            note="Target flash verification"
          />

          {/* Card 5: Security Events */}
          <MetricCard
            title="Security Events"
            value={`${events.length} Events`}
            subtitle={events.length > 0 ? 'Telemetry events logged' : 'No telemetry logged'}
            icon={Activity}
            variant="info"
            badge={<span className="text-[10px] font-mono text-cyan-300">Audit Log</span>}
          />

          {/* Card 6: Critical Alerts */}
          <MetricCard
            title="Critical Alerts"
            value={criticalAlertsCount}
            subtitle={criticalAlertsCount > 0 ? 'Requires attention' : 'Zero unacknowledged'}
            icon={AlertTriangle}
            variant={criticalAlertsCount > 0 ? 'fail' : 'pass'}
            badge={<StatusBadge status={criticalAlertsCount > 0 ? 'CRITICAL' : 'RESOLVED'} size="sm" />}
          />
        </div>

        {/* Real-Time Central Integrity Status Card */}
        <IntegrityStatusCard verification={latestVerification} />

        {/* Split Grid: Analytics Chart and Verification Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityEventChart events={events} />
          <VerificationTimeline verifications={verifications} limit={6} />
        </div>
      </div>
    </AppLayout>
  );
}
