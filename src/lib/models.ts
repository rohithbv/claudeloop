export const MODELS = [
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
] as const;

export type ModelId = (typeof MODELS)[number]['id'];

export const MODEL_IDS = MODELS.map((m) => m.id) as [ModelId, ...ModelId[]];
