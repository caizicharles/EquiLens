import { motion } from 'framer-motion';
import SandboxPanel from './SandboxPanel';
import ResultsPanel from './ResultsPanel';
import { colors } from '../style';

const SANDBOX_FRACTION = 0.33;
const RESULTS_FRACTION = 0.67;
const PADDING = 32;

export default function ResultsLayout() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'row',
        zIndex: 1,
      }}
    >
      {/* Left: Sandbox config panel (33%) */}
      <div
        style={{
          width: `${SANDBOX_FRACTION * 100}%`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: `${PADDING + 40}px ${PADDING}px ${PADDING}px`,
          boxSizing: 'border-box',
          borderRight: `1px solid ${colors.borderLight}`,
        }}
      >
        <SandboxPanel resultsMode />
      </div>

      {/* Right: Results panel (67%) */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        style={{
          width: `${RESULTS_FRACTION * 100}%`,
          height: '100%',
          flexShrink: 0,
          padding: PADDING,
          boxSizing: 'border-box',
        }}
      >
        <ResultsPanel />
      </motion.div>
    </div>
  );
}
