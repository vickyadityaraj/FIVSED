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
    devices, 
    isHardwareConnected,
    acknowledgeAlert
  } = useFIVSED();

  const isPass = latestVerification?.status === 'PASS';
  const esp32Device = devices.find(d => d.device_type === 'ESP32');
  const onlineDevicesCount = devices.filter(d => d.status === 'ONLINE').length;
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
              {isHardwareConnected ? 'Hardware Telemetry Link Active' : 'Hardware Offline / Awaiting Hardware Link'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              {isHardwareConnected 
                ? 'Actively receiving real-time STM32 integrity measurements via ESP32 Wi-Fi node' 
                : 'Connect Raspberry Pi (STM32 verifier) & ESP32 to stream authoritative scan reports to POST /api/events'}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
            <span>Target: <strong className="text-slate-200">FIVSED-001</strong></span>
            <span>•</span>
            <span>Authority: <strong className="text-emerald-400 font-semibold">STM32</strong></span>
          </div>
        </div>

        {/* Active Alerts Banner if there are active incidents */}
        <ActiveAlertsBanner alerts={alerts} onAcknowledge={acknowledgeAlert} />

        {/* 6 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Card 1: Firmware Integrity */}
          <MetricCard
            title="Firmware Integrity"
            value={latestVerification ? (isPass ? 'PASS' : 'FAIL') : 'AWAITING SCAN'}
            subtitle="Security Authority (STM32)"
            icon={latestVerification ? (isPass ? ShieldCheck : ShieldAlert) : ShieldCheck}
            variant={latestVerification ? (isPass ? 'pass' : 'fail') : 'default'}
            badge={
              latestVerification ? (
                <StatusBadge status={latestVerification.verification_result} size="sm" />
              ) : (
                <span className="text-[10px] font-mono text-slate-500">NO SCANS</span>
              )
            }
            note={latestVerification ? 'Authoritative decision' : 'Waiting for hardware scan'}
          />

          {/* Card 2: Last Verification */}
          <MetricCard
            title="Last Verification"
            value={latestVerification ? timeAgo(latestVerification.verified_at) : 'No Scans Yet'}
            subtitle={latestVerification ? new Date(latestVerification.verified_at).toLocaleTimeString() : 'Awaiting connection'}
            icon={Clock}
            variant="default"
            badge={
              latestVerification ? (
                <span className="font-mono text-[10px] text-cyan-400">#{latestVerification.verification_id}</span>
              ) : (
                <span className="font-mono text-[10px] text-slate-500">--</span>
              )
            }
            note="10-min scheduled cycle"
          />

          {/* Card 3: Security Events */}
          <MetricCard
            title="Security Events"
            value={`${events.length} Events`}
            subtitle={events.length > 0 ? 'Logged across nodes' : 'No telemetry logged'}
            icon={Activity}
            variant="info"
            badge={<span className="text-[10px] font-mono text-cyan-300">Telemetry</span>}
          />

          {/* Card 4: Critical Alerts */}
          <MetricCard
            title="Critical Alerts"
            value={criticalAlertsCount}
            subtitle={criticalAlertsCount > 0 ? 'Requires attention' : 'Zero unacknowledged'}
            icon={AlertTriangle}
            variant={criticalAlertsCount > 0 ? 'fail' : 'pass'}
            badge={<StatusBadge status={criticalAlertsCount > 0 ? 'CRITICAL' : 'RESOLVED'} size="sm" />}
          />

          {/* Card 5: Connected Devices */}
          <MetricCard
            title="Connected Devices"
            value={`${onlineDevicesCount} Active`}
            subtitle={onlineDevicesCount > 0 ? 'Hardware Link Established' : 'Hardware Disconnected'}
            icon={Cpu}
            variant={onlineDevicesCount > 0 ? 'pass' : 'default'}
            badge={
              <span className={`text-[10px] font-mono ${onlineDevicesCount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {onlineDevicesCount > 0 ? 'ONLINE' : 'OFFLINE'}
              </span>
            }
          />

          {/* Card 6: ESP32 Upload Status */}
          <MetricCard
            title="ESP32 Upload Status"
            value={esp32Device && esp32Device.status === 'ONLINE' ? 'Active' : 'Offline'}
            subtitle={esp32Device?.ip_address || (isHardwareConnected ? 'Wi-Fi Uplink Active' : 'Disconnected')}
            icon={Wifi}
            variant={esp32Device && esp32Device.status === 'ONLINE' ? 'pass' : 'default'}
            badge={<StatusBadge status={esp32Device?.status || 'OFFLINE'} size="sm" />}
            note="Uplink only; does NOT determine trust"
          />
        </div>

        {/* Real-Time Central Integrity Status Card */}
        <IntegrityStatusCard verification={latestVerification} />

        {/* Split Grid: Analytics Chart and Verification Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SecurityEventChart events={events} />
          <VerificationTimeline verifications={verifications} limit={4} />
        </div>
      </div>
    </AppLayout>
  );
}
