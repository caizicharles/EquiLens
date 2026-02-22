import { motion } from 'framer-motion';
import { colors, typography, spacing, radii } from '../../style';

export default function VerdictSection() {
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
          border: '1px solid rgba(196, 92, 74, 0.2)',
          borderRadius: radii.md,
          padding: `${spacing.sm}px ${spacing.md}px`,
        }}
      >
        <span
          style={{
            fontFamily: typography.body,
            fontWeight: 700,
            fontSize: 12,
            color: '#fff',
            background: colors.alertRed,
            borderRadius: radii.pill,
            padding: '4px 14px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          Not Recommended for Clinical Deployment
        </span>
        <span
          style={{
            fontFamily: typography.body,
            fontSize: 11,
            color: colors.inkMuted,
          }}
        >
          Model performance falls below 90% safety threshold in multiple disease categories
          and cities.
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
        Recommendation: The model requires targeted retraining on underrepresented disease
        categories — particularly neurological and respiratory conditions — before clinical
        deployment. Regional calibration using city-specific disease prevalence data is
        advised before scaling to new geographic areas.
      </p>
    </motion.div>
  );
}
