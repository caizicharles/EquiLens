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
  resetSandbox: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
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
    set({ attackRunning: true, attackComplete: false });
    // Simulate loading — then transition to results
    setTimeout(() => {
      const { phase } = get();
      // Only proceed if still in sandbox (user didn't navigate away)
      if (phase === 'sandbox') {
        set({ attackRunning: false, attackComplete: true, phase: 'results' });
      } else {
        set({ attackRunning: false });
      }
    }, 2000);
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
