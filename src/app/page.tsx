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

  return (
    <div className="space-y-8">
      <TaskForm onCreated={fetchTasks} />

      <div>
        <h2 className="text-base font-semibold text-white mb-4">
          Tasks
          {tasks.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">({tasks.length})</span>
          )}
        </h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : (
          <TaskList tasks={tasks} onRefresh={fetchTasks} />
        )}
      </div>
    </div>
  );
}
