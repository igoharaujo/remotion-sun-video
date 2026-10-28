// Camera, face mesh and globe state as pure functions of the frame. Shared by the 3D scene and the
// 2D HUD (labels project the same world points with the same camera).
import * as THREE from "three";
import { random } from "remotion";
import { FACE_Y, FPS, H, K, SC, W, darkAt, easeIn, easeInOut, easeOut, energyAt, mix, prog, win } from "../tl";

export const FOV = 40;
export const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** Screen pixels per world unit on the z = 0 plane at the base camera. */
export const UNIT_PX = H / 2 / (CAM_Z * TAN);
export const pxY = (py: number) => (H / 2 - py) / UNIT_PX;
export const pxX = (px: number) => (px - W / 2) / UNIT_PX;

// Drift with the emotional energy; a slow push-in on the curious beats and a heavy settle when serious.
export const cameraAt = (frame: number) => {
  const t = frame / FPS;
  const e = 0.6 + 0.8 * energyAt(frame);
  const push = 0.9 * prog(frame, 0, SC.S01.to, easeInOut) * (1 - prog(frame, SC.S02.from, SC.S02.from + 40)) + 0.7 * win(frame, SC.S06.from, SC.S06.to + 20, 120, 20);
  return {
    x: 0.2 * e * (0.6 * Math.sin(t * 0.21) + 0.4 * Math.sin(t * 0.53 + 1)),
    y: 0.14 * e * (0.6 * Math.sin(t * 0.17 + 2) + 0.4 * Math.sin(t * 0.41)) - 0.25 * darkAt(frame),
    z: CAM_Z - push - 0.6 * darkAt(frame),
  };
};

const cam = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 400);
export const project = (p: THREE.Vector3, frame: number) => {
  const c = cameraAt(frame);
  cam.position.set(c.x, c.y, c.z);
  cam.lookAt(c.x * 0.3, c.y * 0.3, 0);
  cam.updateMatrixWorld();
  const v = p.clone().project(cam);
  return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H };
};

// ---- face landmarks --------------------------------------------------------------------------
// Unit face: about 1.6 wide, 2.3 tall, centred on the nose bridge. z bulges toward the camera.
export type Region = "outline" | "brow" | "eye" | "nose" | "lip" | "skin" | "tongue";
export type Landmark = { region: Region; base: THREE.Vector3; scatter: THREE.Vector3; seed: number };

const depth = (x: number, y: number) => 0.6 * Math.sqrt(Math.max(0, 1 - (x / 0.85) ** 2 - (y / 1.25) ** 2));
const v3 = (x: number, y: number, dz = 0) => new THREE.Vector3(x, y, depth(x, y) + dz);

const build = () => {
  const L: Landmark[] = [];
  const add = (region: Region, p: THREE.Vector3) => {
    const i = L.length;
    const r = (k: string) => random(`lm-${i}-${k}`);
    const a = r("a") * Math.PI * 2;
    const rad = 3 + 5 * r("r");
    L.push({ region, base: p, scatter: new THREE.Vector3(Math.cos(a) * rad, Math.sin(a) * rad * 1.4, -4 + 6 * r("z")), seed: r("s") });
  };
  const strips: number[][] = [];
  const strip = (region: Region, pts: THREE.Vector3[], loop = false) => {
    const ids = pts.map((p) => (add(region, p), L.length - 1));
    strips.push(loop ? [...ids, ids[0]] : ids);
  };
  // Outline: jaw narrows toward the chin.
  strip(
    "outline",
    Array.from({ length: 36 }, (_, k) => {
      const a = (k / 36) * Math.PI * 2;
      const y = 1.15 * Math.cos(a);
      const narrow = y < 0 ? 1 - 0.32 * (-y / 1.15) ** 1.6 : 1;
      return v3(0.8 * Math.sin(a) * narrow, y - 0.05, -0.02);
    }),
    true,
  );
  for (const s of [-1, 1]) {
    strip("brow", Array.from({ length: 7 }, (_, k) => v3(s * (0.13 + 0.38 * (k / 6)), 0.44 + 0.07 * Math.sin((k / 6) * Math.PI) - 0.04 * (k / 6), 0.03)));
    strip("eye", Array.from({ length: 12 }, (_, k) => {
      const a = (k / 12) * Math.PI * 2;
      return v3(s * 0.31 + 0.13 * Math.cos(a), 0.22 + 0.055 * Math.sin(a) * (Math.sin(a) > 0 ? 1.1 : 0.8), 0.01);
    }), true);
  }
  strip("nose", Array.from({ length: 6 }, (_, k) => v3(0, 0.3 - 0.52 * (k / 5), 0.05 + 0.3 * (k / 5))));
  strip("nose", Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI * (k / 6);
    return v3(0.15 * Math.cos(a), -0.27 - 0.05 * Math.sin(a), 0.22);
  }));
  const LIP0 = L.length;
  strip("lip", Array.from({ length: 16 }, (_, k) => {
    const a = (k / 16) * Math.PI * 2;
    return v3(0.3 * Math.cos(a), -0.58 + 0.085 * Math.sin(a), 0.06);
  }), true);
  const LIP1 = L.length;
  // Skin: jittered grid inside the outline, skipping eyes and mouth.
  for (let gy = -1.0; gy <= 0.95; gy += 0.17)
    for (let gx = -0.75; gx <= 0.75; gx += 0.17) {
      const i = L.length;
      const x = gx + (random(`skin-x-${i}`) - 0.5) * 0.08;
      const y = gy + (random(`skin-y-${i}`) - 0.5) * 0.08;
      const narrow = y < 0 ? 1 - 0.32 * (-y / 1.15) ** 1.6 : 1;
      if ((x / (0.74 * narrow)) ** 2 + ((y + 0.05) / 1.08) ** 2 > 1) continue;
      if (Math.abs(Math.abs(x) - 0.31) < 0.17 && Math.abs(y - 0.22) < 0.1) continue;
      if (Math.abs(x) < 0.34 && Math.abs(y + 0.58) < 0.12) continue;
      add("skin", v3(x, y));
    }
  // Tongue: a filled U of points in normalised coords (x -1..1 across, y 0 at the root .. -1 at the tip);
  // its pose comes from faceAt().tongue.
  const T0 = L.length;
  for (let row = 0; row <= 5; row++) {
    const v = -row / 5;
    const half = row < 4 ? 1 : Math.sqrt(Math.max(0, 1 - ((row - 3.2) / 1.8) ** 2));
    const n = row === 5 ? 2 : 4;
    for (let k = 0; k <= n; k++) add("tongue", new THREE.Vector3(half * (k / n * 2 - 1), v, 0));
  }
  for (let k = 0; k < 9; k++) {
    const a = Math.PI * (1 + k / 8);
    add("tongue", new THREE.Vector3(Math.cos(a), -0.62 + 0.38 * Math.sin(a), 0));
  }
  const T1 = L.length;
  // Faint mesh: each skin point links to its 2 nearest neighbours (computed once on the base pose).
  const links: [number, number][] = [];
  const skin = L.map((l, i) => [l, i] as const).filter(([l]) => l.region !== "tongue");
  for (const [l, i] of skin) {
    const near = skin
      .filter(([, j]) => j !== i)
      .map(([m, j]) => [m.base.distanceToSquared(l.base), j] as const)
      .sort((a, b) => a[0] - b[0])
      .slice(0, 2);
    for (const [, j] of near) if (i < j) links.push([i, j]);
  }
  return { L, strips, links, lip: [LIP0, LIP1] as const, tongue: [T0, T1] as const };
};

export const FACE = build();

export type FaceState = {
  opacity: number;
  pos: THREE.Vector3;
  scale: number;
  yaw: number;
  pitch: number;
  roll: number;
  assemble: number; // 0 scattered .. 1 face
  disperse: number; // 0 face .. 1 converged into the S09 spark
  tongue: number; // 0 in .. 1 fully out
  smile: number;
  scan: number; // -1 off, else 0..1 sweep from top to bottom
  lock: number; // tracking lock-on glow
};

const FACE_POS_HOOK = () => new THREE.Vector3(-0.15, pxY(FACE_Y), 0);

export const faceAt = (frame: number): FaceState => {
  const t = frame / FPS;
  const hook = 1 - prog(frame, SC.S02.from, SC.S02.from + 30, easeIn);
  const bgS02 = win(frame, SC.S02.from, SC.S02.to + 1, 30, 1) * 0.16;
  const s03 = win(frame, SC.S03.from - 20, SC.S04.from, 30, 1);
  const back = win(frame, SC.S06.from, SC.S09.to, 40, 1);
  const opacity = frame < SC.S02.from ? prog(frame, 0, 20) : frame < SC.S03.from - 20 ? Math.max(hook, bgS02) : frame < SC.S04.from ? s03 : back;
  const pos = FACE_POS_HOOK();
  pos.z -= 3 * prog(frame, SC.S02.from, SC.S02.from + 40) * (1 - prog(frame, SC.S03.from - 20, SC.S03.from + 20));
  // In S06–S08 the face sits higher to leave room for the phone below it.
  const up = win(frame, SC.S06.from - 1, SC.S09.from + 60, 50, 60);
  pos.y += 0.55 * up;
  pos.x += 0.15 * up;
  const sway = 0.5 + 0.5 * energyAt(frame);
  const tongueOut = (a: number, b: number, rise = 12, fall = 18) => win(frame, a, b, rise, fall);
  return {
    opacity,
    pos,
    scale: 1.12 - 0.12 * up + 0.08 * darkAt(frame),
    yaw: 0.18 * sway * Math.sin(t * 0.7) + 0.22 * win(frame, K("S03", "Rastreamento de Cabeça"), K("S03", "Apple"), 30, 30) * Math.sin(t * 2.1),
    pitch: 0.08 * Math.sin(t * 0.5 + 1) - 0.08 * tongueOut(K("S01", "língua"), SC.S02.from + 20),
    roll: 0.04 * Math.sin(t * 0.33),
    assemble: prog(frame, 0, 80, easeOut),
    disperse: prog(frame, SC.S09.from + 20, K("S09", "mágica"), easeInOut),
    tongue: Math.max(tongueOut(K("S01", "língua") - 4, SC.S02.from + 20), tongueOut(K("S07", "passar") - 2, K("S07", "câmera frontal"), 8, 24), 0.55 * tongueOut(K("S07", "expressão"), SC.S07.to - 20, 14, 20)),
    smile: prog(frame, K("S08", "sorrir"), K("S08", "sorrir") + 28, easeInOut) * (1 - prog(frame, SC.S09.from, SC.S09.from + 40)),
    scan:
      frame >= K("S01", "ler") && frame < K("S01", "ler") + 40
        ? prog(frame, K("S01", "ler"), K("S01", "ler") + 40, easeInOut)
        : frame >= K("S06", "rosto") && frame < K("S06", "rosto") + 50
          ? prog(frame, K("S06", "rosto"), K("S06", "rosto") + 50, easeInOut)
          : frame >= K("S07", "câmera frontal") + 6 && frame < K("S07", "câmera frontal") + 56
            ? prog(frame, K("S07", "câmera frontal") + 6, K("S07", "câmera frontal") + 56, easeInOut)
            : -1,
    lock: win(frame, K("S03", "Rastreamento de Cabeça"), SC.S03.to, 10, 30),
  };
};

const tmp = new THREE.Vector3();
const euler = new THREE.Euler();
const quat = new THREE.Quaternion();

/** World position of landmark i in state f (after expression, pose, assemble and disperse). */
export const landmarkWorld = (i: number, f: FaceState, frame: number, out = new THREE.Vector3()) => {
  const l = FACE.L[i];
  out.copy(l.base);
  if (l.region === "lip") {
    const u = out.x / 0.3;
    out.y += f.smile * (0.1 * u * u - 0.02);
    out.x *= 1 + 0.18 * f.smile;
    if (out.y < -0.58) out.y -= 0.08 * f.tongue;
    else out.y += 0.02 * f.tongue; // lower lip drops as the mouth opens
  }
  if (l.region === "tongue") {
    // Tip hangs below the mouth and comes forward.
    const len = 0.08 + 0.4 * f.tongue;
    const tip = -out.y;
    out.set(out.x * 0.13 * (0.7 + 0.3 * f.tongue), -0.6 + out.y * len, depth(0, -0.6) + 0.06 + 0.3 * f.tongue * tip);
  }
  out.multiplyScalar(f.scale);
  euler.set(f.pitch, f.yaw, f.roll);
  out.applyQuaternion(quat.setFromEuler(euler)).add(f.pos);
  if (f.assemble < 1) out.lerp(tmp.copy(l.scatter).add(f.pos), 1 - f.assemble);
  if (f.disperse > 0) {
    // Spiral into the spark at the face centre.
    const d = f.disperse;
    const a = d * (3 + 4 * l.seed);
    const c = f.pos;
    const rx = out.x - c.x;
    const ry = out.y - c.y;
    const shrink = 1 + 1.6 * Math.sin(Math.PI * Math.min(1, d * 1.3)) * (0.5 + l.seed) - d;
    out.set(c.x + (rx * Math.cos(a) - ry * Math.sin(a)) * shrink, c.y + (rx * Math.sin(a) + ry * Math.cos(a)) * shrink, out.z * (1 - d) + 0.8 * Math.sin(frame / 9 + l.seed * 6) * d * (1 - d));
  }
  return out;
};

/** Screen-space pixel position of landmark i. */
export const landmarkScreen = (i: number, frame: number) => project(landmarkWorld(i, faceAt(frame), frame), frame);

export const firstOf = (region: Region) => FACE.L.findIndex((l) => l.region === region);

// ---- globe (S04) -----------------------------------------------------------------------------
export const GLOBE_R = 1.75;
export const GLOBE_POS = new THREE.Vector3(0, pxY(720), 0);
export const globeAt = (frame: number) => ({
  opacity: win(frame, SC.S04.from, SC.S05.from + 10, 2, 22),
  rotY: frame * 0.012,
  scale: mix(0.6, 1, prog(frame, SC.S04.from, SC.S04.from + 26, easeOut)) * (1 + 0.08 * Math.exp(-Math.max(0, frame - K("S04", "trend mundial")) / 8) * (frame >= K("S04", "trend mundial") ? 1 : 0)),
});
