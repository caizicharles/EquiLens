import type { City } from '../store';

import londonData from './analysis/london.json';
import edinburghData from './analysis/edinburgh.json';
import dublinData from './analysis/dublin.json';
import crossCityData from './analysis/cross_city.json';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AnalysisSection {
  summary: string;
  findings: string;
  verdict?: string;
  recommendation: string;
}

interface CityAnalysisSections {
  demographic_only: AnalysisSection;
  disease_only: AnalysisSection;
  combined: AnalysisSection;
}

export type AnalysisMode = 'demographic_only' | 'disease_only' | 'combined';

export type VerdictStatus = 'not_recommended' | 'conditional' | 'recommended';

// ---------------------------------------------------------------------------
// Data accessors
// ---------------------------------------------------------------------------

const CITY_ANALYSIS: Record<City, CityAnalysisSections> = {
  london: (londonData as Record<string, unknown>).london as CityAnalysisSections,
  edinburgh: (edinburghData as Record<string, unknown>).edinburgh as CityAnalysisSections,
  dublin: (dublinData as Record<string, unknown>).dublin as CityAnalysisSections,
};

const CROSS_CITY_ANALYSIS = (crossCityData as Record<string, unknown>).cross_city as CityAnalysisSections;

export function getAnalysis(city: City, mode: AnalysisMode): AnalysisSection {
  return CITY_ANALYSIS[city][mode];
}

export function getCrossCityAnalysis(mode: AnalysisMode): AnalysisSection {
  return CROSS_CITY_ANALYSIS[mode];
}

// ---------------------------------------------------------------------------
// Verdict parser
// ---------------------------------------------------------------------------

export function parseVerdictStatus(verdict: string | undefined): VerdictStatus {
  if (!verdict) return 'not_recommended';
  const upper = verdict.toUpperCase();
  if (upper.includes('CONDITIONALLY RECOMMENDED')) return 'conditional';
  if (upper.includes('NOT RECOMMENDED')) return 'not_recommended';
  if (upper.includes('RECOMMENDED')) return 'recommended';
  return 'not_recommended';
}

/**
 * Extract the short badge label from a verdict string.
 */
export function verdictBadgeLabel(status: VerdictStatus): string {
  switch (status) {
    case 'recommended':
      return 'Recommended for Clinical Deployment';
    case 'conditional':
      return 'Conditionally Recommended';
    case 'not_recommended':
      return 'Not Recommended for Clinical Deployment';
  }
}

/**
 * Compute the analysis mode from the two toggle states.
 */
export function computeMode(enabledDemographics: boolean, enabledDisease: boolean): AnalysisMode {
  if (enabledDemographics && enabledDisease) return 'combined';
  if (enabledDemographics) return 'demographic_only';
  return 'disease_only';
}
