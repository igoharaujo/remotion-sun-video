// Side-view fold geometry, built by integrating a curvature profile along the screen's length.
// t = 0 is flat; t = 1 is closed (the two halves parallel, rising up from a fold at the bottom).
// "v": all the bending happens in a 14 px kink (a sharp crease).
// "drop": the teardrop hinge. A small outward counter-bend, a wide bulb, a counter-bend back,
// so the same total turn is spread over a large radius.

export type FoldKind = "v" | "drop";
export type FoldPoint = { x: number; y: number; k: number };

const HALF = 190;
const BEND = 300;
const KINK = 14;
const ALPHA = 1.0;
const N = 300;

/** Total turn (radians) accumulated from the start to arc length s, at fold progress t. Exact, so a
 *  6 px kink is never missed by the sampling. */
const turn = (kind: FoldKind, s: number, t: number) => {
  const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
  if (kind === "v") return clamp01((s - (HALF + BEND / 2 - KINK / 2)) / KINK) * Math.PI * t;
  const u = clamp01((s - HALF) / BEND);
  const lobe = (x: number) => clamp01(x / 0.2);
  const mid = clamp01((u - 0.2) / 0.6);
  return t * (-ALPHA * lobe(u) + (Math.PI + 2 * ALPHA) * mid - ALPHA * lobe(u - 0.8));
};

/** Points (SVG coords, y down) with the fold's midpoint at (cx, cy); `k` is the mean curvature (1/px)
 *  of the segment ending at that point. */
export const foldCurve = (kind: FoldKind, t: number, cx: number, cy: number, scale = 1): FoldPoint[] => {
  const L = 2 * HALF + BEND;
  const ds = L / N;
  const th0 = (-Math.PI * t) / 2;
  let x = 0;
  let y = 0;
  const pts: FoldPoint[] = [{ x, y, k: 0 }];
  for (let i = 1; i <= N; i++) {
    const s = i * ds;
    const th = th0 + turn(kind, s - ds / 2, t);
    x += Math.cos(th) * ds;
    y += Math.sin(th) * ds;
    pts.push({ x, y, k: (turn(kind, s, t) - turn(kind, s - ds, t)) / ds });
  }
  const mid = pts[N / 2];
  return pts.map((p) => ({ x: cx + (p.x - mid.x) * scale, y: cy - (p.y - mid.y) * scale, k: p.k / scale }));
};

export const toPath = (pts: FoldPoint[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

/** Fit a circle to the bulb of a closed teardrop: centre = mean of the bulb points, radius = mean distance. */
export const bulbCircle = (pts: FoldPoint[]) => {
  const n = pts.length - 1;
  const a = Math.round(n * ((HALF + 0.2 * BEND) / (2 * HALF + BEND)));
  const b = Math.round(n * ((HALF + 0.8 * BEND) / (2 * HALF + BEND)));
  const bulb = pts.slice(a, b + 1);
  const cx = bulb.reduce((s, p) => s + p.x, 0) / bulb.length;
  const cy = bulb.reduce((s, p) => s + p.y, 0) / bulb.length;
  const r = bulb.reduce((s, p) => s + Math.hypot(p.x - cx, p.y - cy), 0) / bulb.length;
  return { cx, cy, r };
};

/** 0 (relaxed) .. 1 (concentrated) stress colour key from curvature. */
export const stress = (k: number) => {
  const x = Math.min(1, Math.max(0, (Math.abs(k) - 0.03) / 0.1));
  return x * x * (3 - 2 * x);
};

/** Green -> yellow -> red for stress 0..1. */
export const stressColor = (s: number) => {
  const g = [59, 255, 154];
  const y = [255, 214, 64];
  const r = [255, 59, 59];
  const [a, b, u] = s < 0.5 ? [g, y, s * 2] : [y, r, (s - 0.5) * 2];
  return `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * u)).join(",")})`;
};
