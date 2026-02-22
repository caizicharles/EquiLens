import { useEffect, useRef, useState, useCallback } from 'react';
import { TerrainRenderer } from '../terrain/TerrainRenderer';
import { BOUNDS } from '../terrain/projection';
import MapLabels from './MapLabels';

// Correct aspect ratio accounting for latitude distortion
const LAT_RANGE = BOUNDS.maxLat - BOUNDS.minLat;
const LNG_RANGE = BOUNDS.maxLng - BOUNDS.minLng;
const MID_LAT = (BOUNDS.minLat + BOUNDS.maxLat) / 2;
const COS_FACTOR = Math.cos((MID_LAT * Math.PI) / 180);
const GEO_ASPECT = (LNG_RANGE * COS_FACTOR) / LAT_RANGE;

const PADDING = 48;

function computeSize(vpW: number, vpH: number) {
  const availW = vpW - PADDING * 2;
  const availH = vpH - PADDING * 2;

  let w: number, h: number;
  if (availW / availH > GEO_ASPECT) {
    h = availH;
    w = h * GEO_ASPECT;
  } else {
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
      }}
    >
      {/* Shared container — canvas + labels same size and position */}
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
  );
}
