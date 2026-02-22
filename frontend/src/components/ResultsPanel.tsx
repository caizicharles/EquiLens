import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { CITY_CONFIGS } from '../data/cities';
import { MODELS } from '../data/models';
import CityResultsTab from './results/CityResultsTab';
import CompareAllTab from './results/CompareAllTab';
import { colors, typography, components, spacing, radii } from '../style';

type Tab = 'city' | 'compare';

export default function ResultsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const selectedCity = useAppStore((s) => s.selectedCity);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const enabledBiasAxes = useAppStore((s) => s.enabledBiasAxes);
  const enabledDisease = useAppStore((s) => s.enabledDisease);

  if (!selectedCity) return null;

  const city = CITY_CONFIGS[selectedCity];
  const model = MODELS.find((m) => m.id === selectedModel);
  const badgeColors = components[city.badgeStyle] as { background: string; color: string };

  return (
    <motion.div
      initial={{ x: 60, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      style={{
        ...components.panel,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* Header area — non-scrollable */}
      <div
        style={{
          padding: `${spacing.lg}px ${spacing.lg}px 0`,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.md,
          flexShrink: 0,
        }}
      >
        {/* Title */}
        <h2
          style={{
            fontFamily: typography.display,
            fontSize: '1.3rem',
            fontWeight: 700,
            color: colors.green500,
            margin: 0,
          }}
        >
          Results
        </h2>

        {/* Badges row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              ...components.badge,
              ...badgeColors,
              fontFamily: typography.body,
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            {city.label}
          </span>
          <span
            style={{
              ...components.badge,
              background: colors.surfaceMuted,
              color: colors.inkMuted,
              fontFamily: typography.mono,
              fontWeight: 500,
              fontSize: 11,
            }}
          >
            {model?.label ?? selectedModel}
          </span>
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            background: colors.surfaceAlt,
            borderRadius: radii.pill,
            padding: 3,
            gap: 2,
          }}
        >
          <TabButton
            label="City Results"
            active={activeTab === 'city'}
            onClick={() => setActiveTab('city')}
          />
          <TabButton
            label="Compare All"
            active={activeTab === 'compare'}
            onClick={() => setActiveTab('compare')}
          />
        </div>
      </div>

      {/* Scrollable content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: spacing.lg,
        }}
      >
        {activeTab === 'city' ? (
          <CityResultsTab
            city={selectedCity}
            enabledAxes={enabledBiasAxes}
            enabledDisease={enabledDisease}
          />
        ) : (
          <CompareAllTab />
        )}
      </div>
    </motion.div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        fontFamily: typography.body,
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        padding: '7px 16px',
        borderRadius: radii.pill,
        border: active ? 'none' : `1px solid ${colors.borderLight}`,
        background: active ? colors.green400 : 'transparent',
        color: active ? '#fff' : colors.inkMuted,
        cursor: 'pointer',
        transition: 'background 0.2s ease, color 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}
