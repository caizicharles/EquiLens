import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { colors, typography, spacing } from '../style';

const CHEVRON_KEYFRAMES = `
@keyframes chevron-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
`;

export default function MapOverlays() {
  const phase = useAppStore((s) => s.phase);
  const hasSeenMapOverlays = useAppStore((s) => s.hasSeenMapOverlays);

  const show = phase === 'map' && !hasSeenMapOverlays;

  return (
    <AnimatePresence>
      {show && (
        <>
          <style>{CHEVRON_KEYFRAMES}</style>

          {/* Hero Title + Subtitle */}
          <motion.div
            key="hero-title"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
            style={{
              position: 'fixed',
              top: 80,
              left: spacing.xl,
              zIndex: 50,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: typography.display,
                fontSize: '1.6rem',
                fontWeight: 700,
                color: colors.ink,
                textShadow: '0 1px 6px rgba(255,255,255,0.9)',
                lineHeight: 1.2,
              }}
            >
              Stress-Testing Medical LLMs
            </div>
            <div
              style={{
                fontFamily: typography.body,
                fontSize: '0.9rem',
                fontWeight: 400,
                color: colors.inkMuted,
                textShadow: '0 1px 6px rgba(255,255,255,0.9)',
                marginTop: 4,
                lineHeight: 1.3,
              }}
            >
              Adversarial bias detection across UK &amp; Ireland
            </div>
          </motion.div>

          {/* Instruction Cue */}
          <motion.div
            key="instruction-cue"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.0 }}
            style={{
              position: 'fixed',
              bottom: 48,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                color: colors.inkLight,
                fontSize: 12,
                animation: 'chevron-float 2s ease-in-out infinite',
              }}
            >
              ▲
            </div>
            <div
              style={{
                fontFamily: typography.body,
                fontSize: 13,
                fontWeight: 500,
                color: colors.inkMuted,
                textShadow: '0 1px 4px rgba(255,255,255,0.8)',
                whiteSpace: 'nowrap',
              }}
            >
              Select a city to begin
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
