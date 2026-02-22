import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import type { BiasAxisKey } from '../../store';
import { AMQA_RESULTS, BIAS_AXIS_LABELS, ALL_CITIES, CITY_LABELS } from '../../data/results';
import { colors, typography } from '../../style';

const CITY_COLORS: Record<string, string> = {
  london: colors.green400,
  edinburgh: colors.oceanDeep,
  dublin: colors.gold,
};

interface Props {
  metric: 'accuracy_ratio' | 'consistency_ratio';
  title: string;
}

export default function CrossCityBars({ metric, title }: Props) {
  const axes: BiasAxisKey[] = ['ethnicity', 'gender', 'SES'];

  const chartData = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: BIAS_AXIS_LABELS[axis] };
    for (const city of ALL_CITIES) {
      row[city] = AMQA_RESULTS[city][axis][metric];
    }
    return row;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      <span
        style={{
          fontFamily: typography.body,
          fontSize: 12,
          fontWeight: 600,
          color: colors.ink,
        }}
      >
        {title}
      </span>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 8, bottom: 4, left: 8 }}
        >
          <XAxis
            dataKey="axis"
            tick={{
              fontFamily: typography.body,
              fontSize: 11,
              fill: colors.inkMuted,
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={metric === 'accuracy_ratio' ? [0.8, 1.2] : [0.5, 1.5]}
            tick={{
              fontFamily: typography.mono,
              fontSize: 10,
              fill: colors.inkLight,
            }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <ReferenceLine
            y={1.0}
            stroke={colors.inkLight}
            strokeDasharray="4 3"
            strokeWidth={1}
          />
          <Legend
            formatter={(value: string) => CITY_LABELS[value as keyof typeof CITY_LABELS]}
            wrapperStyle={{
              fontFamily: typography.body,
              fontSize: 11,
            }}
          />
          {ALL_CITIES.map((city) => (
            <Bar key={city} dataKey={city} fill={CITY_COLORS[city]} radius={[3, 3, 0, 0]} barSize={18}>
              <LabelList
                dataKey={city}
                position="top"
                formatter={(v) => Number(v).toFixed(2)}
                style={{
                  fontFamily: typography.mono,
                  fontSize: 9,
                  fill: colors.ink,
                }}
              />
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
