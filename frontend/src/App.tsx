import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store';
import { colors, typography, components, spacing } from './style';
import TerrainMap from './components/TerrainMap';

function SandboxPlaceholder() {
  const selectedCity = useAppStore((s) => s.selectedCity);
  const setPhase = useAppStore((s) => s.setPhase);
  const selectCity = useAppStore((s) => s.selectCity);

  const cityLabel = selectedCity
    ? selectedCity.charAt(0).toUpperCase() + selectedCity.slice(1)
    : '';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}
    >
      <div
        style={{
          ...components.card,
          padding: `${spacing.xxl}px ${spacing.xxl}px`,
          maxWidth: 420,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        <h1
          style={{
            fontFamily: typography.display,
            color: colors.green500,
            fontSize: '2rem',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Sandbox
        </h1>
        <p
          style={{
            fontFamily: typography.body,
            color: colors.inkMuted,
            fontSize: '1rem',
            margin: 0,
          }}
        >
          {cityLabel}
        </p>
        <button
          onClick={() => {
            selectCity(null as never);
            setPhase('map');
          }}
          style={{
            fontFamily: typography.body,
            fontWeight: 500,
            fontSize: 13,
            padding: '8px 20px',
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: colors.surface,
            color: colors.ink,
            cursor: 'pointer',
          }}
        >
          Back to Map
        </button>
      </div>
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.3 } },
};

function App() {
  const phase = useAppStore((s) => s.phase);

  return (
    <AnimatePresence mode="wait">
      {phase === 'map' && (
        <motion.div
          key="map"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <TerrainMap />
        </motion.div>
      )}

      {phase === 'sandbox' && (
        <motion.div
          key="sandbox"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <SandboxPlaceholder />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
