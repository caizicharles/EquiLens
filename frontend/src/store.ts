import { create } from 'zustand';

export type Phase = 'globe' | 'map' | 'sandbox' | 'results';
export type City = 'london' | 'edinburgh' | 'dublin';

export interface AppStore {
  phase: Phase;
  selectedCity: City | null;
  setPhase: (phase: Phase) => void;
  selectCity: (city: City) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  phase: 'map',
  selectedCity: null,
  setPhase: (phase) => set({ phase }),
  selectCity: (city) => set({ selectedCity: city }),
}));
