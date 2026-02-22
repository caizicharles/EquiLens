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
  compact?: boolean;
}

export default function DiseaseAccuracyChart({ diseases, aggregate, compact = false }: Props) {
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ height: '100%' }}
    >
      <ResponsiveContainer width="100%" height={compact ? '100%' : 200}>
        <BarChart
          data={chartData}
          margin={compact
            ? { top: 14, right: 4, bottom: 2, left: 4 }
            : { top: 20, right: 8, bottom: 4, left: 8 }
          }
        >
          <XAxis
            dataKey="name"
            tick={{
              fontFamily: typography.body,
              fontSize: compact ? 9 : 11,
              fill: colors.inkMuted,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[50, 100]}
            ticks={[50, 70, 90, 100]}
            tick={{
              fontFamily: typography.mono,
              fontSize: compact ? 8 : 10,
              fill: colors.inkLight,
            }}
            tickFormatter={(v: number) => `${v}%`}
            axisLine={false}
            tickLine={false}
            width={compact ? 30 : 40}
          />
          <ReferenceLine
            y={+(aggregate.accuracy * 100).toFixed(1)}
            stroke={colors.inkLight}
            strokeDasharray="6 3"
            strokeWidth={1}
          />
          <Bar dataKey="accuracy" radius={[4, 4, 0, 0]} barSize={compact ? 28 : 40}>
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
                fontSize: compact ? 8 : 10,
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
