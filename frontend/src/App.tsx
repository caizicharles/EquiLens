import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './store';
import TerrainMap from './components/TerrainMap';
import SandboxLayout from './components/SandboxLayout';
import ResultsLayout from './components/ResultsLayout';

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
          <SandboxLayout />
        </motion.div>
      )}

      {phase === 'results' && (
        <motion.div
          key="results"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <ResultsLayout />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
