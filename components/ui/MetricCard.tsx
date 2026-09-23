import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon: LucideIcon;
  badge?: React.ReactNode;
  variant?: 'default' | 'pass' | 'fail' | 'warning' | 'info';
  note?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  variant = 'default',
  note,
  className = '',
  onClick
}: MetricCardProps) {
  const variantStyles = {
    default: {
      border: 'border-slate-800',
      iconBg: 'bg-slate-800/60 text-slate-300',
      glow: ''
    },
    pass: {
      border: 'border-emerald-900/60 hover:border-emerald-700/70',
      iconBg: 'bg-emerald-950/80 text-emerald-400',
      glow: 'glow-emerald'
    },
    fail: {
      border: 'border-rose-900/70 hover:border-rose-700/80',
      iconBg: 'bg-rose-950/80 text-rose-400',
      glow: 'glow-crimson'
    },
    warning: {
      border: 'border-amber-900/60 hover:border-amber-700/70',
      iconBg: 'bg-amber-950/80 text-amber-400',
      glow: 'glow-amber'
    },
    info: {
      border: 'border-sky-900/60 hover:border-sky-700/70',
      iconBg: 'bg-sky-950/80 text-sky-400',
      glow: ''
    }
  }[variant];

  return (
    <div
      onClick={onClick}
      className={`soc-card p-4 sm:p-5 flex flex-col justify-between ${variantStyles.border} ${variantStyles.glow} ${
        onClick ? 'cursor-pointer soc-card-interactive' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-wide uppercase">{title}</p>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg border border-slate-700/40 ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || badge || note) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between gap-2">
            {subtitle && <span className="truncate">{subtitle}</span>}
            {badge && <div>{badge}</div>}
          </div>
          {note && (
            <p className="text-[11px] leading-tight text-slate-400 italic">
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
