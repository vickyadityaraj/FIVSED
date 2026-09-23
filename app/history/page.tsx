'use client';

import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  ArrowUpDown, 
  Clock, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { HashDisplay } from '@/components/ui/HashDisplay';
import { useFIVSED } from '@/lib/context/fivsed-context';
import { VerificationStatus } from '@/types/fivsed';

export default function VerificationHistoryPage() {
  const { verifications, refreshData } = useFIVSED();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deviceFilter, setDeviceFilter] = useState<string>('ALL');

  // Filtered dataset
  const filtered = useMemo(() => {
    return verifications.filter(item => {
      const matchesSearch = 
        item.verification_id.toString().includes(searchQuery) ||
        item.current_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesDevice = deviceFilter === 'ALL' || item.device_id === deviceFilter;

      return matchesSearch && matchesStatus && matchesDevice;
    });
  }, [verifications, searchQuery, statusFilter, deviceFilter]);

  // CSV Export Functionality
  const exportToCSV = () => {
    const headers = [
      'Verification_ID',
      'Device_ID',
      'Status',
      'Verification_Result',
      'Current_Hash',
      'Reference_Hash',
      'Duration_ms',
      'Source',
      'Verified_At'
    ];

    const rows = filtered.map(item => [
      item.verification_id,
      item.device_id,
      item.status,
      item.verification_result,
      item.current_hash,
      item.reference_hash,
      item.verification_duration_ms,
      item.source,
      `"${new Date(item.verified_at).toISOString()}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fivsed_verification_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout
      title="Authoritative Verification History"
      subtitle="Complete chronological audit trail of all STM32 firmware integrity measurements"
    >
      <div className="space-y-6">
        {/* Controls, Filters & Export Bar */}
        <div className="soc-card p-4 sm:p-5 border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by verification ID, hash, or device..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Filter Dropdowns and Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Results</option>
                <option value="PASS">PASS Only</option>
                <option value="FAIL">FAIL Only</option>
                <option value="ERROR">ERROR Only</option>
              </select>

              {/* Device Filter */}
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="ALL">All Devices</option>
                <option value="FIVSED-001">FIVSED-001 (STM32)</option>
              </select>

              {/* CSV Export Button */}
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => refreshData()}
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Refresh history"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Showing <strong className="text-white">{filtered.length}</strong> of {verifications.length} total verification records</span>
            <span className="font-mono text-cyan-400 font-semibold">10-Minute Polling Cycle</span>
          </div>
        </div>

        {/* History Table */}
        <div className="soc-card overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Ver ID</th>
                  <th className="py-3 px-4">Device ID</th>
                  <th className="py-3 px-4">Result</th>
                  <th className="py-3 px-4">Current SHA-256</th>
                  <th className="py-3 px-4">Reference SHA-256</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px] text-slate-300">
                {filtered.length > 0 ? (
                  filtered.map(item => (
                    <tr key={item.id || item.verification_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">#{item.verification_id}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{item.device_id}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={item.verification_result} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <HashDisplay hash={item.current_hash} length={7} showCopy={true} />
                      </td>
                      <td className="py-3 px-4">
                        <HashDisplay hash={item.reference_hash} length={7} showCopy={true} />
                      </td>
                      <td className="py-3 px-4 text-slate-400">{item.verification_duration_ms} ms</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                          {item.source}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans">
                        {new Date(item.verified_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No verification cycles found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
