import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { getTask } from './tasks';
import { createExecution, finishExecution, hasRunningExecution } from './executions';
import type { ExecutionTrigger } from './executions';

const WORKSPACES_DIR = path.join(process.cwd(), 'workspaces');

export async function runTask(taskId: string, trigger: ExecutionTrigger): Promise<string> {
  const task = getTask(taskId);
  if (!task) throw new Error(`Task ${taskId} not found`);

  // For cron-triggered runs, skip if the task was disabled between schedule and fire
  if (trigger === 'cron' && !task.enabled) return '';

  // Skip if a run is already in progress
  if (hasRunningExecution(taskId)) {
    console.log(`[runner] Skipping task ${taskId} — previous run still in progress`);
    return '';
  }

  const execId = nanoid();
  createExecution({ id: execId, task_id: taskId, trigger });

  const workspaceDir = path.join(WORKSPACES_DIR, taskId);
  fs.mkdirSync(workspaceDir, { recursive: true });

  try {
    // Dynamic import so this module only loads in the Node.js runtime
    const { query } = await import('@anthropic-ai/claude-agent-sdk');

    // Build the env passed to the Claude subprocess. In subscription mode we
    // strip ANTHROPIC_API_KEY so the SDK falls back to OAuth credentials
    // stored by `claude` CLI login (~/.claude/). In api_key mode we require
    // the key to be present.
    const env: Record<string, string | undefined> = { ...process.env };
    if (task.auth_mode === 'subscription') {
      delete env.ANTHROPIC_API_KEY;
    } else if (task.auth_mode === 'api_key' && !env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set but task is configured for api_key auth');
    }

    const stderrLines: string[] = [];
    let output = '';
    const messages = query({
      prompt: task.prompt,
      options: {
        model: task.model,
        cwd: workspaceDir,
        env,
        permissionMode: 'bypassPermissions',
        allowDangerouslySkipPermissions: true,
        stderr: (data: string) => { stderrLines.push(data); },
      },
    });

    for await (const message of messages) {
      if (message.type === 'result') {
        if (message.subtype === 'success') {
          output = message.result ?? '';
        } else {
          const errMsg = message.errors?.join('\n') ?? 'Claude returned an error result';
          const detail = `[${message.subtype}] ${errMsg}`;
          const stderr = stderrLines.join('').trim();
          throw new Error(stderr ? `${detail}\n\nDiagnostics:\n${stderr}` : detail);
        }
        break;
      }
    }

    finishExecution(execId, { status: 'success', output });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const stderr = stderrLines.join('').trim();
    const fullError = stderr ? `${errorMsg}\n\nDiagnostics:\n${stderr}` : errorMsg;
    console.error(`[runner] Task ${taskId} failed:`, fullError);
    finishExecution(execId, { status: 'error', error: fullError });
  }

  return execId;
}
