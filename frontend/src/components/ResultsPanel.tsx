import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { CITY_CONFIGS } from '../data/cities';
import { MODELS } from '../data/models';
import { computeMode } from '../data/analysis';
import CityResultsTab from './results/CityResultsTab';
import CompareAllTab from './results/CompareAllTab';
import { colors, typography, components, spacing, radii } from '../style';

type Tab = 'city' | 'compare';

const LOADING_DURATION = 6500;

const LOADING_STEPS = [
  { at: 0,    label: () => 'Initialising pipeline...' },
  { at: 0.06, label: () => 'Loading dataset...' },
  { at: 0.14, label: (model: string) => `Testing ${model}...` },
  { at: 0.68, label: () => 'Gathering results...' },
  { at: 0.86, label: () => 'Computing metrics...' },
];

// Piecewise-linear mapping from wall-clock fraction → visual progress.
// "Testing model..." (progress 0.14–0.68) consumes ~75% of real time,
// while init/dataset and gathering/metrics zip through quickly.
const TIME_TO_PROGRESS: [number, number][] = [
  [0,    0],
  [0.10, 0.14],   // init + dataset: fast
  [0.85, 0.68],   // testing model: slow crawl
  [1,    1],       // gathering + metrics: fast
];

function timeToProgress(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  for (let i = 1; i < TIME_TO_PROGRESS.length; i++) {
    const [t0, p0] = TIME_TO_PROGRESS[i - 1];
    const [t1, p1] = TIME_TO_PROGRESS[i];
    if (t <= t1) {
      return p0 + (p1 - p0) * ((t - t0) / (t1 - t0));
    }
  }
  return 1;
}

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
      const timeFrac = Math.min(elapsed / LOADING_DURATION, 1);
      const pct = timeToProgress(timeFrac);
      setProgress(pct);

      let idx = 0;
      for (let i = LOADING_STEPS.length - 1; i >= 0; i--) {
        if (pct >= LOADING_STEPS[i].at) {
          idx = i;
          break;
        }
      }
      setStepIdx(idx);

      if (timeFrac >= 1) {
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
// Tab button
// ---------------------------------------------------------------------------

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
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        padding: '5px 12px',
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

// ---------------------------------------------------------------------------
// Main ResultsPanel — no-scroll flex column layout
// ---------------------------------------------------------------------------

export default function ResultsPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('city');
  const selectedCity = useAppStore((s) => s.selectedCity);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const enabledDemographics = useAppStore((s) => s.enabledDemographics);
  const enabledDisease = useAppStore((s) => s.enabledDisease);
  const attackRunning = useAppStore((s) => s.attackRunning);
  const attackComplete = useAppStore((s) => s.attackComplete);

  if (!selectedCity) return null;

  const city = CITY_CONFIGS[selectedCity];
  const model = MODELS.find((m) => m.id === selectedModel);
  const badgeColors = components[city.badgeStyle] as { background: string; color: string };
  const modelLabel = model?.label ?? selectedModel;
  const mode = computeMode(enabledDemographics, enabledDisease);

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
      {/* Header + Tabs — compact, ~48px */}
      <div
        style={{
          padding: `${spacing.sm}px ${spacing.md}px`,
          display: 'flex',
          alignItems: 'center',
          gap: spacing.sm,
          flexShrink: 0,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        <h2
          style={{
            fontFamily: typography.display,
            fontSize: '1.1rem',
            fontWeight: 700,
            color: colors.green500,
            margin: 0,
            flexShrink: 0,
          }}
        >
          Results
        </h2>

        <span
          style={{
            ...components.badge,
            ...badgeColors,
            fontFamily: typography.body,
            fontWeight: 600,
            fontSize: 10,
            padding: '2px 8px',
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
            fontSize: 9,
            padding: '2px 8px',
          }}
        >
          {modelLabel}
        </span>

        <div style={{ flex: 1 }} />

        {attackComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex',
              background: colors.surfaceAlt,
              borderRadius: radii.pill,
              padding: 2,
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

      {/* Content area — fills remaining height, scrolls if needed */}
      <AnimatePresence mode="wait">
        {attackRunning && (
          <LoadingOverlay key="loading" modelLabel={modelLabel} />
        )}

        {attackComplete && (
          <motion.div
            key={`results-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: spacing.sm,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {activeTab === 'city' ? (
              <CityResultsTab
                city={selectedCity}
                model={selectedModel}
                enabledDemographics={enabledDemographics}
                enabledDisease={enabledDisease}
                mode={mode}
              />
            ) : (
              <CompareAllTab model={selectedModel} mode={mode} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
