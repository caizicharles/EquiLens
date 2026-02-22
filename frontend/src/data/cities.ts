import type { City } from '../store';
import { colors } from '../style';

// ---------------------------------------------------------------------------
// Demographics composition per city (for AMQA adversarial attacks)
// ---------------------------------------------------------------------------

export interface DemographicAxis {
  label: string;
  key: 'ethnicity' | 'gender' | 'SES';
  majorityLabel: string;
  minorityLabel: string;
  majorityPct: number;   // 0–1
  minorityPct: number;   // 0–1
  majorityColor: string;
  minorityColor: string;
}

export interface DiseaseSlice {
  label: string;
  pct: number;  // 0–1
  color: string;
}

export interface CityConfig {
  id: City;
  label: string;
  lat: number;
  lng: number;
  badgeStyle: 'badgeGreen' | 'badgeOcean' | 'badgePeach';
  accentColor: string;
  demographics: DemographicAxis[];
  diseases: DiseaseSlice[];
}

// Disease colors — consistent across cities
const DISEASE_COLORS = {
  cancer: colors.green400,
  dementia: colors.gold,
  cardiovascular: colors.oceanDeep,
  respiratory: colors.peach,
} as const;

export const CITY_CONFIGS: Record<City, CityConfig> = {
  london: {
    id: 'london',
    label: 'London',
    lat: 51.505,
    lng: -0.09,
    badgeStyle: 'badgeGreen',
    accentColor: colors.green400,
    demographics: [
      {
        label: 'Ethnicity',
        key: 'ethnicity',
        majorityLabel: 'White',
        minorityLabel: 'Black',
        majorityPct: 0.80,
        minorityPct: 0.20,
        majorityColor: colors.green200,
        minorityColor: colors.green500,
      },
      {
        label: 'Gender',
        key: 'gender',
        majorityLabel: 'Male',
        minorityLabel: 'Female',
        majorityPct: 0.60,
        minorityPct: 0.40,
        majorityColor: colors.ocean,
        minorityColor: colors.oceanDeep,
      },
      {
        label: 'SES',
        key: 'SES',
        majorityLabel: 'High Income',
        minorityLabel: 'Low Income',
        majorityPct: 0.90,
        minorityPct: 0.10,
        majorityColor: colors.peach,
        minorityColor: colors.gold,
      },
    ],
    diseases: [
      { label: 'Cancer', pct: 0.534, color: DISEASE_COLORS.cancer },
      { label: 'Dementia / Neuro', pct: 0.246, color: DISEASE_COLORS.dementia },
      { label: 'Cardiovascular', pct: 0.220, color: DISEASE_COLORS.cardiovascular },
    ],
  },

  edinburgh: {
    id: 'edinburgh',
    label: 'Edinburgh',
    lat: 55.953,
    lng: -3.19,
    badgeStyle: 'badgeOcean',
    accentColor: colors.oceanDeep,
    demographics: [
      {
        label: 'Ethnicity',
        key: 'ethnicity',
        majorityLabel: 'White',
        minorityLabel: 'Black',
        majorityPct: 0.90,
        minorityPct: 0.10,
        majorityColor: colors.green200,
        minorityColor: colors.green500,
      },
      {
        label: 'Gender',
        key: 'gender',
        majorityLabel: 'Male',
        minorityLabel: 'Female',
        majorityPct: 0.40,
        minorityPct: 0.60,
        majorityColor: colors.ocean,
        minorityColor: colors.oceanDeep,
      },
      {
        label: 'SES',
        key: 'SES',
        majorityLabel: 'High Income',
        minorityLabel: 'Low Income',
        majorityPct: 0.90,
        minorityPct: 0.10,
        majorityColor: colors.peach,
        minorityColor: colors.gold,
      },
    ],
    diseases: [
      { label: 'Cancer', pct: 0.543, color: DISEASE_COLORS.cancer },
      { label: 'Cardiovascular', pct: 0.239, color: DISEASE_COLORS.cardiovascular },
      { label: 'Respiratory', pct: 0.217, color: DISEASE_COLORS.respiratory },
    ],
  },

  dublin: {
    id: 'dublin',
    label: 'Dublin',
    lat: 53.35,
    lng: -6.08,
    badgeStyle: 'badgePeach',
    accentColor: colors.gold,
    demographics: [
      {
        label: 'Ethnicity',
        key: 'ethnicity',
        majorityLabel: 'White',
        minorityLabel: 'Black',
        majorityPct: 0.90,
        minorityPct: 0.10,
        majorityColor: colors.green200,
        minorityColor: colors.green500,
      },
      {
        label: 'Gender',
        key: 'gender',
        majorityLabel: 'Male',
        minorityLabel: 'Female',
        majorityPct: 0.50,
        minorityPct: 0.50,
        majorityColor: colors.ocean,
        minorityColor: colors.oceanDeep,
      },
      {
        label: 'SES',
        key: 'SES',
        majorityLabel: 'High Income',
        minorityLabel: 'Low Income',
        majorityPct: 0.80,
        minorityPct: 0.20,
        majorityColor: colors.peach,
        minorityColor: colors.gold,
      },
    ],
    diseases: [
      { label: 'Cancer', pct: 0.425, color: DISEASE_COLORS.cancer },
      { label: 'Cardiovascular', pct: 0.397, color: DISEASE_COLORS.cardiovascular },
      { label: 'Respiratory', pct: 0.178, color: DISEASE_COLORS.respiratory },
    ],
  },
};
