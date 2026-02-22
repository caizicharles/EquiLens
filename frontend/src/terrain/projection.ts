// Equirectangular projection for the British Isles

const BOUNDS = {
  minLat: 49.5,
  maxLat: 59.0,
  minLng: -10.5,
  maxLng: 2.5,
} as const;

export function latLngToPixel(
  lat: number,
  lng: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const x =
    ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * canvasWidth;
  const y =
    ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * canvasHeight;
  return { x, y };
}

export function pixelToLatLng(
  x: number,
  y: number,
  canvasWidth: number,
  canvasHeight: number,
): { lat: number; lng: number } {
  const lng =
    (x / canvasWidth) * (BOUNDS.maxLng - BOUNDS.minLng) + BOUNDS.minLng;
  const lat =
    BOUNDS.maxLat - (y / canvasHeight) * (BOUNDS.maxLat - BOUNDS.minLat);
  return { lat, lng };
}

export { BOUNDS };
