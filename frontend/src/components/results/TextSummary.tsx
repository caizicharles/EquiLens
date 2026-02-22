import { motion } from 'framer-motion';
import type { City } from '../../store';
import type { AnalysisMode } from '../../data/analysis';
import { getAnalysis, getCrossCityAnalysis } from '../../data/analysis';
import { renderAnalysisText } from './renderAnalysisText';
import { colors, typography, spacing, radii, components } from '../../style';

interface Props {
  city?: City;
  isCompare?: boolean;
  mode: AnalysisMode;
}

export default function TextSummary({ city, isCompare = false, mode }: Props) {
  const section = isCompare
    ? getCrossCityAnalysis(mode)
    : city
      ? getAnalysis(city, mode)
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
          fontFamily: typography.display,
          fontWeight: 700,
          fontSize: 13,
          color: colors.green500,
          display: 'block',
          marginBottom: spacing.xs,
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
