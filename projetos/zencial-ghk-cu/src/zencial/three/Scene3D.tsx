// The 3D layer, Apple Keynote studio: charcoal cyclorama, glossy dark floor, a volumetric spotlight
// that follows the product (warm on the hook, neutral after), a cool rim light behind it, slow
// camera pans, and the S04 molecule + collagen helix. No particles. Every value is a pure function
// of the frame.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { FPS, GOLD, H, K, SC, SERUM, SPOT_COOL, SPOT_WARM, W, dimAt, hookDarkAt, kickAt, mix, prog } from "../tl";
import { ATOMS, BONDS, CAM_Z, FLOOR_Y, FOV, HELIX, bottleAt, cameraAt, helixAt, lookAtFor, moleculeAt, screenToFloor } from "./rig";
import { ATOM_FRAG, ATOM_VERT, BEAM_FRAG, BEAM_VERT, FLOOR_FRAG, FLOOR_VERT, GLOW_FRAG, QUAD_VERT, SCREEN_VERT, STAGE_FRAG } from "./shaders";

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

const useShader = (frag: string, vert: string, uniforms: Record<string, THREE.IUniform>, extra: object = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, ...extra }), []);

/** Impact frames that kick the light. */
const FLARES = [K("S01", "pare"), K("S02", "vidro"), K("S03", "n125"), K("S05", "bizarro"), K("S06", "n1"), K("S08", "agora"), K("S09", "euquero")];
export const flareAt = (frame: number) => FLARES.reduce((m, f) => Math.max(m, kickAt(frame, f, 14)), 0);

/** Light rig state: where the spot lands, how strong, what colour. */
export const lightAt = (frame: number) => {
  const b = bottleAt(frame);
  const hook = (1 - hookDarkAt(frame)) * (1 - prog(frame, SC.S01.to - 30, SC.S01.to + 30));
  const ambient = 0.32 * (1 - hookDarkAt(frame));
  const k = Math.max(hook, b.spot, ambient) * (1 + 0.25 * flareAt(frame));
  // The beam lands under the product when it is on stage, otherwise centre stage.
  const target = b.o > 0.01 ? { x: mix(540, b.cx, b.o), y: b.base } : { x: 540, y: 1060 };
  const warm = 1 - prog(frame, SC.S02.from - 20, SC.S02.from + 40);
  return { k, target, color: new THREE.Color(SPOT_COOL).lerp(new THREE.Color(SPOT_WARM), warm) };
};

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(lookAtFor(frame));
  camera.updateProjectionMatrix();
  return null;
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(
    STAGE_FRAG,
    SCREEN_VERT,
    { uDark: { value: 1 }, uDim: { value: 0 }, uGlow: { value: 0 }, uCenter: { value: new THREE.Vector2(0.5, 0.55) }, uTint: { value: new THREE.Color() }, uTime: { value: 0 } },
    { depthWrite: false, depthTest: false },
  );
  const l = lightAt(frame);
  mat.uniforms.uDark.value = hookDarkAt(frame);
  mat.uniforms.uDim.value = dimAt(frame);
  mat.uniforms.uGlow.value = 0.5 + 0.5 * l.k;
  mat.uniforms.uCenter.value.set(l.target.x / W, 1 - (l.target.y - 300) / H);
  mat.uniforms.uTint.value.copy(l.color);
  mat.uniforms.uTime.value = frame / FPS;
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(FLOOR_FRAG, FLOOR_VERT, {
    uPool: { value: new THREE.Vector3() },
    uPoolK: { value: 0 },
    uTint: { value: new THREE.Color() },
    uDark: { value: 1 },
    uDim: { value: 0 },
    uCam: { value: new THREE.Vector3() },
  });
  const l = lightAt(frame);
  const c = cameraAt(frame);
  mat.uniforms.uPool.value.copy(screenToFloor(l.target.x, l.target.y, frame));
  mat.uniforms.uPoolK.value = l.k;
  mat.uniforms.uTint.value.copy(l.color);
  mat.uniforms.uDark.value = hookDarkAt(frame);
  mat.uniforms.uDim.value = dimAt(frame);
  mat.uniforms.uCam.value.set(c.x, c.y, c.z);
  return (
    <mesh material={mat} position={[0, FLOOR_Y, -10]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-9}>
      <planeGeometry args={[60, 60]} />
    </mesh>
  );
};

/** Volumetric cone from above, its open base landing on the pool. */
const BEAM_H = 9;
const Beam: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(BEAM_FRAG, BEAM_VERT, { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uTime: { value: 0 } }, { ...additive, side: THREE.DoubleSide });
  const geom = useMemo(() => new THREE.ConeGeometry(1.5, BEAM_H, 64, 1, true), []);
  const l = lightAt(frame);
  const p = screenToFloor(l.target.x, l.target.y, frame);
  mat.uniforms.uColor.value.copy(l.color);
  mat.uniforms.uIntensity.value = 0.16 * l.k * (1 - 0.5 * dimAt(frame));
  mat.uniforms.uTime.value = frame / FPS;
  if (l.k <= 0.002) return null;
  return <mesh geometry={geom} material={mat} position={[p.x, FLOOR_Y + BEAM_H / 2, p.z]} renderOrder={5} />;
};

export const SoftGlow: React.FC<{ position: [number, number, number]; size: number; color: string | THREE.Color; intensity: number; falloff?: number }> = ({ position, size, color, intensity, falloff = 8 }) => {
  const mat = useShader(GLOW_FRAG, QUAD_VERT, { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uFalloff: { value: falloff } }, additive);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uIntensity.value = intensity;
  if (intensity <= 0.002) return null;
  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

/** Cool rim light hugging the product from behind. */
const Rim: React.FC = () => {
  const frame = useCurrentFrame();
  const b = bottleAt(frame);
  if (b.o <= 0.01) return null;
  const base = screenToFloor(b.cx, b.base, frame);
  // Bottle height in world units at its depth (it fills ~75% of the cutout's height).
  const dist = cameraAt(frame).z - base.z;
  const h = ((b.size * 0.75) / (H / 2)) * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist;
  return <SoftGlow position={[base.x, FLOOR_Y + h * 0.55, base.z - 0.6]} size={h * 2.2} color={SPOT_COOL} intensity={0.2 * b.o * (1 + 0.4 * flareAt(frame))} falloff={5} />;
};

// ---- S04: molecule + collagen ------------------------------------------------------------------
const litMat = (color: string, metal: number) =>
  new THREE.ShaderMaterial({
    vertexShader: ATOM_VERT,
    fragmentShader: ATOM_FRAG,
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: 1 }, uMetal: { value: metal }, uGlow: { value: 0 } },
    transparent: true,
  });

const Molecule: React.FC = () => {
  const frame = useCurrentFrame();
  const m = moleculeAt(frame);
  const mats = useMemo(() => ATOMS.map((a) => litMat(a.color, a.id === "Cu" ? 1 : 0.2)), []);
  const bondMat = useMemo(() => litMat("#BFB8B0", 0.3), []);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 48, 32), []);
  const cyl = useMemo(() => new THREE.CylinderGeometry(0.07, 0.07, 1, 16), []);
  if (m.visible <= 0.002) return null;
  const pos = ATOMS.map((a, i) => a.from.clone().lerp(a.pos, m.arrive[i]));
  mats.forEach((mt, i) => {
    mt.uniforms.uOpacity.value = m.visible * Math.min(1, m.arrive[i] * 3);
    mt.uniforms.uGlow.value = ATOMS[i].id === "Cu" ? m.cuGlow * 0.8 : 0;
  });
  bondMat.uniforms.uOpacity.value = m.visible;
  return (
    <group position={m.center} scale={m.scale}>
      <SoftGlow position={[0, 0.55, -0.5]} size={4 * m.cuGlow + 0.01} color={SERUM} intensity={0.5 * m.cuGlow * m.visible} falloff={7} />
      <group rotation={[0.15, m.spin, 0]}>
        {ATOMS.map((a, i) => (
          <mesh key={a.id} geometry={sphere} material={mats[i]} position={pos[i]} scale={a.r} />
        ))}
        {BONDS.map(([a, b], i) => {
          const k = Math.min(m.arrive[a], m.arrive[b]);
          if (k < 0.95) return null;
          const pa = pos[a];
          const pb = pos[b];
          const mid = pa.clone().add(pb).multiplyScalar(0.5);
          const dir = pb.clone().sub(pa);
          const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          return <mesh key={i} geometry={cyl} material={bondMat} position={mid} quaternion={q} scale={[1, dir.length(), 1]} />;
        })}
      </group>
    </group>
  );
};

const STRANDS = ["#E9B7A6", "#E2C26A", "#F2F2F2"];
const Helix: React.FC = () => {
  const frame = useCurrentFrame();
  const h = helixAt(frame);
  const mats = useMemo(() => STRANDS.map((c) => litMat(c, 0.35)), []);
  // Geometry depends on radius (pulled taut on "firmeza"), cached per (radius, stretch).
  const geoms = useMemo(() => {
    const cache = new Map<string, THREE.TubeGeometry[]>();
    return (radius: number, stretch: number) => {
      const key = `${radius.toFixed(3)}-${stretch.toFixed(3)}`;
      if (!cache.has(key)) {
        cache.set(
          key,
          STRANDS.map((_, s) => {
            const pts = Array.from({ length: 220 }, (_, i) => {
              const u = i / 219;
              const a = u * HELIX.turns * Math.PI * 2 + (s * Math.PI * 2) / 3;
              return new THREE.Vector3(mix(HELIX.x0, HELIX.x1, u) * stretch, Math.cos(a) * radius, Math.sin(a) * radius);
            });
            return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.085, 12, false);
          }),
        );
      }
      return cache.get(key)!;
    };
  }, []);
  if (h.visible <= 0.002 || h.grow <= 0) return null;
  const gs = geoms(h.radius, h.stretch);
  return (
    <group position={[0, h.y, 0]}>
      <SoftGlow position={[0, 0, -0.6]} size={6} color={GOLD} intensity={0.25 * h.lock * h.visible} falloff={6} />
      <group rotation={[h.twist, 0, 0]}>
        {gs.map((g, i) => {
          const count = Math.floor((g.index!.count * h.grow) / 6) * 6;
          g.setDrawRange(0, count);
          mats[i].uniforms.uOpacity.value = h.visible;
          mats[i].uniforms.uGlow.value = 0.4 * h.lock;
          return <mesh key={i} geometry={g} material={mats[i]} />;
        })}
      </group>
    </group>
  );
};

export const Scene3D: React.FC = () => (
  <ThreeCanvas width={W} height={H} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 400 }}>
    <CameraRig />
    <Backdrop />
    <Floor />
    <Rim />
    <Beam />
    <Molecule />
    <Helix />
  </ThreeCanvas>
);
