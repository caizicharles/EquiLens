import { motion } from 'framer-motion';
import type { City, BiasAxisKey } from '../../store';
import { AMQA_RESULTS, MEDMCQA_RESULTS } from '../../data/results';
import type { AMQAMetrics } from '../../data/results';
import AccuracyRatioChart from './AccuracyRatioChart';
import ConsistencyGauge from './ConsistencyGauge';
import AggregateCards from './AggregateCards';
import DiseaseAccuracyChart from './DiseaseAccuracyChart';
import TextSummary from './TextSummary';
import { colors, typography, spacing } from '../../style';

interface Props {
  city: City;
  enabledAxes: Record<BiasAxisKey, boolean>;
  enabledDisease: boolean;
}

export default function CityResultsTab({ city, enabledAxes, enabledDisease }: Props) {
  const amqa = AMQA_RESULTS[city];
  const medmcqa = MEDMCQA_RESULTS[city];

  const filteredAMQA: Partial<Record<BiasAxisKey, AMQAMetrics>> = {};
  for (const [key, enabled] of Object.entries(enabledAxes)) {
    if (enabled) {
      filteredAMQA[key as BiasAxisKey] = amqa[key as BiasAxisKey];
    }
  }

  const hasAMQA = Object.keys(filteredAMQA).length > 0;

  if (!hasAMQA && !enabledDisease) {
    return (
      <div
        style={{
          padding: spacing.xxl,
          textAlign: 'center',
          fontFamily: typography.body,
          color: colors.inkLight,
          fontSize: 14,
        }}
      >
        No axes or disease toggles enabled. Go back to sandbox to configure.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, height: '100%' }}>
      {/* Text Summary */}
      <TextSummary city={city} />

      {/* Charts section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm, minHeight: 0 }}>
        {/* Row 1: Accuracy Ratio (left) + Consistency Gauges (right) */}
        {hasAMQA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', gap: spacing.sm, flex: '0 0 auto' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <AccuracyRatioChart data={filteredAMQA} compact />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ConsistencyGauge data={filteredAMQA} compact />
            </div>
          </motion.div>
        )}

        {/* Row 2: Aggregate Cards 2x2 (left ~38%) + Disease Accuracy Bars (right ~62%) */}
        {enabledDisease && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ display: 'flex', gap: spacing.sm, flex: 1, minHeight: 0 }}
          >
            <div style={{ flex: '0 0 38%', minWidth: 0 }}>
              <AggregateCards aggregate={medmcqa.aggregate} compact />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <DiseaseAccuracyChart
                diseases={medmcqa.diseases}
                aggregate={medmcqa.aggregate}
                compact
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
