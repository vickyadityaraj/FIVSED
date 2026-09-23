'use client';

import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { useFIVSED } from '@/lib/context/fivsed-context';
import { SecurityEvent, EventSeverity } from '@/types/fivsed';

export default function SecurityEventsPage() {
  const { events, refreshData } = useFIVSED();

  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = 
        e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.message.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSeverity = severityFilter === 'ALL' || e.severity === severityFilter;
      const matchesDevice = deviceFilter === 'ALL' || e.device_id === deviceFilter;
      const matchesType = typeFilter === 'ALL' || e.event_type === typeFilter;

      return matchesSearch && matchesSeverity && matchesDevice && matchesType;
    });
  }, [events, searchQuery, severityFilter, deviceFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedEvents = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <AppLayout
      title="Security Events Management"
      subtitle="Comprehensive audit trail and telemetry log across STM32, ESP32, and Raspberry Pi"
    >
      <div className="space-y-6">
        {/* Filter & Search Bar */}
        <div className="soc-card p-4 sm:p-5 border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search event ID, device, type, or message..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Severity Filter */}
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="WARNING">WARNING</option>
                <option value="INFO">INFO</option>
              </select>

              {/* Event Type Filter */}
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="FIRMWARE_VERIFICATION">FIRMWARE_VERIFICATION</option>
                <option value="HASH_MISMATCH">HASH_MISMATCH</option>
                <option value="COMMUNICATION_TIMEOUT">COMMUNICATION_TIMEOUT</option>
                <option value="HEARTBEAT">HEARTBEAT</option>
                <option value="DEVICE_ONLINE">DEVICE_ONLINE</option>
              </select>

              {/* Device Filter */}
              <select
                value={deviceFilter}
                onChange={(e) => {
                  setDeviceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Devices</option>
                <option value="FIVSED-001">FIVSED-001 (STM32)</option>
                <option value="FIVSED-002">FIVSED-002 (ESP32)</option>
                <option value="FIVSED-003">FIVSED-003 (RPi)</option>
              </select>

              <button
                onClick={() => refreshData()}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Refresh events"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Showing <strong className="text-white">{filtered.length}</strong> security events</span>
            <span>Page {currentPage} of {totalPages}</span>
          </div>
        </div>

        {/* Security Events Table */}
        <div className="soc-card overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Ver ID</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {paginatedEvents.length > 0 ? (
                  paginatedEvents.map(evt => (
                    <tr 
                      key={evt.id} 
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4">
                        <StatusBadge status={evt.severity} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-bold text-cyan-400">{evt.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{evt.device_id}</td>
                      <td className="py-3 px-4 text-slate-200">{evt.event_type}</td>
                      <td className="py-3 px-4 text-cyan-400">
                        {evt.verification_id ? `#${evt.verification_id}` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px]">
                          {evt.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate font-sans text-slate-300">
                        {evt.message}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {new Date(evt.created_at).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-700 text-xs transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 font-sans">
                      No security events match the current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal for event details */}
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </AppLayout>
  );
}
