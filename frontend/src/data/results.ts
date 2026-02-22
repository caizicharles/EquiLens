import type { City, BiasAxisKey } from '../store';
import type { ModelId } from './models';

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

const AMQA_CLAUDE: Record<City, CityAMQAResults> = {
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

const AMQA_GPT5: Record<City, CityAMQAResults> = {
  london: {
    ethnicity: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
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
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
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
  dublin: {
    ethnicity: {
      baseline_accuracy: 0.9,
      city_accuracy: 0.9,
      accuracy_ratio: 1.0,
      consistency_ratio: 1.0,
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

const AMQA_BY_MODEL: Record<ModelId, Record<City, CityAMQAResults>> = {
  'claude-sonnet-4-6': AMQA_CLAUDE,
  'gpt-5': AMQA_GPT5,
};

export function getAMQAResults(model: ModelId): Record<City, CityAMQAResults> {
  return AMQA_BY_MODEL[model];
}

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

const MEDMCQA_CLAUDE: Record<City, CityMedMCQAResults> = {
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

const MEDMCQA_GPT5: Record<City, CityMedMCQAResults> = {
  london: {
    aggregate: {
      accuracy: 0.9200,
      precision_macro: 0.9304,
      recall_macro: 0.9234,
      f1_macro: 0.9241,
      n_valid: 100,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 1.0,
        precision_macro: 1.0,
        recall_macro: 1.0,
        f1_macro: 1.0,
        n_valid: 54,
        composition: 0.5342,
      },
      Cardiovascular: {
        accuracy: 0.8636,
        precision_macro: 0.8929,
        recall_macro: 0.8944,
        f1_macro: 0.8728,
        n_valid: 22,
        composition: 0.2201,
      },
      'Dementia / Neuro': {
        accuracy: 0.7917,
        precision_macro: 0.7917,
        recall_macro: 0.7893,
        f1_macro: 0.7769,
        n_valid: 24,
        composition: 0.2458,
      },
    },
  },
  edinburgh: {
    aggregate: {
      accuracy: 0.9200,
      precision_macro: 0.9183,
      recall_macro: 0.9283,
      f1_macro: 0.9209,
      n_valid: 100,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 0.9808,
        precision_macro: 0.9792,
        recall_macro: 0.9808,
        f1_macro: 0.9791,
        n_valid: 52,
        composition: 0.5435,
      },
      Cardiovascular: {
        accuracy: 0.9231,
        precision_macro: 0.9250,
        recall_macro: 0.9083,
        f1_macro: 0.9141,
        n_valid: 26,
        composition: 0.2391,
      },
      Respiratory: {
        accuracy: 0.7727,
        precision_macro: 0.7139,
        recall_macro: 0.8667,
        f1_macro: 0.7571,
        n_valid: 22,
        composition: 0.2174,
      },
    },
  },
  dublin: {
    aggregate: {
      accuracy: 0.8900,
      precision_macro: 0.8840,
      recall_macro: 0.8814,
      f1_macro: 0.8798,
      n_valid: 100,
      n_samples: 100,
    },
    diseases: {
      Cancer: {
        accuracy: 0.9070,
        precision_macro: 0.9113,
        recall_macro: 0.9079,
        f1_macro: 0.9091,
        n_valid: 43,
        composition: 0.4247,
      },
      Cardiovascular: {
        accuracy: 0.8780,
        precision_macro: 0.8944,
        recall_macro: 0.8639,
        f1_macro: 0.8603,
        n_valid: 41,
        composition: 0.3973,
      },
      Respiratory: {
        accuracy: 0.8750,
        precision_macro: 0.8250,
        recall_macro: 0.9018,
        f1_macro: 0.8339,
        n_valid: 16,
        composition: 0.1781,
      },
    },
  },
};

const MEDMCQA_BY_MODEL: Record<ModelId, Record<City, CityMedMCQAResults>> = {
  'claude-sonnet-4-6': MEDMCQA_CLAUDE,
  'gpt-5': MEDMCQA_GPT5,
};

export function getMedMCQAResults(model: ModelId): Record<City, CityMedMCQAResults> {
  return MEDMCQA_BY_MODEL[model];
}

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
