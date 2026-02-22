import { latLngToPixel } from './projection';
import { GREAT_BRITAIN, IRELAND, ISLE_OF_MAN } from './coastlines';
import { SimplexNoise } from './noise';

// ---------------------------------------------------------------------------
// Terrain color stops (lowland green → highland grey)
// ---------------------------------------------------------------------------
interface RGB {
  r: number;
  g: number;
  b: number;
}

const TERRAIN_STOPS: { t: number; color: RGB }[] = [
  { t: 0.0, color: { r: 198, g: 222, b: 172 } },   // lowland fresh green
  { t: 0.3, color: { r: 185, g: 212, b: 156 } },   // lowland deeper green
  { t: 0.5, color: { r: 172, g: 200, b: 144 } },   // rolling hills green
  { t: 0.7, color: { r: 190, g: 196, b: 168 } },   // upland sage-grey
  { t: 0.85, color: { r: 205, g: 208, b: 196 } },  // mountain muted sage
  { t: 1.0, color: { r: 218, g: 218, b: 212 } },   // peak light grey
];

function sampleTerrainColor(t: number): RGB {
  const clamped = Math.max(0, Math.min(1, t));
  for (let i = 1; i < TERRAIN_STOPS.length; i++) {
    if (clamped <= TERRAIN_STOPS[i].t) {
      const a = TERRAIN_STOPS[i - 1];
      const b = TERRAIN_STOPS[i];
      const f = (clamped - a.t) / (b.t - a.t);
      return {
        r: a.color.r + (b.color.r - a.color.r) * f,
        g: a.color.g + (b.color.g - a.color.g) * f,
        b: a.color.b + (b.color.b - a.color.b) * f,
      };
    }
  }
  const last = TERRAIN_STOPS[TERRAIN_STOPS.length - 1].color;
  return { ...last };
}

// ---------------------------------------------------------------------------
// Elevation zones — approximate real UK geography
// ---------------------------------------------------------------------------
interface ElevationZone {
  lat: number;
  lng: number;
  boost: number;
  sigmaLat: number;
  sigmaLng: number;
}

const ELEVATION_ZONES: ElevationZone[] = [
  // Scottish Highlands
  { lat: 57.2, lng: -5.0, boost: 0.35, sigmaLat: 1.2, sigmaLng: 1.0 },
  // Cairngorms / Grampians
  { lat: 56.9, lng: -3.7, boost: 0.3, sigmaLat: 0.6, sigmaLng: 0.8 },
  // Southern Uplands
  { lat: 55.4, lng: -3.5, boost: 0.12, sigmaLat: 0.5, sigmaLng: 1.0 },
  // Lake District
  { lat: 54.5, lng: -3.1, boost: 0.18, sigmaLat: 0.25, sigmaLng: 0.3 },
  // Pennines
  { lat: 54.2, lng: -2.2, boost: 0.1, sigmaLat: 1.0, sigmaLng: 0.3 },
  // Snowdonia
  { lat: 53.05, lng: -3.9, boost: 0.15, sigmaLat: 0.2, sigmaLng: 0.25 },
  // Welsh hills
  { lat: 52.2, lng: -3.5, boost: 0.08, sigmaLat: 0.6, sigmaLng: 0.5 },
  // Dartmoor / Exmoor
  { lat: 50.65, lng: -3.8, boost: 0.07, sigmaLat: 0.2, sigmaLng: 0.4 },
  // Wicklow Mountains (Ireland)
  { lat: 53.0, lng: -6.3, boost: 0.12, sigmaLat: 0.3, sigmaLng: 0.3 },
  // Connemara / West Ireland
  { lat: 53.5, lng: -9.8, boost: 0.08, sigmaLat: 0.4, sigmaLng: 0.3 },
  // Kerry Mountains (Ireland)
  { lat: 51.85, lng: -9.8, boost: 0.1, sigmaLat: 0.25, sigmaLng: 0.3 },
  // Donegal Highlands
  { lat: 54.9, lng: -7.9, boost: 0.1, sigmaLat: 0.3, sigmaLng: 0.4 },
  // Mourne Mountains
  { lat: 54.15, lng: -5.95, boost: 0.1, sigmaLat: 0.15, sigmaLng: 0.2 },
];

function computeElevationBoost(lat: number, lng: number): number {
  let boost = 0;
  for (const zone of ELEVATION_ZONES) {
    const dLat = (lat - zone.lat) / zone.sigmaLat;
    const dLng = (lng - zone.lng) / zone.sigmaLng;
    boost += zone.boost * Math.exp(-0.5 * (dLat * dLat + dLng * dLng));
  }
  return boost;
}

// ---------------------------------------------------------------------------
// Polygon helpers
// ---------------------------------------------------------------------------
function polygonToPixels(
  polygon: [number, number][],
  w: number,
  h: number,
): { x: number; y: number }[] {
  return polygon.map(([lat, lng]) => latLngToPixel(lat, lng, w, h));
}

function drawPolygonPath(ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) {
  if (pts.length === 0) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// TerrainRenderer
// ---------------------------------------------------------------------------
export class TerrainRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    this.dpr = window.devicePixelRatio || 1;
  }

  render(): void {
    const { canvas, ctx, dpr } = this;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;

    // Set physical pixel dimensions for retina clarity
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = cssW;
    const h = cssH;

    // --- Layer 1: Clear canvas (transparent — heroWash gradient shows through) ---
    ctx.clearRect(0, 0, w, h);

    // --- Build land mask on offscreen canvas ---
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const maskCtx = maskCanvas.getContext('2d')!;

    const landMasses = [
      { poly: GREAT_BRITAIN, id: 1 },
      { poly: IRELAND, id: 2 },
      { poly: ISLE_OF_MAN, id: 3 },
    ];

    // Fill each land mass with a unique red channel value
    for (const lm of landMasses) {
      const pts = polygonToPixels(lm.poly, w, h);
      drawPolygonPath(maskCtx, pts);
      maskCtx.fillStyle = `rgb(${lm.id}, 0, 0)`;
      maskCtx.fill();
    }

    const maskData = maskCtx.getImageData(0, 0, w, h).data;

    // --- Layer 2 + 3: Terrain + Hillshading ---
    const noise1 = new SimplexNoise(42);
    const noise2 = new SimplexNoise(97);

    // First pass: compute elevation grid
    const elevation = new Float32Array(w * h);
    const noiseScale = 0.008;
    const noiseScale2 = 0.012;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = py * w + px;
        const maskIdx = idx * 4;

        if (maskData[maskIdx] === 0) {
          elevation[idx] = -1; // ocean
          continue;
        }

        // Convert pixel back to approximate lat/lng for elevation zones
        const lat = 59.0 - (py / h) * 9.5; // maxLat - (py/h) * (maxLat - minLat)
        const lng = -10.5 + (px / w) * 13.0; // minLng + (px/w) * (maxLng - minLng)

        // Primary noise
        const n1 = noise1.fbm(px * noiseScale, py * noiseScale, 3, 2.0, 0.5);
        // Secondary noise at different frequency
        const n2 = noise2.fbm(px * noiseScale2, py * noiseScale2, 3, 2.0, 0.5);

        // Combine: primary 70%, secondary 30%, shift to 0-1 range
        let elev = (n1 * 0.7 + n2 * 0.3) * 0.5 + 0.35;

        // Add geographic elevation zones
        elev += computeElevationBoost(lat, lng);

        elevation[idx] = Math.max(0, Math.min(1, elev));
      }
    }

    // Second pass: render with hillshading
    const imageData = ctx.getImageData(0, 0, w * dpr, h * dpr);
    const pixels = imageData.data;

    // Light direction: from northwest (top-left)
    const lightX = -1;
    const lightY = -1;
    const lightLen = Math.sqrt(lightX * lightX + lightY * lightY);
    const lx = lightX / lightLen;
    const ly = lightY / lightLen;

    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const idx = py * w + px;

        if (elevation[idx] < 0) continue; // skip ocean pixels

        const elev = elevation[idx];
        const color = sampleTerrainColor(elev);

        // Compute hillshade via finite-difference gradient
        let shade = 1.0;
        if (px > 0 && px < w - 1 && py > 0 && py < h - 1) {
          const eL = elevation[idx - 1] >= 0 ? elevation[idx - 1] : elev;
          const eR = elevation[idx + 1] >= 0 ? elevation[idx + 1] : elev;
          const eU = elevation[idx - w] >= 0 ? elevation[idx - w] : elev;
          const eD = elevation[idx + w] >= 0 ? elevation[idx + w] : elev;

          const dx = (eR - eL) * 2;
          const dy = (eD - eU) * 2;

          // Dot product with light direction
          const dot = -(dx * lx + dy * ly);
          shade = 1.0 + dot * 0.25; // subtle: 0.75 to 1.25
          shade = Math.max(0.85, Math.min(1.15, shade));
        }

        const r = Math.max(0, Math.min(255, Math.round(color.r * shade)));
        const g = Math.max(0, Math.min(255, Math.round(color.g * shade)));
        const b = Math.max(0, Math.min(255, Math.round(color.b * shade)));

        // Write to every physical pixel this CSS pixel covers
        for (let dy = 0; dy < dpr; dy++) {
          for (let dx = 0; dx < dpr; dx++) {
            const physX = px * dpr + dx;
            const physY = py * dpr + dy;
            if (physX >= w * dpr || physY >= h * dpr) continue;
            const pIdx = (physY * w * dpr + physX) * 4;
            pixels[pIdx] = r;
            pixels[pIdx + 1] = g;
            pixels[pIdx + 2] = b;
            pixels[pIdx + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // --- Layer 4: Coastline stroke ---
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = 'rgba(100, 120, 90, 0.3)';
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';

    for (const lm of landMasses) {
      const pts = polygonToPixels(lm.poly, w, h);
      drawPolygonPath(ctx, pts);
      ctx.stroke();
    }
  }

  resize(_width: number, _height: number): void {
    this.render();
  }

  destroy(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
