import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Cell,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { BiasAxisKey } from '../../store';
import type { AMQAMetrics } from '../../data/results';
import { BIAS_AXIS_LABELS } from '../../data/results';
import { colors, typography } from '../../style';

interface Props {
  data: Partial<Record<BiasAxisKey, AMQAMetrics>>;
  compact?: boolean;
}

function ratioColor(ratio: number): string {
  if (ratio > 1.05) return colors.green400;
  if (ratio < 0.95) return colors.alertRed;
  return colors.oceanDeep;
}

export default function AccuracyRatioChart({ data, compact = false }: Props) {
  const chartData = (Object.entries(data) as [BiasAxisKey, AMQAMetrics][]).map(
    ([key, m]) => ({
      axis: BIAS_AXIS_LABELS[key],
      ratio: m.accuracy_ratio,
      color: ratioColor(m.accuracy_ratio),
    }),
  );

  if (chartData.length === 0) return null;

  const barHeight = compact ? 22 : 36;
  const h = compact ? Math.max(80, 28 + chartData.length * barHeight) : 40 + chartData.length * 36;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
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
        Accuracy Ratio
      </span>
      <ResponsiveContainer width="100%" height={h}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={compact
            ? { top: 2, right: 48, bottom: 2, left: 4 }
            : { top: 4, right: 56, bottom: 4, left: 72 }
          }
        >
          <XAxis
            type="number"
            domain={[0.8, 1.2]}
            ticks={[0.8, 0.9, 1.0, 1.1, 1.2]}
            tick={{
              fontFamily: typography.mono,
              fontSize: compact ? 8 : 10,
              fill: colors.inkLight,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="axis"
            tick={{
              fontFamily: typography.body,
              fontSize: compact ? 10 : 12,
              fontWeight: 500,
              fill: colors.inkMuted,
            }}
            axisLine={false}
            tickLine={false}
            width={compact ? 52 : 68}
          />
          <ReferenceLine
            x={1.0}
            stroke={colors.inkLight}
            strokeDasharray="4 3"
            strokeWidth={1}
          />
          <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={compact ? 14 : 20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="ratio"
              position="right"
              formatter={(v) => Number(v).toFixed(2)}
              style={{
                fontFamily: typography.mono,
                fontSize: compact ? 9 : 10,
                fontWeight: 500,
                fill: colors.ink,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
