'use client';

import { useState } from 'react';
import type { Execution } from '@/lib/executions';
import MarkdownView from './MarkdownView';

interface Props {
  executions: Execution[];
}

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  if (status === 'success') return <span className={`${base} bg-green-900/50 text-green-300`}>success</span>;
  if (status === 'error') return <span className={`${base} bg-red-900/50 text-red-300`}>error</span>;
  return <span className={`${base} bg-yellow-900/50 text-yellow-300 animate-pulse`}>{status}</span>;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function duration(start: number, end: number | null): string {
  if (!end) return '…';
  const secs = Math.round((end - start) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export default function ExecutionList({ executions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (executions.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-10">No executions yet.</p>;
  }

  return (
    <div className="space-y-2">
      {executions.map((exec) => {
        const isOpen = expanded === exec.id;
        return (
          <div key={exec.id} className="border border-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : exec.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900/60 transition-colors text-left"
            >
              <StatusBadge status={exec.status} />
              <span className="text-sm text-gray-300">{formatDate(exec.started_at)}</span>
              <span className="text-xs text-gray-500">
                {exec.trigger === 'manual' ? 'manual' : 'cron'} &middot; {duration(exec.started_at, exec.finished_at)}
              </span>
              <span className="ml-auto text-gray-600 text-xs">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="border-t border-gray-800 px-4 py-4 bg-gray-950">
                {exec.status === 'error' ? (
                  <div className="bg-red-950/50 border border-red-800 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-400 mb-1">Error</p>
                    <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{exec.error}</pre>
                  </div>
                ) : exec.output ? (
                  <MarkdownView content={exec.output} />
                ) : exec.status === 'running' ? (
                  <p className="text-sm text-gray-500 italic">Running…</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">No output captured.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
