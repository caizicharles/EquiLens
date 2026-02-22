import { motion } from 'framer-motion';
import type { BiasAxisKey } from '../../store';
import type { AMQAMetrics } from '../../data/results';
import { BIAS_AXIS_LABELS } from '../../data/results';
import { colors, typography, spacing, radii } from '../../style';

interface Props {
  data: Partial<Record<BiasAxisKey, AMQAMetrics>>;
  compact?: boolean;
}

function gaugeColor(ratio: number): string {
  const dist = Math.abs(ratio - 1.0);
  if (dist < 0.02) return colors.green400;
  if (dist < 0.15) return colors.alertAmber;
  return colors.alertRed;
}

function biasLabel(ratio: number): { text: string; color: string } {
  if (Math.abs(ratio - 1.0) < 0.02) return { text: 'Equal', color: colors.oceanDeep };
  if (ratio > 1.0) return { text: 'Majority-biased', color: colors.alertAmber };
  return { text: 'Minority-biased', color: colors.alertAmber };
}

function GaugeRow({
  axisKey,
  metrics,
  delay,
  compact,
}: {
  axisKey: BiasAxisKey;
  metrics: AMQAMetrics;
  delay: number;
  compact: boolean;
}) {
  const ratio = metrics.consistency_ratio;
  const pct = ((ratio - 0.5) / (1.5 - 0.5)) * 100;
  const clampedPct = Math.max(2, Math.min(98, pct));
  const dotColor = gaugeColor(ratio);
  const badge = biasLabel(ratio);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      style={{ display: 'flex', flexDirection: 'column', gap: compact ? spacing.xs : spacing.sm }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: typography.body,
            fontSize: compact ? 10 : 12,
            fontWeight: 500,
            color: colors.ink,
          }}
        >
          {BIAS_AXIS_LABELS[axisKey]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: compact ? 10 : 12,
              fontWeight: 600,
              color: dotColor,
            }}
          >
            {ratio.toFixed(2)}
          </span>
          <span
            style={{
              fontFamily: typography.body,
              fontSize: compact ? 8 : 10,
              fontWeight: 500,
              padding: compact ? '1px 5px' : '2px 8px',
              borderRadius: radii.pill,
              background:
                badge.color === colors.oceanDeep
                  ? colors.oceanLight
                  : badge.color === colors.alertAmber
                    ? `${colors.alertAmber}26`
                    : `${colors.alertRed}26`,
              color: badge.color,
            }}
          >
            {badge.text}
          </span>
        </div>
      </div>

      {/* Gauge track */}
      <div style={{ position: 'relative', height: compact ? 14 : 20 }}>
        <div
          style={{
            position: 'absolute',
            top: compact ? 5 : 8,
            left: 0,
            right: 0,
            height: compact ? 3 : 4,
            borderRadius: 2,
            background: colors.surfaceMuted,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: compact ? 2 : 4,
            left: '50%',
            width: 1,
            height: compact ? 9 : 12,
            background: colors.inkLight,
            opacity: 0.4,
          }}
        />
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${clampedPct}%` }}
          transition={{ duration: 0.5, delay: delay + 0.1, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: compact ? 2 : 4,
            width: compact ? 9 : 12,
            height: compact ? 9 : 12,
            borderRadius: '50%',
            background: dotColor,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: `0 0 6px ${dotColor}44`,
            transform: 'translateX(-50%)',
          }}
        />
      </div>
    </motion.div>
  );
}

export default function ConsistencyGauge({ data, compact = false }: Props) {
  const entries = Object.entries(data) as [BiasAxisKey, AMQAMetrics][];
  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
      <span
        style={{
          fontFamily: typography.body,
          fontSize: compact ? 10 : 11,
          fontWeight: 500,
          color: colors.inkMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Consistency Ratio
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? spacing.xs : spacing.md }}>
        {entries.map(([key, metrics], i) => (
          <GaugeRow key={key} axisKey={key} metrics={metrics} delay={i * 0.03} compact={compact} />
        ))}
      </div>
    </div>
  );
}
