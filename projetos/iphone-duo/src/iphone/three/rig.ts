// Camera, layer-stack and hinge state as pure functions of the frame. Shared by the 3D scene and the
// 2D HUD (labels project the same world points with the same camera).
import * as THREE from "three";
import { random } from "remotion";
import { FPS, H, K, SC, W, easeIn, easeInOut, easeOut, energyAt, mix, prog } from "../tl";

export const FOV = 40;
export const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** World units per screen pixel on the z = 0 plane at the base camera. */
export const UNIT_PX = H / 2 / (CAM_Z * TAN);
export const pxY = (py: number) => (H / 2 - py) / UNIT_PX;

// Slow parallax drift; amplitude follows the emotional energy of the moment.
export const cameraAt = (frame: number) => {
  const t = frame / FPS;
  const e = 0.6 + 0.8 * energyAt(frame);
  return {
    x: 0.22 * e * (0.6 * Math.sin(t * 0.21) + 0.4 * Math.sin(t * 0.53 + 1)),
    y: 0.16 * e * (0.6 * Math.sin(t * 0.17 + 2) + 0.4 * Math.sin(t * 0.41)),
    z: CAM_Z,
  };
};

const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
export const project = (p: THREE.Vector3, frame: number) => {
  const c = cameraAt(frame);
  cam.position.set(c.x, c.y, c.z);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld();
  const v = p.clone().project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

/** Dust clock in seconds; it stops dead for 12 frames on "absurda" (the freeze), then resumes. */
export const dustTime = (frame: number) => {
  const f = K("s11_absurd", "absurda");
  return (frame - Math.min(Math.max(frame - f, 0), 12)) / FPS;
};

// ---- the display stack ----------------------------------------------------------------------
export const LAYER_W = 2.9;
export const LAYER_D = 2.5;
export type LayerKind = 0 | 1 | 2 | 3 | 4; // plain, glass, oled, titanium, glue
export const LAYERS: { kind: LayerKind; color: string; edge: string }[] = [
  { kind: 0, color: "#6f8fb0", edge: "#9fd8ff" },
  { kind: 1, color: "#cfe8ff", edge: "#d8f1ff" }, // UTG above the panel
  { kind: 0, color: "#4a7fa8", edge: "#7fc8ff" },
  { kind: 0, color: "#5a6a8a", edge: "#a0b4ff" },
  { kind: 2, color: "#00A8FF", edge: "#38c2ff" }, // OLED emitter
  { kind: 0, color: "#3c5a78", edge: "#6aa8e0" },
  { kind: 1, color: "#cfe8ff", edge: "#d8f1ff" }, // UTG below the panel
  { kind: 0, color: "#4b5568", edge: "#8a9ab8" },
  { kind: 0, color: "#3d4352", edge: "#7d8798" },
  { kind: 3, color: "#C0C0C0", edge: "#e6e6e6" }, // titanium plate
];
export const GLASS = [1, 6];
export const OLED = 4;
export const TI = 9;

export type StackState = {
  opacity: number;
  spread: number;
  rotX: number;
  rotY: number;
  scale: number;
  pos: [number, number, number];
  curv: number;
  glue: number;
  dim: number;
  oledGlow: number;
  focusOled: number; // 1 = every other layer fades away
  layerIn: number[]; // per-layer 0..1 arrival
  slideX: number[]; // per-layer x offset (glass slides in)
  dropY: number[]; // per-layer y offset (titanium rises in)
  glassGlow: number;
  tiGlint: number;
};

const s01 = SC.s01_layers;
const s02 = SC.s02_oled_ignite;
const s05a = SC.s05a_not_only;
const s05 = SC.s05_glass_titanium;
const s06 = SC.s06_glue_book;
const s07 = SC.s07_hinge_assembly;
const s11 = SC.s11_absurd;

export const stackAt = (frame: number): StackState => {
  const t = frame / FPS;
  const dez = K("s01_layers", "dez");
  const base: StackState = {
    opacity: 0,
    spread: 0.012,
    rotX: 0.5,
    rotY: -0.5 + 0.05 * t,
    scale: 1,
    pos: [0, pxY(800), 0],
    curv: 0,
    glue: 0,
    dim: 0,
    oledGlow: 0.25,
    focusOled: 0,
    layerIn: LAYERS.map(() => 1),
    slideX: LAYERS.map(() => 0),
    dropY: LAYERS.map(() => 0),
    glassGlow: 0.3,
    tiGlint: -0.5,
  };

  if (frame < s02.to) {
    // Hook: one glowing slab, then on "dez" the ten layers lift apart one by one (slow, curious).
    const s = base;
    s.opacity = prog(frame, 0, 40) * (1 - prog(frame, 470, 505, easeIn));
    s.spread = mix(0.012, 0.3, prog(frame, dez, dez + 80, easeInOut));
    s.layerIn = LAYERS.map((_, i) => 0.35 + 0.65 * prog(frame, dez + i * 5, dez + i * 5 + 24));
    // OLED: turn the stack to face the camera, isolate the emitter and push in.
    const face = prog(frame, K("s02_oled_ignite", "Pois é"), K("s02_oled_ignite", "mágica") + 20, easeInOut);
    s.rotX = mix(0.5, Math.PI / 2, face);
    s.rotY = mix(s.rotY, 0, face);
    s.focusOled = face;
    s.scale = mix(0.86, 3.2, prog(frame, K("s02_oled_ignite", "mágica"), K("s02_oled_ignite", "OLED"), easeIn));
    s.pos = [0, mix(pxY(800), pxY(860), face), 0];
    s.oledGlow = mix(0.25, 1, face);
    return s;
  }

  if (frame >= s05a.from && frame < s07.from + 40) {
    const s = base;
    const orbit = prog(frame, s05.from, s06.from, easeInOut);
    s.opacity = prog(frame, s05a.from, s05a.from + 30) * (1 - prog(frame, s07.from, s07.from + 34, easeIn));
    s.dim = 1 - prog(frame, s05.from, s05.from + 40);
    s.spread = mix(0.2, 0.34, prog(frame, s05.from, K("s05_glass_titanium", "vidros"), easeInOut));
    s.rotY = mix(-0.75, 0.55, orbit);
    s.rotX = mix(0.5, 0.42, orbit);
    // "bem no fundo": lift the stack and lean in so the bottom of it sits at frame centre.
    const fundo = prog(frame, K("s05_glass_titanium", "bem no fundo") - 10, K("s05_glass_titanium", "titânio"), easeInOut) * (1 - prog(frame, s06.from, s06.from + 60, easeInOut));
    s.pos = [0, pxY(860) + 0.55 * fundo, 0];
    s.scale = 0.92;
    // Glass and titanium arrive in s05; until then the stack re-forms without them.
    const vidros = K("s05_glass_titanium", "vidros");
    const glassIn = prog(frame, vidros - 18, vidros, easeOut);
    const ti = K("s05_glass_titanium", "titânio");
    const tiIn = prog(frame, ti - 16, ti, Easing_outQuint);
    s.layerIn = LAYERS.map((_, i) => (GLASS.includes(i) ? 0.12 + 0.88 * glassIn : i === TI ? tiIn : 1));
    // Ghosts: the empty glass slots outline themselves on "por cima" / "por baixo".
    s.layerIn[1] = Math.max(s.layerIn[1], 0.35 * prog(frame, K("s05_glass_titanium", "por cima"), K("s05_glass_titanium", "por cima") + 12));
    s.layerIn[6] = Math.max(s.layerIn[6], 0.35 * prog(frame, K("s05_glass_titanium", "por baixo"), K("s05_glass_titanium", "por baixo") + 12));
    s.slideX = LAYERS.map((_, i) => (i === 1 ? -4.5 * (1 - glassIn) : i === 6 ? 4.5 * (1 - glassIn) : 0));
    s.dropY = LAYERS.map((_, i) => (i === TI ? -3.2 * (1 - tiIn) : 0));
    s.glassGlow = 0.3 + 0.9 * Math.exp(-Math.max(0, frame - vidros) / 30) * (frame >= vidros ? 1 : 0);
    s.tiGlint = frame < ti ? -0.6 : mix(-0.6, 1.8, prog(frame, ti, ti + 50, easeInOut));
    s.oledGlow = 0.55;
    // s06: glue glows on "cola", the stack closes up like a book and bends; the layers slide.
    const cola = K("s06_glue_book", "cola");
    const cola2 = K("s06_glue_book", "cola 2");
    const desl = K("s06_glue_book", "deslizarem");
    const book = prog(frame, s06.from, cola, easeInOut);
    s.spread = mix(s.spread, 0.13, book);
    s.rotY = mix(s.rotY, 0.12, book);
    s.rotX = mix(s.rotX, 0.32, book);
    s.glue = prog(frame, cola - 4, cola + 12) * (0.75 + 0.25 * Math.exp(-Math.max(0, frame - cola2) / 14) * (frame >= cola2 ? 1 : 0));
    s.curv = 0.66 * prog(frame, desl - 10, desl + 70, easeInOut) * (1 - 0.35 * prog(frame, K("s06_glue_book", "livro"), s06.to, easeInOut));
    s.scale = mix(s.scale, 1.08, book);
    return s;
  }

  if (frame >= s11.from && frame < s11.to + 10) {
    // Payoff: the whole thing reassembled, compact, spinning slowly above its hinge.
    const s = base;
    s.opacity = prog(frame, s11.from, s11.from + 16) * (1 - prog(frame, s11.to - 6, s11.to + 10, easeIn));
    s.spread = 0.07;
    s.rotX = 0.45;
    s.rotY = -0.6 + 1.2 * prog(frame, s11.from, s11.to, easeInOut);
    s.pos = [0, pxY(780), 0];
    s.oledGlow = 1;
    s.glassGlow = 0.8;
    s.tiGlint = mix(-0.6, 1.8, prog(frame, K("s11_absurd", "absurda"), K("s11_absurd", "absurda") + 40));
    return s;
  }
  return base;
};

// Easing.out(quint) without importing Easing into every caller.
function Easing_outQuint(x: number) {
  return 1 - Math.pow(1 - x, 5);
}

/** World position of a point on layer `i` (local x, before any bend) for HUD labels. */
export const layerPoint = (frame: number, i: number, localX: number) => {
  const s = stackAt(frame);
  const h = (4.5 - i) * s.spread + s.dropY[i];
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...s.pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(s.rotX, s.rotY, 0, "XYZ")),
    new THREE.Vector3(s.scale, s.scale, s.scale),
  );
  return new THREE.Vector3(localX + s.slideX[i], h, 0).applyMatrix4(m);
};

// ---- the hinge ------------------------------------------------------------------------------
export const HINGE_LEN = 3.0;
export type HingeState = { opacity: number; assemble: number; scale: number; pos: [number, number, number]; rotY: number; rotX: number; glint: number; barrel: number };

export const hingeAt = (frame: number): HingeState => {
  const t = frame / FPS;
  const off: HingeState = { opacity: 0, assemble: 1, scale: 1, pos: [0, 0, 0], rotX: 0.35, rotY: 0, glint: 0, barrel: 0 };
  const dob = K("s01_layers", "dobradiça");
  if (frame >= dob - 6 && frame < s02.from + 30) {
    // Hook preview: just the barrel glints under the stack on "dobradiça".
    return { ...off, opacity: prog(frame, dob - 6, dob + 10) * (1 - prog(frame, s02.from, s02.from + 30)), pos: [0, pxY(1250), 0], rotY: -0.3 + 0.05 * t, glint: Math.exp(-Math.max(0, frame - dob) / 18), barrel: 1, assemble: 0 };
  }
  if (frame >= s07.from && frame < SC.s08_teardrop.from + 24) {
    const snap = K("s07_hinge_assembly", "dobradiça");
    return {
      opacity: prog(frame, s07.from, s07.from + 14) * (1 - prog(frame, SC.s08_teardrop.from, SC.s08_teardrop.from + 24, easeIn)),
      assemble: prog(frame, s07.from, snap, (x) => x),
      scale: mix(0.8, 1.08, prog(frame, s07.from, SC.s08_teardrop.from, easeInOut)),
      pos: [0, pxY(860), 0],
      rotX: 0.42,
      rotY: -0.35 + 0.5 * prog(frame, s07.from, SC.s08_teardrop.from, easeInOut),
      glint: frame >= snap ? Math.exp(-(frame - snap) / 10) : 0,
      barrel: prog(frame, snap - 4, snap + 4),
    };
  }
  if (frame >= s11.from && frame < s11.to + 10) {
    const st = stackAt(frame);
    return { ...off, opacity: st.opacity, assemble: 1, scale: 0.9, pos: [0, pxY(1120), 0], rotX: 0.45, rotY: st.rotY, barrel: 1, glint: 0.4 * Math.exp(-Math.max(0, frame - K("s11_absurd", "absurda")) / 12) * (frame >= K("s11_absurd", "absurda") ? 1 : 0) };
  }
  return off;
};


// 120 parts in 30 columns along the hinge axis: two link plates, a cam block and a pin per column.
const COLS = 30;
export type Part = { target: THREE.Vector3; size: THREE.Vector3; rot: THREE.Euler; from: THREE.Vector3; spin: THREE.Euler; arrive: number; dur: number };

const buildParts = (snap: number) => {
  const boxes: Part[] = [];
  const cyls: Part[] = [];
  for (let c = 0; c < COLS; c++) {
    const x = -HINGE_LEN / 2 + 0.05 + (c * (HINGE_LEN - 0.1)) / (COLS - 1);
    const slots: [Part[], THREE.Vector3, THREE.Vector3, THREE.Euler][] = [
      [boxes, new THREE.Vector3(x, 0.17, 0.05), new THREE.Vector3(0.06, 0.34, 0.05), new THREE.Euler(0, 0, c % 2 ? 0.25 : -0.25)],
      [boxes, new THREE.Vector3(x, -0.17, -0.05), new THREE.Vector3(0.06, 0.34, 0.05), new THREE.Euler(0, 0, c % 2 ? -0.25 : 0.25)],
      [boxes, new THREE.Vector3(x, 0, 0), new THREE.Vector3(0.075, 0.22, 0.22), new THREE.Euler(0.785 * (c % 2), 0, 0)],
      [cyls, new THREE.Vector3(x, 0.02, c % 2 ? 0.2 : -0.2), new THREE.Vector3(0.06, 0.09, 0.06), new THREE.Euler(0, 0, Math.PI / 2)],
    ];
    slots.forEach(([list, target, size, rot], k) => {
      const r = (key: string) => random(`part-${c}-${k}-${key}`);
      const dir = new THREE.Vector3(r("dx") * 2 - 1, r("dy") * 2 - 1, r("dz") * 1.2 - 0.2).normalize();
      const late = Math.pow(r("t"), 0.6);
      list.push({
        target,
        size,
        rot,
        from: target.clone().add(dir.multiplyScalar(5 + 4 * r("d"))),
        spin: new THREE.Euler(r("rx") * 9 - 4.5, r("ry") * 9 - 4.5, r("rz") * 9 - 4.5),
        arrive: snap - Math.round(52 * (1 - late)),
        dur: 26 + Math.round(22 * r("dur")),
      });
    });
  }
  return { boxes, cyls };
};

export const PARTS = buildParts(K("s07_hinge_assembly", "dobradiça"));
export const PART_COUNT = PARTS.boxes.length + PARTS.cyls.length;
/** Parts that have landed by `frame`. */
export const partsArrived = (frame: number) => [...PARTS.boxes, ...PARTS.cyls].filter((p) => frame >= p.arrive).length;

/** World position of the end of layer `i` after the s06 bend (x = ±LAYER_W/2), for HUD arrows. */
export const bentLayerEnd = (frame: number, i: number, side: 1 | -1) => {
  const s = stackAt(frame);
  const h = (4.5 - i) * s.spread;
  const x = (side * LAYER_W) / 2;
  let px = x;
  let py = h;
  if (s.curv > 1e-4) {
    const R0 = 1 / s.curv;
    const r = R0 + h;
    px = r * Math.sin(x / r);
    py = -R0 + r * Math.cos(x / r);
  }
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...s.pos),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(s.rotX, s.rotY, 0, "XYZ")),
    new THREE.Vector3(s.scale, s.scale, s.scale),
  );
  return new THREE.Vector3(px, py, 0).applyMatrix4(m);
};
