'use client';

import React from 'react';
import { X, ShieldAlert, Clock, Cpu, Server, Hash } from 'lucide-react';
import { SecurityEvent } from '@/types/fivsed';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashDisplay } from '@/components/ui/HashDisplay';

interface EventDetailsModalProps {
  event: SecurityEvent | null;
  onClose: () => void;
}

export function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      <div className="relative w-full max-w-lg soc-card p-6 bg-[#0c1424] border-slate-700 shadow-2xl space-y-5 z-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge status={event.severity} size="sm" />
              <StatusBadge status={event.status} size="sm" />
            </div>
            <h3 className="text-base font-bold text-white pt-1">{event.event_type}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Event Message</span>
          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            {event.message}
          </p>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Device ID</span>
            <span className="font-mono font-bold text-cyan-400">{event.device_id}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Source Component</span>
            <span className="font-mono text-slate-200">{event.source}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Verification ID</span>
            <span className="font-mono text-slate-200">{event.verification_id ? `#${event.verification_id}` : 'N/A'}</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Recorded At</span>
            <span className="text-slate-200">{new Date(event.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Raw Metadata JSON if present */}
        {event.metadata && Object.keys(event.metadata).length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Payload Metadata</span>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-36">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
