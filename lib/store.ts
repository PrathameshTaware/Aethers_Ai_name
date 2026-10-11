import { create } from 'zustand';
import type { StageNumber } from '@/lib/types';

export type Lang = 'en' | 'hi' | 'ta';

interface UiStore {
  /** The GRAP stage being rehearsed. Drives the haze and the 3D scene everywhere. */
  stage: StageNumber;
  setStage: (stage: StageNumber) => void;
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useUi = create<UiStore>((set) => ({
  stage: 2,
  setStage: (stage) => set({ stage }),
  lang: 'en',
  setLang: (lang) => set({ lang }),
}));
