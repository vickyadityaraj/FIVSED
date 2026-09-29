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
      <div className="flex items-start justify-between gap-2.5 min-w-0">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase truncate">{title}</p>
          <div className="text-lg sm:text-xl font-bold tracking-tight text-white truncate flex items-center gap-2">
            {value}
          </div>
        </div>
        <div className={`p-2 rounded-lg border border-slate-700/40 shrink-0 ${variantStyles.iconBg}`}>
          <Icon className="w-4 h-4 sm:w-5 h-5" />
        </div>
      </div>

      {(subtitle || badge || note) && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between gap-2 min-w-0">
            {subtitle && (
              <span className="text-[11px] text-slate-300 font-medium truncate min-w-0 flex-1" title={typeof subtitle === 'string' ? subtitle : undefined}>
                {subtitle}
              </span>
            )}
            {badge && (
              <div className="shrink-0">{badge}</div>
            )}
          </div>
          {note && (
            <p className="text-[10px] leading-tight text-slate-400/90 italic truncate" title={note}>
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
