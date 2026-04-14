import db from './db';

export interface Task {
  id: string;
  name: string;
  prompt: string;
  model: string;
  cron: string;
  enabled: boolean;
  created_at: number;
  updated_at: number;
}

interface TaskRow {
  id: string;
  name: string;
  prompt: string;
  model: string;
  cron: string;
  enabled: number;
  created_at: number;
  updated_at: number;
}

function toTask(row: TaskRow): Task {
  return { ...row, enabled: row.enabled === 1 };
}

export function getAllTasks(): Task[] {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all() as unknown as TaskRow[];
  return rows.map(toTask);
}

export function getTask(id: string): Task | undefined {
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as unknown as TaskRow | undefined;
  return row ? toTask(row) : undefined;
}

export function getEnabledTasks(): Task[] {
  const rows = db.prepare('SELECT * FROM tasks WHERE enabled = 1').all() as unknown as TaskRow[];
  return rows.map(toTask);
}

export function createTask(data: Omit<Task, 'created_at' | 'updated_at'>): Task {
  const now = Date.now();
  db.prepare(
    'INSERT INTO tasks (id, name, prompt, model, cron, enabled, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(data.id, data.name, data.prompt, data.model, data.cron, data.enabled ? 1 : 0, now, now);
  return { ...data, created_at: now, updated_at: now };
}

export function updateTask(id: string, patch: Partial<Pick<Task, 'enabled' | 'name' | 'prompt' | 'model' | 'cron'>>): Task | undefined {
  const task = getTask(id);
  if (!task) return undefined;
  const updated = { ...task, ...patch, updated_at: Date.now() };
  db.prepare(
    'UPDATE tasks SET name=?, prompt=?, model=?, cron=?, enabled=?, updated_at=? WHERE id=?'
  ).run(updated.name, updated.prompt, updated.model, updated.cron, updated.enabled ? 1 : 0, updated.updated_at, id);
  return updated;
}

export function deleteTask(id: string): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
}
