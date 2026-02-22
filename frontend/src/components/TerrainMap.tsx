import { useEffect, useRef, useState, useCallback } from 'react';
import { TerrainRenderer } from '../terrain/TerrainRenderer';
import { BOUNDS } from '../terrain/projection';

// Correct aspect ratio accounting for latitude distortion
// At ~54° latitude, 1° longitude ≈ cos(54°) ≈ 0.588 × 1° latitude
const LAT_RANGE = BOUNDS.maxLat - BOUNDS.minLat; // 9.5
const LNG_RANGE = BOUNDS.maxLng - BOUNDS.minLng; // 13.0
const MID_LAT = (BOUNDS.minLat + BOUNDS.maxLat) / 2; // ~54.25
const COS_FACTOR = Math.cos((MID_LAT * Math.PI) / 180); // ~0.584
const GEO_ASPECT = (LNG_RANGE * COS_FACTOR) / LAT_RANGE; // width / height ≈ 0.80

const PADDING = 48;

function computeSize(vpW: number, vpH: number) {
  const availW = vpW - PADDING * 2;
  const availH = vpH - PADDING * 2;

  let w: number, h: number;
  if (availW / availH > GEO_ASPECT) {
    // viewport is wider than the map — constrain by height
    h = availH;
    w = h * GEO_ASPECT;
  } else {
    // viewport is taller — constrain by width
    w = availW;
    h = w / GEO_ASPECT;
  }

  return { width: Math.round(w), height: Math.round(h) };
}

export default function TerrainMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TerrainRenderer | null>(null);
  const [size, setSize] = useState(() =>
    computeSize(window.innerWidth, window.innerHeight),
  );

  const handleResize = useCallback(() => {
    setSize(computeSize(window.innerWidth, window.innerHeight));
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: size.width,
          height: size.height,
          display: 'block',
          pointerEvents: 'auto',
        }}
      />
    </div>
  );
}
