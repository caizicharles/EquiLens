import { motion } from 'framer-motion';
import type { DiseaseMetrics } from '../../data/results';
import { colors, typography, radii, spacing } from '../../style';

interface Props {
  diseases: Record<string, DiseaseMetrics>;
}

function valueColor(pct: number): string {
  if (pct >= 0.90) return colors.green400;
  if (pct >= 0.80) return colors.gold;
  return colors.alertRed;
}

const COLUMNS: { key: keyof DiseaseMetrics; label: string }[] = [
  { key: 'accuracy', label: 'Accuracy' },
  { key: 'precision_macro', label: 'Precision' },
  { key: 'recall_macro', label: 'Recall' },
  { key: 'f1_macro', label: 'F1' },
  { key: 'n_valid', label: 'N' },
];

const thStyle: React.CSSProperties = {
  fontFamily: typography.body,
  fontSize: 10,
  fontWeight: 600,
  color: colors.inkMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  padding: `${spacing.sm}px ${spacing.sm}px`,
  textAlign: 'left',
  background: colors.surfaceAlt,
};

const tdBase: React.CSSProperties = {
  fontFamily: typography.mono,
  fontSize: 12,
  padding: `${spacing.sm}px ${spacing.sm}px`,
};

export default function DiseaseMetricsTable({ diseases }: Props) {
  const entries = Object.entries(diseases);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      style={{ borderRadius: radii.md, overflow: 'hidden' }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.body,
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, minWidth: 90 }}>Disease</th>
            {COLUMNS.map((col) => (
              <th key={col.key} style={{ ...thStyle, textAlign: 'right' }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map(([name, d], i) => (
            <tr
              key={name}
              style={{
                background: i % 2 === 1 ? 'rgba(240, 244, 236, 0.3)' : 'transparent',
              }}
            >
              <td
                style={{
                  ...tdBase,
                  fontFamily: typography.body,
                  fontWeight: 500,
                  color: colors.ink,
                  maxWidth: 140,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={name}
              >
                {name}
              </td>
              {COLUMNS.map((col) => {
                const val = d[col.key];
                const isPct = col.key !== 'n_valid';
                return (
                  <td
                    key={col.key}
                    style={{
                      ...tdBase,
                      textAlign: 'right',
                      color: isPct ? valueColor(val) : colors.inkLight,
                      fontWeight: isPct ? 500 : 400,
                    }}
                  >
                    {isPct ? `${(val * 100).toFixed(1)}%` : val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </motion.div>
  );
}
