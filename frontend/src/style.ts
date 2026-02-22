// EquiLens Design System — "Cartographic Laboratory"

// ---------------------------------------------------------------------------
// Color Palette
// ---------------------------------------------------------------------------
export const colors = {
  // Backgrounds
  surface: '#F8FAF6',
  surfaceAlt: '#F0F4EC',
  surfaceMuted: '#E8EDE3',

  // Hero Greens
  green50: '#F0F7E8',
  green100: '#D9EECC',
  green200: '#B4E08C',
  green300: '#A0D470',
  green400: '#7EBF4E',
  green500: '#6B8F5E',
  green600: '#4A6B3F',

  // Ocean Blues
  ocean: '#AAD7F0',
  oceanLight: '#C4E4F5',
  oceanDeep: '#7DBBD8',

  // Warm Accents
  peach: '#F5DFC0',
  peachLight: '#FAF0E4',
  gold: '#E8C87A',

  // Terrain Scale
  terrainLow: '#C6DEAC',
  terrainMid: '#D8C8A0',
  terrainHigh: '#DADAD4',

  // Text
  ink: '#2C2C2C',
  inkMuted: '#5A6355',
  inkLight: '#8A9484',

  // Borders and Dividers
  border: '#D4DCC8',
  borderLight: '#E4EAD8',

  // Semantic / Signal Colors
  alertRed: '#C45C4A',
  alertAmber: '#D4A03C',
  alertGreen: '#5B8C50',
} as const;

// ---------------------------------------------------------------------------
// Organic Gradient Wash
// ---------------------------------------------------------------------------
export const gradients = {
  heroWash: [
    'radial-gradient(ellipse at 20% 50%, rgba(180, 224, 140, 0.3) 0%, transparent 60%)',
    'radial-gradient(ellipse at 80% 20%, rgba(170, 215, 240, 0.25) 0%, transparent 50%)',
    'radial-gradient(ellipse at 60% 80%, rgba(245, 223, 192, 0.2) 0%, transparent 50%)',
  ].join(', '),

  subtleWash:
    'radial-gradient(ellipse at 30% 40%, rgba(180, 224, 140, 0.12) 0%, transparent 50%)',

  cardSheen:
    'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,246,0.7) 100%)',
} as const;

// ---------------------------------------------------------------------------
// Component Styling Patterns
// ---------------------------------------------------------------------------
export const components = {
  card: {
    background: 'rgba(255, 255, 255, 0.75)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(212, 220, 200, 0.5)',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(107, 143, 94, 0.06)',
  },

  cardHover: {
    boxShadow: '0 4px 16px rgba(107, 143, 94, 0.12)',
    border: '1px solid rgba(160, 212, 112, 0.4)',
  },

  panel: {
    background: 'rgba(240, 244, 236, 0.6)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(212, 220, 200, 0.4)',
    borderRadius: 16,
  },

  badge: {
    borderRadius: 100,
    padding: '4px 12px',
    fontSize: 12,
    fontWeight: 500,
  },

  badgeGreen: {
    background: '#D9EECC',
    color: '#4A6B3F',
  },

  badgeOcean: {
    background: '#C4E4F5',
    color: '#3A7A9B',
  },

  badgePeach: {
    background: '#FAF0E4',
    color: '#8B6B3A',
  },

  badgeAlert: {
    background: '#F5D5CF',
    color: '#8B3A2E',
  },
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  display: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', 'Helvetica Neue', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const fontImports =
  "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:wght@400;700&display=swap');";

// ---------------------------------------------------------------------------
// Spacing, Radii, Shadows
// ---------------------------------------------------------------------------
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 100,
} as const;

export const shadows = {
  subtle: '0 1px 3px rgba(107, 143, 94, 0.06)',
  card: '0 2px 8px rgba(107, 143, 94, 0.08)',
  elevated: '0 4px 16px rgba(107, 143, 94, 0.12)',
  glow: '0 0 24px rgba(180, 224, 140, 0.2)',
} as const;

// ---------------------------------------------------------------------------
// Terrain Gradient (9-stop, for data visualizations)
// ---------------------------------------------------------------------------
export const terrainGradient = [
  '#C6DEAC',
  '#C2D8A4',
  '#BDD29C',
  '#CCCE9E',
  '#D8C8A0',
  '#D6C6A6',
  '#D0C8B4',
  '#D4D0C8',
  '#DADAD4',
] as const;

// ---------------------------------------------------------------------------
// Chart / Visualization Palette
// ---------------------------------------------------------------------------
export const chartColors = {
  primary: ['#7EBF4E', '#AAD7F0', '#E8C87A'] as const,
  secondary: ['#A0D470', '#7DBBD8', '#F5DFC0', '#C45C4A'] as const,
  categorical: ['#7EBF4E', '#5B9BD5', '#E8C87A', '#C45C4A', '#8AAA7D', '#D4A03C'] as const,
  diverging: {
    low: '#C45C4A',
    mid: '#F8FAF6',
    high: '#7EBF4E',
  },
} as const;
