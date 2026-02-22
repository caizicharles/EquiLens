import { motion } from 'framer-motion';
import type { City } from '../../store';
import type { AnalysisMode } from '../../data/analysis';
import {
  getAnalysis,
  parseVerdictStatus,
  verdictBadgeLabel,
  stripVerdictPrefix,
} from '../../data/analysis';
import { renderAnalysisText } from './renderAnalysisText';
import { renderMetrics } from './renderAnalysisText';
import { colors, typography, spacing, radii } from '../../style';

interface Props {
  city: City;
  mode: AnalysisMode;
}

export default function VerdictSection({ city, mode }: Props) {
  const section = getAnalysis(city, mode);
  if (!section.verdict) return null;

  const status = parseVerdictStatus(section.verdict);
  const verdictText = stripVerdictPrefix(section.verdict);

  const badgeBg =
    status === 'recommended'
      ? colors.alertGreen
      : status === 'conditional'
        ? colors.alertAmber
        : colors.alertRed;

  const borderColor =
    status === 'recommended'
      ? `${colors.alertGreen}33`
      : status === 'conditional'
        ? `${colors.alertAmber}33`
        : `${colors.alertRed}33`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}
    >
      {/* Verdict card */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.7)',
          border: `1px solid ${borderColor}`,
          borderRadius: radii.md,
          padding: `${spacing.sm}px ${spacing.md}px`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.sm,
            marginBottom: spacing.xs,
          }}
        >
          <span
            style={{
              fontFamily: typography.display,
              fontWeight: 700,
              fontSize: 13,
              color: colors.ink,
              flexShrink: 0,
            }}
          >
            Verdict
          </span>
          <span
            style={{
              fontFamily: typography.body,
              fontWeight: 700,
              fontSize: 11,
              color: '#fff',
              background: badgeBg,
              borderRadius: radii.pill,
              padding: `${spacing.xs}px ${spacing.md}px`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {verdictBadgeLabel(status)}
          </span>
        </div>
        <p
          style={{
            fontFamily: typography.body,
            fontSize: 11,
            color: colors.inkMuted,
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          {renderMetrics(verdictText)}
        </p>
      </div>

      {/* Recommendation */}
      <div>
        <span
          style={{
            fontFamily: typography.display,
            fontWeight: 700,
            fontSize: 13,
            color: colors.ink,
            display: 'block',
            marginBottom: spacing.xs,
          }}
        >
          Recommendation
        </span>
        {renderAnalysisText(section.recommendation, {
          fontFamily: typography.body,
          fontSize: 11,
          fontStyle: 'italic',
          color: colors.inkMuted,
          lineHeight: 1.5,
        })}
      </div>
    </motion.div>
  );
}
