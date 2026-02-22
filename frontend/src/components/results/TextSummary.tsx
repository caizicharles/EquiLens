import { motion } from 'framer-motion';
import type { City } from '../../store';
import { colors, typography, spacing, radii, components } from '../../style';

// ---------------------------------------------------------------------------
// Inline highlighted value component
// ---------------------------------------------------------------------------

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
        fontSize: 12,
        background: bg,
        color,
        borderRadius: radii.sm,
        padding: '1px 6px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// City-specific summaries
// ---------------------------------------------------------------------------

const citySummaries: Record<City, React.ReactNode> = {
  london: (
    <>
      London demonstrates strong baseline performance with{' '}
      <Val tone="notable">89.8% aggregate accuracy</Val> across disease categories.
      Adversarial bias testing reveals <Val tone="good">minimal demographic bias</Val> in
      gender and socioeconomic framing, with a slight positive effect in ethnicity-framed
      questions <Val tone="notable">accuracy ratio: 1.11</Val>. However, significant
      performance disparity exists in{' '}
      <Val tone="concern">dementia/neurological conditions at 66.7%</Val>, substantially
      below the aggregate benchmark.
    </>
  ),
  edinburgh: (
    <>
      Edinburgh achieves the highest aggregate performance at{' '}
      <Val tone="good">94.0% accuracy</Val>. Bias analysis reveals a notable{' '}
      <Val tone="concern">consistency ratio of 1.2 in gender-framed questions</Val>,
      indicating the model responds more consistently to male-framed than female-framed
      prompts. Disease-specific performance is strong across categories, with respiratory
      conditions showing the lowest performance at <Val tone="notable">86.4%</Val>.
    </>
  ),
  dublin: (
    <>
      Dublin shows the weakest overall performance at{' '}
      <Val tone="concern">85.0% aggregate accuracy</Val>. Bias detection indicates{' '}
      <Val tone="good">minimal demographic bias</Val> across all axes. Disease-specific
      analysis reveals concerning performance gaps: respiratory conditions at{' '}
      <Val tone="concern">75.0%</Val> and cancer-related questions at{' '}
      <Val tone="concern">88.4%</Val>, both below clinical deployment thresholds for
      safety-critical applications.
    </>
  ),
};

const crossCitySummary: React.ReactNode = (
  <>
    Cross-city comparison reveals significant performance variation. Edinburgh leads with{' '}
    <Val tone="good">94.0% aggregate accuracy</Val>, followed by London at{' '}
    <Val tone="notable">89.8%</Val> and Dublin at <Val tone="concern">85.0%</Val>. A{' '}
    <Val tone="concern">gender bias signal</Val> was detected in Edinburgh (consistency
    ratio <Val tone="concern">1.2</Val>). London shows a notable weakness in{' '}
    <Val tone="concern">dementia/neurological questions at 66.7%</Val>. Dublin demonstrates
    the most uniform but lowest performance across all disease categories.
  </>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  city?: City;
  isCompare?: boolean;
}

export default function TextSummary({ city, isCompare = false }: Props) {
  const content = isCompare ? crossCitySummary : city ? citySummaries[city] : null;
  if (!content) return null;

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
      <p
        style={{
          fontFamily: typography.body,
          fontSize: 12,
          lineHeight: 1.55,
          color: colors.ink,
          margin: 0,
        }}
      >
        {content}
      </p>
    </motion.div>
  );
}
