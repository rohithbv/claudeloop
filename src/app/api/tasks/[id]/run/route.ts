import { NextResponse } from 'next/server';
import { getTask } from '@/lib/tasks';
import { runTask } from '@/lib/runner';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Run in background — don't await so the UI gets the execId immediately
  const execId = await runTask(id, 'manual');

  return NextResponse.json({ execId });
}
