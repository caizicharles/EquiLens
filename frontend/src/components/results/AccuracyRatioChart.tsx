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
}

function ratioColor(ratio: number): string {
  if (ratio > 1.05) return colors.green400;
  if (ratio < 0.95) return colors.alertRed;
  return colors.oceanDeep;
}

export default function AccuracyRatioChart({ data }: Props) {
  const chartData = (Object.entries(data) as [BiasAxisKey, AMQAMetrics][]).map(
    ([key, m]) => ({
      axis: BIAS_AXIS_LABELS[key],
      ratio: m.accuracy_ratio,
      color: ratioColor(m.accuracy_ratio),
    }),
  );

  if (chartData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ResponsiveContainer width="100%" height={40 + chartData.length * 36}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 56, bottom: 4, left: 72 }}
        >
          <XAxis
            type="number"
            domain={[0.8, 1.2]}
            ticks={[0.8, 0.9, 1.0, 1.1, 1.2]}
            tick={{
              fontFamily: typography.mono,
              fontSize: 10,
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
              fontSize: 12,
              fontWeight: 500,
              fill: colors.inkMuted,
            }}
            axisLine={false}
            tickLine={false}
            width={68}
          />
          <ReferenceLine
            x={1.0}
            stroke={colors.inkLight}
            strokeDasharray="4 3"
            strokeWidth={1}
            label={{
              value: 'No Effect',
              position: 'top',
              style: {
                fontFamily: typography.mono,
                fontSize: 9,
                fill: colors.inkLight,
              },
            }}
          />
          <Bar dataKey="ratio" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
            <LabelList
              dataKey="ratio"
              position="right"
              formatter={(v) => Number(v).toFixed(4)}
              style={{
                fontFamily: typography.mono,
                fontSize: 10,
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
