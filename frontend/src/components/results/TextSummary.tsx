import { motion } from 'framer-motion';
import type { City } from '../../store';
import type { ModelId } from '../../data/models';
import type { AnalysisMode } from '../../data/analysis';
import { getAnalysis, getCrossCityAnalysis } from '../../data/analysis';
import { renderAnalysisText } from './renderAnalysisText';
import { colors, typography, spacing, radii, components } from '../../style';

interface Props {
  city?: City;
  isCompare?: boolean;
  mode: AnalysisMode;
  model?: ModelId;
}

export default function TextSummary({ city, isCompare = false, mode, model = 'claude-sonnet-4-6' }: Props) {
  const section = isCompare
    ? getCrossCityAnalysis(mode, model)
    : city
      ? getAnalysis(city, mode, model)
      : null;

  if (!section) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        ...components.card,
        padding: `${spacing.sm}px ${spacing.md}px`,
        borderRadius: radii.md,
      }}
    >
      <span
        style={{
          fontFamily: typography.body,
          fontWeight: 600,
          fontSize: 12,
          color: colors.ink,
          display: 'block',
          marginBottom: 4,
        }}
      >
        Summary
      </span>
      {renderAnalysisText(section.summary, {
        fontFamily: typography.body,
        fontSize: 12,
        lineHeight: 1.55,
        color: colors.ink,
      })}
    </motion.div>
  );
}
