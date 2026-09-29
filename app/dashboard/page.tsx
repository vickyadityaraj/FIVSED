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
    stm32Active,
    piActive,
    secondsSinceLastPacket,
    acknowledgeAlert
  } = useFIVSED();

  const isPass = latestVerification?.status === 'PASS';
  const criticalAlertsCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <AppLayout
      title="FIVSED Security Dashboard"
      subtitle="Real-time firmware integrity verification and hardware security monitoring"
    >
      <div className="space-y-6">
        {/* Dynamic Multi-Node Hardware Architecture Status Banner */}
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
              {isHardwareConnected ? 'ESP32 Telemetry Link Streaming' : 'Hardware Telemetry Offline'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">
              {isHardwareConnected 
                ? `Receiving authenticated telemetry (last packet ${secondsSinceLastPacket ?? 0}s ago)` 
                : 'Awaiting ESP32 connection to /api/events.'}
            </span>
          </div>

          {/* Real-Time Status Indicators for all 3 Architecture Components */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isHardwareConnected ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              <span className="text-slate-400">ESP32:</span>
              <strong className={isHardwareConnected ? 'text-emerald-400' : 'text-slate-500'}>
                {isHardwareConnected ? 'STREAMING' : 'OFFLINE'}
              </strong>
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${stm32Active ? 'bg-emerald-400' : 'bg-amber-500'}`}></span>
              <span className="text-slate-400">STM32:</span>
              <strong className={stm32Active ? 'text-emerald-400' : 'text-amber-400'}>
                {stm32Active ? 'ACTIVE' : 'DISCONNECTED'}
              </strong>
            </span>

            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${piActive ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              <span className="text-slate-400">Raspberry Pi:</span>
              <strong className={piActive ? 'text-emerald-400' : 'text-slate-500'}>
                {piActive ? 'ACTIVE' : 'NOT DETECTED'}
              </strong>
            </span>
          </div>
        </div>

        {/* Active Alerts Banner if there are active incidents */}
        <ActiveAlertsBanner alerts={alerts} onAcknowledge={acknowledgeAlert} />

        {/* 6 Real Telemetry Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {/* Card 1: Firmware Integrity Decision */}
          <MetricCard
            title="Firmware Integrity"
            value={latestVerification ? (isPass ? 'PASS' : 'FAIL') : 'AWAITING SCAN'}
            subtitle={latestVerification ? `Report #${latestVerification.verification_id}` : 'No reports ingested'}
            icon={latestVerification ? (isPass ? ShieldCheck : ShieldAlert) : ShieldCheck}
            variant={latestVerification ? (isPass ? 'pass' : 'fail') : 'default'}
            badge={
              latestVerification ? (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  isPass 
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60' 
                    : 'bg-rose-950/80 text-rose-400 border-rose-800/60'
                }`}>
                  {isPass ? 'PASS' : 'FAIL'}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-slate-500">NO SCANS</span>
              )
            }
            note="STM32 hardware comparator"
          />

          {/* Card 2: ESP32 Hardware Link */}
          <MetricCard
            title="ESP32 Telemetry Link"
            value={isHardwareConnected ? 'ONLINE' : 'OFFLINE'}
            subtitle={
              isHardwareConnected 
                ? `Active (${secondsSinceLastPacket ?? 0}s ago)` 
                : 'No connection'
            }
            icon={Wifi}
            variant={isHardwareConnected ? 'pass' : 'default'}
            badge={
              <span className={`text-[10px] font-mono font-bold ${isHardwareConnected ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isHardwareConnected ? 'STREAMING' : 'OFFLINE'}
              </span>
            }
            note="Wi-Fi / HTTPS uplink"
          />

          {/* Card 3: STM32 Security Authority */}
          <MetricCard
            title="STM32 Security Authority"
            value={stm32Active ? 'ACTIVE' : 'DISCONNECTED'}
            subtitle={stm32Active ? 'On-chip verifier online' : 'Awaiting UART link'}
            icon={Cpu}
            variant={stm32Active ? 'pass' : 'default'}
            badge={
              <span className={`text-[10px] font-mono font-bold ${stm32Active ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stm32Active ? 'AUTHORITY' : 'STANDBY'}
              </span>
            }
            note="Sole security decision engine"
          />

          {/* Card 4: Raspberry Pi Node */}
          <MetricCard
            title="Raspberry Pi Node"
            value={piActive ? 'ACTIVE' : 'NOT DETECTED'}
            subtitle={piActive ? 'Main system operational' : 'Hardware not detected'}
            icon={Server}
            variant={piActive ? 'pass' : 'default'}
            badge={
              <span className={`text-[10px] font-mono font-bold ${piActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {piActive ? 'ONLINE' : 'IDLE'}
              </span>
            }
            note="Supervisor system node"
          />

          {/* Card 5: Ingested Scans */}
          <MetricCard
            title="Total Ingested Scans"
            value={`${verifications.length} Scans`}
            subtitle={latestVerification ? `Latest: #${latestVerification.verification_id}` : '0 reports in database'}
            icon={Radio}
            variant="info"
            badge={<span className="text-[10px] font-mono text-cyan-300">ESP32 Uplink</span>}
            note="Authoritative reports"
          />

          {/* Card 6: Security Events */}
          <MetricCard
            title="Security Events"
            value={`${events.length} Events`}
            subtitle={criticalAlertsCount > 0 ? `${criticalAlertsCount} critical alert(s)` : 'No active alerts'}
            icon={Activity}
            variant={criticalAlertsCount > 0 ? 'fail' : 'info'}
            badge={<span className="text-[10px] font-mono text-cyan-300">Audit Log</span>}
            note="Telemetry & liveness logs"
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
