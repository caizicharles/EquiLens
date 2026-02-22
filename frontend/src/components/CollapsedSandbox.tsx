import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { CITY_CONFIGS } from '../data/cities';
import { MODELS } from '../data/models';
import { colors, typography, components, spacing, radii } from '../style';

export default function CollapsedSandbox() {
  const selectedCity = useAppStore((s) => s.selectedCity);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const enabledBiasAxes = useAppStore((s) => s.enabledBiasAxes);
  const enabledDisease = useAppStore((s) => s.enabledDisease);
  const setPhase = useAppStore((s) => s.setPhase);

  if (!selectedCity) return null;

  const city = CITY_CONFIGS[selectedCity];
  const model = MODELS.find((m) => m.id === selectedModel);

  const toggles = [
    { label: 'Eth', on: enabledBiasAxes.ethnicity },
    { label: 'Gen', on: enabledBiasAxes.gender },
    { label: 'SES', on: enabledBiasAxes.SES },
    { label: 'Dis', on: enabledDisease },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{
        ...components.panel,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
        padding: `${spacing.lg}px ${spacing.sm}px`,
        boxSizing: 'border-box',
        background: 'rgba(232, 237, 227, 0.5)',
      }}
    >
      {/* City name */}
      <div
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: typography.display,
          fontSize: 18,
          fontWeight: 700,
          color: city.accentColor,
          letterSpacing: '0.02em',
        }}
      >
        {city.label}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 20,
          height: 1,
          background: colors.borderLight,
        }}
      />

      {/* Model name */}
      <div
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          fontFamily: typography.mono,
          fontSize: 9,
          color: colors.inkMuted,
          whiteSpace: 'nowrap',
        }}
      >
        {model?.shortLabel ?? selectedModel}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 20,
          height: 1,
          background: colors.borderLight,
        }}
      />

      {/* Toggle indicators */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {toggles.map((t) => (
          <div
            key={t.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: t.on ? colors.green400 : 'transparent',
                border: `1.5px solid ${t.on ? colors.green400 : colors.inkLight}`,
                opacity: t.on ? 1 : 0.4,
              }}
            />
            <span
              style={{
                fontFamily: typography.mono,
                fontSize: 7,
                color: t.on ? colors.inkMuted : colors.inkLight,
                opacity: t.on ? 1 : 0.4,
              }}
            >
              {t.label}
            </span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div
        style={{
          width: 20,
          height: 1,
          background: colors.borderLight,
        }}
      />

      {/* Edit button */}
      <button
        onClick={() => setPhase('sandbox')}
        style={{
          fontFamily: typography.body,
          fontSize: 10,
          fontWeight: 500,
          padding: '4px 8px',
          borderRadius: radii.sm,
          border: `1px solid ${colors.border}`,
          background: 'transparent',
          color: colors.inkMuted,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        Edit
      </button>
    </motion.div>
  );
}
