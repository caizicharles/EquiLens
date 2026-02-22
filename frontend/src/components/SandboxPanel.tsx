import { motion } from 'framer-motion';
import { useAppStore } from '../store';
import { CITY_CONFIGS, type DemographicAxis, type DiseaseSlice } from '../data/cities';
import { MODELS } from '../data/models';
import type { ModelId } from '../data/models';
import { colors, typography, components, spacing, shadows } from '../style';

// ---------------------------------------------------------------------------
// Stacked horizontal bar
// ---------------------------------------------------------------------------

function StackedBar({
  segments,
  height = 28,
  disabled = false,
}: {
  segments: { label: string; pct: number; color: string }[];
  height?: number;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height,
        borderRadius: 100,
        overflow: 'hidden',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {segments.map((seg) => (
        <div
          key={seg.label}
          style={{
            width: `${seg.pct * 100}%`,
            background: seg.color,
          }}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar legend (below stacked bar)
// ---------------------------------------------------------------------------

function BarLegend({
  segments,
  disabled = false,
}: {
  segments: { label: string; pct: number; color: string }[];
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.xs,
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      {segments.map((seg) => (
        <div
          key={seg.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: seg.color,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: typography.body,
              fontSize: 11,
              color: colors.inkMuted,
            }}
          >
            {seg.label}
          </span>
          <span
            style={{
              fontFamily: typography.mono,
              fontSize: 11,
              fontWeight: 500,
              color: colors.ink,
            }}
          >
            {Math.round(seg.pct * 100)}%
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

function Toggle({
  on,
  onToggle,
  disabled = false,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        borderRadius: 10,
        border: 'none',
        background: on ? colors.green300 : colors.surfaceMuted,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0,
        flexShrink: 0,
        transition: 'background 0.2s ease',
      }}
    >
      <motion.div
        animate={{ x: on ? 17 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: shadows.subtle,
        }}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Demographics section (single toggle + all stacked bars)
// ---------------------------------------------------------------------------

function DemographicsSection({
  demographics,
  enabled,
  onToggle,
  disabled = false,
}: {
  demographics: DemographicAxis[];
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle on={enabled} onToggle={onToggle} disabled={disabled} />
        <span
          style={{
            fontFamily: typography.body,
            fontSize: 13,
            fontWeight: 600,
            color: enabled ? colors.ink : colors.inkLight,
            transition: 'color 0.2s ease',
          }}
        >
          Demographics
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {demographics.map((axis) => {
          const segs = [
            { label: axis.majorityLabel, pct: axis.majorityPct, color: axis.majorityColor },
            { label: axis.minorityLabel, pct: axis.minorityPct, color: axis.minorityColor },
          ];
          return (
            <div key={axis.key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: typography.body,
                  fontSize: 11,
                  fontWeight: 500,
                  color: enabled ? colors.inkMuted : colors.inkLight,
                  transition: 'color 0.2s ease',
                }}
              >
                {axis.label}
              </span>
              <StackedBar disabled={!enabled} segments={segs} />
              <BarLegend disabled={!enabled} segments={segs} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disease section (toggle + stacked bar)
// ---------------------------------------------------------------------------

function DiseaseSection({
  diseases,
  enabled,
  onToggle,
  disabled = false,
}: {
  diseases: DiseaseSlice[];
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toggle on={enabled} onToggle={onToggle} disabled={disabled} />
        <span
          style={{
            fontFamily: typography.body,
            fontSize: 13,
            fontWeight: 600,
            color: enabled ? colors.ink : colors.inkLight,
            transition: 'color 0.2s ease',
          }}
        >
          Disease Composition
        </span>
      </div>
      {(() => {
        const segs = diseases.map((d) => ({
          label: d.label,
          pct: d.pct,
          color: d.color,
        }));
        return (
          <>
            <StackedBar disabled={!enabled} segments={segs} />
            <BarLegend disabled={!enabled} segments={segs} />
          </>
        );
      })()}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Model selector dropdown
// ---------------------------------------------------------------------------

function ModelSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: ModelId;
  onChange: (m: ModelId) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontFamily: typography.body,
          fontSize: 12,
          fontWeight: 500,
          color: colors.inkMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Target Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ModelId)}
        disabled={disabled}
        style={{
          fontFamily: typography.body,
          fontSize: 14,
          fontWeight: 500,
          padding: '8px 12px',
          borderRadius: 8,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          color: colors.ink,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          outline: 'none',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%235A6355' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          paddingRight: 32,
        }}
      >
        {MODELS.filter((m) => m.available).map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SandboxPanel
// ---------------------------------------------------------------------------

interface SandboxPanelProps {
  /** When true, the panel is shown in results phase — button greyed out, back-to-map shown */
  resultsMode?: boolean;
}

export default function SandboxPanel({ resultsMode = false }: SandboxPanelProps) {
  const selectedCity = useAppStore((s) => s.selectedCity);
  const selectedModel = useAppStore((s) => s.selectedModel);
  const enabledDemographics = useAppStore((s) => s.enabledDemographics);
  const enabledDisease = useAppStore((s) => s.enabledDisease);
  const attackRunning = useAppStore((s) => s.attackRunning);
  const setPhase = useAppStore((s) => s.setPhase);
  const selectCity = useAppStore((s) => s.selectCity);
  const setSelectedModel = useAppStore((s) => s.setSelectedModel);
  const toggleDemographics = useAppStore((s) => s.toggleDemographics);
  const toggleDisease = useAppStore((s) => s.toggleDisease);
  const runAttack = useAppStore((s) => s.runAttack);
  const resetSandbox = useAppStore((s) => s.resetSandbox);

  if (!selectedCity) return null;

  const city = CITY_CONFIGS[selectedCity];
  const badgeColors = components[city.badgeStyle] as { background: string; color: string };

  const hasAnyEnabled = enabledDemographics || enabledDisease;
  const frozen = resultsMode;

  const handleBack = () => {
    resetSandbox();
    selectCity(null as never);
    setPhase('map');
  };

  const buttonDisabled = resultsMode || attackRunning || !hasAnyEnabled;

  return (
    <div
      style={{
        ...components.card,
        width: '100%',
        maxWidth: 400,
        height: '100%',
        padding: spacing.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.md,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2
          style={{
            fontFamily: typography.display,
            fontSize: 20,
            fontWeight: 700,
            color: colors.green500,
            margin: 0,
          }}
        >
          Sandbox Configurations
        </h2>
        {!resultsMode && (
          <button
            onClick={handleBack}
            style={{
              fontFamily: typography.body,
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 14px',
              borderRadius: 6,
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.inkMuted,
              cursor: 'pointer',
            }}
          >
            Back
          </button>
        )}
      </div>

      {/* City badge */}
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          ...components.badge,
          ...badgeColors,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: typography.body,
        }}
      >
        {city.label}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: colors.borderLight }} />

      {/* Model selector */}
      <ModelSelector value={selectedModel} onChange={setSelectedModel} disabled={frozen} />

      {/* Divider */}
      <div style={{ height: 1, background: colors.borderLight }} />

      {/* Demographics — single toggle */}
      <DemographicsSection
        demographics={city.demographics}
        enabled={enabledDemographics}
        onToggle={toggleDemographics}
        disabled={frozen}
      />

      {/* Divider */}
      <div style={{ height: 1, background: colors.borderLight }} />

      {/* Disease — single toggle */}
      <DiseaseSection
        diseases={city.diseases}
        enabled={enabledDisease}
        onToggle={toggleDisease}
        disabled={frozen}
      />

      {/* Spacer — pushes button to bottom */}
      <div style={{ flex: 1 }} />

      {/* Run Attack button */}
      <motion.button
        whileHover={!buttonDisabled ? { scale: 1.02 } : {}}
        whileTap={!buttonDisabled ? { scale: 0.98 } : {}}
        onClick={resultsMode ? undefined : runAttack}
        disabled={buttonDisabled}
        style={{
          fontFamily: typography.body,
          fontSize: 15,
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: 10,
          border: 'none',
          background: resultsMode
            ? colors.surfaceMuted
            : attackRunning
              ? colors.surfaceMuted
              : hasAnyEnabled
                ? colors.green400
                : colors.surfaceMuted,
          color: resultsMode
            ? colors.inkLight
            : attackRunning
              ? colors.inkLight
              : hasAnyEnabled
                ? '#fff'
                : colors.inkLight,
          cursor: buttonDisabled ? 'not-allowed' : 'pointer',
          boxShadow: !resultsMode && hasAnyEnabled && !attackRunning ? shadows.glow : 'none',
          opacity: resultsMode ? 0.4 : 1,
          transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          width: '100%',
        }}
      >
        {attackRunning ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', fontSize: 16 }}
            >
              &#9696;
            </motion.span>
            Running Attack...
          </>
        ) : (
          'Run Attack'
        )}
      </motion.button>

      {/* Back to Map — shown only in results mode */}
      {resultsMode && (
        <button
          onClick={handleBack}
          style={{
            fontFamily: typography.body,
            fontWeight: 500,
            fontSize: 13,
            padding: '7px 16px',
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            background: 'transparent',
            color: colors.inkMuted,
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
          }}
        >
          Back to Map
        </button>
      )}
    </div>
  );
}
