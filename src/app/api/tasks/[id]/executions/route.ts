import { NextResponse } from 'next/server';
import { getTask } from '@/lib/tasks';
import { getExecutionsForTask } from '@/lib/executions';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const executions = getExecutionsForTask(id);
  return NextResponse.json(executions);
}
