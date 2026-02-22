import { motion } from 'framer-motion';
import { MEDMCQA_RESULTS, ALL_CITIES, CITY_LABELS } from '../../data/results';
import { colors, typography, radii } from '../../style';

const CITY_HEADER_COLORS: Record<string, string> = {
  london: colors.green400,
  edinburgh: colors.oceanDeep,
  dublin: colors.gold,
};

interface RowDef {
  label: string;
  bold: boolean;
  getter: (city: string) => number | string;
  isPct: boolean;
}

function buildRows(): RowDef[] {
  const rows: RowDef[] = [
    {
      label: 'Aggregate Accuracy',
      bold: true,
      getter: (c) => MEDMCQA_RESULTS[c as keyof typeof MEDMCQA_RESULTS].aggregate.accuracy,
      isPct: true,
    },
    {
      label: 'Aggregate F1',
      bold: true,
      getter: (c) => MEDMCQA_RESULTS[c as keyof typeof MEDMCQA_RESULTS].aggregate.f1_macro,
      isPct: true,
    },
  ];

  const diseaseSet = new Set<string>();
  for (const city of ALL_CITIES) {
    for (const d of Object.keys(MEDMCQA_RESULTS[city].diseases)) {
      diseaseSet.add(d);
    }
  }

  for (const disease of diseaseSet) {
    rows.push({
      label: `${disease} Acc.`,
      bold: false,
      getter: (c) => {
        const d = MEDMCQA_RESULTS[c as keyof typeof MEDMCQA_RESULTS].diseases[disease];
        return d ? d.accuracy : '—';
      },
      isPct: true,
    });
  }

  return rows;
}

function cellBg(val: number, rowVals: number[]): string {
  if (rowVals.length < 2) return 'transparent';
  const min = Math.min(...rowVals);
  const max = Math.max(...rowVals);
  if (val === min && min !== max) return 'rgba(196, 92, 74, 0.08)';
  if (val === max && min !== max) return 'rgba(240, 247, 232, 0.6)';
  return 'transparent';
}

interface Props {
  compact?: boolean;
}

export default function CrossCityTable({ compact = false }: Props) {
  const rows = buildRows();
  const fs = compact ? 10 : 12;
  const pad = compact ? '4px 6px' : '7px 10px';

  const thStyle: React.CSSProperties = {
    fontFamily: typography.body,
    fontSize: compact ? 8 : 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    padding: compact ? '4px 6px' : '8px 10px',
    textAlign: 'right',
    background: colors.surfaceAlt,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ borderRadius: radii.md, overflow: 'hidden' }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontFamily: typography.body,
          fontSize: fs,
        }}
      >
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: 'left', color: colors.inkMuted, minWidth: compact ? 80 : 120 }}>
              Metric
            </th>
            {ALL_CITIES.map((city) => (
              <th key={city} style={{ ...thStyle, color: CITY_HEADER_COLORS[city] }}>
                {CITY_LABELS[city]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => {
            const numVals = ALL_CITIES.map((c) => row.getter(c)).filter(
              (v): v is number => typeof v === 'number',
            );

            return (
              <tr
                key={row.label}
                style={{
                  background: ri % 2 === 1 ? 'rgba(240, 244, 236, 0.3)' : 'transparent',
                }}
              >
                <td
                  style={{
                    fontFamily: typography.body,
                    fontWeight: row.bold ? 600 : 400,
                    fontSize: compact ? (row.bold ? 10 : 9) : (row.bold ? 12 : 11),
                    color: colors.ink,
                    padding: pad,
                  }}
                >
                  {row.label}
                </td>
                {ALL_CITIES.map((city) => {
                  const val = row.getter(city);
                  const isNum = typeof val === 'number';
                  const bg = isNum ? cellBg(val, numVals) : 'transparent';
                  const pctColor = isNum
                    ? val >= 0.9
                      ? colors.green400
                      : val >= 0.8
                        ? colors.gold
                        : colors.alertRed
                    : colors.inkLight;

                  return (
                    <td
                      key={city}
                      style={{
                        fontFamily: typography.mono,
                        fontSize: compact ? (row.bold ? 10 : 9) : (row.bold ? 12 : 11),
                        fontWeight: row.bold ? 600 : 400,
                        textAlign: 'right',
                        padding: pad,
                        color: row.isPct && isNum ? pctColor : colors.inkLight,
                        background: bg,
                      }}
                    >
                      {isNum && row.isPct ? `${(val * 100).toFixed(1)}%` : val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
  );
}
