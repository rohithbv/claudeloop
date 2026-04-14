'use client';

import { useCallback, useEffect, useState } from 'react';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import type { Task } from '@/lib/tasks';
import type { Execution } from '@/lib/executions';

interface TaskWithExecution extends Task {
  lastExecution: Execution | null;
}

export default function Home() {
  const [tasks, setTasks] = useState<TaskWithExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchTasks = useCallback(async () => {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      setTasks(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Close modal on Escape key
  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showModal]);

  function handleCreated() {
    setShowModal(false);
    fetchTasks();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Tasks
          {tasks.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">({tasks.length})</span>
          )}
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Add Task
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : (
        <TaskList tasks={tasks} onRefresh={fetchTasks} />
      )}

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto p-4 sm:p-8"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full max-w-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <TaskForm onCreated={handleCreated} onCancel={() => setShowModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
