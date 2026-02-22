import { motion } from 'framer-motion';
import type { City, BiasAxisKey } from '../../store';
import { AMQA_RESULTS, MEDMCQA_RESULTS } from '../../data/results';
import type { AMQAMetrics } from '../../data/results';
import AccuracyRatioChart from './AccuracyRatioChart';
import ConsistencyGauge from './ConsistencyGauge';
import AggregateCards from './AggregateCards';
import DiseaseAccuracyChart from './DiseaseAccuracyChart';
import DiseaseMetricsTable from './DiseaseMetricsTable';
import { colors, typography, spacing } from '../../style';

interface Props {
  city: City;
  enabledAxes: Record<BiasAxisKey, boolean>;
  enabledDisease: boolean;
}

function SectionHeader({
  title,
  subtitle,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <span
        style={{
          fontFamily: typography.body,
          fontWeight: 600,
          fontSize: 14,
          color: colors.ink,
        }}
      >
        {title}
      </span>
      <span
        style={{
          fontFamily: typography.mono,
          fontSize: 11,
          color: colors.inkLight,
        }}
      >
        {subtitle}
      </span>
    </motion.div>
  );
}

export default function CityResultsTab({ city, enabledAxes, enabledDisease }: Props) {
  const amqa = AMQA_RESULTS[city];
  const medmcqa = MEDMCQA_RESULTS[city];

  // Filter AMQA data to only enabled axes
  const filteredAMQA: Partial<Record<BiasAxisKey, AMQAMetrics>> = {};
  for (const [key, enabled] of Object.entries(enabledAxes)) {
    if (enabled) {
      filteredAMQA[key as BiasAxisKey] = amqa[key as BiasAxisKey];
    }
  }

  const hasAMQA = Object.keys(filteredAMQA).length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {/* Section A: AMQA Bias Analysis */}
      {hasAMQA && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
        >
          <SectionHeader
            title="Adversarial Bias Detection"
            subtitle="N=10 questions, seed=42"
          />

          {/* A1: Accuracy Ratio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span
              style={{
                fontFamily: typography.body,
                fontSize: 11,
                fontWeight: 500,
                color: colors.inkMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Accuracy Ratio
            </span>
            <AccuracyRatioChart data={filteredAMQA} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: colors.borderLight }} />

          {/* A2: Consistency Ratio */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontFamily: typography.body,
                fontSize: 11,
                fontWeight: 500,
                color: colors.inkMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Consistency Ratio
            </span>
            <ConsistencyGauge data={filteredAMQA} />
          </div>
        </motion.div>
      )}

      {/* Divider between sections */}
      {hasAMQA && enabledDisease && (
        <div
          style={{
            height: 1,
            background: colors.borderLight,
          }}
        />
      )}

      {/* Section B: MedMCQA Disease Performance */}
      {enabledDisease && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: spacing.lg }}
        >
          <SectionHeader
            title="Disease-Specific Performance"
            subtitle="N=100 questions per city"
            delay={0.15}
          />

          {/* B1: Aggregate Metrics Cards */}
          <AggregateCards aggregate={medmcqa.aggregate} />

          {/* B2: Disease Accuracy Bars */}
          <DiseaseAccuracyChart
            diseases={medmcqa.diseases}
            aggregate={medmcqa.aggregate}
          />

          {/* B3: Disease Metrics Table */}
          <DiseaseMetricsTable diseases={medmcqa.diseases} />
        </motion.div>
      )}

      {!hasAMQA && !enabledDisease && (
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
      )}
    </div>
  );
}
