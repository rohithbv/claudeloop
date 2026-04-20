# syntax=docker/dockerfile:1

# ── Stage 1: production dependencies only ──────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: build ─────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 3: runtime ───────────────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# Prevent the bundled Claude CLI from downloading updates or phoning home at runtime.
# Everything the CLI needs is already baked into node_modules at build time.
ENV DISABLE_AUTOUPDATER=1
ENV CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1

# @anthropic-ai/claude-agent-sdk spawns ripgrep and the claude CLI as child
# processes — those binaries live inside node_modules and must stay intact.
# We copy the full prod node_modules from the deps stage rather than using
# Next.js standalone mode (which only traces import-time requires and would
# miss the vendor/ directory and cli.js used at runtime by the agent SDK).
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/.next        ./.next
COPY package.json next.config.mjs ./

# Install Claude Code CLI globally so it is available as a subprocess at runtime.
RUN npm install -g @anthropic-ai/claude-code@2.1.114

# Pre-create persistent directories; mount volumes over these at runtime.
# Claude Code's --dangerously-skip-permissions flag is blocked when running as
# root, so we switch to the built-in non-root 'node' user (UID 1000).
RUN mkdir -p data workspaces /home/node/.claude \
    && chown -R node:node /app /home/node/.claude

USER node

EXPOSE 3000

CMD ["sh", "-c", "exec node_modules/.bin/next start --hostname 0.0.0.0 --port ${PORT:-3000}"]
