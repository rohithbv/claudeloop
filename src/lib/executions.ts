import db from './db';

export type ExecutionStatus = 'running' | 'success' | 'error';
export type ExecutionTrigger = 'cron' | 'manual';

export interface Execution {
  id: string;
  task_id: string;
  started_at: number;
  finished_at: number | null;
  status: ExecutionStatus;
  output: string | null;
  error: string | null;
  trigger: ExecutionTrigger;
}

export function getExecutionsForTask(taskId: string): Execution[] {
  return db
    .prepare('SELECT * FROM executions WHERE task_id = ? ORDER BY started_at DESC')
    .all(taskId) as unknown as Execution[];
}

export function getExecution(id: string): Execution | undefined {
  return db.prepare('SELECT * FROM executions WHERE id = ?').get(id) as unknown as Execution | undefined;
}

export function hasRunningExecution(taskId: string): boolean {
  const row = db
    .prepare("SELECT id FROM executions WHERE task_id = ? AND status = 'running' LIMIT 1")
    .get(taskId);
  return !!row;
}

export function createExecution(data: Pick<Execution, 'id' | 'task_id' | 'trigger'>): Execution {
  const now = Date.now();
  const exec: Execution = {
    ...data,
    started_at: now,
    finished_at: null,
    status: 'running',
    output: null,
    error: null,
  };
  db.prepare(
    'INSERT INTO executions (id, task_id, started_at, finished_at, status, output, error, trigger) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(exec.id, exec.task_id, exec.started_at, null, exec.status, null, null, exec.trigger);
  return exec;
}

export function finishExecution(
  id: string,
  result: { status: ExecutionStatus; output?: string; error?: string }
): void {
  db.prepare(
    'UPDATE executions SET finished_at=?, status=?, output=?, error=? WHERE id=?'
  ).run(Date.now(), result.status, result.output ?? null, result.error ?? null, id);
}

export function getLastExecutionForTask(taskId: string): Execution | undefined {
  return db
    .prepare('SELECT * FROM executions WHERE task_id = ? ORDER BY started_at DESC LIMIT 1')
    .get(taskId) as unknown as Execution | undefined;
}
