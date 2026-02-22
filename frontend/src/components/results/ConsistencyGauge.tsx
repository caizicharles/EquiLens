import { motion } from 'framer-motion';
import type { BiasAxisKey } from '../../store';
import type { AMQAMetrics } from '../../data/results';
import { BIAS_AXIS_LABELS } from '../../data/results';
import { colors, typography, spacing, radii } from '../../style';

interface Props {
  data: Partial<Record<BiasAxisKey, AMQAMetrics>>;
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
}: {
  axisKey: BiasAxisKey;
  metrics: AMQAMetrics;
  delay: number;
}) {
  const ratio = metrics.consistency_ratio;
  const pct = ((ratio - 0.5) / (1.5 - 0.5)) * 100; // map 0.5–1.5 to 0–100%
  const clampedPct = Math.max(2, Math.min(98, pct));
  const dotColor = gaugeColor(ratio);
  const badge = biasLabel(ratio);
  const isNotable = Math.abs(ratio - 1.0) >= 0.15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span
          style={{
            fontFamily: typography.body,
            fontSize: 12,
            fontWeight: 500,
            color: colors.ink,
          }}
        >
          {BIAS_AXIS_LABELS[axisKey]}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 12,
              fontWeight: 600,
              color: dotColor,
            }}
          >
            {ratio.toFixed(4)}
          </span>
          <span
            style={{
              fontFamily: typography.body,
              fontSize: 10,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: radii.pill,
              background:
                badge.color === colors.oceanDeep
                  ? colors.oceanLight
                  : badge.color === colors.alertAmber
                    ? 'rgba(212, 160, 60, 0.15)'
                    : 'rgba(196, 92, 74, 0.15)',
              color: badge.color,
            }}
          >
            {badge.text}
          </span>
        </div>
      </div>

      {/* Gauge track */}
      <div style={{ position: 'relative', height: 20 }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: colors.surfaceMuted,
          }}
        />
        {/* Center line */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            width: 1,
            height: 12,
            background: colors.inkLight,
            opacity: 0.4,
          }}
        />
        {/* Marker dot */}
        <motion.div
          initial={{ left: '50%' }}
          animate={{ left: `${clampedPct}%` }}
          transition={{ duration: 0.6, delay: delay + 0.15, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            top: 4,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: dotColor,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: `0 0 8px ${dotColor}44`,
            transform: 'translateX(-50%)',
          }}
        />
        {/* Scale labels */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 8,
              color: colors.inkLight,
              opacity: 0.6,
            }}
          >
            0.5
          </span>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 8,
              color: colors.inkLight,
              opacity: 0.6,
            }}
          >
            1.5
          </span>
        </div>
      </div>

      {/* Axis labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: -2,
        }}
      >
        <span style={{ fontFamily: typography.body, fontSize: 9, color: colors.inkLight }}>
          Minority-favored
        </span>
        <span style={{ fontFamily: typography.body, fontSize: 9, color: colors.inkLight }}>
          Majority-favored
        </span>
      </div>

      {/* Notable badge */}
      {isNotable && (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: radii.pill,
            background: 'rgba(212, 160, 60, 0.12)',
            border: '1px solid rgba(212, 160, 60, 0.3)',
          }}
        >
          <span style={{ fontSize: 10 }}>&#9888;</span>
          <span
            style={{
              fontFamily: typography.body,
              fontSize: 10,
              fontWeight: 600,
              color: colors.alertAmber,
            }}
          >
            Bias Signal Detected
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function ConsistencyGauge({ data }: Props) {
  const entries = Object.entries(data) as [BiasAxisKey, AMQAMetrics][];
  if (entries.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
      {entries.map(([key, metrics], i) => (
        <GaugeRow key={key} axisKey={key} metrics={metrics} delay={i * 0.05} />
      ))}
    </div>
  );
}
