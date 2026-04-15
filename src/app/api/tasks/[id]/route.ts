import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getTask, updateTask, deleteTask } from '@/lib/tasks';
import { reloadTask, unregisterTask } from '@/lib/scheduler';
import { getLastExecutionForTask } from '@/lib/executions';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...task, lastExecution: getLastExecutionForTask(id) ?? null });
}

const PatchSchema = z.object({
  enabled: z.boolean().optional(),
  name: z.string().min(1).optional(),
  prompt: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  cron: z.string().min(1).optional(),
  auth_mode: z.enum(['subscription', 'api_key']).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = updateTask(id, parsed.data);
  reloadTask(id);

  return NextResponse.json({ ...updated, lastExecution: getLastExecutionForTask(id) ?? null });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  unregisterTask(id);
  deleteTask(id);

  return new NextResponse(null, { status: 204 });
}
