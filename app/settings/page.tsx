'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  Key, 
  Bell, 
  Shield, 
  Save, 
  Check, 
  AlertTriangle, 
  Copy, 
  RefreshCw,
  Lock,
  Sliders
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/lib/context/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [intervalMin, setIntervalMin] = useState(10);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSound, setCriticalSound] = useState(true);
  const [autoAcknowledge, setAutoAcknowledge] = useState(false);
  const [apiKey, setApiKey] = useState('fivsed_sec_key_77e9b812a4309c48');
  const [savedToast, setSavedToast] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <AppLayout
      title="System & Security Settings"
      subtitle="Configure verification parameters, alerts, API ingestion keys, and operational limits"
    >
      <div className="space-y-6 max-w-4xl">
        {savedToast && (
          <div className="p-3.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings saved successfully. Changes applied to local console.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Section 1: General & Timing Settings */}
          <div className="soc-card p-6 border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>1. Verification Timing & Cadence</span>
              </h3>
              <span className="text-[10px] font-mono text-cyan-400">TELEMETRY DISPLAY</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Dashboard Verification Refresh Interval (Minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={intervalMin}
                  disabled={!isAdmin}
                  onChange={(e) => setIntervalMin(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono focus:border-cyan-500 disabled:opacity-50"
                />
                <p className="text-[11px] text-slate-400">
                  Matches the autonomous 10-minute STM32 hardware verification cycle.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 block">
                  Communication Heartbeat Timeout Threshold
                </label>
                <select
                  disabled={!isAdmin}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white focus:border-cyan-500 disabled:opacity-50 text-xs"
                >
                  <option value="60">60 Seconds (Aggressive)</option>
                  <option value="120">120 Seconds (Standard)</option>
                  <option value="300">300 Seconds (Tolerant)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Flags ESP32 / Raspberry Pi as OFFLINE if no heartbeat packet arrives.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Security & Authoritative Boundary Warning */}
          <div className="soc-card p-6 border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>2. Security Architecture & Golden Reference Protection</span>
              </h3>
              <span className="text-[10px] font-mono text-emerald-400">READ-ONLY AUTHORITY</span>
            </div>

            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>STM32 Golden Reference Hash Protection</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                By architectural design, the web application <strong>cannot modify the trusted golden reference hash</strong>. 
                The golden hash is physically protected within STM32 write-protected flash to eliminate remote web-tampering attack vectors.
              </p>
            </div>
          </div>

          {/* Section 3: ESP32 Device Ingestion API Key */}
          <div className="soc-card p-6 border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>3. ESP32 Ingestion API Configuration</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-400">POST /api/events</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Device Ingestion API Secret Key (Header: x-api-key)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyKey}
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Flash this exact secret key into the ESP32 firmware to authenticate HTTP POST transmissions to <code className="text-cyan-400 font-mono">/api/events</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Notification Settings */}
          <div className="soc-card p-6 border-slate-800 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span>4. Alert Dispatch Preferences</span>
              </h3>
              <span className="text-[10px] font-mono text-amber-400">SOC DISPATCH</span>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  disabled={!isAdmin}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Immediate Incident Alert Dispatches</span>
                  <span className="text-[11px] text-slate-400">Trigger active notifications when HASH_MISMATCH or TIMEOUT events occur.</span>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criticalSound}
                  onChange={(e) => setCriticalSound(e.target.checked)}
                  disabled={!isAdmin}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-slate-200 block">Console Audio Beacon for Critical Incidents</span>
                  <span className="text-[11px] text-slate-400">Play an audible chime on the operator terminal when integrity fails.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Save Button */}
          {isAdmin && (
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide uppercase bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/40 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </AppLayout>
  );
}
