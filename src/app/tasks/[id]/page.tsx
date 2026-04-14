'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ExecutionList from '@/components/ExecutionList';
import type { Task } from '@/lib/tasks';
import type { Execution } from '@/lib/executions';

interface TaskWithExecution extends Task {
  lastExecution: Execution | null;
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<TaskWithExecution | null>(null);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTask = useCallback(async () => {
    const res = await fetch(`/api/tasks/${id}`);
    if (res.ok) setTask(await res.json());
    else router.push('/');
  }, [id, router]);

  const fetchExecutions = useCallback(async () => {
    const res = await fetch(`/api/tasks/${id}/executions`);
    if (res.ok) setExecutions(await res.json());
  }, [id]);

  useEffect(() => {
    Promise.all([fetchTask(), fetchExecutions()]).then(() => setLoading(false));

    // Poll while on this page so running executions surface automatically
    intervalRef.current = setInterval(() => {
      fetchTask();
      fetchExecutions();
    }, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchTask, fetchExecutions]);

  async function handleToggle() {
    if (!task) return;
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !task.enabled }),
    });
    fetchTask();
  }

  async function handleRunNow() {
    if (!task) return;
    setRunning(true);
    await fetch(`/api/tasks/${task.id}/run`, { method: 'POST' });
    await fetchExecutions();
    setRunning(false);
  }

  async function handleDelete() {
    if (!task) return;
    if (!confirm(`Delete task "${task.name}"?`)) return;
    await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
    router.push('/');
  }

  if (loading) {
    return <p className="text-sm text-gray-500">Loading…</p>;
  }

  if (!task) return null;

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-300 transition-colors">Tasks</Link>
        <span className="mx-2">/</span>
        <span className="text-white">{task.name}</span>
      </div>

      {/* Task config card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold text-white">{task.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
              <span className="font-mono">{task.cron}</span>
              <span>&middot;</span>
              <span>{task.model}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Enable toggle */}
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${task.enabled ? 'bg-indigo-600' : 'bg-gray-700'}`}
              title={task.enabled ? 'Disable task' : 'Enable task'}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${task.enabled ? 'translate-x-4' : 'translate-x-1'}`}
              />
            </button>
            <span className="text-xs text-gray-500">{task.enabled ? 'Enabled' : 'Disabled'}</span>

            <button
              onClick={handleRunNow}
              disabled={running}
              className="ml-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {running ? 'Running…' : 'Run now'}
            </button>

            <button
              onClick={handleDelete}
              className="text-xs text-red-500 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Prompt preview */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 mb-1">Prompt</p>
          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{task.prompt}</pre>
        </div>
      </div>

      {/* Execution history */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Execution History
          {executions.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">({executions.length})</span>
          )}
        </h2>
        <ExecutionList executions={executions} />
      </div>
    </div>
  );
}
