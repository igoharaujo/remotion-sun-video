// The 3D layer: #0A0A0F backdrop, scrolling perspective grid (floor + ceiling), three dust layers,
// wireframe accessibility icons drifting in the mid field, and the story objects: the face mesh of
// light points (with tongue and smile), the S04 globe, and the S09 spark.
// Every value is a pure function of the frame.
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { BLUE, FPS, GREEN, H, K, SC, W, AMBER, darkAt, easeOut, energyAt, mix, prog, win } from "../tl";
import { CAM_Z, FACE, FOV, GLOBE_POS, GLOBE_R, cameraAt, faceAt, globeAt, landmarkWorld, pxY } from "./rig";
import { BACKDROP_FRAG, BACKDROP_VERT, DUST_FRAG, DUST_VERT, GLOW_FRAG, GRID_FRAG, GRID_VERT, QUAD_VERT, SPOT_FRAG, SPOT_VERT } from "./shaders";

const additive = { transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending } as const;

const useShader = (frag: string, vert: string, uniforms: Record<string, THREE.IUniform>, extra: object = {}) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, ...extra }), []);

/** Impact frames that make the grid flare. */
const PULSES = [K("S01", "língua"), K("S04", "TikTok"), K("S04", "trend mundial"), K("S07", "passar"), K("S09", "mágica")];
const pulseAt = (frame: number) => PULSES.reduce((m, f) => (frame >= f ? Math.max(m, Math.exp(-(frame - f) / 10)) : m), 0);

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.set(c.x, c.y, c.z);
  camera.lookAt(c.x * 0.3, c.y * 0.3, 0);
  camera.updateProjectionMatrix();
  return null;
};

const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useShader(BACKDROP_FRAG, BACKDROP_VERT, { uDark: { value: 0 } }, { depthWrite: false, depthTest: false });
  mat.uniforms.uDark.value = darkAt(frame);
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

export const Glow: React.FC<{ position: [number, number, number] | THREE.Vector3; size: number; color: string; intensity: number; r0?: number; falloff?: number; rays?: number }> = ({
  position,
  size,
  color,
  intensity,
  r0 = 0,
  falloff = 12,
  rays = 0,
}) => {
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
  const p = position instanceof THREE.Vector3 ? ([position.x, position.y, position.z] as [number, number, number]) : position;
  return (
    <mesh position={p} material={mat}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

// ---- ambient ---------------------------------------------------------------------------------
const GridPlane: React.FC<{ y: number; alpha: number }> = ({ y, alpha }) => {
  const frame = useCurrentFrame();
  const mat = useShader(
    GRID_FRAG,
    GRID_VERT,
    { uScroll: { value: 0 }, uOpacity: { value: 0 }, uPulse: { value: 0 }, uColor: { value: new THREE.Color(BLUE) } },
    { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending },
  );
  // Scroll speed follows the energy: calm drift, a rush on the impactful beats.
  let scroll = 0;
  for (let f = 0; f < frame; f += 6) scroll += 6 * (0.012 + 0.05 * energyAt(f));
  mat.uniforms.uScroll.value = scroll;
  mat.uniforms.uOpacity.value = alpha * (0.3 + 0.2 * energyAt(frame)) * (1 - 0.6 * darkAt(frame)) * prog(frame, 0, 40);
  mat.uniforms.uPulse.value = pulseAt(frame);
  return (
    <mesh material={mat} position={[0, y, -20]} rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[40, 60]} />
    </mesh>
  );
};

const DUST_LAYERS = [
  { count: 800, z: [-26, -10], size: [1.5, 3.5], box: [12, 10] },
  { count: 360, z: [-9, -2], size: [2, 4.5], box: [7, 6] },
  { count: 70, z: [0, 5], size: [3, 7], box: [3.5, 3.2] },
];
const DUST_TINTS = [BLUE, "#9fc9ff", "#F5F7FA", GREEN];

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
      c.set(DUST_TINTS[Math.floor(Math.pow(r("c"), 1.4) * DUST_TINTS.length)]).multiplyScalar(0.3 + 0.6 * Math.pow(r("b"), 2));
      color.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const mat = useShader(DUST_FRAG, DUST_VERT, { uTime: { value: 0 }, uScale: { value: 60 }, uOpacity: { value: 1 }, uBox: { value: new THREE.Vector3(0, spec.box[1] * 2, 0) } }, additive);
  mat.uniforms.uTime.value = frame / FPS;
  mat.uniforms.uOpacity.value = (0.6 + 0.5 * energyAt(frame)) * (1 - 0.5 * darkAt(frame));
  return <points geometry={geom} material={mat} frustumCulled={false} />;
};

// Wireframe accessibility pictograms, built from line segments in a unit box.
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 24) =>
  Array.from({ length: n + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as [number, number];
  });
const segs = (pts: [number, number][], close = false) => {
  const out: [number, number][] = [];
  for (let k = 0; k < pts.length - 1; k++) out.push(pts[k], pts[k + 1]);
  if (close) out.push(pts[pts.length - 1], pts[0]);
  return out;
};
const ICONS: [number, number][][] = [
  // Universal access: ring, head, arms, body, legs.
  [
    ...segs(arc(0, 0, 1, 0, Math.PI * 2, 48)),
    ...segs(arc(0, 0.55, 0.13, 0, Math.PI * 2, 16)),
    [-0.6, 0.3], [0.6, 0.3],
    [0, 0.3], [0, -0.15],
    [0, -0.15], [-0.32, -0.7],
    [0, -0.15], [0.32, -0.7],
  ],
  // Eye.
  [...segs(arc(0, -0.55, 1.0, Math.PI * 0.2, Math.PI * 0.8)), ...segs(arc(0, 0.55, 1.0, -Math.PI * 0.2, -Math.PI * 0.8)), ...segs(arc(0, 0, 0.28, 0, Math.PI * 2, 20))],
  // Head with tracking arcs.
  [
    ...segs(arc(0, 0.05, 0.5, 0, Math.PI * 2, 32)),
    ...segs(arc(0, 0.05, 0.85, Math.PI * 0.15, Math.PI * 0.85)),
    ...segs(arc(0, 0.05, 0.85, Math.PI * 1.15, Math.PI * 1.85)),
    [0.72, 0.5], [0.85, 0.42], [0.72, 0.5], [0.66, 0.36],
    [-0.72, -0.4], [-0.85, -0.32], [-0.72, -0.4], [-0.66, -0.26],
  ],
  // Hand: palm and fingers.
  [
    ...segs([[-0.42, -0.9], [-0.45, -0.15], [0.45, -0.15], [0.42, -0.9]], true),
    ...[-0.33, -0.11, 0.11, 0.33].flatMap((x, k) => [[x, -0.15], [x, 0.55 + 0.12 * Math.sin(k * 1.3 + 0.8)]] as [number, number][]),
    [-0.45, -0.35], [-0.8, 0.05],
  ],
  // Face with tongue out.
  [...segs(arc(0, 0, 1, 0, Math.PI * 2, 40)), ...segs(arc(-0.35, 0.3, 0.1, 0, Math.PI * 2, 10)), ...segs(arc(0.35, 0.3, 0.1, 0, Math.PI * 2, 10)), ...segs(arc(0, -0.25, 0.42, Math.PI * 1.15, Math.PI * 1.85)), ...segs(arc(0, -0.55, 0.16, Math.PI, Math.PI * 2, 12))],
];

const ICON_COUNT = 11;
const AccessIcons: React.FC = () => {
  const frame = useCurrentFrame();
  const objs = useMemo(
    () =>
      Array.from({ length: ICON_COUNT }, (_, i) => {
        const r = (k: string) => random(`icon-${i}-${k}`);
        const shape = ICONS[i % ICONS.length];
        const geom = new THREE.BufferGeometry().setFromPoints(shape.map(([x, y]) => new THREE.Vector3(x, y, 0)));
        const green = r("c") < 0.3;
        const mat = new THREE.LineBasicMaterial({ color: green ? GREEN : BLUE, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
        const side = i % 2 ? 1 : -1;
        return {
          line: new THREE.LineSegments(geom, mat),
          base: [side * (1.6 + 2.6 * r("x")), (r("y") * 2 - 1) * 6, -5 - 13 * r("z")] as const,
          scale: 0.5 + 0.9 * r("s"),
          spin: (r("spin") * 2 - 1) * 0.25,
          alpha: 0.16 + 0.18 * r("a"),
          phase: r("p") * 10,
        };
      }),
    [],
  );
  const t = frame / FPS;
  // Icons brighten while the narration talks about accessibility.
  const accent = win(frame, K("S03", "Apple"), SC.S03.to, 20, 30);
  const fade = prog(frame, 10, 60) * (1 - 0.6 * darkAt(frame)) * (1 - prog(frame, SC.S09.from + 30, SC.S09.to - 40));
  return (
    <>
      {objs.map((o, i) => {
        (o.line.material as THREE.LineBasicMaterial).opacity = o.alpha * fade * (1 + 1.4 * accent);
        return (
          <primitive
            key={i}
            object={o.line}
            position={[o.base[0] + 0.25 * Math.sin(t * 0.2 + o.phase), o.base[1] + 0.35 * Math.sin(t * 0.15 + o.phase * 2) + t * 0.05, o.base[2]]}
            rotation={[0.3 * Math.sin(t * 0.11 + o.phase), t * o.spin + o.phase, 0.1 * Math.sin(t * 0.13)]}
            scale={o.scale}
          />
        );
      })}
    </>
  );
};

// ---- face mesh -------------------------------------------------------------------------------
const N = FACE.L.length;
const SEGMENTS: [number, number][] = [...FACE.strips.flatMap((s) => s.slice(0, -1).map((a, k) => [a, s[k + 1]] as [number, number])), ...FACE.links];
const STRIP_SEGS = FACE.strips.reduce((n, s) => n + s.length - 1, 0);
const COL = {
  outline: new THREE.Color("#7fb8ff"),
  brow: new THREE.Color("#cfe3ff"),
  eye: new THREE.Color("#ffffff"),
  nose: new THREE.Color("#a9ccff"),
  lip: new THREE.Color("#d6e8ff"),
  skin: new THREE.Color(BLUE).multiplyScalar(0.75),
  tongue: new THREE.Color(GREEN),
} as const;
const WHITE3 = new THREE.Color("#ffffff");
const GREEN3 = new THREE.Color(GREEN);
const AMBER3 = new THREE.Color(AMBER);

const FaceMesh: React.FC = () => {
  const frame = useCurrentFrame();
  const f = faceAt(frame);
  const { pts, lines, lineFaint } = useMemo(() => {
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    pg.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(N), 1));
    pg.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(STRIP_SEGS * 6), 3));
    const fg = new THREE.BufferGeometry();
    fg.setAttribute("position", new THREE.BufferAttribute(new Float32Array((SEGMENTS.length - STRIP_SEGS) * 6), 3));
    const lm = new THREE.LineBasicMaterial({ color: "#6fb0ff", transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    const fm = new THREE.LineBasicMaterial({ color: BLUE, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending });
    return { pts: pg, lines: new THREE.LineSegments(lg, lm), lineFaint: new THREE.LineSegments(fg, fm) };
  }, []);
  const mat = useShader(SPOT_FRAG, SPOT_VERT, { uScale: { value: 60 }, uOpacity: { value: 1 } }, additive);
  if (f.opacity <= 0.002) return null;

  const world: THREE.Vector3[] = [];
  const pos = pts.attributes.position as THREE.BufferAttribute;
  const size = pts.attributes.aSize as THREE.BufferAttribute;
  const color = pts.attributes.aColor as THREE.BufferAttribute;
  const c = new THREE.Color();
  // Scan band in world y (top of face to chin).
  const top = f.pos.y + 1.25 * f.scale;
  const scanY = f.scan >= 0 ? mix(top, f.pos.y - 1.35 * f.scale, f.scan) : -999;
  const tongueGlow = f.tongue;
  for (let i = 0; i < N; i++) {
    const l = FACE.L[i];
    const p = landmarkWorld(i, f, frame);
    world.push(p);
    pos.setXYZ(i, p.x, p.y, p.z);
    const tw = 0.75 + 0.25 * Math.sin(frame / 11 + l.seed * 40);
    const scanned = scanY > -900 ? Math.exp(-((p.y - scanY) ** 2) / 0.02) : 0;
    let s = l.region === "skin" ? 3.2 : l.region === "tongue" ? 4.4 : 4.6;
    c.copy(COL[l.region]);
    if (l.region === "tongue") {
      if (tongueGlow <= 0.01) {
        size.setX(i, 0);
        color.setXYZ(i, 0, 0, 0);
        continue;
      }
      c.multiplyScalar(0.6 + 0.8 * tongueGlow);
      s *= 0.6 + 0.6 * tongueGlow;
    }
    if (l.region === "lip" && f.smile > 0) c.lerp(AMBER3, 0.7 * f.smile);
    c.lerp(GREEN3, 0.8 * scanned).lerp(WHITE3, 0.3 * scanned);
    size.setX(i, s * (1 + 0.8 * scanned + 0.25 * f.lock) * (1 + 1.5 * f.disperse * (1 - f.disperse)));
    color.setXYZ(i, c.r * tw, c.g * tw, c.b * tw);
  }
  pos.needsUpdate = true;
  size.needsUpdate = true;
  color.needsUpdate = true;
  const lp = lines.geometry.attributes.position as THREE.BufferAttribute;
  const fp = lineFaint.geometry.attributes.position as THREE.BufferAttribute;
  SEGMENTS.forEach(([a, b], k) => {
    const [arr, idx] = k < STRIP_SEGS ? [lp, k] : [fp, k - STRIP_SEGS];
    arr.setXYZ(idx * 2, world[a].x, world[a].y, world[a].z);
    arr.setXYZ(idx * 2 + 1, world[b].x, world[b].y, world[b].z);
  });
  lp.needsUpdate = true;
  fp.needsUpdate = true;
  const lineK = f.opacity * f.assemble * (1 - f.disperse);
  (lines.material as THREE.LineBasicMaterial).opacity = 0.55 * lineK * (1 + 0.5 * f.lock);
  (lineFaint.material as THREE.LineBasicMaterial).opacity = 0.16 * lineK;
  mat.uniforms.uOpacity.value = f.opacity;

  const mouth = landmarkWorld(FACE.tongue[0] + 7, f, frame);
  return (
    <>
      <Glow position={[f.pos.x, f.pos.y, f.pos.z - 0.8]} size={5.2 * f.scale} color={BLUE} intensity={0.16 * f.opacity * (1 + f.lock) * (1 - 0.5 * darkAt(frame))} falloff={5} />
      <primitive object={lineFaint} />
      <primitive object={lines} />
      <points geometry={pts} material={mat} frustumCulled={false} />
      <Glow position={[mouth.x, mouth.y, mouth.z + 0.1]} size={1.6} color={GREEN} intensity={0.9 * tongueGlow * f.opacity} falloff={10} />
    </>
  );
};

// ---- globe (S04) -----------------------------------------------------------------------------
const GLOBE_N = 700;
const GLOBE_PTS = Array.from({ length: GLOBE_N }, (_, i) => {
  const y = 1 - (2 * (i + 0.5)) / GLOBE_N;
  const r = Math.sqrt(1 - y * y);
  const a = i * Math.PI * (3 - Math.sqrt(5));
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
});
// Pings: where the trend "lights up" (indices into GLOBE_PTS) and when.
export const PINGS = Array.from({ length: 16 }, (_, i) => ({
  idx: Math.floor(random(`ping-${i}`) * GLOBE_N),
  at: K("S04", "descobriu") + Math.floor(i * 6 + random(`ping-t-${i}`) * 8),
}));

const Globe: React.FC = () => {
  const frame = useCurrentFrame();
  const g = globeAt(frame);
  const geom = useMemo(() => {
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(GLOBE_PTS.flatMap((p) => [p.x, p.y, p.z])), 3));
    pg.setAttribute("aSize", new THREE.BufferAttribute(new Float32Array(GLOBE_N), 1));
    pg.setAttribute("aColor", new THREE.BufferAttribute(new Float32Array(GLOBE_N * 3), 3));
    return pg;
  }, []);
  const mat = useShader(SPOT_FRAG, SPOT_VERT, { uScale: { value: 60 }, uOpacity: { value: 1 } }, additive);
  if (g.opacity <= 0.002) return null;
  const size = geom.attributes.aSize as THREE.BufferAttribute;
  const color = geom.attributes.aColor as THREE.BufferAttribute;
  const blue = new THREE.Color(BLUE);
  const c = new THREE.Color();
  const rot = new THREE.Matrix4().makeRotationY(g.rotY);
  const lit = new Float32Array(GLOBE_N);
  for (const p of PINGS) if (frame >= p.at) lit[p.idx] = Math.max(lit[p.idx], 0.5 + 0.5 * Math.exp(-(frame - p.at) / 12));
  for (let i = 0; i < GLOBE_N; i++) {
    const z = GLOBE_PTS[i].clone().applyMatrix4(rot).z; // back side dimmer
    const front = 0.35 + 0.65 * (z * 0.5 + 0.5);
    c.copy(blue).multiplyScalar(front).lerp(GREEN3, lit[i]);
    size.setX(i, (2.6 + 5 * lit[i]) * (0.7 + 0.3 * front));
    color.setXYZ(i, c.r, c.g, c.b);
  }
  size.needsUpdate = true;
  color.needsUpdate = true;
  mat.uniforms.uOpacity.value = g.opacity;
  return (
    <group position={GLOBE_POS} scale={GLOBE_R * g.scale}>
      <Glow position={[0, 0, -0.4]} size={3.2} color={BLUE} intensity={0.3 * g.opacity} falloff={6} />
      <group rotation={[0.35, g.rotY, 0]}>
        <points geometry={geom} material={mat} frustumCulled={false} />
        {PINGS.filter((p) => frame >= p.at && frame < p.at + 40).map((p, i) => {
          const q = GLOBE_PTS[p.idx];
          const k = prog(frame, p.at, p.at + 40);
          return <Glow key={i} position={[q.x * 1.02, q.y * 1.02, q.z * 1.02]} size={0.06 + 0.3 * k} color={GREEN} intensity={g.opacity * (1 - k) * 1.2} r0={0.3 * k} falloff={30} />;
        })}
      </group>
    </group>
  );
};

/** The S09 spark: the face's points converge into it on "mágica". */
const Spark: React.FC = () => {
  const frame = useCurrentFrame();
  const f = faceAt(frame);
  const m = K("S09", "mágica");
  const build = prog(frame, SC.S09.from + 40, m, easeOut);
  const burst = frame >= m ? Math.exp(-(frame - m) / 18) : 0;
  const hold = win(frame, m, SC.S09.to, 4, 50);
  const k = Math.max(build * 0.5, hold) * (1 - prog(frame, K("S09", "fadeOut"), SC.S09.to));
  if (k <= 0.002) return null;
  const t = frame / FPS;
  return (
    <>
      <Glow position={[f.pos.x, f.pos.y, 0.4]} size={7} color={BLUE} intensity={0.5 * k + 0.6 * burst} falloff={5} rays={0.9} />
      <Glow position={[f.pos.x, f.pos.y, 0.5]} size={3.5} color={GREEN} intensity={0.6 * k + 0.5 * burst} falloff={9} rays={0.6} />
      <Glow position={[f.pos.x, f.pos.y, 0.6]} size={1.2 + 0.1 * Math.sin(t * 6)} color="#ffffff" intensity={1.4 * k + burst} falloff={16} />
    </>
  );
};

export const Scene3D: React.FC = () => (
  <ThreeCanvas width={W} height={H} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 400 }}>
    <CameraRig />
    <Backdrop />
    <GridPlane y={pxY(1920) - 1.2} alpha={1} />
    <GridPlane y={pxY(0) + 2.2} alpha={0.35} />
    <DustLayer layer={0} />
    <AccessIcons />
    <DustLayer layer={1} />
    <Globe />
    <FaceMesh />
    <Spark />
    <DustLayer layer={2} />
  </ThreeCanvas>
);
