import { useState } from 'react';
import { useAppStore } from '../store';
import { colors, typography, spacing } from '../style';

export default function Logo() {
  const [hovered, setHovered] = useState(false);
  const setPhase = useAppStore((s) => s.setPhase);
  const selectCity = useAppStore((s) => s.selectCity);
  const resetSandbox = useAppStore((s) => s.resetSandbox);

  const handleClick = () => {
    setPhase('map');
    selectCity(null);
    resetSandbox();
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        top: spacing.lg,
        left: spacing.lg,
        zIndex: 100,
        display: 'inline-flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        cursor: 'pointer',
        opacity: hovered ? 0.8 : 1.0,
        transition: 'opacity 0.2s',
      }}
    >
      <img
        src="/logo.png"
        alt="EquiLens"
        style={{ height: 32, width: 'auto' }}
      />
      <span
        style={{
          fontFamily: typography.display,
          fontSize: '1.25rem',
          fontWeight: 700,
          color: colors.green500,
          textShadow: '0 1px 4px rgba(255,255,255,0.8)',
          userSelect: 'none',
        }}
      >
        EquiLens
      </span>
    </div>
  );
}
