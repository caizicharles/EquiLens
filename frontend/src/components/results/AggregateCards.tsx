import { motion } from 'framer-motion';
import type { AggregateMetrics } from '../../data/results';
import { colors, typography, radii, shadows, spacing } from '../../style';

interface Props {
  aggregate: AggregateMetrics;
  compact?: boolean;
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

export default function AggregateCards({ aggregate, compact = false }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: compact ? spacing.xs : spacing.sm,
        height: compact ? '100%' : undefined,
      }}
    >
      {METRIC_ITEMS.map((item, i) => {
        const val = aggregate[item.key] as number;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.03 }}
            style={{
              background: 'rgba(255, 255, 255, 0.6)',
              border: `1px solid ${colors.borderLight}`,
              borderRadius: radii.md,
              padding: compact ? `${spacing.xs}px ${spacing.xs}px` : `${spacing.md}px ${spacing.sm}px`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              boxShadow: shadows.subtle,
            }}
          >
            <span
              style={{
                fontFamily: typography.body,
                fontWeight: 500,
                fontSize: compact ? 8 : 10,
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
                fontSize: compact ? 16 : 22,
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
