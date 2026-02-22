import type { City, BiasAxisKey } from '../store';

// ---------------------------------------------------------------------------
// AMQA Types & Data
// ---------------------------------------------------------------------------

export interface AMQAMetrics {
  baseline_accuracy: number;
  city_accuracy: number;
  accuracy_ratio: number;
  consistency_ratio: number;
}

export type CityAMQAResults = Record<BiasAxisKey, AMQAMetrics>;

export const AMQA_RESULTS: Record<City, CityAMQAResults> = {
  london: {
    ethnicity: {
      baseline_accuracy: 0.9,
      city_accuracy: 1.0,
      accuracy_ratio: 1.1111,
      consistency_ratio: 0.875,
    },
    gender: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
    },
    SES: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
    },
  },
  edinburgh: {
    ethnicity: {
      baseline_accuracy: 0.9,
      city_accuracy: 1.0,
      accuracy_ratio: 1.1111,
      consistency_ratio: 0.8889,
    },
    gender: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.2,
    },
    SES: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
    },
  },
  dublin: {
    ethnicity: {
      baseline_accuracy: 0.9,
      city_accuracy: 1.0,
      accuracy_ratio: 1.1111,
      consistency_ratio: 0.8889,
    },
    gender: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
    },
    SES: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
    },
  },
};

// ---------------------------------------------------------------------------
// MedMCQA Types & Data
// ---------------------------------------------------------------------------

export interface DiseaseMetrics {
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  n_valid: number;
  composition: number;
}

export interface AggregateMetrics {
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  n_valid: number;
  n_samples: number;
}

export interface CityMedMCQAResults {
  aggregate: AggregateMetrics;
  diseases: Record<string, DiseaseMetrics>;
}

export const MEDMCQA_RESULTS: Record<City, CityMedMCQAResults> = {
  london: {
    aggregate: {
      accuracy: 0.8980,
      precision_macro: 0.8982,
      recall_macro: 0.8981,
      f1_macro: 0.8976,
      n_valid: 98,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 0.9811,
        precision_macro: 0.9722,
        recall_macro: 0.9833,
        f1_macro: 0.9767,
        n_valid: 53,
        composition: 0.534,
      },
      Cardiovascular: {
        accuracy: 0.9524,
        precision_macro: 0.9556,
        recall_macro: 0.9524,
        f1_macro: 0.9524,
        n_valid: 21,
        composition: 0.220,
      },
      'Dementia / Neuro': {
        accuracy: 0.6667,
        precision_macro: 0.6600,
        recall_macro: 0.6667,
        f1_macro: 0.6600,
        n_valid: 24,
        composition: 0.246,
      },
    },
  },
  edinburgh: {
    aggregate: {
      accuracy: 0.9400,
      precision_macro: 0.9370,
      recall_macro: 0.9400,
      f1_macro: 0.9370,
      n_valid: 100,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 0.9615,
        precision_macro: 0.9590,
        recall_macro: 0.9615,
        f1_macro: 0.9590,
        n_valid: 52,
        composition: 0.543,
      },
      Cardiovascular: {
        accuracy: 0.9615,
        precision_macro: 0.9530,
        recall_macro: 0.9615,
        f1_macro: 0.9530,
        n_valid: 26,
        composition: 0.239,
      },
      Respiratory: {
        accuracy: 0.8636,
        precision_macro: 0.8900,
        recall_macro: 0.8636,
        f1_macro: 0.8900,
        n_valid: 22,
        composition: 0.217,
      },
    },
  },
  dublin: {
    aggregate: {
      accuracy: 0.8500,
      precision_macro: 0.8260,
      recall_macro: 0.8500,
      f1_macro: 0.8260,
      n_valid: 100,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 0.8837,
        precision_macro: 0.8520,
        recall_macro: 0.8837,
        f1_macro: 0.8520,
        n_valid: 43,
        composition: 0.425,
      },
      Cardiovascular: {
        accuracy: 0.8537,
        precision_macro: 0.8360,
        recall_macro: 0.8537,
        f1_macro: 0.8360,
        n_valid: 41,
        composition: 0.397,
      },
      Respiratory: {
        accuracy: 0.7500,
        precision_macro: 0.7290,
        recall_macro: 0.7500,
        f1_macro: 0.7290,
        n_valid: 16,
        composition: 0.178,
      },
    },
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const BIAS_AXIS_LABELS: Record<BiasAxisKey, string> = {
  ethnicity: 'Ethnicity',
  gender: 'Gender',
  SES: 'SES',
};

export const CITY_LABELS: Record<City, string> = {
  london: 'London',
  edinburgh: 'Edinburgh',
  dublin: 'Dublin',
};

export const ALL_CITIES: City[] = ['london', 'edinburgh', 'dublin'];
