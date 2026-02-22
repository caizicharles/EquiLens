import { motion } from 'framer-motion';
import CrossCityBars from './CrossCityBars';
import CrossCityTable from './CrossCityTable';
import { colors, typography, spacing } from '../../style';

export default function CompareAllTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xl }}>
      {/* Section C: Cross-City Accuracy Comparison */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: typography.body,
              fontWeight: 600,
              fontSize: 14,
              color: colors.ink,
            }}
          >
            Cross-City Bias Comparison (AMQA)
          </span>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 11,
              color: colors.inkLight,
            }}
          >
            All three cities, N=10 questions, seed=42
          </span>
        </div>

        <CrossCityBars metric="accuracy_ratio" title="Accuracy Ratio by City" />

        <div style={{ height: 1, background: colors.borderLight, margin: `${spacing.sm}px 0` }} />

        <CrossCityBars metric="consistency_ratio" title="Consistency Ratio by City" />
      </motion.div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.borderLight }} />

      {/* Section E: Cross-City Disease Performance */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span
            style={{
              fontFamily: typography.body,
              fontWeight: 600,
              fontSize: 14,
              color: colors.ink,
            }}
          >
            Cross-City Disease Performance (MedMCQA)
          </span>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 11,
              color: colors.inkLight,
            }}
          >
            N=100 questions per city
          </span>
        </div>

        <CrossCityTable />
      </motion.div>
    </div>
  );
}
