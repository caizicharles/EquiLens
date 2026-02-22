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
  enabledDemographics: boolean;
  enabledDisease: boolean;
  attackRunning: boolean;
  attackComplete: boolean;

  // Sandbox actions
  setSelectedModel: (model: ModelId) => void;
  toggleDemographics: () => void;
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
  enabledDemographics: true,
  enabledDisease: true,
  attackRunning: false,
  attackComplete: false,

  // Sandbox actions
  setSelectedModel: (model) => set({ selectedModel: model }),
  toggleDemographics: () => set((s) => ({ enabledDemographics: !s.enabledDemographics })),
  toggleDisease: () => set((s) => ({ enabledDisease: !s.enabledDisease })),

  runAttack: () => {
    set({ attackRunning: true, attackComplete: false, phase: 'results' });
  },

  finishAttack: () => {
    set({ attackRunning: false, attackComplete: true });
  },

  resetSandbox: () =>
    set({
      selectedModel: 'claude-sonnet-4-6',
      enabledDemographics: true,
      enabledDisease: true,
      attackRunning: false,
      attackComplete: false,
    }),
}));
