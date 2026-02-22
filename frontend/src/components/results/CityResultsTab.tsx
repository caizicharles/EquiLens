import { motion } from 'framer-motion';
import type { City } from '../../store';
import type { ModelId } from '../../data/models';
import type { AnalysisMode } from '../../data/analysis';
import { getAMQAResults, getMedMCQAResults } from '../../data/results';
import AccuracyRatioChart from './AccuracyRatioChart';
import ConsistencyGauge from './ConsistencyGauge';
import AggregateCards from './AggregateCards';
import DiseaseAccuracyChart from './DiseaseAccuracyChart';
import TextSummary from './TextSummary';
import TrendsPatterns from './TrendsPatterns';
import VerdictSection from './VerdictSection';
import { colors, typography, spacing } from '../../style';

interface Props {
  city: City;
  model: ModelId;
  enabledDemographics: boolean;
  enabledDisease: boolean;
  mode: AnalysisMode;
}

export default function CityResultsTab({ city, model, enabledDemographics, enabledDisease, mode }: Props) {
  const amqa = getAMQAResults(model)[city];
  const medmcqa = getMedMCQAResults(model)[city];

  if (!enabledDemographics && !enabledDisease) {
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
        No toggles enabled. Go back to sandbox to configure.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, height: '100%' }}>
      {/* Text Summary */}
      <TextSummary city={city} mode={mode} />

      {/* Charts section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm, minHeight: 0 }}>
        {/* Row 1: Accuracy Ratio (left) + Consistency Gauges (right) */}
        {enabledDemographics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', gap: spacing.sm, flex: '0 0 auto' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <AccuracyRatioChart data={amqa} compact />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <ConsistencyGauge data={amqa} compact />
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

      {/* Findings */}
      <TrendsPatterns city={city} mode={mode} />

      {/* Verdict + Recommendation */}
      <VerdictSection city={city} mode={mode} />
    </div>
  );
}
