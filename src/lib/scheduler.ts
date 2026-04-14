import cron from 'node-cron';
import { getEnabledTasks, getTask } from './tasks';
import { runTask } from './runner';
import type { Task } from './tasks';

// Keyed by task id; lives for the process lifetime
const jobs = new Map<string, cron.ScheduledTask>();

const INIT_KEY = Symbol.for('claudeloop.schedulerInit');

export function initScheduler(): void {
  const g = globalThis as Record<symbol, boolean>;
  if (g[INIT_KEY]) return;
  g[INIT_KEY] = true;

  const tasks = getEnabledTasks();
  for (const task of tasks) {
    registerTask(task);
  }
  console.log(`[scheduler] Initialized with ${tasks.length} task(s)`);
}

export function registerTask(task: Task): void {
  if (jobs.has(task.id)) {
    jobs.get(task.id)!.stop();
    jobs.delete(task.id);
  }
  const job = cron.schedule(task.cron, () => {
    runTask(task.id, 'cron').catch((err) =>
      console.error(`[scheduler] Task ${task.id} failed:`, err)
    );
  });
  jobs.set(task.id, job);
  console.log(`[scheduler] Registered task "${task.name}" (${task.cron})`);
}

export function unregisterTask(taskId: string): void {
  const job = jobs.get(taskId);
  if (job) {
    job.stop();
    jobs.delete(taskId);
    console.log(`[scheduler] Unregistered task ${taskId}`);
  }
}

export function reloadTask(taskId: string): void {
  unregisterTask(taskId);
  const task = getTask(taskId);
  if (task?.enabled) {
    registerTask(task);
  }
}

export function validateCron(expr: string): boolean {
  return cron.validate(expr);
}
