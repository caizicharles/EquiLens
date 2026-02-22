import type { City } from '../store';
import type { ModelId } from './models';

// Claude analysis data
import londonData from './analysis/london.json';
import edinburghData from './analysis/edinburgh.json';
import dublinData from './analysis/dublin.json';
import crossCityData from './analysis/cross_city.json';

// GPT-5 analysis data
import gpt5LondonData from './analysis/gpt5/london.json';
import gpt5EdinburghData from './analysis/gpt5/edinburgh.json';
import gpt5DublinData from './analysis/gpt5/dublin.json';
import gpt5CrossCityData from './analysis/gpt5/cross_city.json';

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

const CLAUDE_CITY_ANALYSIS: Record<City, CityAnalysisSections> = {
  london: (londonData as Record<string, unknown>).london as CityAnalysisSections,
  edinburgh: (edinburghData as Record<string, unknown>).edinburgh as CityAnalysisSections,
  dublin: (dublinData as Record<string, unknown>).dublin as CityAnalysisSections,
};

const CLAUDE_CROSS_CITY = (crossCityData as Record<string, unknown>).cross_city as CityAnalysisSections;

const GPT5_CITY_ANALYSIS: Record<City, CityAnalysisSections> = {
  london: (gpt5LondonData as Record<string, unknown>).london as CityAnalysisSections,
  edinburgh: (gpt5EdinburghData as Record<string, unknown>).edinburgh as CityAnalysisSections,
  dublin: (gpt5DublinData as Record<string, unknown>).dublin as CityAnalysisSections,
};

const GPT5_CROSS_CITY = (gpt5CrossCityData as Record<string, unknown>).cross_city as CityAnalysisSections;

const MODEL_CITY_ANALYSIS: Record<ModelId, Record<City, CityAnalysisSections>> = {
  'claude-sonnet-4-6': CLAUDE_CITY_ANALYSIS,
  'gpt-5': GPT5_CITY_ANALYSIS,
};

const MODEL_CROSS_CITY: Record<ModelId, CityAnalysisSections> = {
  'claude-sonnet-4-6': CLAUDE_CROSS_CITY,
  'gpt-5': GPT5_CROSS_CITY,
};

export function getAnalysis(city: City, mode: AnalysisMode, model: ModelId = 'claude-sonnet-4-6'): AnalysisSection {
  return MODEL_CITY_ANALYSIS[model][city][mode];
}

export function getCrossCityAnalysis(mode: AnalysisMode, model: ModelId = 'claude-sonnet-4-6'): AnalysisSection {
  return MODEL_CROSS_CITY[model][mode];
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
 * Short badge label for the verdict status.
 */
export function verdictBadgeLabel(status: VerdictStatus): string {
  switch (status) {
    case 'recommended':
      return 'Recommended';
    case 'conditional':
      return 'Conditionally Recommended';
    case 'not_recommended':
      return 'Not Recommended';
  }
}

/**
 * Strip the status prefix (e.g. "NOT RECOMMENDED. ") from a verdict string,
 * leaving only the explanatory text. Capitalises the first remaining character.
 */
export function stripVerdictPrefix(verdict: string): string {
  const stripped = verdict
    .replace(
      /^(?:CONDITIONALLY\s+RECOMMENDED|NOT\s+RECOMMENDED|RECOMMENDED)\.?\s*/i,
      '',
    );
  if (stripped.length === 0) return stripped;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/**
 * Compute the analysis mode from the two toggle states.
 */
export function computeMode(enabledDemographics: boolean, enabledDisease: boolean): AnalysisMode {
  if (enabledDemographics && enabledDisease) return 'combined';
  if (enabledDemographics) return 'demographic_only';
  return 'disease_only';
}
