// Camera and the browser-window field as pure functions of the frame. Shared by the 3D scene and
// the 2D HUD (chips and the cursor project the same world points with the same camera).
//
// Layers (parallax): near panes at the frame edges, the mid "mural" grid the camera dollies past,
// a far field fading into the fog. On top: the 47 hook windows flying in, hero windows pulled out of
// the mural in front of the camera, the S03 close-one-open-three beat, and the S06/S07 multiplication.
import { random } from "remotion";
import * as THREE from "three";
import { DURATION, FPS, H, K, PAUSE, SC, W, backOut, easeIn, easeInOut, energyAt, expOut, mix, prog, stutterFrame, win } from "../tl";
import { Cell } from "./atlas";

export const FOV = 40;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
export const WIN = { w: 1.6, h: 1.0, margin: 0.16 };
/** Screen pixels per world unit at distance `d` from the camera. */
export const unitPx = (d: number) => H / 2 / (d * TAN);

// ---- camera ------------------------------------------------------------------------------------
export const cameraAt = (rawFrame: number) => {
  const frame = stutterFrame(rawFrame);
  const t = frame / FPS;
  const e = 0.5 + 0.8 * energyAt(frame);
  // Lateral dolly past the mural during the conversational lines, settling back to centre.
  const keys = [SC.S02.from - 30, SC.S02.from + 60, SC.S03.to, SC.S05.to];
  const vals = [0, -0.9, 1.1, 0];
  let dolly = 0;
  for (let i = 0; i < keys.length - 1; i++) if (frame >= keys[i]) dolly = mix(vals[i], vals[i + 1], prog(frame, keys[i], keys[i + 1], easeInOut));
  const x = dolly + 0.08 * e * Math.sin(t * 0.37 + 1.3);
  const y = 0.06 * e * Math.sin(t * 0.23 + 0.4);
  let z: number;
  if (frame < SC.S08.from) {
    z =
      11.6 -
      1.6 * prog(frame, 0, SC.S01.to, easeInOut) - // hook push-in while the windows arrive
      1.4 * prog(frame, SC.S04.from, SC.S04.to, easeInOut) + // serious: slow, heavy push
      1.8 * prog(frame, SC.S05.from, SC.S05.to, easeInOut) - // curious: gradual pull-out
      2.4 * prog(frame, K("S06", "toda"), SC.S06.to, easeIn) + // climax: dramatic push
      5.0 * prog(frame, K("S07", "enquanto") - 2, K("S07", "enquanto") + 28, expOut); // zoo: hard pull-back
  } else {
    // Clean stage after the blackout: hard cut back in, then a slow push to the CTA.
    z = 10.2 - 0.9 * prog(frame, SC.S08.from, DURATION, easeInOut);
  }
  return { x, y, z };
};

const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
export const lookAtFor = (frame: number) => {
  const c = cameraAt(frame);
  return new THREE.Vector3(c.x * 0.9, c.y * 0.5, c.z - 10);
};
const setCam = (frame: number) => {
  const c = cameraAt(frame);
  cam.position.set(c.x, c.y, c.z);
  cam.lookAt(lookAtFor(frame));
  cam.updateMatrixWorld();
  return cam;
};
export const project = (p: THREE.Vector3, frame: number) => {
  const v = p.clone().project(setCam(frame));
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

// ---- slots ---------------------------------------------------------------------------------------
type Layer = "near" | "mid" | "far" | "extra";
type Slot = { pos: THREE.Vector3; rot: THREE.Euler; cell: Cell; layer: Layer; seed: number };
const r = (k: string) => random(`slot-${k}`);
const CELLS = [Cell.Search, Cell.Video, Cell.Shop, Cell.News, Cell.Mail, Cell.Search, Cell.Video, Cell.Shop, Cell.Recipe, Cell.Doc];
const cellFor = (k: string) => CELLS[Math.floor(r(`cell-${k}`) * CELLS.length)];
const rotFor = (k: string, p: THREE.Vector3) =>
  new THREE.Euler(p.y * 0.02 + (r(`rx-${k}`) - 0.5) * 0.14, -p.x * 0.05 + (r(`ry-${k}`) - 0.5) * 0.25, (r(`rz-${k}`) - 0.5) * 0.06);

const SLOTS: Slot[] = [];
const add = (layer: Layer, k: string, pos: THREE.Vector3) => SLOTS.push({ pos, rot: rotFor(k, pos), cell: cellFor(k), layer, seed: r(`seed-${k}`) });
// Mid mural: 8x8 jittered grid.
for (let row = 0; row < 8; row++)
  for (let col = 0; col < 8; col++) {
    const k = `m${row}-${col}`;
    add("mid", k, new THREE.Vector3(-6.4 + col * 1.83 + (r(`jx-${k}`) - 0.5) * 0.5, -4.2 + row * 1.2 + (r(`jy-${k}`) - 0.5) * 0.3, -1.0 + r(`jz-${k}`) * 1.6));
  }
// Near panes at the frame edges.
for (let i = 0; i < 24; i++) {
  const k = `n${i}`;
  const side = i % 2 ? 1 : -1;
  add("near", k, new THREE.Vector3(side * mix(0.95, 2.3, r(`x-${k}`)), mix(-3.2, 3.2, (i + r(`y-${k}`)) / 24), mix(2.0, 3.4, r(`z-${k}`))));
}
// Far field.
for (let i = 0; i < 62; i++) {
  const k = `f${i}`;
  add("far", k, new THREE.Vector3(mix(-10, 10, r(`x-${k}`)), mix(-7, 7, r(`y-${k}`)), mix(-11, -4, r(`z-${k}`))));
}
export const N_BASE = SLOTS.length; // 150

// Extras: the S03 trio, the S06 creep, the S07 explosion.
const TRIO = N_BASE;
const S06_FIRST = TRIO + 3;
const S06_N = 80;
const S07_FIRST = S06_FIRST + S06_N;
const S07_N = 367;
export const N_TOTAL = S07_FIRST + S07_N; // 600
for (let i = 0; i < 3 + S06_N + S07_N; i++) {
  const k = `e${i}`;
  const zoo = i >= 3 + S06_N;
  const pos = zoo
    ? new THREE.Vector3(mix(-5.5, 5.5, r(`x-${k}`)), mix(-5.5, 5.5, r(`y-${k}`)), mix(-10, 7.5, Math.pow(r(`z-${k}`), 0.7)))
    : new THREE.Vector3(mix(-3, 3, r(`x-${k}`)), mix(-3.6, 3.6, r(`y-${k}`)), mix(-4, 2.5, r(`z-${k}`)));
  add("extra", k, pos);
}

// ---- the 47 hook windows -----------------------------------------------------------------------
const N47 = K("S01", "n47");
const central = (layer: Layer, n: number) =>
  SLOTS.map((s, i) => ({ i, s }))
    .filter((x) => x.s.layer === layer)
    .sort((a, b) => a.s.pos.length() - b.s.pos.length())
    .slice(0, n)
    .map((x) => x.i);
const HOOK = [...central("mid", 40), ...central("near", 7)].sort((a, b) => r(`h${a}`) - r(`h${b}`));
const HOOK_AT = new Map(HOOK.map((idx, n) => [idx, N47 - 4 + n * 2]));
export const HOOK_ARRIVALS = [...HOOK_AT.values()].sort((a, b) => a - b);

// ---- heroes (pulled out of the mural in front of the camera) -------------------------------------
type Target = { x: number; y: number; d: number; rz: number };
type Hero = { name: string; cell: Cell; from: number; to: number; target: (f: number) => Target; grey?: (f: number) => number; alpha?: (f: number) => number };

const HERO_Y = 0.42; // ~ screen y 755 at d = 5.4
const tres = K("S02", "tres");
const duas = K("S02", "duas");
const site = K("S02", "site");
const close = K("S03", "closeTab");
export const MULTIPLY = K("S03", "multiply");
const HEROES: Hero[] = [
  { name: "pesquisa", cell: Cell.Search, from: K("S02", "pesquisa") - 6, to: tres - 2, target: () => ({ x: 0, y: HERO_Y, d: 5.4, rz: 0 }) },
  ...[0, 1, 2].map((i) => ({
    name: `tres${i}`,
    cell: Cell.Video,
    from: tres - 4 + i * 5,
    to: duas - 2,
    target: () => ({ x: (i - 1) * 0.5, y: HERO_Y + (i === 1 ? 0.05 : -0.02), d: i === 1 ? 5.5 : 5.9, rz: (1 - i) * 0.09 }),
  })),
  ...[0, 1].map((i) => ({
    name: `duas${i}`,
    cell: Cell.Shop,
    from: duas - 4 + i * 6,
    to: K("S03", "receita") - 24,
    target: (f: number) => {
      const s = prog(f, site - 8, site + 22, easeInOut);
      return { x: mix(i ? 0.38 : -0.38, i ? 0.05 : -0.05, s), y: HERO_Y + mix(i ? -0.5 : 0.58, i ? 0 : 0.08, s), d: i ? 6.0 : 6.3, rz: 0 };
    },
    alpha: (f: number) => (i ? mix(1, 0.82, prog(f, site, site + 20)) : 1),
  })),
  {
    name: "receita",
    cell: Cell.Recipe,
    from: K("S03", "receita") - 6,
    to: K("S03", "google") - 4,
    target: () => ({ x: 0, y: HERO_Y, d: 5.4, rz: 0 }),
    grey: (f) => prog(f, K("S03", "nunca"), K("S03", "nunca") + 18),
  },
  // The Docs window stays out until the cursor finally closes it in the pause.
  { name: "docs", cell: Cell.Doc, from: K("S03", "google") - 6, to: SC.S03.to + 10, target: () => ({ x: 0, y: HERO_Y, d: 5.4, rz: 0 }) },
];

const used = new Set<number>();
const pickSlot = (frame: number) => {
  const cx = cameraAt(frame).x;
  let best = -1;
  let bd = Infinity;
  SLOTS.forEach((s, i) => {
    if (s.layer !== "mid" || used.has(i)) return;
    const d = Math.abs(s.pos.x - cx) + Math.abs(s.pos.y - 0.2) * 0.6;
    if (d < bd) [bd, best] = [d, i];
  });
  used.add(best);
  return best;
};
const HERO_IDX = new Map<number, Hero>();
const HERO_BY_NAME = new Map<string, number>();
for (const h of HEROES) {
  const idx = pickSlot(h.from);
  HERO_IDX.set(idx, h);
  HERO_BY_NAME.set(h.name, idx);
}
/** The window the cursor closes in the S03 pause (the Docs hero); 3 new ones pop in around where it was. */
export const CLOSED = HERO_BY_NAME.get("docs")!;

const heroBlend = (h: Hero, f: number) => Math.min(prog(f, h.from, h.from + 22, expOut), 1 - prog(f, h.to - 16, h.to, easeInOut));
/** 0..1 how much any hero is out (dims the rest of the field). */
export const focusAt = (frame: number) => HEROES.reduce((m, h) => Math.max(m, heroBlend(h, frame)), 0);

// ---- per-window state --------------------------------------------------------------------------
export type WinState = { pos: THREE.Vector3; rot: THREE.Euler; scale: number; alpha: number; hi: number; grey: number; blank: number; cell: Cell };

const BLACKOUT = PAUSE("S07")[1];
const METADE = K("S05", "metade");
const LENTO = K("S06", "lento");
const ENQUANTO = K("S07", "enquanto");
const ZOO = K("S07", "zoologico");
const ZOO_END = K("S07", "aberto2") + 10;

const spawnAt = (i: number) => {
  if (i < S06_FIRST) return MULTIPLY + [0, 6, 11][i - TRIO];
  if (i < S07_FIRST) return LENTO + 10 + (ENQUANTO - LENTO) * Math.sqrt((i - S06_FIRST) / S06_N);
  // Exponential growth: sparse first, a flood at the end.
  const u = (i - S07_FIRST) / S07_N;
  const k = 3.2;
  return ZOO - 30 + ((ZOO_END - (ZOO - 30)) * Math.log(1 + u * (Math.exp(k) - 1))) / k;
};
const TRIO_OFF = [new THREE.Vector3(-0.62, 0.42, -0.6), new THREE.Vector3(0.1, -0.36, 0.2), new THREE.Vector3(0.66, 0.46, -0.3)];
const TRIO_CELL = [Cell.Video, Cell.Shop, Cell.News];

const drift = (s: Slot, t: number) => {
  const a = s.layer === "far" ? 0.22 : s.layer === "near" ? 0.12 : 0.08;
  const sp = s.layer === "far" ? 0.025 : s.layer === "near" ? -0.04 : 0.012;
  const ph = s.seed * 40;
  return new THREE.Vector3(a * Math.sin(t * 0.31 + ph) + sp * t, 0.7 * a * Math.cos(t * 0.27 + ph * 1.3), 0.5 * a * Math.sin(t * 0.19 + ph * 0.7));
};

export const windowAt = (i: number, rawFrame: number): WinState => {
  const frame = stutterFrame(rawFrame);
  const s = SLOTS[i];
  const t = frame / FPS;
  const pos = s.pos.clone().add(drift(s, t));
  const rot = s.rot.clone();
  const sway = 0.03 * Math.sin(t * 0.4 + s.seed * 20);
  rot.y += sway;
  let scale = 1;
  let alpha = 1;
  let hi = 0;
  let grey = 0;
  let cell = s.cell;
  // S05: half of them are forgotten (title + content gone).
  const blank = s.layer !== "extra" && s.seed < 0.5 ? prog(frame, METADE - 8 + s.seed * 40, METADE + 10 + s.seed * 40) : 0;

  if (s.layer === "extra") {
    const at = spawnAt(i);
    if (frame < at || frame >= BLACKOUT) return { pos, rot, scale: 0, alpha: 0, hi: 0, grey: 0, blank: 0, cell };
    const p = prog(frame, at, at + 12, backOut);
    scale = Math.max(0, p);
    alpha = Math.min(1, p * 2);
    hi = Math.exp(-(frame - at) / 10) * 0.8;
    if (i < S06_FIRST) {
      // Anchored in the world where the closed window was, so they stay put as the camera moves on.
      const c = windowAt(CLOSED, close).pos;
      pos.copy(c.add(TRIO_OFF[i - TRIO])).add(drift(s, t).multiplyScalar(0.5));
      cell = TRIO_CELL[i - TRIO];
      rot.set(0, (i - TRIO - 1) * -0.15, 0);
    } else {
      rot.z += (1 - p) * 0.8 * (s.seed - 0.5);
    }
    return { pos, rot, scale, alpha, hi, grey, blank, cell };
  }

  // Hook: the 47 fly in from deep space; the rest of the field fades in during the pause.
  const hookAt = HOOK_AT.get(i);
  if (hookAt !== undefined) {
    const fp = prog(frame, hookAt, hookAt + 34, expOut);
    if (frame < hookAt) alpha = 0;
    const start = new THREE.Vector3(s.pos.x * 2.6, s.pos.y * 2.6, -38);
    pos.lerp(start, 1 - fp);
    rot.x += (1 - fp) * 0.7;
    rot.y += (1 - fp) * -0.9 * (s.seed - 0.5) * 2;
    rot.z += (1 - fp) * 0.4;
    hi = Math.max(hi, frame >= hookAt ? Math.exp(-(frame - hookAt) / 12) * 0.7 : 0);
  } else {
    alpha = prog(frame, 190 + s.seed * 90, 230 + s.seed * 90);
  }

  // After the blackout only the far field stays, dim, so the clean stage still moves.
  if (frame >= BLACKOUT) alpha *= s.layer === "far" ? 0.5 * prog(frame, BLACKOUT, BLACKOUT + 40) : 0;
  // Near panes stay translucent so they never cover the type.
  if (s.layer === "near") alpha *= 0.55;

  const hero = HERO_IDX.get(i);
  if (hero) {
    const h = heroBlend(hero, frame);
    if (h > 0) {
      const c = cameraAt(rawFrame);
      const tg = hero.target(frame);
      const target = new THREE.Vector3(c.x + tg.x, c.y + tg.y, c.z - tg.d);
      pos.lerp(target, h);
      rot.set(mix(rot.x, 0.02 * Math.sin(t * 0.8), h), mix(rot.y, 0.05 * Math.sin(t * 0.5), h), mix(rot.z, tg.rz, h));
      hi = Math.max(hi, h);
      cell = hero.cell;
      grey = (hero.grey?.(frame) ?? 0) * h;
      alpha = mix(alpha, hero.alpha?.(frame) ?? 1, h);
    }
    if (frame >= hero.from) cell = hero.cell;
  }
  if (i === CLOSED) {
    hi = Math.max(hi, 0.7 * win(frame, close - 40, close + 2, 12, 2));
    const gone = prog(frame, close, close + 10, easeIn);
    scale *= 1 - gone;
    if (gone >= 1) alpha = 0;
  }
  return { pos, rot, scale, alpha, hi, grey, blank: hero ? blank * (1 - hi) : blank, cell };
};

// ---- screen-space helpers for the HUD ------------------------------------------------------------
/** Screen rect of a window (projected corners), plus its opacity. */
export const windowRect = (i: number, frame: number) => {
  const st = windowAt(i, frame);
  const m = new THREE.Matrix4().compose(st.pos, new THREE.Quaternion().setFromEuler(st.rot), new THREE.Vector3(st.scale, st.scale, st.scale));
  const pts = [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ].map(([x, y]) => project(new THREE.Vector3(x * WIN.w, y * WIN.h, 0).applyMatrix4(m), frame));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), alpha: st.alpha * Math.min(1, st.scale) };
};
/** Screen point of window-UV (0..1, y up) on window i. */
export const windowPoint = (i: number, u: number, v: number, frame: number) => {
  const st = windowAt(i, frame);
  const m = new THREE.Matrix4().compose(st.pos, new THREE.Quaternion().setFromEuler(st.rot), new THREE.Vector3(st.scale, st.scale, st.scale));
  return project(new THREE.Vector3((u - 0.5) * WIN.w, (v - 0.5) * WIN.h, 0).applyMatrix4(m), frame);
};
export const heroIndex = (name: string) => {
  const i = HERO_BY_NAME.get(name);
  if (i === undefined) throw new Error(`no hero ${name}`);
  return i;
};
export const heroBlendAt = (name: string, frame: number) => heroBlend(HEROES.find((h) => h.name === name)!, stutterFrame(frame));
