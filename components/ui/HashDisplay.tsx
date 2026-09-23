'use client';

import React, { useState } from 'react';
import { Copy, Check, Eye } from 'lucide-react';

interface HashDisplayProps {
  hash: string;
  truncate?: boolean;
  length?: number;
  showCopy?: boolean;
  showExpand?: boolean;
  label?: string;
  className?: string;
}

export function HashDisplay({
  hash,
  truncate = true,
  length = 8,
  showCopy = true,
  showExpand = false,
  label,
  className = ''
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanHash = hash || 'N/A';
  const shouldTruncate = truncate && !expanded && cleanHash.length > length * 2;
  const displayedHash = shouldTruncate
    ? `${cleanHash.substring(0, length)}...${cleanHash.substring(cleanHash.length - length)}`
    : cleanHash;

  return (
    <div className={`inline-flex items-center gap-1.5 font-mono text-xs ${className}`}>
      {label && <span className="text-slate-400 font-sans mr-1">{label}:</span>}
      <span 
        className="px-2 py-0.5 rounded bg-slate-900/90 text-cyan-300/90 border border-slate-800 font-hash tracking-tight select-all"
        title={cleanHash}
      >
        {displayedHash}
      </span>

      {showCopy && cleanHash !== 'N/A' && (
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy full cryptographic hash"
          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title={copied ? 'Copied full SHA-256 hash!' : 'Copy full SHA-256 hash'}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}

      {showExpand && cleanHash.length > length * 2 && (
        <button
          onClick={() => setExpanded(!expanded)}
          type="button"
          aria-label={expanded ? 'Collapse hash' : 'Expand full hash'}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={expanded ? 'Collapse hash' : 'Show full 64-char hash'}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
