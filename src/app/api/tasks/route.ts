import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { z } from 'zod';
import { getAllTasks, createTask, getTask } from '@/lib/tasks';
import { getLastExecutionForTask } from '@/lib/executions';
import { reloadTask, validateCron } from '@/lib/scheduler';
import { MODEL_IDS } from '@/lib/models';

export async function GET() {
  const tasks = getAllTasks();
  const enriched = tasks.map((task) => ({
    ...task,
    lastExecution: getLastExecutionForTask(task.id) ?? null,
  }));
  return NextResponse.json(enriched);
}

const CreateSchema = z.object({
  name: z.string().min(1),
  prompt: z.string().min(1),
  model: z.enum(MODEL_IDS),
  cron: z.string().min(1),
  auth_mode: z.enum(['subscription', 'api_key']).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  const { name, prompt, model, cron, auth_mode } = parsed.data;
  if (!validateCron(cron)) {
    return NextResponse.json({ error: 'Invalid cron expression' }, { status: 400 });
  }

  const task = createTask({
    id: nanoid(),
    name,
    prompt,
    model,
    cron,
    enabled: true,
    auth_mode: auth_mode ?? 'subscription',
  });

  // Register in the in-process scheduler
  reloadTask(task.id);

  return NextResponse.json({ ...task, lastExecution: null }, { status: 201 });
}
