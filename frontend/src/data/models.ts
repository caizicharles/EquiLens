export type ModelId = 'claude-sonnet-4-6' | 'gemini';

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
    id: 'gemini',
    label: 'Gemini 2.0 Flash',
    shortLabel: 'Gemini',
    available: true,
  },
];
