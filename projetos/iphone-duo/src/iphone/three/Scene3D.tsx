// The 3D layer: dark gradient, drifting dust, a slow key light with faint rays, wireframe "layers"
// in the far field, and the story objects (display stack, macro pixel grid, hinge).
// Every value is a pure function of the frame.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { GLOW_FRAG, QUAD_VERT } from "../../three/shaders";
import { FPS, H, K, SC, W, easeIn, easeInOut, easeOut, energyAt, mix, prog } from "../tl";
import {
  CAM_Z,
  FOV,
  GLASS,
  HINGE_LEN,
  LAYERS,
  LAYER_D,
  LAYER_W,
  OLED,
  TI,
  cameraAt,
  dustTime,
  hingeAt,
  PARTS,
  type Part,
  pxY,
  stackAt,
} from "./rig";
import {
  BACKDROP_FRAG,
  BACKDROP_VERT,
  DUST_FRAG,
  DUST_VERT,
  LAYER_FRAG,
  LAYER_VERT,
  METAL_FRAG,
  METAL_VERT,
  PIXELS_FRAG,
} from "./shaders";

const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

const useShader = (frag: string, vert: string, uniforms: Record<string, THREE.IUniform>, extra: object = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, ...extra }), []);

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return null;
};

const Backdrop: React.FC = () => {
  const mat = useShader(BACKDROP_FRAG, BACKDROP_VERT, {}, { depthWrite: false, depthTest: false });
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

export const Glow: React.FC<{
  position: [number, number, number];
  size: number;
  color: string;
  intensity: number;
  r0?: number;
  falloff?: number;
  rays?: number;
}> = ({ position, size, color, intensity, r0 = 0, falloff = 12, rays = 0 }) => {
  const frame = useCurrentFrame();
  const mat = useShader(
    GLOW_FRAG,
    QUAD_VERT,
    { uColor: { value: new THREE.Color(color) }, uIntensity: { value: 0 }, uR0: { value: r0 }, uFalloff: { value: falloff }, uRays: { value: rays }, uTime: { value: 0 } },
    additive,
  );
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uIntensity.value = intensity;
  mat.uniforms.uTime.value = frame / FPS;
  if (intensity <= 0.002) return null;
  return (
    <mesh position={position} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

// ---- ambient ---------------------------------------------------------------------------------
const DUST_LAYERS = [
  { count: 900, z: [-22, -9], size: [1.5, 4], box: [11, 9] },
  { count: 420, z: [-8, -1], size: [2, 5], box: [6, 5] },
  { count: 90, z: [0, 5], size: [3, 7], box: [3.5, 3.2] },
];
const DUST_TINTS = ["#C0C0C0", "#00A8FF", "#FFF5E0", "#7fc8ff"];

const DustLayer: React.FC<{ layer: number }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const spec = DUST_LAYERS[layer];
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(spec.count * 3);
    const size = new Float32Array(spec.count);
    const phase = new Float32Array(spec.count);
    const color = new Float32Array(spec.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < spec.count; i++) {
      const r = (k: string) => random(`dust-${layer}-${i}-${k}`);
      const z = mix(spec.z[0], spec.z[1], r("z"));
      const reach = (CAM_Z - z) / CAM_Z;
      pos.set([(r("x") * 2 - 1) * spec.box[0] * reach * 0.5, (r("y") * 2 - 1) * spec.box[1] * reach, z], i * 3);
      size[i] = mix(spec.size[0], spec.size[1], Math.pow(r("s"), 3));
      phase[i] = r("p");
      c.set(DUST_TINTS[Math.floor(r("c") * DUST_TINTS.length)]).multiplyScalar(0.35 + 0.65 * Math.pow(r("b"), 2));
      color.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mat = useShader(
    DUST_FRAG,
    DUST_VERT,
    { uTime: { value: 0 }, uScale: { value: 60 }, uOpacity: { value: 1 }, uBox: { value: new THREE.Vector3(0, spec.box[1] * 2, 0) } },
    additive,
  );
  mat.uniforms.uTime.value = dustTime(frame);
  mat.uniforms.uOpacity.value = 0.7 + 0.5 * energyAt(frame);
  return <points geometry={geom} material={mat} frustumCulled={false} />;
};

/** Soft key light drifting across the top of frame, with faint noisy rays. */
const KeyLight: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const x = -1.6 + 1.1 * Math.sin(t * 0.09);
  const y = pxY(260) + 0.4 * Math.sin(t * 0.13 + 1);
  const e = energyAt(frame);
  return (
    <>
      <Glow position={[x, y, -6]} size={16} color="#FFF5E0" intensity={0.16 + 0.08 * e} falloff={7} rays={0.95} />
      <Glow position={[x, y, -6]} size={5} color="#FFF5E0" intensity={0.22} falloff={14} />
      <Glow position={[-x * 0.6, pxY(1500), -10]} size={18} color="#00A8FF" intensity={0.07 + 0.05 * e} falloff={6} />
    </>
  );
};

const WIRE_COUNT = 14;
/** Extremely faint outlines of screen layers (rounded rects) and rings, drifting in the far field. */
const WireLayers: React.FC = () => {
  const frame = useCurrentFrame();
  const objs = useMemo(
    () =>
      Array.from({ length: WIRE_COUNT }, (_, i) => {
        const r = (k: string) => random(`wire-${i}-${k}`);
        const circle = r("shape") < 0.3;
        const pts: THREE.Vector3[] = [];
        if (circle) {
          for (let k = 0; k < 64; k++) pts.push(new THREE.Vector3(Math.cos((k / 64) * Math.PI * 2), Math.sin((k / 64) * Math.PI * 2), 0));
        } else {
          const w = 0.8;
          const h = 1.0 + 0.4 * r("h");
          const rad = 0.12;
          const corners = [
            [w - rad, h - rad, 0],
            [-w + rad, h - rad, Math.PI / 2],
            [-w + rad, -h + rad, Math.PI],
            [w - rad, -h + rad, (3 * Math.PI) / 2],
          ];
          for (const [cx, cy, a0] of corners)
            for (let k = 0; k <= 8; k++) {
              const a = a0 + (k / 8) * (Math.PI / 2);
              pts.push(new THREE.Vector3(cx + rad * Math.cos(a), cy + rad * Math.sin(a), 0));
            }
        }
        const geom = new THREE.BufferGeometry().setFromPoints(pts);
        const mat = new THREE.LineBasicMaterial({ color: r("c") < 0.5 ? "#C0C0C0" : "#00A8FF", transparent: true, opacity: 0, depthWrite: false });
        return {
          line: new THREE.LineLoop(geom, mat),
          base: [(r("x") * 2 - 1) * 5, (r("y") * 2 - 1) * 8, -12 - 14 * r("z")] as const,
          scale: 0.8 + 1.8 * r("s"),
          spin: (r("spin") * 2 - 1) * 0.05,
          tilt: [(r("tx") - 0.5) * 1.2, (r("ty") - 0.5) * 1.2],
          alpha: 0.05 + 0.07 * r("a"),
          phase: r("p") * 10,
        };
      }),
    [],
  );
  const t = frame / FPS;
  return (
    <>
      {objs.map((o, i) => {
        o.line.position.set(o.base[0] + 0.3 * Math.sin(t * 0.07 + o.phase), o.base[1] + ((t * 0.05 + o.phase) % 16) - 8, o.base[2]);
        o.line.rotation.set(o.tilt[0] + 0.1 * Math.sin(t * 0.1 + o.phase), o.tilt[1], o.spin * t * 6);
        o.line.scale.setScalar(o.scale);
        (o.line.material as THREE.LineBasicMaterial).opacity = o.alpha * (0.7 + 0.6 * energyAt(frame));
        return <primitive key={i} object={o.line} />;
      })}
    </>
  );
};

// ---- the display stack ----------------------------------------------------------------------
const Layer: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const s = stackAt(frame);
  const L = LAYERS[i];
  const mat = useShader(
    LAYER_FRAG,
    LAYER_VERT,
    {
      uColor: { value: new THREE.Color(L.color) },
      uEdge: { value: new THREE.Color(L.edge) },
      uOpacity: { value: 0 },
      uKind: { value: L.kind },
      uTime: { value: 0 },
      uGlow: { value: 0 },
      uGlint: { value: 0 },
      uDim: { value: 0 },
      uCurv: { value: 0 },
      uH: { value: 0 },
      uSlideX: { value: 0 },
    },
    { transparent: true, depthWrite: false, side: THREE.DoubleSide },
  );
  const h = (4.5 - i) * s.spread;
  const focus = i === OLED ? 1 : 1 - 0.92 * s.focusOled;
  const u = mat.uniforms;
  u.uOpacity.value = s.opacity * s.layerIn[i] * focus;
  u.uTime.value = frame / FPS;
  u.uGlow.value = i === OLED ? s.oledGlow : GLASS.includes(i) ? s.glassGlow : i === TI ? 0.6 : 0.3;
  u.uGlint.value = GLASS.includes(i) ? (frame / FPS) * 0.12 : s.tiGlint;
  u.uDim.value = s.dim;
  u.uCurv.value = s.curv;
  u.uH.value = h;
  u.uSlideX.value = s.slideX[i];
  return (
    <mesh position={[0, h + s.dropY[i], 0]} material={mat} renderOrder={10 - i}>
      <planeGeometry args={[LAYER_W, LAYER_D, 64, 1]} />
    </mesh>
  );
};

const Glue: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const s = stackAt(frame);
  const mat = useShader(
    LAYER_FRAG,
    LAYER_VERT,
    {
      uColor: { value: new THREE.Color("#FFB347") },
      uEdge: { value: new THREE.Color("#FFB347") },
      uOpacity: { value: 0 },
      uKind: { value: 4 },
      uTime: { value: 0 },
      uGlow: { value: 0 },
      uGlint: { value: 0 },
      uDim: { value: 0 },
      uCurv: { value: 0 },
      uH: { value: 0 },
      uSlideX: { value: 0 },
    },
    { ...additive, side: THREE.DoubleSide },
  );
  const h = (4 - i) * s.spread;
  mat.uniforms.uOpacity.value = s.opacity;
  mat.uniforms.uGlow.value = s.glue;
  mat.uniforms.uTime.value = frame / FPS;
  mat.uniforms.uCurv.value = s.curv;
  mat.uniforms.uH.value = h;
  if (s.glue <= 0.001) return null;
  return (
    <mesh position={[0, h, 0]} material={mat}>
      <planeGeometry args={[LAYER_W * 0.97, LAYER_D * 0.97, 64, 1]} />
    </mesh>
  );
};

const Stack: React.FC = () => {
  const frame = useCurrentFrame();
  const s = stackAt(frame);
  if (s.opacity <= 0.001) return null;
  return (
    <group position={s.pos} rotation={[s.rotX, s.rotY, 0]} scale={s.scale}>
      {LAYERS.map((_, i) => (
        <Layer key={i} i={i} />
      ))}
      {Array.from({ length: LAYERS.length - 1 }, (_, i) => (
        <Glue key={`g${i}`} i={i} />
      ))}
    </group>
  );
};

// ---- macro pixel grid (s02 ignition, s03 pulsing macro) --------------------------------------
const PixelGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const oled = K("s02_oled_ignite", "OLED");
  const magica = K("s02_oled_ignite", "mágica");
  const from = SC.s02_oled_ignite.from + 90;
  const to = SC.s03_self_emissive.to;
  const vh = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const mat = useShader(
    PIXELS_FRAG,
    QUAD_VERT,
    { uCells: { value: 3 }, uAspect: { value: H / W }, uIgnite: { value: 0 }, uSeed: { value: 0 }, uTime: { value: 0 }, uPulse: { value: 0 }, uOpacity: { value: 0 } },
    additive,
  );
  if (frame < from || frame > to) return null;
  const u = mat.uniforms;
  u.uOpacity.value = prog(frame, from, from + 40) * (1 - prog(frame, to - 24, to, easeIn)) * mix(1, 0.22, prog(frame, SC.s03_self_emissive.from - 10, SC.s03_self_emissive.from + 14));
  u.uCells.value = mix(mix(2.2, 3.2, prog(frame, from, oled)), 16, prog(frame, oled, SC.s03_self_emissive.from + 30, easeInOut));
  u.uCells.value = mix(u.uCells.value, 30, prog(frame, SC.s03_self_emissive.from + 30, to, easeInOut));
  u.uSeed.value = 0.25 * prog(frame, magica, magica + 30) + 0.75 * prog(frame, oled - 2, oled + 2);
  u.uIgnite.value = frame < oled ? 0 : mix(0, 40, prog(frame, oled, oled + 70, easeIn));
  u.uPulse.value = prog(frame, SC.s03_self_emissive.from, SC.s03_self_emissive.from + 40);
  u.uTime.value = frame / FPS;
  return (
    <mesh position={[0, 0, 0]} material={mat}>
      <planeGeometry args={[vh * (W / H) * 1.1, vh * 1.1]} />
    </mesh>
  );
};

/** Bloom bursts: OLED ignition, the "própria luz" sparkle, the titanium landing. */
const Bursts: React.FC = () => {
  const frame = useCurrentFrame();
  const kick = (f: number, decay: number) => (frame >= f ? Math.exp(-(frame - f) / decay) : 0);
  const oled = K("s02_oled_ignite", "OLED");
  const luz = K("s03_self_emissive", "própria luz");
  const pre = prog(frame, K("s02_oled_ignite", "mágica"), oled) * (frame < oled ? 1 : 0);
  return (
    <>
      <Glow position={[0, 0, 0.5]} size={3.4} color="#00A8FF" intensity={0.25 * pre + 1.6 * kick(oled, 14)} falloff={11} />
      <Glow position={[0, 0, 0.6]} size={1.2} color="#ffffff" intensity={2.2 * kick(oled, 8)} falloff={18} />
      <Glow position={[0, 0, 0.5]} size={7} color="#00A8FF" intensity={0.7 * kick(oled, 26)} falloff={7} rays={0.8} />
      <Glow position={[0, pxY(700), 0.5]} size={4.5} color="#FFF5E0" intensity={1.1 * kick(luz, 12)} falloff={10} rays={0.9} />
    </>
  );
};

// ---- the hinge: 120 parts fly in and snap together on "dobradiça" -----------------------------
const PartsMesh: React.FC<{ parts: Part[]; geom: THREE.BufferGeometry; mat: THREE.ShaderMaterial }> = ({ parts, geom, mat }) => {
  const frame = useCurrentFrame();
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geom, mat, parts.length);
    m.frustumCulled = false;
    return m;
  }, [geom, mat, parts.length]);
  const h = hingeAt(frame);
  const tmp = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const q0 = new THREE.Quaternion();
  parts.forEach((p, i) => {
    const k = h.assemble >= 1 ? 1 : prog(frame, p.arrive - p.dur, p.arrive, easeOut);
    const pos = p.from.clone().lerp(p.target, k);
    q0.setFromEuler(new THREE.Euler(p.rot.x + p.spin.x, p.rot.y + p.spin.y, p.rot.z + p.spin.z));
    q.setFromEuler(p.rot);
    q0.slerp(q, k);
    tmp.compose(pos, q0, p.size);
    mesh.setMatrixAt(i, tmp);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
};

const Hinge: React.FC = () => {
  const frame = useCurrentFrame();
  const parts = PARTS;
  const boxGeom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cylGeom = useMemo(() => new THREE.CylinderGeometry(1, 1, 1, 20), []);
  const metal = useShader(METAL_FRAG, METAL_VERT, { uTint: { value: new THREE.Color("#C0C0C0") }, uOpacity: { value: 1 }, uGlint: { value: 0 } }, { transparent: true });
  const barrelMat = useShader(METAL_FRAG, METAL_VERT, { uTint: { value: new THREE.Color("#d8dce4") }, uOpacity: { value: 1 }, uGlint: { value: 0 } }, { transparent: true });
  const h = hingeAt(frame);
  if (h.opacity <= 0.001) return null;
  metal.uniforms.uOpacity.value = h.opacity;
  metal.uniforms.uGlint.value = 0.6 * h.glint;
  barrelMat.uniforms.uOpacity.value = h.opacity * h.barrel;
  barrelMat.uniforms.uGlint.value = 0.8 * h.glint;
  return (
    <group position={h.pos} rotation={[h.rotX, h.rotY, 0]} scale={h.scale}>
      {h.assemble > 0 ? (
        <>
          <PartsMesh parts={parts.boxes} geom={boxGeom} mat={metal} />
          <PartsMesh parts={parts.cyls} geom={cylGeom} mat={metal} />
        </>
      ) : null}
      <mesh material={barrelMat} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.07, 0.07, HINGE_LEN, 32]} />
      </mesh>
      <Glow position={[0, 0, 0.3]} size={HINGE_LEN * 1.6} color="#00A8FF" intensity={0.9 * h.glint * h.opacity} falloff={6} />
      <Glow position={[0, 0, 0.35]} size={1.4} color="#FFF5E0" intensity={1.4 * h.glint * h.opacity} falloff={14} />
    </group>
  );
};

/** Lift the whole stack's brightness at the payoff and fade everything for the end card. */
export const Scene3D: React.FC = () => (
  <ThreeCanvas width={W} height={H} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 400 }}>
    <CameraRig />
    <Backdrop />
    <KeyLight />
    <WireLayers />
    {DUST_LAYERS.map((_, i) => (
      <DustLayer key={i} layer={i} />
    ))}
    <PixelGrid />
    <Stack />
    <Hinge />
    <Bursts />
  </ThreeCanvas>
);

