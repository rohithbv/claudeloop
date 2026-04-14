'use client';

import { useState } from 'react';
import { MODELS } from '@/lib/models';
import type { AuthMode } from '@/lib/tasks';

interface Props {
  onCreated: () => void;
  onCancel?: () => void;
}

export default function TaskForm({ onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(MODELS[1].id);
  const [cronExpr, setCronExpr] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('subscription');
  const [cronError, setCronError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCronError('');
    setSubmitting(true);

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt, model, cron: cronExpr, auth_mode: authMode }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.error === 'Invalid cron expression') {
        setCronError('Invalid cron expression');
      } else {
        setError(data.error ?? 'Failed to create task');
      }
      return;
    }

    setName('');
    setPrompt('');
    setCronExpr('');
    setAuthMode('subscription');
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">New Task</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Daily digest"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1">Prompt</label>
        <textarea
          required
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
          placeholder="Write a summary of today's activity in the ./workspaces directory…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Schedule{' '}
            <span className="text-gray-600 font-mono">(cron expression)</span>
          </label>
          <input
            required
            value={cronExpr}
            onChange={(e) => { setCronExpr(e.target.value); setCronError(''); }}
            className={`w-full bg-gray-800 border rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${cronError ? 'border-red-500' : 'border-gray-700'}`}
            placeholder="0 9 * * *  →  daily at 9 am"
          />
          {cronError && <p className="mt-1 text-xs text-red-400">{cronError}</p>}
          <p className="mt-1 text-xs text-gray-600">
            Examples: <span className="font-mono">* * * * *</span> every minute,{' '}
            <span className="font-mono">0 * * * *</span> hourly,{' '}
            <span className="font-mono">0 8 * * 1-5</span> weekdays 8 am
          </p>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Authentication</label>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setAuthMode('subscription')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                authMode === 'subscription'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              Claude Subscription
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('api_key')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                authMode === 'api_key'
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
              }`}
            >
              API Key
            </button>
          </div>
          <p className="mt-1.5 text-xs text-gray-600">
            {authMode === 'subscription'
              ? 'Uses credentials from `claude` CLI login (Pro/Max plan)'
              : 'Uses ANTHROPIC_API_KEY from .env.local'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {submitting ? 'Creating…' : 'Create Task'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
