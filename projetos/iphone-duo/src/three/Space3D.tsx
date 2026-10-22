// Procedural 3D environment: nebula, parallax starfield, Sun, Earth, light beam,
// travelling photon and arrival pulse. Every value is a pure function of the frame.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { FPS, H, T, W, easeIn, easeInOut, easeOut, ev, mix, prog } from "../timeline";
import {
  BEAM_FRAG,
  EARTH_FRAG,
  GLOW_FRAG,
  NEBULA_FRAG,
  QUAD_VERT,
  RING_FRAG,
  SPHERE_VERT,
  STAR_FRAG,
  STAR_VERT,
  SUN_FRAG,
} from "./shaders";
import {
  BASE_Z,
  BEAM_LEN,
  BEAM_X0,
  BEAM_X1,
  EARTH_IN,
  EARTH_POS,
  FOV,
  R_EARTH,
  R_SUN,
  SUN_IN,
  SUN_POS,
  appearAt,
  cameraAt,
} from "./layout";

const BEAM_H = 0.16;

const BEAM_FORM = ev("explanation", "Thin beam");
const DEPART = ev("journey", "Light particle departs").f;
const ARRIVE = ev("journey", "Particle reaches Earth").f;
const PHOTON = T.motion.photon;

// Sun "fires" the photon: a quick swell that decays.
const sunPulse = (frame: number) =>
  frame < PHOTON.sunPulseAt ? 0 : prog(frame, PHOTON.sunPulseAt, PHOTON.sunPulseAt + 6, easeOut) * Math.exp(-Math.max(0, frame - PHOTON.sunPulseAt - 6) / 22);

const additive = {
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
} as const;

const useShader = (frag: string, vert: string, uniforms: Record<string, THREE.IUniform>, extra: object = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, ...extra }), []);

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(c.x, c.y, 0);
  camera.updateProjectionMatrix();
  return null;
};

const Nebula: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(NEBULA_FRAG, QUAD_VERT, { uTime: { value: 0 } }, { depthWrite: false });
  mat.uniforms.uTime.value = frame / FPS;
  return (
    <mesh position={[0, 0, -140]} material={mat}>
      <planeGeometry args={[150, 260]} />
    </mesh>
  );
};

const STAR_LAYERS = [
  { count: 2600, z: [-95, -60], size: [2.0, 4.4], drift: [0.0, 0.05] },
  { count: 1100, z: [-50, -30], size: [2.6, 5.6], drift: [0.0, 0.11] },
  { count: 380, z: [-25, -12], size: [3.4, 7.5], drift: [0.0, 0.22] },
];
const STAR_TINTS = [
  [1.0, 1.0, 1.0],
  [0.8, 0.88, 1.0],
  [1.0, 0.92, 0.8],
  [0.7, 0.8, 1.0],
];

const StarLayer: React.FC<{ layer: number }> = ({ layer }) => {
  const frame = useCurrentFrame();
  const spec = STAR_LAYERS[layer];
  // Half-extents cover the widest view (camera at z ~10.1) at this layer's far depth.
  const dist = BASE_Z + 0.2 - spec.z[0];
  const wrap = new THREE.Vector2(dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (W / H) * 1.15, dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * 1.15);
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(spec.count * 3);
    const size = new Float32Array(spec.count);
    const phase = new Float32Array(spec.count);
    const color = new Float32Array(spec.count * 3);
    for (let i = 0; i < spec.count; i++) {
      const r = (k: string) => random(`star-${layer}-${i}-${k}`);
      pos[i * 3] = (r("x") * 2 - 1) * wrap.x;
      pos[i * 3 + 1] = (r("y") * 2 - 1) * wrap.y;
      pos[i * 3 + 2] = mix(spec.z[0], spec.z[1], r("z"));
      // Mostly faint stars with a few bright ones.
      size[i] = mix(spec.size[0], spec.size[1], Math.pow(r("s"), 3));
      phase[i] = r("p");
      const tint = STAR_TINTS[Math.floor(r("c") * STAR_TINTS.length)];
      const b = 0.5 + 0.9 * Math.pow(r("b"), 2);
      color.set([tint[0] * b, tint[1] * b, tint[2] * b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mat = useShader(
    STAR_FRAG,
    STAR_VERT,
    { uTime: { value: 0 }, uDrift: { value: new THREE.Vector2() }, uWrap: { value: wrap }, uOpacity: { value: 1 } },
    additive,
  );
  const t = frame / FPS;
  mat.uniforms.uTime.value = t;
  // Slow diagonal drift, faster for nearer layers: the parallax cue.
  mat.uniforms.uDrift.value.set(-spec.drift[1] * 0.35 * t, spec.drift[1] * t);
  return <points geometry={geom} material={mat} frustumCulled={false} />;
};

const Glow: React.FC<{
  position: THREE.Vector3;
  size: number;
  color: string;
  intensity: number;
  r0: number;
  falloff: number;
  rays?: number;
  z?: number;
}> = ({ position, size, color, intensity, r0, falloff, rays = 0, z = 0 }) => {
  const frame = useCurrentFrame();
  const mat = useShader(
    GLOW_FRAG,
    QUAD_VERT,
    {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: 0 },
      uR0: { value: r0 },
      uFalloff: { value: falloff },
      uRays: { value: rays },
      uTime: { value: 0 },
    },
    additive,
  );
  mat.uniforms.uIntensity.value = intensity;
  mat.uniforms.uTime.value = frame / FPS;
  return (
    <mesh position={[position.x, position.y, position.z + z]} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

const Sun: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = appearAt(frame, SUN_IN);
  const pulse = sunPulse(frame);
  const mat = useShader(SUN_FRAG, SPHERE_VERT, { uTime: { value: 0 }, uOpacity: { value: 0 } }, { transparent: true });
  mat.uniforms.uTime.value = frame / FPS;
  mat.uniforms.uOpacity.value = appear;
  const s = mix(0.6, 1, appear) * (1 + 0.07 * pulse);
  const flicker = 1 + 0.04 * Math.sin((frame / FPS) * 3.1);
  if (appear <= 0) return null;
  return (
    <group>
      <Glow position={SUN_POS} size={R_SUN * 9 * s} color="#ff7a1a" intensity={(0.55 + 0.5 * pulse) * appear * flicker} r0={0.5 / 9} falloff={9} rays={0.45} z={-0.5} />
      <Glow position={SUN_POS} size={R_SUN * 4 * s} color="#ffc266" intensity={(0.95 + 0.9 * pulse) * appear} r0={0.5 / 4} falloff={22} z={-0.4} />
      <mesh position={SUN_POS} scale={R_SUN * s} rotation={[0.2, (frame / FPS) * 0.05, 0]} material={mat}>
        <sphereGeometry args={[1, 96, 64]} />
      </mesh>
    </group>
  );
};

const Earth: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = appearAt(frame, EARTH_IN);
  // Earth brightens as the photon closes in, then flashes on arrival.
  const [rampFrom, rampTo] = PHOTON.earthGlowRamp;
  const ramp = prog(frame, rampFrom, rampTo, easeIn) * (1 - prog(frame, rampTo, rampTo + 90, easeOut));
  const flash = Math.max(frame >= ARRIVE ? Math.exp(-(frame - ARRIVE) / 14) : 0, 0.45 * ramp);
  const mat = useShader(
    EARTH_FRAG,
    SPHERE_VERT,
    {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uLightDir: { value: SUN_POS.clone().sub(EARTH_POS).normalize().add(new THREE.Vector3(0, 0.15, 0.35)).normalize() },
      uFlash: { value: 0 },
    },
    { transparent: true },
  );
  mat.uniforms.uTime.value = frame / FPS;
  mat.uniforms.uOpacity.value = appear;
  mat.uniforms.uFlash.value = flash;
  const s = mix(0.6, 1, appear);
  if (appear <= 0) return null;
  return (
    <group>
      <Glow position={EARTH_POS} size={R_EARTH * 4.2 * s} color="#4f9dff" intensity={(0.55 + 0.9 * flash) * appear} r0={0.5 / 4.2} falloff={34} z={-0.2} />
      <mesh position={EARTH_POS} scale={R_EARTH * s} rotation={[0.41, 0, 0]} material={mat}>
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
    </group>
  );
};

const Beam: React.FC = () => {
  const frame = useCurrentFrame();
  const formed = 0.25 * prog(frame, BEAM_FORM.f, BEAM_FORM.until ?? BEAM_FORM.f, easeOut);
  const head = prog(frame, DEPART, ARRIVE, easeInOut);
  const reveal = frame >= DEPART ? Math.max(formed, Math.min(1.03, head + 0.015)) : formed;
  const headOn = frame < DEPART ? 0 : 1 - prog(frame, ARRIVE, ARRIVE + 24, easeOut);
  const mat = useShader(
    BEAM_FRAG,
    QUAD_VERT,
    {
      uReveal: { value: 0 },
      uHead: { value: 0 },
      uHeadOn: { value: 0 },
      uOpacity: { value: 1 },
      uTime: { value: 0 },
      uLen: { value: BEAM_LEN },
      uHeight: { value: BEAM_H },
    },
    additive,
  );
  mat.uniforms.uReveal.value = reveal;
  mat.uniforms.uHead.value = head;
  mat.uniforms.uHeadOn.value = headOn;
  mat.uniforms.uTime.value = frame / FPS;
  if (frame < BEAM_FORM.f) return null;
  const headPos = new THREE.Vector3(mix(BEAM_X0, BEAM_X1, head), SUN_POS.y, 0.05);
  return (
    <group>
      <mesh position={[(BEAM_X0 + BEAM_X1) / 2, SUN_POS.y, 0.02]} material={mat}>
        <planeGeometry args={[BEAM_LEN, BEAM_H]} />
      </mesh>
      {headOn > 0 ? (
        <>
          {/* Light trail: fading echoes of the photon a few frames behind it. */}
          {Array.from({ length: PHOTON.trailSprites }, (_, k) => {
            const lag = prog(frame - (k + 1) * 3, DEPART, ARRIVE, easeInOut);
            const pos = new THREE.Vector3(mix(BEAM_X0, BEAM_X1, lag), SUN_POS.y, 0.04);
            return <Glow key={k} position={pos} size={0.5 - k * 0.05} color="#ffb85c" intensity={0.55 * headOn * (1 - k / PHOTON.trailSprites)} r0={0} falloff={18} />;
          })}
          <Glow position={headPos} size={0.8} color="#ffd27a" intensity={1.1 * headOn} r0={0.0} falloff={16} />
          <Glow position={headPos} size={0.2} color="#ffffff" intensity={1.8 * headOn} r0={0.02} falloff={60} z={0.01} />
        </>
      ) : null}
    </group>
  );
};

const Pulse: React.FC = () => {
  const frame = useCurrentFrame();
  const p = prog(frame, ARRIVE, ARRIVE + 60, easeOut);
  const mat = useShader(RING_FRAG, QUAD_VERT, { uProgress: { value: 0 }, uOpacity: { value: 0 } }, additive);
  mat.uniforms.uProgress.value = p;
  mat.uniforms.uOpacity.value = (1 - p) * 1.2;
  if (frame < ARRIVE || p >= 1) return null;
  return (
    <mesh position={[EARTH_POS.x, EARTH_POS.y, 0.3]} material={mat}>
      <planeGeometry args={[R_EARTH * 11, R_EARTH * 11]} />
    </mesh>
  );
};

export const Space3D: React.FC = () => (
  <ThreeCanvas
    width={W}
    height={H}
    flat
    linear
    gl={{ antialias: true }}
    camera={{ fov: FOV, position: [0, 0, BASE_Z], near: 0.1, far: 400 }}
    style={{ backgroundColor: "#02030a" }}
  >
    <color attach="background" args={["#02030a"]} />
    <CameraRig />
    <Nebula />
    {STAR_LAYERS.map((_, i) => (
      <StarLayer key={i} layer={i} />
    ))}
    <Sun />
    <Earth />
    <Beam />
    <Pulse />
  </ThreeCanvas>
);
