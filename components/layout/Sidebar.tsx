'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  ShieldCheck,
  History,
  Activity,
  Bell,
  Network,
  Settings,
  LogOut,
  User,
  ShieldAlert,
  Server
} from 'lucide-react';
import { FivsedLogo } from '@/components/ui/FivsedLogo';
import { useAuth } from '@/lib/context/auth-context';
import { useFIVSED } from '@/lib/context/fivsed-context';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/devices', label: 'Devices', icon: Cpu },
  { href: '/integrity', label: 'Firmware Integrity', icon: ShieldCheck },
  { href: '/history', label: 'Verification History', icon: History },
  { href: '/events', label: 'Security Events', icon: Activity },
  { href: '/alerts', label: 'Alerts', icon: Bell, hasBadge: true },
  { href: '/architecture', label: 'Architecture', icon: Network },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeAlertsCount, isRealtimeConnected } = useFIVSED();

  return (
    <aside className="w-64 h-full bg-[#09101f] border-r border-slate-800 flex flex-col justify-between select-none">
      {/* Top Header & Brand */}
      <div>
        <div className="p-5 border-b border-slate-800/80">
          <Link href="/dashboard" onClick={onCloseMobile} className="block">
            <FivsedLogo size="md" showText={true} showSubtitle={true} />
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.hasBadge && activeAlertsCount > 0 && (
                  <span className="flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                    {activeAlertsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Authority Architecture & User Profile */}
      <div className="p-3 space-y-3 border-t border-slate-800/80 bg-[#070b15]/60">
        {/* Core Architecture Demarcation Card */}
        <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              <span>STM32 Verifier</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold px-1 py-0.2 rounded bg-emerald-950/70 border border-emerald-800/50">
              AUTHORITY
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-tight">
            Authoritative SHA-256 measurement & PASS/FAIL decision engine.
          </p>
          <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3 text-cyan-400" />
              <span>ESP32 Wi-Fi Uploader</span>
            </span>
            <span className="text-cyan-400 font-semibold">Active</span>
          </div>
        </div>

        {/* User Card & Logout */}
        {user ? (
          <div className="pt-1 flex items-center justify-between gap-2 px-1">
            <Link 
              href="/profile" 
              onClick={onCloseMobile}
              className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 font-bold text-xs shrink-0">
                {user.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                <p className="text-[10px] text-cyan-400 capitalize font-medium">{user.role.replace('_', ' ')}</p>
              </div>
            </Link>

            <button
              onClick={() => logout()}
              title="Logout"
              aria-label="Logout"
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            onClick={onCloseMobile}
            className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
