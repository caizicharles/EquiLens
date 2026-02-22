import { create } from 'zustand';
import type { ModelId } from './data/models';

export type Phase = 'globe' | 'map' | 'sandbox' | 'results';
export type City = 'london' | 'edinburgh' | 'dublin';

export type BiasAxisKey = 'ethnicity' | 'gender' | 'SES';

export interface AppStore {
  // Phase navigation
  phase: Phase;
  selectedCity: City | null;
  setPhase: (phase: Phase) => void;
  selectCity: (city: City) => void;

  // Sandbox configuration
  selectedModel: ModelId;
  enabledBiasAxes: Record<BiasAxisKey, boolean>;
  enabledDisease: boolean;
  attackRunning: boolean;
  attackComplete: boolean;

  // Sandbox actions
  setSelectedModel: (model: ModelId) => void;
  toggleBiasAxis: (axis: BiasAxisKey) => void;
  toggleDisease: () => void;
  runAttack: () => void;
  finishAttack: () => void;
  resetSandbox: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Phase navigation
  phase: 'map',
  selectedCity: null,
  setPhase: (phase) => set({ phase }),
  selectCity: (city) => set({ selectedCity: city }),

  // Sandbox configuration
  selectedModel: 'claude-sonnet-4-6',
  enabledBiasAxes: { ethnicity: true, gender: true, SES: true },
  enabledDisease: true,
  attackRunning: false,
  attackComplete: false,

  // Sandbox actions
  setSelectedModel: (model) => set({ selectedModel: model }),
  toggleBiasAxis: (axis) =>
    set((s) => ({
      enabledBiasAxes: {
        ...s.enabledBiasAxes,
        [axis]: !s.enabledBiasAxes[axis],
      },
    })),
  toggleDisease: () => set((s) => ({ enabledDisease: !s.enabledDisease })),

  runAttack: () => {
    // Transition to results immediately — the loading animation lives in ResultsPanel
    set({ attackRunning: true, attackComplete: false, phase: 'results' });
  },

  finishAttack: () => {
    set({ attackRunning: false, attackComplete: true });
  },

  resetSandbox: () =>
    set({
      selectedModel: 'claude-sonnet-4-6',
      enabledBiasAxes: { ethnicity: true, gender: true, SES: true },
      enabledDisease: true,
      attackRunning: false,
      attackComplete: false,
    }),
}));
