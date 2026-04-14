'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Task } from '@/lib/tasks';
import type { Execution } from '@/lib/executions';

interface TaskWithExecution extends Task {
  lastExecution: Execution | null;
}

interface Props {
  tasks: TaskWithExecution[];
  onRefresh: () => void;
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatusBadge({ status }: { status: string }) {
  const base = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
  if (status === 'success') return <span className={`${base} bg-green-900/50 text-green-300`}>success</span>;
  if (status === 'error') return <span className={`${base} bg-red-900/50 text-red-300`}>error</span>;
  return <span className={`${base} bg-yellow-900/50 text-yellow-300`}>{status}</span>;
}

export default function TaskList({ tasks, onRefresh }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function toggleEnabled(task: TaskWithExecution) {
    setLoadingId(task.id);
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !task.enabled }),
    });
    setLoadingId(null);
    onRefresh();
  }

  async function runNow(task: TaskWithExecution) {
    setLoadingId(task.id);
    await fetch(`/api/tasks/${task.id}/run`, { method: 'POST' });
    setLoadingId(null);
    onRefresh();
  }

  async function deleteTask(task: TaskWithExecution) {
    if (!confirm(`Delete task "${task.name}"?`)) return;
    setLoadingId(task.id);
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    setLoadingId(null);
    onRefresh();
  }

  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-12">
        No tasks yet. Create one above.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Schedule</th>
            <th className="text-left px-4 py-3">Model</th>
            <th className="text-left px-4 py-3">Auth</th>
            <th className="text-left px-4 py-3">Last Run</th>
            <th className="text-left px-4 py-3">Enabled</th>
            <th className="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60">
          {tasks.map((task) => (
            <tr key={task.id} className="hover:bg-gray-900/50 transition-colors">
              <td className="px-4 py-3 font-medium text-white">
                <Link href={`/tasks/${task.id}`} className="hover:text-indigo-400 transition-colors">
                  {task.name}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-gray-400 text-xs">{task.cron}</td>
              <td className="px-4 py-3 text-gray-400 text-xs">{task.model.replace('claude-', '').replace(/-\d+$/, '')}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  task.auth_mode === 'subscription'
                    ? 'bg-violet-900/50 text-violet-300'
                    : 'bg-blue-900/50 text-blue-300'
                }`}>
                  {task.auth_mode === 'subscription' ? 'subscription' : 'api key'}
                </span>
              </td>
              <td className="px-4 py-3">
                {task.lastExecution ? (
                  <span className="flex items-center gap-2">
                    <StatusBadge status={task.lastExecution.status} />
                    <span className="text-gray-500 text-xs">{relativeTime(task.lastExecution.started_at)}</span>
                  </span>
                ) : (
                  <span className="text-gray-600 text-xs">never</span>
                )}
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => toggleEnabled(task)}
                  disabled={loadingId === task.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${task.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${task.enabled ? 'translate-x-4' : 'translate-x-1'}`}
                  />
                </button>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => runNow(task)}
                    disabled={loadingId === task.id}
                    className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition-colors"
                  >
                    Run now
                  </button>
                  <button
                    onClick={() => deleteTask(task)}
                    disabled={loadingId === task.id}
                    className="text-xs text-red-500 hover:text-red-400 disabled:opacity-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
