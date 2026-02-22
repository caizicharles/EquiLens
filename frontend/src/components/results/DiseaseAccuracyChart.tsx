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
import type { DiseaseMetrics, AggregateMetrics } from '../../data/results';
import { colors, typography, chartColors } from '../../style';

interface Props {
  diseases: Record<string, DiseaseMetrics>;
  aggregate: AggregateMetrics;
}

export default function DiseaseAccuracyChart({ diseases, aggregate }: Props) {
  const diseaseColors = chartColors.secondary;
  const entries = Object.entries(diseases);

  const chartData = entries.map(([name, d], i) => ({
    name,
    accuracy: +(d.accuracy * 100).toFixed(1),
    color: diseaseColors[i % diseaseColors.length],
    flagged: d.accuracy < aggregate.accuracy - 0.10,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 8, bottom: 4, left: 8 }}
        >
          <XAxis
            dataKey="name"
            tick={{
              fontFamily: typography.body,
              fontSize: 11,
              fill: colors.inkMuted,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            ticks={[50, 60, 70, 80, 90, 100]}
            tick={{
              fontFamily: typography.mono,
              fontSize: 10,
              fill: colors.inkLight,
            }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <ReferenceLine
            y={+(aggregate.accuracy * 100).toFixed(1)}
            stroke={colors.inkLight}
            strokeDasharray="6 3"
            strokeWidth={1}
            label={{
              value: `Aggregate: ${(aggregate.accuracy * 100).toFixed(1)}%`,
              position: 'insideTopRight',
              style: {
                fontFamily: typography.mono,
                fontSize: 9,
                fill: colors.inkMuted,
              },
            }}
          />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={40}>
            {chartData.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                stroke={entry.flagged ? colors.alertRed : 'none'}
                strokeWidth={entry.flagged ? 2 : 0}
              />
            ))}
            <LabelList
              dataKey="accuracy"
              position="top"
              formatter={(v) => `${v}%`}
              style={{
                fontFamily: typography.mono,
                fontSize: 10,
                fontWeight: 600,
                fill: colors.ink,
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
