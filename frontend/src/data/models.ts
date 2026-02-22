export type ModelId = 'claude-sonnet-4-6' | 'gpt-5';

export interface ModelOption {
  id: ModelId;
  label: string;
  shortLabel: string;
  available: boolean;
}

export const MODELS: ModelOption[] = [
  {
    id: 'claude-sonnet-4-6',
    label: 'Claude Sonnet 4.6',
    shortLabel: 'Claude',
    available: true,
  },
  {
    id: 'gpt-5',
    label: 'GPT-5',
    shortLabel: 'GPT-5',
    available: true,
  },
];
