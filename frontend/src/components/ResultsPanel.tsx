import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { CITY_CONFIGS } from '../data/cities';
import { MODELS } from '../data/models';
import CityResultsTab from './results/CityResultsTab';
import CompareAllTab from './results/CompareAllTab';
import { colors, typography, components, spacing, radii } from '../style';

type Tab = 'city' | 'compare';

const LOADING_DURATION = 4000; // ms total

const LOADING_STEPS = [
  { at: 0, label: (model: string) => `Testing ${model}...` },
  { at: 0.4, label: () => 'Gathering results...' },
  { at: 0.75, label: () => 'Synthesizing findings...' },
];

// ---------------------------------------------------------------------------
// Loading overlay with progress bar
// ---------------------------------------------------------------------------

function LoadingOverlay({ modelLabel }: { modelLabel: string }) {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const finishAttack = useAppStore((s) => s.finishAttack);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startTime.current;
      const pct = Math.min(elapsed / LOADING_DURATION, 1);
      setProgress(pct);

      // Advance step label
      let idx = 0;
      for (let i = LOADING_STEPS.length - 1; i >= 0; i--) {
        if (pct >= LOADING_STEPS[i].at) {
          idx = i;
          break;
        }
      }
      setStepIdx(idx);

      if (pct >= 1) {
        finishAttack();
      } else {
        raf = requestAnimationFrame(tick);
      }
    };

    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [finishAttack]);

  const label = LOADING_STEPS[stepIdx].label(modelLabel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: spacing.xxl,
      }}
    >
      {/* Progress bar track */}
      <div
        style={{
          width: '100%',
          maxWidth: 280,
          height: 6,
          borderRadius: 3,
          background: colors.surfaceMuted,
          overflow: 'hidden',
        }}
      >
        <motion.div
          style={{
            height: '100%',
            borderRadius: 3,
            background: colors.green400,
            width: `${progress * 100}%`,
          }}
        />
      </div>

      {/* Status message */}
      <AnimatePresence mode="wait">
        <motion.span
          key={stepIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          style={{
            fontFamily: typography.mono,
            fontSize: 12,
            color: colors.inkMuted,
          }}
        >
          {label}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main ResultsPanel
// ---------------------------------------------------------------------------

export default function ResultsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const selectedCity = useAppStore((s) => s.selectedCity);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const enabledBiasAxes = useAppStore((s) => s.enabledBiasAxes);
  const enabledDisease = useAppStore((s) => s.enabledDisease);
  const attackRunning = useAppStore((s) => s.attackRunning);
  const attackComplete = useAppStore((s) => s.attackComplete);

  if (!selectedCity) return null;

  const city = CITY_CONFIGS[selectedCity];
  const model = MODELS.find((m) => m.id === selectedModel);
  const badgeColors = components[city.badgeStyle] as { background: string; color: string };
  const modelLabel = model?.label ?? selectedModel;

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
            {modelLabel}
          </span>
        </div>

        {/* Tab bar — only show when results are ready */}
        {attackComplete && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
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
          </motion.div>
        )}
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {attackRunning && (
          <LoadingOverlay key="loading" modelLabel={modelLabel} />
        )}

        {attackComplete && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
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
          </motion.div>
        )}
      </AnimatePresence>
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
