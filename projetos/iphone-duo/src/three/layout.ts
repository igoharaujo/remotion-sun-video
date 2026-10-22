// Scene geometry and the camera path, shared by the 3D scene and the 2D HUD
// (the HUD projects world points to pixels with the same camera).
import * as THREE from "three";
import { FPS, H, S3D, T, W, easeInOut, mix, prog } from "../timeline";

export const FOV = 40;
export const BASE_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const ASPECT = W / H;
const HALF_H = BASE_Z * TAN;
const HALF_W = HALF_H * ASPECT;

// Screen pixel at the base camera (z = 10) -> world point on the z = 0 plane.
const pxToWorld = (px: number, py: number) =>
  new THREE.Vector3(((px - W / 2) / (W / 2)) * HALF_W, -((py - H / 2) / (H / 2)) * HALF_H, 0);
const pxToWorldLen = (px: number) => (px / (H / 2)) * HALF_H;

export const SUN_POS = pxToWorld(S3D.sun.screenPos[0], S3D.sun.screenPos[1]);
export const EARTH_POS = pxToWorld(S3D.earth.screenPos[0], S3D.earth.screenPos[1]);
export const R_SUN = pxToWorldLen(S3D.sun.screenRadiusPx);
export const R_EARTH = pxToWorldLen(S3D.earth.screenRadiusPx);
export const BEAM_X0 = SUN_POS.x + R_SUN * 0.92;
export const BEAM_X1 = EARTH_POS.x - R_EARTH * 0.92;
export const BEAM_LEN = BEAM_X1 - BEAM_X0;

const CAM = T.motion.camera;
export const SUN_IN = CAM.sunIn;
export const EARTH_IN = CAM.earthIn;
export const APPEAR = CAM.appearFrames;

/** Camera position at `frame`: eased z keys from timeline.json plus a slow two-frequency drift. */
export const cameraAt = (frame: number) => {
  const keys = CAM.keys;
  let z = keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, z0] = keys[i];
    const [f1, z1] = keys[i + 1];
    if (frame >= f0) z = mix(z0, z1, prog(frame, f0, f1, easeInOut));
  }
  const t = frame / FPS;
  const x = CAM.drift.x * (0.6 * Math.sin(t * 0.35) + 0.4 * Math.sin(t * 0.83 + 1));
  const y = CAM.drift.y * (0.6 * Math.sin(t * 0.27 + 2) + 0.4 * Math.sin(t * 0.61));
  return { x, y, z };
};

/** World point -> screen pixels (camera looks straight down -Z). */
export const project = (p: THREE.Vector3, frame: number) => {
  const cam = cameraAt(frame);
  const halfH = (cam.z - p.z) * TAN;
  const pxPerUnit = H / 2 / halfH;
  return { x: W / 2 + (p.x - cam.x) * pxPerUnit, y: H / 2 - (p.y - cam.y) * pxPerUnit, pxPerUnit };
};

/** 0..1 appearance of the Sun / Earth (scale and opacity both follow it). */
export const appearAt = (frame: number, start: number) => prog(frame, start, start + APPEAR);

// Journey frames used by both layers.
export const JOURNEY = {
  depart: T.beats.find((b) => b.id === "journey")!.from,
  arrive: T.motion.photon.earthGlowRamp[1],
};
