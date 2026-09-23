import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Info, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { VerificationStatus, EventSeverity, DeviceStatus, VerificationResult } from '@/types/fivsed';

type BadgeType = 
  | VerificationStatus 
  | EventSeverity 
  | DeviceStatus 
  | VerificationResult
  | 'ONLINE' 
  | 'OFFLINE'
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESOLVED';

interface StatusBadgeProps {
  status: BadgeType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function StatusBadge({ status, size = 'md', showIcon = true, className = '' }: StatusBadgeProps) {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let Icon = Info;

  switch (norm) {
    case 'PASS':
    case 'INTEGRITY_PASS':
    case 'ONLINE':
    case 'RESOLVED':
      colorClasses = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      Icon = norm === 'ONLINE' ? Wifi : ShieldCheck;
      break;

    case 'FAIL':
    case 'HASH_MISMATCH':
    case 'CRITICAL':
    case 'ERROR':
      colorClasses = 'bg-rose-950/70 text-rose-400 border-rose-800/70';
      Icon = XCircle;
      break;

    case 'HIGH':
      colorClasses = 'bg-orange-950/60 text-orange-400 border-orange-800/60';
      Icon = AlertTriangle;
      break;

    case 'WARNING':
    case 'VERIFYING':
    case 'ACTIVE':
      colorClasses = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      Icon = norm === 'VERIFYING' ? Clock : AlertTriangle;
      break;

    case 'INFO':
    case 'ACKNOWLEDGED':
      colorClasses = 'bg-sky-950/60 text-sky-400 border-sky-800/60';
      Icon = Info;
      break;

    case 'OFFLINE':
      colorClasses = 'bg-slate-900/90 text-slate-400 border-slate-800';
      Icon = WifiOff;
      break;
  }

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold tracking-wider'
  }[size];

  // Friendly human label
  let displayLabel = norm.replace('_', ' ');
  if (norm === 'INTEGRITY_PASS') displayLabel = 'INTEGRITY PASS';
  if (norm === 'HASH_MISMATCH') displayLabel = 'HASH MISMATCH';

  return (
    <span 
      className={`inline-flex items-center font-semibold rounded-md border tracking-wide uppercase ${colorClasses} ${sizeClasses} ${className}`}
      role="status"
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />}
      <span>{displayLabel}</span>
    </span>
  );
}
