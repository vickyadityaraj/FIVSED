import React from 'react';

interface FivsedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  className?: string;
}

export function FivsedLogo({
  size = 'md',
  showText = true,
  showSubtitle = false,
  className = ''
}: FivsedLogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size];

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* FIVSED Composite Security/Microchip/Checkmark Emblem */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 shadow-lg shadow-cyan-950/40 p-1.5 ${iconSizes}`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-cyan-400"
        >
          {/* Outer Shield Boundary */}
          <path
            d="M24 4L8 10V22C8 32 15 40.5 24 44C33 40.5 40 32 40 22V10L24 4Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-cyan-500"
          />

          {/* Microchip Pins (Left & Right) */}
          <line x1="4" y1="18" x2="8" y2="18" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
          <line x1="4" y1="24" x2="8" y2="24" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="18" x2="44" y2="18" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />
          <line x1="40" y1="24" x2="44" y2="24" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" />

          {/* Microchip Core Matrix Background */}
          <rect
            x="16"
            y="15"
            width="16"
            height="16"
            rx="3"
            fill="#0f172a"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Authoritative Integrity Checkmark */}
          <path
            d="M19 23L22.5 26.5L29 20"
            stroke="#10b981"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Cryptographic SHA Node Point */}
          <circle cx="24" cy="9" r="1.5" fill="#38bdf8" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-wider text-white ${textSizes}`}>
              FIVSED
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
              STM32 SEC
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[11px] text-slate-400 font-medium leading-tight tracking-tight">
              Firmware Integrity Verification & Security Event Detection
            </span>
          )}
        </div>
      )}
    </div>
  );
}
