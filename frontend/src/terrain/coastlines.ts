// Simplified coastline polygons for the British Isles
// Each array is [lat, lng] pairs tracing the outline clockwise
// These are approximate but aim for recognizable shapes

export const GREAT_BRITAIN: [number, number][] = [
  // Start at Land's End, Cornwall — go clockwise
  [50.07, -5.71],
  [50.05, -5.53],
  [50.12, -5.32],
  [50.21, -5.05],
  [50.33, -4.78],
  [50.35, -4.55],
  [50.22, -4.20],
  [50.36, -4.12],
  [50.52, -3.55],
  [50.62, -3.40],
  [50.57, -3.07],
  // South coast Devon/Dorset
  [50.63, -2.46],
  [50.61, -1.97],
  [50.72, -1.75],
  [50.73, -1.33],
  // Solent / Isle of Wight area
  [50.78, -1.10],
  [50.80, -0.84],
  [50.77, -0.25],
  // Sussex / Kent coast
  [50.78, 0.10],
  [50.88, 0.45],
  [50.91, 0.72],
  [51.07, 1.10],
  [51.13, 1.30],
  // North Foreland round to Thames Estuary
  [51.37, 1.42],
  [51.39, 1.18],
  // Essex coast / Thames Estuary north side
  [51.52, 0.95],
  [51.58, 1.00],
  [51.73, 1.10],
  // Suffolk coast
  [51.88, 1.25],
  [52.05, 1.35],
  [52.22, 1.58],
  // Norfolk — East Anglia bulge (pronounced eastward)
  [52.40, 1.72],
  [52.55, 1.78],
  [52.68, 1.75],
  [52.82, 1.68],
  [52.95, 1.55],
  // The Wash indent
  [52.98, 1.15],
  [52.94, 0.55],
  [52.82, 0.18],
  [52.93, 0.30],
  [53.01, 0.15],
  // Lincolnshire coast
  [53.20, 0.08],
  [53.37, -0.04],
  [53.52, -0.08],
  // Humber Estuary
  [53.57, -0.07],
  [53.63, 0.02],
  [53.72, -0.15],
  // Yorkshire coast
  [54.00, -0.20],
  [54.12, -0.17],
  [54.28, -0.40],
  [54.49, -0.60],
  // Northumberland
  [54.65, -1.18],
  [54.95, -1.38],
  [55.17, -1.53],
  [55.37, -1.62],
  [55.58, -1.77],
  // Scottish east coast — Berwick to Edinburgh area
  [55.77, -1.98],
  [55.92, -2.05],
  [56.00, -2.46],
  // Firth of Forth
  [56.07, -2.72],
  [56.07, -3.13],
  [56.18, -3.10],
  [56.20, -2.85],
  // Fife coast
  [56.33, -2.60],
  [56.42, -2.52],
  [56.45, -2.80],
  // Angus / Aberdeenshire
  [56.55, -2.72],
  [56.70, -2.48],
  [56.88, -2.25],
  [57.10, -2.08],
  [57.30, -1.95],
  [57.50, -1.82],
  // Moray Firth
  [57.68, -2.00],
  [57.70, -2.58],
  [57.62, -3.15],
  [57.58, -3.55],
  [57.69, -3.85],
  [57.83, -3.95],
  // Northeast coast up to Duncansby Head
  [57.95, -4.05],
  [58.15, -4.25],
  [58.30, -4.10],
  [58.40, -3.55],
  [58.47, -3.10],
  // Duncansby Head — northeast corner
  [58.62, -3.02],
  // North coast runs east-west (flat top of Scotland)
  [58.58, -3.30],
  [58.57, -3.80],
  [58.55, -4.20],
  [58.52, -4.60],
  [58.50, -4.85],
  // Cape Wrath — northwest corner
  [58.60, -5.00],
  [58.58, -4.98],
  // Northwest Highlands coast — very jagged, south along west coast
  [58.42, -5.02],
  [58.28, -5.05],
  [58.15, -5.10],
  [58.00, -5.15],
  [57.85, -5.25],
  [57.68, -5.38],
  [57.55, -5.50],
  // Wester Ross / Skye area
  [57.42, -5.62],
  [57.28, -5.72],
  [57.15, -5.82],
  [57.00, -5.85],
  [56.88, -5.78],
  [56.72, -5.68],
  // Oban area
  [56.55, -5.52],
  [56.42, -5.48],
  [56.28, -5.52],
  // Firth of Clyde / Kintyre
  [56.12, -5.48],
  [55.95, -5.62],
  [55.78, -5.68],
  [55.58, -5.55],
  [55.43, -5.45],
  [55.30, -5.65],
  // Ayrshire coast
  [55.18, -5.10],
  [55.08, -4.93],
  [54.98, -4.90],
  // Galloway
  [54.88, -5.00],
  [54.73, -5.10],
  [54.63, -4.90],
  [54.68, -4.40],
  // Solway Firth
  [54.85, -3.60],
  [54.80, -3.25],
  // Cumbria coast
  [54.65, -3.45],
  [54.50, -3.55],
  [54.35, -3.50],
  // Lancashire / Morecambe Bay
  [54.18, -3.25],
  [54.05, -2.88],
  [53.88, -3.05],
  // Liverpool Bay
  [53.75, -3.10],
  [53.60, -3.08],
  [53.40, -3.10],
  [53.33, -3.15],
  // North Wales coast
  [53.28, -3.50],
  [53.20, -3.83],
  [53.25, -4.10],
  [53.30, -4.40],
  // Anglesey
  [53.25, -4.55],
  [53.35, -4.65],
  [53.42, -4.55],
  [53.38, -4.32],
  [53.25, -4.35],
  // Lleyn Peninsula
  [52.95, -4.48],
  [52.83, -4.60],
  [52.79, -4.72],
  // Cardigan Bay
  [52.55, -4.50],
  [52.28, -4.30],
  [52.08, -4.55],
  [51.90, -4.80],
  // Pembrokeshire
  [51.72, -5.10],
  [51.62, -5.08],
  [51.60, -4.70],
  [51.55, -4.25],
  // Swansea Bay / Gower
  [51.55, -3.97],
  [51.48, -3.78],
  // Bristol Channel — South Wales side
  [51.42, -3.50],
  [51.38, -3.17],
  // Severn Estuary
  [51.45, -2.98],
  [51.55, -2.68],
  // Bristol Channel — Somerset side
  [51.33, -3.00],
  [51.22, -3.20],
  [51.20, -3.55],
  // North Devon coast
  [51.10, -3.80],
  [51.00, -4.15],
  [50.95, -4.40],
  [50.82, -4.55],
  // Cornwall north coast
  [50.68, -4.82],
  [50.55, -5.00],
  [50.40, -5.18],
  [50.27, -5.40],
  // Back to Land's End
  [50.07, -5.71],
];

export const IRELAND: [number, number][] = [
  // Start at southeast — Carnsore Point, go clockwise (south coast first)
  [52.10, -6.40],
  // Wexford / Waterford coast
  [52.13, -6.68],
  [52.07, -6.95],
  [52.05, -7.15],
  [51.95, -7.33],
  [51.83, -7.55],
  // Cork coast
  [51.70, -7.82],
  [51.63, -8.15],
  [51.60, -8.50],
  [51.55, -8.85],
  [51.45, -9.30],
  // Kerry — Dingle Peninsula jutting southwest
  [51.62, -9.55],
  [51.78, -9.85],
  [52.10, -10.35],
  [52.05, -10.50],
  // Iveragh Peninsula (Ring of Kerry)
  [51.80, -10.42],
  [51.72, -10.15],
  [51.80, -9.85],
  [51.92, -9.78],
  // Shannon Estuary — significant indent
  [52.30, -9.95],
  [52.45, -9.85],
  [52.58, -9.55],
  [52.60, -9.30],
  [52.55, -9.55],
  // Loop Head / Clare coast
  [52.65, -9.92],
  [52.78, -9.98],
  [52.88, -9.90],
  // Galway Bay — significant indent
  [53.02, -9.95],
  [53.10, -10.02],
  [53.15, -9.65],
  [53.10, -9.30],
  [53.15, -9.05],
  // Connemara — westernmost jutting
  [53.28, -9.55],
  [53.38, -10.05],
  [53.48, -10.18],
  [53.55, -10.08],
  // Clew Bay area
  [53.65, -10.05],
  [53.78, -9.88],
  [53.82, -9.78],
  // Achill Island / Mayo NW coast
  [53.90, -10.00],
  [54.00, -10.05],
  [54.12, -9.98],
  // Donegal Bay — noticeable indent
  [54.22, -9.85],
  [54.28, -9.50],
  [54.32, -8.95],
  [54.40, -8.55],
  [54.48, -8.40],
  // Donegal coast — northwest peninsula
  [54.62, -8.48],
  [54.73, -8.35],
  [54.82, -8.18],
  [54.95, -8.05],
  [55.08, -7.88],
  [55.18, -7.72],
  // Malin Head — northernmost point
  [55.38, -7.38],
  [55.33, -7.12],
  [55.22, -6.92],
  [55.18, -6.78],
  // North coast — east toward Antrim
  [55.20, -6.50],
  [55.25, -6.20],
  [55.22, -5.98],
  // Northeast — Antrim coast
  [55.17, -5.90],
  [55.08, -5.92],
  [54.95, -5.82],
  // Belfast Lough area
  [54.78, -5.70],
  [54.68, -5.60],
  [54.60, -5.52],
  // Ards Peninsula / Strangford
  [54.48, -5.45],
  [54.35, -5.48],
  [54.22, -5.55],
  // Down coast — Mourne area (NI)
  [54.05, -5.75],
  // Carlingford Lough — smoother transition westward
  [54.00, -5.95],
  // Cooley Peninsula — curves eastward before Dundalk Bay
  [53.95, -5.98],
  // East coast — Dundalk Bay to Drogheda
  [53.85, -6.08],
  [53.72, -6.10],
  [53.58, -6.07],
  // Dublin Bay — with indent (Howth Head → bay → Dalkey)
  [53.40, -6.02],
  [53.35, -6.10],
  [53.28, -6.04],
  // Bray / north Wicklow
  [53.18, -6.00],
  // Wicklow coast
  [53.00, -5.97],
  [52.80, -6.00],
  [52.60, -6.10],
  [52.35, -6.28],
  // Back to start — Carnsore Point
  [52.10, -6.40],
];

export const ISLE_OF_MAN: [number, number][] = [
  // Small oval island, centered ~54.23, -4.52
  [54.38, -4.45],
  [54.35, -4.35],
  [54.30, -4.32],
  [54.25, -4.33],
  [54.18, -4.38],
  [54.10, -4.45],
  [54.08, -4.53],
  [54.10, -4.63],
  [54.15, -4.68],
  [54.22, -4.70],
  [54.28, -4.65],
  [54.33, -4.58],
  [54.38, -4.45],
];

// ---------------------------------------------------------------------------
// Catmull-Rom spline smoothing (centripetal, alpha=0.5)
// ---------------------------------------------------------------------------
function catmullRomPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number,
): [number, number] {
  // Centripetal parameterization
  const alpha = 0.5;

  function dist(a: [number, number], b: [number, number]) {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  const d01 = Math.pow(dist(p0, p1), alpha);
  const d12 = Math.pow(dist(p1, p2), alpha);
  const d23 = Math.pow(dist(p2, p3), alpha);

  // Avoid division by zero for duplicate points
  const t0 = 0;
  const t1 = t0 + (d01 || 1e-6);
  const t2 = t1 + (d12 || 1e-6);
  const t3 = t2 + (d23 || 1e-6);

  const tt = t1 + t * (t2 - t1);

  const result: [number, number] = [0, 0];
  for (let dim = 0; dim < 2; dim++) {
    const a1 =
      ((t1 - tt) / (t1 - t0)) * p0[dim] + ((tt - t0) / (t1 - t0)) * p1[dim];
    const a2 =
      ((t2 - tt) / (t2 - t1)) * p1[dim] + ((tt - t1) / (t2 - t1)) * p2[dim];
    const a3 =
      ((t3 - tt) / (t3 - t2)) * p2[dim] + ((tt - t2) / (t3 - t2)) * p3[dim];

    const b1 =
      ((t2 - tt) / (t2 - t0)) * a1 + ((tt - t0) / (t2 - t0)) * a2;
    const b2 =
      ((t3 - tt) / (t3 - t1)) * a2 + ((tt - t1) / (t3 - t1)) * a3;

    result[dim] =
      ((t2 - tt) / (t2 - t1)) * b1 + ((tt - t1) / (t2 - t1)) * b2;
  }

  return result;
}

export function catmullRomSmooth(
  points: [number, number][],
  subdivisions = 10,
): [number, number][] {
  const n = points.length;
  if (n < 3) return points;

  // Remove duplicate closing point if present
  const last = points[n - 1];
  const first = points[0];
  const isClosed =
    Math.abs(last[0] - first[0]) < 1e-6 && Math.abs(last[1] - first[1]) < 1e-6;
  const pts = isClosed ? points.slice(0, -1) : points;
  const len = pts.length;

  const result: [number, number][] = [];

  for (let i = 0; i < len; i++) {
    const p0 = pts[(i - 1 + len) % len];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % len];
    const p3 = pts[(i + 2) % len];

    for (let s = 0; s < subdivisions; s++) {
      const t = s / subdivisions;
      result.push(catmullRomPoint(p0, p1, p2, p3, t));
    }
  }

  // Close the polygon
  result.push(result[0]);

  return result;
}
