import { motion } from 'framer-motion';
import type { City } from '../../store';
import type { AnalysisMode } from '../../data/analysis';
import { getAnalysis, parseVerdictStatus, verdictBadgeLabel } from '../../data/analysis';
import { colors, typography, spacing, radii } from '../../style';

interface Props {
  city: City;
  mode: AnalysisMode;
}

export default function VerdictSection({ city, mode }: Props) {
  const section = getAnalysis(city, mode);
  if (!section.verdict) return null;

  const status = parseVerdictStatus(section.verdict);

  const badgeBg =
    status === 'recommended'
      ? colors.alertGreen
      : status === 'conditional'
        ? colors.alertAmber
        : colors.alertRed;

  const borderColor =
    status === 'recommended'
      ? 'rgba(91, 140, 80, 0.2)'
      : status === 'conditional'
        ? 'rgba(212, 160, 60, 0.2)'
        : 'rgba(196, 92, 74, 0.2)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {/* Verdict card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          background: 'rgba(255, 255, 255, 0.7)',
          border: `1px solid ${borderColor}`,
          borderRadius: radii.md,
          padding: `${spacing.sm}px ${spacing.md}px`,
        }}
      >
        <span
          style={{
            fontFamily: typography.body,
            fontWeight: 700,
            fontSize: 11,
            color: '#fff',
            background: badgeBg,
            borderRadius: radii.pill,
            padding: '4px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {verdictBadgeLabel(status)}
        </span>
        <span
          style={{
            fontFamily: typography.body,
            fontSize: 11,
            color: colors.inkMuted,
            lineHeight: 1.4,
          }}
        >
          {section.verdict}
        </span>
      </div>

      {/* Recommendation text */}
      <p
        style={{
          fontFamily: typography.body,
          fontSize: 11,
          fontStyle: 'italic',
          color: colors.inkMuted,
          opacity: 0.85,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {section.recommendation}
      </p>
    </motion.div>
  );
}
