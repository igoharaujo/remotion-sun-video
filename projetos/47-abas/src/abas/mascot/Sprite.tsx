// 2.5D sprite mascot: the trimmed transparent PNGs on a plane inside the 3D scene. The plane sits at a
// camera-relative point (screen position + distance from the lens from track.ts), bobs and tilts in 3D,
// leans into its moves, squash-pops and cross-fades when the pose swaps, and vibrates when tired.
import { useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import meta from "../../../public/avatar/trim/meta.json";
import { cameraAt, unitPx } from "../three/field";
import { FPS, H, W, blackoutAt, hookDarkAt } from "../tl";
import { POSES, Pose, mascotAt } from "./track";

/**
 * World height of the neutral pose. Every sprite scales by the fraction of its source frame the character
 * fills (trimmed height / source height), so PNGs exported at different resolutions — same framing —
 * keep one on-screen size.
 */
const BASE_H = 2.0;
const NAMES = Object.keys(POSES) as Pose[];
const META = meta as Record<string, { width: number; height: number; aspect: number; srcHeight: number }>;
const frac = (f: string) => META[f].height / META[f].srcHeight;
const REF_FRAC = frac(POSES.neutral);

const useSprites = () => {
  const [handle] = useState(() => delayRender("Loading mascot sprites"));
  // The canvas was already drawn (without the images) when the textures arrive: draw it again before releasing the frame.
  const advance = useThree((st) => st.advance);
  return useMemo(() => {
    let loaded = 0;
    const loader = new THREE.TextureLoader();
    return Object.fromEntries(
      NAMES.map((p) => {
        const tex = loader.load(
          staticFile(`avatar/trim/${POSES[p]}`),
          () => {
            if (++loaded === NAMES.length) {
              advance(performance.now());
              continueRender(handle);
            }
          },
          undefined,
          (e) => cancelRender(e),
        );
        // Raw sRGB in, raw out: the canvas renders `flat linear`, like the rest of the stage.
        tex.colorSpace = THREE.NoColorSpace;
        tex.anisotropy = 8;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        const m = META[POSES[p]];
        const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
        return [p, { mat, aspect: m.aspect, h: (BASE_H * frac(POSES[p])) / REF_FRAC }];
      }),
    ) as Record<Pose, { mat: THREE.MeshBasicMaterial; aspect: number; h: number }>;
  }, [handle, advance]);
};

const plane = new THREE.PlaneGeometry(1, 1);

export const MascotSprite: React.FC = () => {
  const frame = useCurrentFrame();
  const sprites = useSprites();
  const m = mascotAt(frame);
  if (!m.visible) return null;
  const t = frame / FPS;
  const c = cameraAt(frame);
  const u = unitPx(m.d);
  // Floating: a slow bob and a 3D sway on every axis; lean into horizontal moves; a buzz when tired.
  const bobPx = 16 * Math.sin(t * 2.2) + 6 * Math.sin(t * 3.7 + 1);
  const buzz = m.shake ? 5 * Math.sin(t * 95) : 0;
  const x = c.x + (m.sx + buzz - W / 2) / u;
  const y = c.y + (H / 2 - m.sy - bobPx) / u;
  const rotY = 0.22 * Math.sin(t * 0.9) + 0.08 * Math.sin(t * 1.7 + 2);
  const rotX = 0.06 * Math.sin(t * 1.3 + 0.5);
  const lean = Math.max(-0.35, Math.min(0.35, -m.vx * 0.012));
  const rotZ = 0.05 * Math.sin(t * 1.1) + lean + (m.shake ? 0.03 * Math.sin(t * 77) : 0);
  // Squash-pop on each pose swap (and the entry bounce).
  const sq = 0.8 + 0.2 * m.pop;
  const dark = 1 - 0.92 * Math.max(hookDarkAt(frame), blackoutAt(frame));
  const layers: [Pose, number][] = m.swap < 1 && m.prevPose !== m.pose ? [[m.prevPose, 1 - m.swap], [m.pose, m.swap]] : [[m.pose, 1]];
  return (
    <group position={[x, y, c.z - m.d]} rotation={[rotX, rotY, rotZ]}>
      {layers.map(([p, o], i) => {
        const s = sprites[p];
        s.mat.opacity = o;
        s.mat.color.setScalar(dark);
        return (
          <mesh
            key={p}
            geometry={plane}
            material={s.mat}
            renderOrder={10 + i}
            scale={[s.h * s.aspect * m.flip * (2 - sq), s.h * sq, 1]}
            position={[0, (s.h * (sq - 1)) / 2, 0]}
          />
        );
      })}
    </group>
  );
};
