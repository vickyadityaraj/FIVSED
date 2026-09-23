'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  RefreshCw, 
  Menu,
  Trash2,
  Check
} from 'lucide-react';
import { useFIVSED } from '@/lib/context/fivsed-context';
import { useAuth } from '@/lib/context/auth-context';

interface TopbarProps {
  onOpenMobileMenu?: () => void;
  title?: string;
  subtitle?: string;
}

export function Topbar({ 
  onOpenMobileMenu, 
  title = 'FIVSED Security Operations', 
  subtitle = 'Real-time firmware integrity monitoring and security event detection' 
}: TopbarProps) {
  const { 
    lastSync, 
    isHardwareConnected, 
    refreshData,
    clearAllData
  } = useFIVSED();
  const { user } = useAuth();
  const [isClearing, setIsClearing] = useState(false);
  const [clearedNotice, setClearedNotice] = useState(false);

  const formatSyncTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleClearData = async () => {
    if (confirm('Clear all telemetry records, verification scan reports, and tamper alerts?')) {
      setIsClearing(true);
      await clearAllData();
      setIsClearing(false);
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 3000);
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#09101f]/90 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
            <span>{title}</span>
            <span className="hidden md:inline-flex text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              SOC CONSOLE
            </span>
          </h1>
          <p className="hidden sm:block text-xs text-slate-400 truncate max-w-xl">{subtitle}</p>
        </div>
      </div>

      {/* Right: Dynamic Hardware Status, Clear Data, Last Sync, User */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Dynamic Hardware Connection Indicator */}
        <div 
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs transition-colors ${
            isHardwareConnected 
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
              : 'bg-slate-900 border-slate-800 text-slate-400'
          }`}
          title={
            isHardwareConnected 
              ? 'Hardware is actively connected and transmitting STM32 measurements via ESP32' 
              : 'Hardware is offline. Awaiting connection from ESP32 / Raspberry Pi.'
          }
        >
          <span className="relative flex h-2 w-2">
            {isHardwareConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isHardwareConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="font-semibold hidden sm:inline">
            {isHardwareConnected ? 'Hardware Active' : 'Hardware Offline'}
          </span>
        </div>

        {/* Clear Data Button */}
        <button
          onClick={handleClearData}
          disabled={isClearing}
          className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 border transition-all ${
            clearedNotice
              ? 'bg-emerald-950/50 border-emerald-700 text-emerald-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-rose-400'
          }`}
          title="Clear all stored scan reports and tamper alerts"
        >
          {clearedNotice ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Data Cleared</span>
            </>
          ) : (
            <>
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Clear Data</span>
            </>
          )}
        </button>

        {/* Last Sync Timestamp */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400">
          <span>Synced:</span>
          <span className="font-mono text-slate-200" suppressHydrationWarning>
            {formatSyncTime(lastSync)}
          </span>
          <button 
            onClick={() => refreshData()} 
            title="Refresh now" 
            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Pill / Profile Shortcut */}
        {user && (
          <Link
            href="/profile"
            className="flex items-center gap-2 pl-2 border-l border-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
              {user.full_name?.charAt(0) || 'A'}
            </div>
            <span className="hidden xl:inline max-w-[120px] truncate">{user.full_name}</span>
          </Link>
        )}
      </div>
    </header>
  );
}
