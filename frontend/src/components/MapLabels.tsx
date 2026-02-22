import { useState } from 'react';
import { motion } from 'framer-motion';
import { latLngToPixel } from '../terrain/projection';
import { useAppStore, type City } from '../store';
import { colors, typography } from '../style';

interface MapLabelsProps {
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const COUNTRY_LABELS = [
  { label: 'United Kingdom', lat: 54.0, lng: -1.5, size: 16 },
  { label: 'Ireland', lat: 53.5, lng: -8.0, size: 15 },
  { label: 'Isle of Man', lat: 54.15, lng: -4.5, size: 10, small: true },
] as const;

const WATER_LABELS = [
  { label: 'North Sea', lat: 56.0, lng: 1.5, size: 13 },
  { label: 'Irish Sea', lat: 53.8, lng: -5.0, size: 12 },
  { label: 'Atlantic Ocean', lat: 55.0, lng: -10.0, size: 14 },
  { label: 'English Channel', lat: 50.2, lng: -2.0, size: 11 },
  { label: 'Celtic Sea', lat: 51.0, lng: -7.5, size: 11 },
] as const;

interface CityData {
  id: City;
  label: string;
  lat: number;
  lng: number;
  dotColor: string;
  glowShadow: string;
  glowShadowHover: string;
  labelSide: 'left' | 'right';
  coord: string;
}

const PRIMARY_CITIES: CityData[] = [
  {
    id: 'london',
    label: 'London',
    lat: 51.505,
    lng: -0.09,
    dotColor: colors.green400,
    glowShadow: '0 0 12px rgba(126, 191, 78, 0.5)',
    glowShadowHover: '0 0 24px rgba(126, 191, 78, 0.7)',
    labelSide: 'right',
    coord: '51.5\u00B0N, 0.1\u00B0W',
  },
  {
    id: 'edinburgh',
    label: 'Edinburgh',
    lat: 55.953,
    lng: -3.19,
    dotColor: colors.oceanDeep,
    glowShadow: '0 0 12px rgba(125, 187, 216, 0.5)',
    glowShadowHover: '0 0 24px rgba(125, 187, 216, 0.7)',
    labelSide: 'right',
    coord: '56.0\u00B0N, 3.2\u00B0W',
  },
  {
    id: 'dublin',
    label: 'Dublin',
    lat: 53.349,
    lng: -6.26,
    dotColor: colors.gold,
    glowShadow: '0 0 12px rgba(232, 200, 122, 0.5)',
    glowShadowHover: '0 0 24px rgba(232, 200, 122, 0.7)',
    labelSide: 'left',
    coord: '53.3\u00B0N, 6.3\u00B0W',
  },
];

const SECONDARY_CITIES = [
  { label: 'Glasgow', lat: 55.86, lng: -4.25 },
  { label: 'Manchester', lat: 53.48, lng: -2.24 },
  { label: 'Birmingham', lat: 52.48, lng: -1.89 },
  { label: 'Belfast', lat: 54.6, lng: -5.93 },
  { label: 'Cardiff', lat: 51.48, lng: -3.18 },
] as const;

const PEAKS = [
  { label: 'Ben Nevis', lat: 56.797, lng: -5.004, elev: '1345m' },
] as const;

// ---------------------------------------------------------------------------
// Pulse animation CSS (injected once)
// ---------------------------------------------------------------------------
const PULSE_KEYFRAMES = `
@keyframes city-pulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(3); opacity: 0; }
}
`;

// Shared text shadow for legibility
const TEXT_SHADOW_STRONG = '0 1px 4px rgba(255, 255, 255, 0.9)';
const TEXT_SHADOW_MEDIUM = '0 1px 3px rgba(255, 255, 255, 0.8)';
const TEXT_SHADOW_LIGHT = '0 1px 2px rgba(255, 255, 255, 0.8)';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CityMarker({ city, width, height }: { city: CityData; width: number; height: number }) {
  const [hovered, setHovered] = useState(false);
  const selectCity = useAppStore((s) => s.selectCity);
  const setPhase = useAppStore((s) => s.setPhase);

  const pos = latLngToPixel(city.lat, city.lng, width, height);
  const dotSize = hovered ? 16 : 12;

  const handleClick = () => {
    selectCity(city.id);
    setPhase('sandbox');
  };

  const isLeft = city.labelSide === 'left';

  return (
    <motion.div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileTap={{ scale: 1.15 }}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: isLeft ? 'row-reverse' : 'row',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        zIndex: 10,
        userSelect: 'none',
      }}
    >
      {/* Dot with pulse ring */}
      <div
        style={{
          position: 'relative',
          width: dotSize,
          height: dotSize,
          flexShrink: 0,
          transition: 'width 0.2s ease, height 0.2s ease',
        }}
      >
        {/* Pulse ring */}
        <div
          style={{
            position: 'absolute',
            inset: -3,
            borderRadius: '50%',
            border: `2px solid ${city.dotColor}`,
            animation: 'city-pulse 2s ease-out infinite',
          }}
        />
        {/* Dot */}
        <div
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: city.dotColor,
            border: '3px solid rgba(255,255,255,0.95)',
            boxShadow: hovered ? city.glowShadowHover : city.glowShadow,
            transition: 'all 0.2s ease',
          }}
        />
      </div>

      {/* Label */}
      <div style={{ textAlign: isLeft ? 'right' : 'left' }}>
        <div
          style={{
            fontFamily: typography.body,
            fontWeight: 700,
            fontSize: 15,
            color: hovered ? city.dotColor : colors.ink,
            textShadow: TEXT_SHADOW_STRONG,
            transition: 'color 0.2s ease',
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
          }}
        >
          {city.label}
        </div>
        <div
          style={{
            fontFamily: typography.mono,
            fontSize: 10,
            color: colors.inkMuted,
            textShadow: TEXT_SHADOW_LIGHT,
            lineHeight: 1.3,
            whiteSpace: 'nowrap',
          }}
        >
          {city.coord}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MapLabels({ width, height }: MapLabelsProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width,
        height,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Inject pulse keyframes */}
      <style>{PULSE_KEYFRAMES}</style>

      {/* Country labels */}
      {COUNTRY_LABELS.map((c) => {
        const pos = latLngToPixel(c.lat, c.lng, width, height);
        const isSmall = 'small' in c && c.small;
        return (
          <div
            key={c.label}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              fontFamily: isSmall ? typography.body : typography.display,
              fontStyle: isSmall ? 'italic' : 'normal',
              textTransform: isSmall ? 'none' : 'uppercase',
              letterSpacing: isSmall ? '0.05em' : '0.3em',
              fontSize: c.size,
              color: colors.inkLight,
              opacity: isSmall ? 0.45 : 0.6,
              textShadow: TEXT_SHADOW_MEDIUM,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {c.label}
          </div>
        );
      })}

      {/* Water labels */}
      {WATER_LABELS.map((wl) => {
        const pos = latLngToPixel(wl.lat, wl.lng, width, height);
        return (
          <div
            key={wl.label}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              fontFamily: typography.body,
              fontStyle: 'italic',
              fontSize: wl.size,
              letterSpacing: '0.15em',
              color: colors.oceanDeep,
              opacity: 0.55,
              textShadow: '0 1px 3px rgba(255, 255, 255, 0.7)',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {wl.label}
          </div>
        );
      })}

      {/* Secondary city labels */}
      {SECONDARY_CITIES.map((c) => {
        const pos = latLngToPixel(c.lat, c.lng, width, height);
        return (
          <div
            key={c.label}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              userSelect: 'none',
            }}
          >
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: colors.inkLight,
                opacity: 0.5,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: typography.body,
                fontWeight: 400,
                fontSize: 11,
                color: colors.inkMuted,
                textShadow: TEXT_SHADOW_LIGHT,
                whiteSpace: 'nowrap',
              }}
            >
              {c.label}
            </span>
          </div>
        );
      })}

      {/* Peak labels */}
      {PEAKS.map((p) => {
        const pos = latLngToPixel(p.lat, p.lng, width, height);
        return (
          <div
            key={p.label}
            style={{
              position: 'absolute',
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              opacity: 0.5,
              userSelect: 'none',
              textShadow: TEXT_SHADOW_LIGHT,
            }}
          >
            <span style={{ fontSize: 8, color: colors.inkLight }}>&#9650;</span>
            <span
              style={{
                fontFamily: typography.mono,
                fontSize: 9,
                color: colors.inkLight,
                whiteSpace: 'nowrap',
              }}
            >
              {p.label} {p.elev}
            </span>
          </div>
        );
      })}

      {/* Primary city markers (interactive — re-enable pointer events) */}
      <div style={{ pointerEvents: 'auto' }}>
        {PRIMARY_CITIES.map((city) => (
          <CityMarker key={city.id} city={city} width={width} height={height} />
        ))}
      </div>
    </div>
  );
}
