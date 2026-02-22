import { motion } from 'framer-motion';
import type { AggregateMetrics } from '../../data/results';
import { colors, typography, radii, shadows, spacing } from '../../style';

interface Props {
  aggregate: AggregateMetrics;
}

function valueColor(pct: number): string {
  if (pct >= 0.90) return colors.green400;
  if (pct >= 0.80) return colors.gold;
  return colors.alertRed;
}

const METRIC_ITEMS: { key: keyof AggregateMetrics; label: string }[] = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'precision_macro', label: 'Precision' },
  { key: 'recall_macro', label: 'Recall' },
  { key: 'f1_macro', label: 'F1 Score' },
];

export default function AggregateCards({ aggregate }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: spacing.sm,
      }}
    >
      {METRIC_ITEMS.map((item, i) => {
        const val = aggregate[item.key] as number;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: radii.md,
              padding: `${spacing.md}px ${spacing.sm}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              boxShadow: shadows.subtle,
            }}
          >
            <span
              style={{
                fontFamily: typography.body,
                fontWeight: 500,
                fontSize: 10,
                color: colors.inkMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              {item.label}
            </span>
            <span
              style={{
                fontFamily: typography.mono,
                fontWeight: 600,
                fontSize: 22,
                color: valueColor(val),
                lineHeight: 1,
              }}
            >
              {(val * 100).toFixed(1)}%
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
