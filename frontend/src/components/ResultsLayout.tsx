import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TerrainRenderer } from '../terrain/TerrainRenderer';
import { BOUNDS } from '../terrain/projection';
import MapLabels from './MapLabels';
import CollapsedSandbox from './CollapsedSandbox';
import ResultsPanel from './ResultsPanel';

// Same aspect-ratio logic as other layouts
const LAT_RANGE = BOUNDS.maxLat - BOUNDS.minLat;
const LNG_RANGE = BOUNDS.maxLng - BOUNDS.minLng;
const MID_LAT = (BOUNDS.minLat + BOUNDS.maxLat) / 2;
const COS_FACTOR = Math.cos((MID_LAT * Math.PI) / 180);
const GEO_ASPECT = (LNG_RANGE * COS_FACTOR) / LAT_RANGE;

const MAP_FRACTION = 0.55;
const COLLAPSED_FRACTION = 0.12;
const RESULTS_FRACTION = 0.33;
const PADDING = 32;

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

export default function ResultsLayout() {
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
      <div
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
      </div>

      {/* Middle: Collapsed sandbox summary (12%) */}
      <motion.div
        initial={{ width: '40%' }}
        animate={{ width: `${COLLAPSED_FRACTION * 100}%` }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <CollapsedSandbox />
      </motion.div>

      {/* Right: Results panel (33%) */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        style={{
          width: `${RESULTS_FRACTION * 100}%`,
          height: '100%',
          flexShrink: 0,
          padding: `${PADDING}px ${PADDING}px ${PADDING}px 0`,
          boxSizing: 'border-box',
        }}
      >
        <ResultsPanel />
      </motion.div>
    </div>
  );
}
