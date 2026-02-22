import { motion } from 'framer-motion';
import { colors, typography, spacing, radii } from '../../style';

type Tone = 'good' | 'concern' | 'notable';

function Val({ children, tone }: { children: React.ReactNode; tone: Tone }) {
  const bg =
    tone === 'good'
      ? colors.green50
      : tone === 'concern'
        ? 'rgba(196, 92, 74, 0.10)'
        : 'rgba(232, 200, 122, 0.15)';
  const color =
    tone === 'good'
      ? colors.green600
      : tone === 'concern'
        ? colors.alertRed
        : colors.ink;

  return (
    <span
      style={{
        fontFamily: typography.mono,
        fontWeight: 600,
        fontSize: 11,
        background: bg,
        color,
        borderRadius: radii.sm,
        padding: '1px 5px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

export default function TrendsPatterns() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        background: colors.green50,
        borderLeft: `4px solid ${colors.green400}`,
        borderRadius: `0 ${radii.md}px ${radii.md}px 0`,
        padding: `${spacing.sm}px ${spacing.md}px`,
      }}
    >
      <span
        style={{
          fontFamily: typography.body,
          fontWeight: 600,
          fontSize: 12,
          color: colors.green600,
          display: 'block',
          marginBottom: 4,
        }}
      >
        Key Trends &amp; Patterns
      </span>
      <p
        style={{
          fontFamily: typography.body,
          fontSize: 11,
          lineHeight: 1.55,
          color: colors.ink,
          margin: 0,
        }}
      >
        Demographic framing has <Val tone="good">minimal impact on accuracy</Val> across
        all three cities, suggesting the model handles adversarial demographic context
        well. However, <Val tone="concern">response consistency varies by gender framing</Val>{' '}
        in Edinburgh, where the model changes its answer more frequently for female-framed
        questions. Disease performance correlates with{' '}
        <Val tone="notable">training data representation</Val> — conditions with higher
        prevalence in training data (cancer:{' '}
        <Val tone="good">96–98% accuracy</Val>) significantly outperform rarer conditions
        (dementia: <Val tone="concern">66.7%</Val>, respiratory:{' '}
        <Val tone="concern">75–86%</Val>). This pattern suggests{' '}
        <Val tone="concern">data imbalance</Val> rather than fundamental reasoning failures.
      </p>
    </motion.div>
  );
}
