import { motion } from 'framer-motion';
import type { ModelId } from '../../data/models';
import type { AnalysisMode } from '../../data/analysis';
import CrossCityBars from './CrossCityBars';
import CrossCityTable from './CrossCityTable';
import TextSummary from './TextSummary';
import TrendsPatterns from './TrendsPatterns';
import { spacing } from '../../style';

interface Props {
  model: ModelId;
  mode: AnalysisMode;
}

export default function CompareAllTab({ model, mode }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, height: '100%' }}>
      {/* Text Summary */}
      <TextSummary isCompare mode={mode} />

      {/* Charts section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: spacing.sm, minHeight: 0 }}>
        {/* Row 1: Accuracy bars (left) + Consistency bars (right) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', gap: spacing.sm, flex: 1, minHeight: 0 }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <CrossCityBars metric="accuracy_ratio" title="Accuracy Ratio by City" model={model} compact />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <CrossCityBars metric="consistency_ratio" title="Consistency Ratio by City" model={model} compact />
          </div>
        </motion.div>

        {/* Row 2: Cross-City Disease Performance Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{ flex: '0 0 auto' }}
        >
          <CrossCityTable model={model} compact />
        </motion.div>
      </div>

      {/* Findings (no verdict for cross-city) */}
      <TrendsPatterns isCompare mode={mode} />
    </div>
  );
}
