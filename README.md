# ClaudeLoop

A self-hosted web UI for scheduling and running autonomous Claude agent tasks on a cron schedule.

## What it does

ClaudeLoop lets you define tasks — a name, a prompt, a model, and a cron schedule — and runs them automatically using the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk). Each task runs in its own isolated workspace directory with full tool access (`bypassPermissions` mode). Execution history is stored locally in SQLite.

**Key features:**
- Schedule Claude agents with standard cron expressions
- Per-task authentication: use your Claude Pro/Max subscription or an Anthropic API key
- Choose the model per task (Opus 4.6, Sonnet 4.6, Haiku 4.5)
- View execution history and output for each task
- Enable/disable tasks without deleting them
- Run tasks manually on demand
- Fully self-hosted — all data stays on your machine

## Prerequisites

- Node.js 22+ (or Docker)
- A Claude account — either:
  - **Claude Pro/Max subscription** (recommended): log in once with `claude` CLI
  - **Anthropic API key**: set `ANTHROPIC_API_KEY` in your environment

## Getting started

### Option 1: Docker (recommended)

First, if you plan to use subscription auth, log in to the Claude CLI on your host:

```bash
claude  # follow the login prompt
```

Then start the container:

```bash
docker compose up
```

Open [http://localhost:3000](http://localhost:3000).

The container mounts `~/.claude` from the host (read-only) so the Claude CLI credentials are available inside. A named Docker volume persists the SQLite database and task workspaces across restarts.

To use an API key instead, set it before starting:

```bash
ANTHROPIC_API_KEY=sk-ant-... docker compose up
```

### Option 2: Local dev

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For subscription auth, ensure `claude` CLI is logged in on your machine. For API key auth, create `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Creating a task

1. Click **+ Add Task**
2. Fill in:
   - **Name** — a label for the task
   - **Model** — which Claude model to use
   - **Prompt** — the instruction given to the agent
   - **Schedule** — a cron expression (e.g. `0 9 * * *` for daily at 9 am)
   - **Authentication** — subscription (default) or API key
3. Click **Create Task**

The task starts on its next scheduled time. Click **Run now** to trigger it immediately.

Each task gets an isolated working directory at `workspaces/<task-id>/`. The agent can read and write files there across runs.

## Cron expression examples

| Expression | Meaning |
|---|---|
| `* * * * *` | Every minute |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Daily at 9 am |
| `0 8 * * 1-5` | Weekdays at 8 am |
| `0 0 * * 0` | Weekly on Sunday midnight |

## Project structure

```
src/
  app/
    api/tasks/        # REST API routes (CRUD + run)
    tasks/[id]/       # Task detail page (execution history)
    page.tsx          # Task list home page
  components/
    TaskForm.tsx      # New task modal
    TaskList.tsx      # Task cards with status
    ExecutionList.tsx # Execution history
    MarkdownView.tsx  # Renders agent output
  lib/
    db.ts             # SQLite connection (better-sqlite3)
    tasks.ts          # Task CRUD
    executions.ts     # Execution tracking
    runner.ts         # Claude agent invocation
    scheduler.ts      # node-cron integration
    models.ts         # Supported model list
```

## Authentication modes

| Mode | How it works | Requires |
|---|---|---|
| **Subscription** | Strips `ANTHROPIC_API_KEY` from env so the Claude SDK falls back to OAuth credentials stored by `claude` CLI login | Claude Pro or Max plan |
| **API Key** | Passes `ANTHROPIC_API_KEY` to the agent subprocess | Valid Anthropic API key |

Auth mode is set per task and can be changed after creation.

## Data storage

- **Database**: SQLite file at `data/claudeloop.db` (auto-created on first run)
- **Workspaces**: `workspaces/<task-id>/` — one directory per task, persisted across runs

Both paths are mounted as Docker volumes when using `docker compose`.
