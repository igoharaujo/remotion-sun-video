// Camera, stage, product placement and the S04 molecule/collagen state as pure functions of the frame. Shared by the 3D scene
// and the 2D HUD (labels project the same world points with the same camera).
import * as THREE from "three";
import { FPS, H, K, SC, W, backOut, dimAt, easeInOut, easeOut, energyAt, kickAt, mix, prog, win } from "../tl";

export const FOV = 40;
export const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** Screen pixels per world unit on the z = 0 plane at the base camera. */
export const UNIT_PX = H / 2 / (CAM_Z * TAN);
export const pxY = (py: number) => (H / 2 - py) / UNIT_PX;
export const pxX = (px: number) => (px - W / 2) / UNIT_PX;

// Studio camera: slightly above the floor looking a touch down, with slow commercial-style pans
// (a long lateral truck plus a gentle push on the curious lines and the serious settle).
export const CAM_Y = 0.6;
export const LOOK_Y = -0.2;
export const cameraAt = (frame: number) => {
  const t = frame / FPS;
  const e = 0.6 + 0.6 * energyAt(frame);
  const push = 0.6 * win(frame, SC.S02.from, SC.S02.to, 200, 40) + 0.5 * win(frame, SC.S08.from, SC.S09.to, 240, 60) + 0.5 * dimAt(frame);
  return {
    x: 0.22 * Math.sin(t * 0.11 + 0.6) + 0.04 * e * Math.sin(t * 0.47),
    y: CAM_Y + 0.05 * e * Math.sin(t * 0.21 + 2),
    z: CAM_Z - push,
  };
};

const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
const setCam = (frame: number) => {
  const c = cameraAt(frame);
  cam.position.set(c.x, c.y, c.z);
  cam.lookAt(c.x * 0.5, LOOK_Y, 0);
  cam.updateMatrixWorld();
  return cam;
};
export const lookAtFor = (frame: number) => new THREE.Vector3(cameraAt(frame).x * 0.5, LOOK_Y, 0);

export const project = (p: THREE.Vector3, frame: number) => {
  const v = p.clone().project(setCam(frame));
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

// ---- stage -------------------------------------------------------------------------------------
export const FLOOR_Y = -0.55;
/** World point on the floor under a screen pixel (ray from the camera through it). */
export const screenToFloor = (px: number, py: number, frame: number) => {
  const c = setCam(frame);
  const ndc = new THREE.Vector3((px / W) * 2 - 1, -(py / H) * 2 + 1, 0.5).unproject(c);
  const dir = ndc.sub(c.position).normalize();
  const t = (FLOOR_Y - c.position.y) / dir.y;
  return c.position.clone().add(dir.multiplyScalar(t > 0 ? t : 1e3));
};

// ---- the product on the stage (2D cutout placed in screen space; the 3D light follows it) ----------
/** Where the bottle sits inside the cutout image (fractions of the square image). */
export const BOTTLE_IN_IMAGE = { cx: 0.49, base: 0.95 };
export const bottleAt = (frame: number) => {
  const seg = K("S02", "segredo");
  const testar = K("S07", "testar");
  const com = K("S09", "comentar");
  // Window A: the S02 reveal. Window B: from "testar" to the end.
  const a = win(frame, seg + 10, SC.S02.to + 8, 30, 18);
  const b = prog(frame, testar - 4, testar + 18);
  const o = Math.max(a, b);
  const slide = prog(frame, testar - 4, testar + 26, easeOut);
  const down = prog(frame, com - 30, com, easeInOut);
  const inB = frame >= testar - 4;
  return {
    o,
    cx: inB ? mix(1500, 540, slide) : 540,
    base: mix(1060, 1395, down),
    // 700 px from "testar" on, so the S08 "AGORA!" headline clears the dropper.
    size: (inB ? 700 : 760) * mix(1, 0.67, down),
    /** Spotlight on the product: sweeps on during the reveal, warm on the hook. */
    spot: inB ? b : prog(frame, seg, seg + 60, easeOut) * a,
    sway: Math.sin((frame / FPS) * 0.9),
  };
};

// ---- S04: GHK-Cu molecule -> collagen triple helix ---------------------------------------------
export type Atom = { id: "G" | "H" | "K" | "Cu"; label: string; color: string; r: number; pos: THREE.Vector3; from: THREE.Vector3 };
export const ATOMS: Atom[] = [
  { id: "G", label: "Gly", color: "#F3EDE6", r: 0.46, pos: new THREE.Vector3(-1.15, -0.35, 0), from: new THREE.Vector3(-4.5, 2.5, -2) },
  { id: "H", label: "His", color: "#E9B7A6", r: 0.52, pos: new THREE.Vector3(0, -0.75, 0.2), from: new THREE.Vector3(0.5, -5, -1) },
  { id: "K", label: "Lys", color: "#E2C26A", r: 0.48, pos: new THREE.Vector3(1.15, -0.3, 0), from: new THREE.Vector3(4.5, 2, -2) },
  { id: "Cu", label: "Cu²⁺", color: "#C27A47", r: 0.4, pos: new THREE.Vector3(0, 0.55, 0.35), from: new THREE.Vector3(0, 6, 0.35) },
];
export const BONDS: [number, number][] = [
  [0, 1],
  [1, 2],
  [3, 0],
  [3, 1],
  [3, 2],
];

/** Molecule group transform and per-atom arrival 0..1. */
export const moleculeAt = (frame: number) => {
  const pep = K("S04", "peptideo");
  const cu = K("S04", "cobre");
  const est = K("S04", "estimula");
  const arrive = [0, 1, 2].map((i) => prog(frame, pep + i * 6, pep + i * 6 + 26, backOut));
  arrive.push(prog(frame, cu - 6, cu + 14, backOut));
  const shrink = prog(frame, est, est + 40, easeInOut);
  const visible = win(frame, pep - 6, SC.S04.to + 6, 10, 24);
  return {
    arrive,
    visible,
    cuGlow: arrive[3] * (0.35 + 0.65 * kickAt(frame, cu, 20)),
    center: new THREE.Vector3(0, mix(pxY(760), pxY(500), shrink), 0),
    scale: mix(1, 0.62, shrink) * (1 + 0.06 * kickAt(frame, K("S04", "ghk2"), 10)),
    spin: frame / FPS * 0.35 + 0.4 * Math.sin(frame / FPS * 0.6),
  };
};

/** Collagen triple helix: grows on "colágeno", pulls taut on "firmeza". */
// Spans screen x ≈ 80–940 (safe zone 60–960 incl. the action bar), with room for perspective and drift.
export const HELIX = { x0: -1.5, x1: 1.3, turns: 2.3 };
export const helixAt = (frame: number) => {
  const col = K("S04", "colageno");
  const firm = K("S04", "firmeza");
  const tight = prog(frame, firm - 4, firm + 16, backOut);
  return {
    grow: prog(frame, col - 10, col + 40, easeOut),
    radius: mix(0.42, 0.24, tight),
    stretch: mix(1, 1.04, tight),
    y: pxY(1010),
    visible: win(frame, col - 10, SC.S04.to + 6, 8, 24),
    lock: kickAt(frame, firm + 8, 14),
    twist: frame / FPS * 0.8,
  };
};
