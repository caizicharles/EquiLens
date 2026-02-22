import { colors, components, typography, spacing } from './style';

const Badge = ({
  label,
  variant,
}: {
  label: string;
  variant: 'green' | 'ocean' | 'peach';
}) => {
  const variantStyles = {
    green: components.badgeGreen,
    ocean: components.badgeOcean,
    peach: components.badgePeach,
  };

  return (
    <span
      style={{
        ...components.badge,
        ...variantStyles[variant],
        display: 'inline-block',
      }}
    >
      {label}
    </span>
  );
};

const Swatch = ({ color }: { color: string }) => (
  <span
    style={{
      display: 'inline-block',
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: color,
      border: `1px solid ${colors.borderLight}`,
    }}
  />
);

function App() {
  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: spacing.xl,
      }}
    >
      <div
        style={{
          ...components.card,
          padding: `${spacing.xxl}px ${spacing.xxl}px`,
          maxWidth: 480,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: spacing.lg,
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: typography.display,
            color: colors.green500,
            fontSize: '2.5rem',
            fontWeight: 700,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          EquiLens
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: typography.body,
            color: colors.inkMuted,
            fontSize: '0.85rem',
            fontWeight: 500,
            margin: 0,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          Cartographic Laboratory
        </p>

        {/* Divider */}
        <div
          style={{
            width: '60%',
            height: 1,
            background: colors.borderLight,
          }}
        />

        {/* City badges */}
        <div style={{ display: 'flex', gap: spacing.sm }}>
          <Badge label="London" variant="green" />
          <Badge label="Edinburgh" variant="ocean" />
          <Badge label="Dublin" variant="peach" />
        </div>

        {/* Color swatches */}
        <div style={{ display: 'flex', gap: spacing.sm, alignItems: 'center' }}>
          <Swatch color={colors.green200} />
          <Swatch color={colors.ocean} />
          <Swatch color={colors.peach} />
          <Swatch color={colors.alertRed} />
        </div>
      </div>
    </div>
  );
}

export default App;
