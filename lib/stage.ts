import type { StageCode, StageNumber } from '@/lib/types';

export interface StageMeta {
  n: StageNumber;
  code: StageCode;
  /** CPCB AQI band the GRAP stage is invoked at. */
  band: string;
  aqi: string;
  /** Haze density for the page background and the 3D scene. */
  haze: number;
  cssColor: string;
  hex: string;
}

export const STAGES: StageMeta[] = [
  { n: 1, code: 'I', band: 'Poor', aqi: 'AQI 201–300', haze: 0.1, cssColor: 'var(--color-aqi-poor)', hex: '#f29c33' },
  { n: 2, code: 'II', band: 'Very poor', aqi: 'AQI 301–400', haze: 0.35, cssColor: 'var(--color-aqi-vpoor)', hex: '#e0443c' },
  { n: 3, code: 'III', band: 'Severe', aqi: 'AQI 401–450', haze: 0.7, cssColor: 'var(--color-aqi-severe)', hex: '#a3207b' },
  { n: 4, code: 'IV', band: 'Severe+', aqi: 'AQI above 450', haze: 0.95, cssColor: 'var(--color-aqi-severe2)', hex: '#6b1030' },
];

export const stageByNumber = (n: number): StageMeta => STAGES[Math.min(4, Math.max(1, Math.round(n))) - 1];
export const stageByCode = (code: string | null | undefined): StageMeta =>
  STAGES.find((s) => s.code === code) ?? STAGES[2];

/** For this ruleset the order permits outdoor PE at I–II and bans it from III. */
export const sameOrderGroup = (a: StageNumber, b: StageNumber) => (a <= 2) === (b <= 2);
