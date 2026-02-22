import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TerrainRenderer } from '../terrain/TerrainRenderer';
import { BOUNDS } from '../terrain/projection';
import MapLabels from './MapLabels';
import SandboxPanel from './SandboxPanel';
import { spacing } from '../style';

// Same aspect-ratio logic as TerrainMap, but sized for left 55%
const LAT_RANGE = BOUNDS.maxLat - BOUNDS.minLat;
const LNG_RANGE = BOUNDS.maxLng - BOUNDS.minLng;
const MID_LAT = (BOUNDS.minLat + BOUNDS.maxLat) / 2;
const COS_FACTOR = Math.cos((MID_LAT * Math.PI) / 180);
const GEO_ASPECT = (LNG_RANGE * COS_FACTOR) / LAT_RANGE;

const MAP_FRACTION = 0.55;
const PANEL_FRACTION = 0.45;
const PADDING = spacing.xl;

function computeMapSize(vpW: number, vpH: number) {
  const mapAreaW = vpW * MAP_FRACTION - PADDING * 2;
  const availH = vpH - PADDING * 2;

  let w: number, h: number;
  if (mapAreaW / availH > GEO_ASPECT) {
    h = availH;
    w = h * GEO_ASPECT;
  } else {
    w = mapAreaW;
    h = w / GEO_ASPECT;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

export default function SandboxLayout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const [size, setSize] = useState(() =>
    computeMapSize(window.innerWidth, window.innerHeight),
  );

  const handleResize = useCallback(() => {
    setSize(computeMapSize(window.innerWidth, window.innerHeight));
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(handleResize, 150);
    };
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [handleResize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new TerrainRenderer(canvas);
    rendererRef.current = renderer;
    renderer.render();

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, [size]);

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
      {/* Left: Terrain map (55%) */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          width: `${MAP_FRACTION * 100}%`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ position: 'relative', width: size.width, height: size.height }}>
          <canvas
            ref={canvasRef}
            style={{
              width: size.width,
              height: size.height,
              display: 'block',
            }}
          />
          <MapLabels width={size.width} height={size.height} />
        </div>
      </motion.div>

      {/* Right: Config panel (45%) */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
        style={{
          width: `${PANEL_FRACTION * 100}%`,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          padding: PADDING,
          boxSizing: 'border-box',
        }}
      >
        <SandboxPanel />
      </motion.div>
    </div>
  );
}
