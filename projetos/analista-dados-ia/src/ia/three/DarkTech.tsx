// The 3D "dark tech" world (Three.js): an endless perspective grid floor in thin cyan lines scrolling toward the
// camera, translucent data columns breathing on the horizon, three parallax layers of "bits" (dots, then 0/1
// glyphs), a horizon glow, plus two story props — a dot-matrix map of the US that lights up west to east on
// "mercado americano", and the AI core (a swirling particle sphere around a black hole) that "engoliu" the
// cards in S02. Every value is a pure function of the frame. Colours are written straight out (`flat linear`
// canvas); glow sprites stand in for bloom (EffectComposer renders black in Remotion).
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { FPS, H, K, SC, W, dimAt, easeInOut, easeOut, kickAt, mix, prog, win } from "../tl";

const FOV = 40;
const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
/** World units -> screen px at distance d from the camera. */
const unitPx = (d: number) => H / 2 / (d * TAN);
/** Point on the z=0 plane that lands on screen pixel (x, y) (camera looking straight down -z). */
const screenAt = (x: number, y: number) => new THREE.Vector3((x - W / 2) / unitPx(CAM_Z), (H / 2 - y) / unitPx(CAM_Z), 0);
const FLOOR_Y = -3.2;
const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

/** 0..1 the lights come back up for the solution (S04). */
const litAt = (frame: number) => win(frame, SC.S04.from - 6, SC.S05.to + 20, 30, 10);
const intensityAt = (frame: number) => (1 - 0.55 * dimAt(frame)) * (1 + 0.35 * litAt(frame));

// ---- camera ------------------------------------------------------------------------------------------
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const t = frame / FPS;
  // A slow, continuous drift; pushes in a little in the serious data scene.
  camera.position.set(0.35 * Math.sin(t * 0.13), 0.15 * Math.sin(t * 0.19 + 1), CAM_Z - 1.2 * dimAt(frame) * prog(frame, SC.S03.from - 30, SC.S03.from + 120, easeInOut));
  camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, camera.position.z - 10);
  camera.updateProjectionMatrix();
  return null;
};

// ---- grid floor -------------------------------------------------------------------------------------------
const FLOOR_VERT = "varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }";
const FLOOR_FRAG = /* glsl */ `
uniform float uScroll; uniform float uI; uniform float uPulse; uniform vec3 uColor;
varying vec3 vW;
float gridLine(vec2 p, float w) { vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p); return 1.0 - min(min(g.x, g.y) / w, 1.0); }
void main() {
  vec2 p = vec2(vW.x, vW.z + uScroll);
  float minor = gridLine(p, 1.0) * 0.35;
  float major = gridLine(p / 4.0, 1.4);
  float d = -vW.z;
  float fade = exp(-max(d, 0.0) * 0.035) * smoothstep(-6.0, 4.0, d + 6.0);
  // a bright scan line rolling toward the camera
  float scan = exp(-pow((fract((d - uPulse) / 40.0) - 0.5) * 40.0, 2.0));
  vec3 c = uColor * (minor + major) * fade * uI + uColor * scan * major * fade * 1.5 * uI;
  gl_FragColor = vec4(c, 1.0);
}
`;
const Floor: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, uniforms: { uScroll: { value: 0 }, uI: { value: 1 }, uPulse: { value: 0 }, uColor: { value: new THREE.Color("#2FC8F0") } }, ...additive }), []);
  const t = frame / FPS;
  mat.uniforms.uScroll.value = -t * 1.6;
  mat.uniforms.uI.value = 0.55 * intensityAt(frame);
  mat.uniforms.uPulse.value = t * 9;
  return (
    <mesh material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, -60]} renderOrder={-6}>
      <planeGeometry args={[220, 160]} />
    </mesh>
  );
};

// ---- glow sprite ----------------------------------------------------------------------------------------------
const QUAD_VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform float uFalloff; uniform vec2 uStretch;
varying vec2 vUv;
void main() { vec2 q = (vUv - 0.5) * uStretch; float r = length(q); float g = exp(-r * uFalloff) * smoothstep(0.5, 0.2, length(vUv - 0.5)); gl_FragColor = vec4(uColor * g * uIntensity, 1.0); }
`;
const Glow: React.FC<{ position: THREE.Vector3 | [number, number, number]; size: [number, number]; color: string; intensity: number; falloff?: number; order?: number }> = ({ position, size, color, intensity, falloff = 6, order = 3 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uFalloff: { value: falloff }, uStretch: { value: new THREE.Vector2(1, 1) } }, ...additive }), [falloff]);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uIntensity.value = intensity;
  if (intensity <= 0.002) return null;
  return (
    <mesh position={position} material={mat} renderOrder={order}>
      <planeGeometry args={size} />
    </mesh>
  );
};

// ---- backdrop (deep gradient) -------------------------------------------------------------------------------
const BACK_FRAG = /* glsl */ `
uniform float uI; varying vec2 vUv;
void main() {
  vec3 top = vec3(0.012, 0.016, 0.03);
  vec3 hz = vec3(0.02, 0.07, 0.11);
  float h = exp(-pow((vUv.y - 0.6) * 5.0, 2.0));
  gl_FragColor = vec4(mix(top, hz, h * uI), 1.0);
}
`;
const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }", fragmentShader: BACK_FRAG, uniforms: { uI: { value: 1 } }, depthWrite: false, depthTest: false }), []);
  mat.uniforms.uI.value = intensityAt(frame);
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

// ---- data columns on the horizon -----------------------------------------------------------------------------
const COL_VERT = "varying vec3 vP; varying vec3 vN; void main() { vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
const COL_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uI;
varying vec3 vP; varying vec3 vN;
void main() {
  // box is 1x1x1 centred: vP.y from -0.5 (floor) to 0.5 (top); edges glow, faces stay faint
  vec3 a = abs(vP);
  float edge = step(0.46, max(a.x, a.z)) * step(0.46, min(max(a.x, a.y), max(a.y, a.z)));
  float rim = smoothstep(0.42, 0.5, max(max(a.x * step(a.y, 0.49), a.z * step(a.y, 0.49)), a.y));
  float grad = 0.25 + 0.75 * (vP.y + 0.5);
  float top = step(0.49, vP.y);
  vec3 c = uColor * (0.08 * grad + 0.55 * rim * grad + 0.5 * top) * uI;
  gl_FragColor = vec4(c, 1.0);
}
`;
const N_COLS = 46;
const COLS = Array.from({ length: N_COLS }, (_, i) => ({
  x: (random(`cx${i}`) - 0.5) * 70,
  z: mix(-22, -70, random(`cz${i}`)),
  w: mix(0.8, 1.8, random(`cw${i}`)),
  h: mix(1.5, 9, random(`ch${i}`) ** 1.4),
  ph: random(`cp${i}`) * 6.28,
  sp: mix(0.2, 0.6, random(`cs${i}`)),
  color: random(`cc${i}`) > 0.7 ? "#2F7BFF" : "#2FC8F0",
}));
const Columns: React.FC = () => {
  const frame = useCurrentFrame();
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mats = useMemo(() => COLS.map((c) => new THREE.ShaderMaterial({ vertexShader: COL_VERT, fragmentShader: COL_FRAG, uniforms: { uColor: { value: new THREE.Color(c.color) }, uI: { value: 1 } }, ...additive })), []);
  const t = frame / FPS;
  const I = intensityAt(frame);
  return (
    <>
      {COLS.map((c, i) => {
        const h = c.h * (0.65 + 0.35 * Math.sin(t * c.sp + c.ph)) * (1 + 0.25 * litAt(frame));
        mats[i].uniforms.uI.value = 0.6 * I;
        return <mesh key={i} geometry={geom} material={mats[i]} position={[c.x, FLOOR_Y + h / 2, c.z]} scale={[c.w, h, c.w]} renderOrder={-4} />;
      })}
    </>
  );
};

// ---- bits: three parallax layers ------------------------------------------------------------------------------
const BIT_VERT = /* glsl */ `
attribute float aSize; attribute float aSeed; attribute float aGlyph;
uniform float uTime; uniform float uPx;
varying float vTw; varying float vGlyph;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTw = 0.55 + 0.45 * sin(uTime * (1.2 + aSeed * 2.5) + aSeed * 40.0);
  vGlyph = aGlyph;
  gl_PointSize = aSize * uPx / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const BIT_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uI; uniform sampler2D uAtlas; uniform float uGlyphs;
varying float vTw; varying float vGlyph;
void main() {
  vec2 pc = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
  float a;
  if (uGlyphs > 0.5) a = texture2D(uAtlas, vec2((pc.x + vGlyph) * 0.5, pc.y)).a;
  else { float d = length(gl_PointCoord - 0.5); a = smoothstep(0.5, 0.0, d); a *= a; }
  gl_FragColor = vec4(uColor * a * vTw * uI, 1.0);
}
`;
const BIT_LAYERS = [
  { n: 1800, z: [-60, -25], spread: 46, size: 0.5, speed: 0.6, color: "#3A8FD8", glyphs: false },
  { n: 420, z: [-25, -6], spread: 20, size: 1.6, speed: 1.2, color: "#3DD9FF", glyphs: true },
  { n: 70, z: [-6, 5], spread: 8, size: 2.6, speed: 2.2, color: "#9BEFFF", glyphs: true },
];
const useAtlas = () =>
  useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#fff";
    g.font = "bold 54px 'JetBrains Mono', Menlo, monospace";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("0", 32, 34);
    g.fillText("1", 96, 34);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.NoColorSpace;
    return tex;
  }, []);
const BitLayer: React.FC<{ layer: (typeof BIT_LAYERS)[number]; idx: number }> = ({ layer, idx }) => {
  const frame = useCurrentFrame();
  const atlas = useAtlas();
  const { geom, base } = useMemo(() => {
    const pos = new Float32Array(layer.n * 3);
    const size = new Float32Array(layer.n);
    const seed = new Float32Array(layer.n);
    const glyph = new Float32Array(layer.n);
    for (let i = 0; i < layer.n; i++) {
      pos[i * 3] = (random(`bx${idx}-${i}`) - 0.5) * layer.spread * 1.2;
      pos[i * 3 + 1] = (random(`by${idx}-${i}`) - 0.35) * layer.spread * 1.6;
      pos[i * 3 + 2] = mix(layer.z[0], layer.z[1], random(`bz${idx}-${i}`));
      size[i] = layer.size * (0.5 + random(`bs${idx}-${i}`));
      seed[i] = random(`bd${idx}-${i}`);
      glyph[i] = random(`bg${idx}-${i}`) > 0.5 ? 1 : 0;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aGlyph", new THREE.BufferAttribute(glyph, 1));
    return { geom: g, base: pos };
  }, [layer, idx]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: BIT_VERT, fragmentShader: BIT_FRAG, uniforms: { uTime: { value: 0 }, uPx: { value: 300 }, uColor: { value: new THREE.Color(layer.color) }, uI: { value: 1 }, uAtlas: { value: atlas }, uGlyphs: { value: layer.glyphs ? 1 : 0 } }, ...additive }),
    [layer, atlas],
  );
  // Bits stream toward the camera (wrapping) and rise slowly; the near layers move faster: the parallax.
  const t = frame / FPS;
  const p = geom.getAttribute("position") as THREE.BufferAttribute;
  const depth = layer.z[1] - layer.z[0];
  const hgt = layer.spread * 1.6;
  for (let i = 0; i < layer.n; i++) {
    const z0 = base[i * 3 + 2] - layer.z[0];
    p.setZ(i, layer.z[0] + ((z0 + t * layer.speed) % depth));
    const y0 = base[i * 3 + 1] + hgt / 2;
    p.setY(i, ((y0 + t * layer.speed * 0.15) % hgt) - hgt / 2 + layer.spread * 0.24);
  }
  p.needsUpdate = true;
  mat.uniforms.uTime.value = t;
  mat.uniforms.uI.value = (idx === 0 ? 0.9 : 0.6) * intensityAt(frame);
  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={-2} />;
};

// ---- dot-matrix US map (hook: "mercado americano agora de 2026") ------------------------------------------------
// Contiguous US outline (lon, lat), coarse.
const US: [number, number][] = [
  [-124.7, 48.4], [-122.8, 49], [-95.2, 49], [-94.8, 49.4], [-89.6, 48], [-84.8, 46.5], [-82.4, 43], [-79, 43.3], [-76.5, 44.2], [-74.9, 45], [-71.5, 45], [-70, 46.7],
  [-69.2, 47.4], [-67.8, 47.1], [-67, 44.8], [-70.6, 43.1], [-70.8, 42], [-69.9, 41.7], [-71.9, 41.3], [-74, 40.6], [-74.9, 38.9], [-75.5, 38.4], [-76, 37], [-75.5, 35.2],
  [-77.9, 33.9], [-79.9, 32.7], [-81.4, 30.7], [-80.1, 26.9], [-80.4, 25.2], [-81.8, 26.1], [-82.7, 27.9], [-83, 29.1], [-84.3, 30], [-86.5, 30.4], [-88.1, 30.4], [-89.6, 30.2],
  [-89.4, 29], [-91, 29.3], [-93.8, 29.7], [-94.8, 29.3], [-97.2, 27.6], [-97.2, 25.9], [-99.5, 27.5], [-101.4, 29.8], [-103.1, 29], [-104.5, 29.6], [-106.5, 31.8], [-108.2, 31.8],
  [-108.2, 31.3], [-111.1, 31.3], [-114.8, 32.5], [-117.1, 32.5], [-118.5, 34], [-120.6, 34.6], [-121.9, 36.6], [-122.5, 37.8], [-123.8, 39.8], [-124.2, 41.9], [-124.5, 43], [-124, 46.3],
];
const inside = (x: number, y: number) => {
  let c = false;
  for (let i = 0, j = US.length - 1; i < US.length; j = i++) {
    const [xi, yi] = US[i];
    const [xj, yj] = US[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const MAP_DOTS = (() => {
  const out: number[] = [];
  for (let lat = 24.5; lat <= 49.5; lat += 0.85) for (let lon = -125; lon <= -66.5; lon += 0.85 / 0.78) if (inside(lon, lat)) out.push(lon, lat);
  return out;
})();
const MAP_VERT = /* glsl */ `
attribute float aLon; uniform float uSweep; uniform float uPx;
varying float vOn;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vOn = smoothstep(uSweep - 0.12, uSweep, 1.0 - aLon) ;
  gl_PointSize = uPx / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const MAP_FRAG = /* glsl */ `
uniform float uO; varying float vOn;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.15, d);
  vec3 off = vec3(0.10, 0.22, 0.32);
  vec3 on = vec3(0.30, 0.90, 1.10);
  gl_FragColor = vec4(mix(off, on, vOn) * a * uO, 1.0);
}
`;
const MAP_IN = K("S01", "americano") - 12;
const MAP_OUT = K("S01", "talvez") + 10;
/** Map centre on screen and its width in px. */
const MAP_POS = { x: 300, y: 520, w: 470 };
const UsMap: React.FC = () => {
  const frame = useCurrentFrame();
  const { geom, mat } = useMemo(() => {
    const n = MAP_DOTS.length / 2;
    const pos = new Float32Array(n * 3);
    const lonN = new Float32Array(n);
    const sc = MAP_POS.w / unitPx(CAM_Z) / 58;
    for (let i = 0; i < n; i++) {
      const lon = MAP_DOTS[i * 2];
      const lat = MAP_DOTS[i * 2 + 1];
      pos[i * 3] = (lon + 95.8) * 0.78 * sc;
      pos[i * 3 + 1] = (lat - 37) * sc;
      lonN[i] = (lon + 125) / 58.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aLon", new THREE.BufferAttribute(lonN, 1));
    const m = new THREE.ShaderMaterial({ vertexShader: MAP_VERT, fragmentShader: MAP_FRAG, uniforms: { uSweep: { value: 0 }, uPx: { value: 70 }, uO: { value: 0 } }, ...additive });
    return { geom: g, mat: m };
  }, []);
  if (frame < MAP_IN || frame > MAP_OUT + 20) return null;
  const o = win(frame, MAP_IN, MAP_OUT + 20, 14, 20);
  // west -> east sweep (the uniform runs 0..1.15 so the east coast fully lights)
  mat.uniforms.uSweep.value = 1.15 - 1.15 * prog(frame, MAP_IN + 6, K("S01", "n2026") + 10, easeInOut);
  mat.uniforms.uO.value = o;
  const tilt = mix(-0.7, -0.35, prog(frame, MAP_IN, MAP_IN + 40, easeOut));
  return (
    <group position={screenAt(MAP_POS.x, MAP_POS.y)} rotation={[tilt, 0.12 * Math.sin(frame / 90), 0]} scale={mix(0.85, 1, o)}>
      <points geometry={geom} material={mat} frustumCulled={false} renderOrder={5} />
    </group>
  );
};

// ---- AI core (S02: "a inteligência artificial hoje já engoliu…") --------------------------------------------------
const CORE_IN = K("S02", "engoliu") - 24;
const CORE_OUT = SC.S02.to - 4;
export const CORE_SCREEN = { x: 470, y: 900 };
const CORE_R = 1.45;
const N_CORE = 2200;
const CORE_VERT = /* glsl */ `
attribute vec3 aSeed;
uniform float uT; uniform float uPull; uniform float uR;
varying float vB;
void main() {
  // particles orbit on tilted rings and spiral inward; the radius cycles so the stream never runs dry
  float ph = fract(aSeed.x + uT * (0.10 + 0.25 * uPull));
  float r = uR * mix(1.0, 0.12, ph) * (0.75 + 0.5 * aSeed.y);
  float ang = aSeed.z * 6.2831 + uT * (0.8 + 2.4 / (0.25 + r));
  float tilt = (aSeed.y - 0.5) * 1.1;
  vec3 p = vec3(cos(ang) * r, sin(ang) * r * 0.28 + sin(tilt) * r * 0.5 * cos(ang * 0.5), sin(ang) * r * 0.35);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vB = smoothstep(0.0, 0.25, ph) * (1.0 - smoothstep(0.85, 1.0, ph)) * (0.6 + 1.4 * (1.0 - r / (uR * 1.3)));
  gl_PointSize = (2.0 + 4.0 * aSeed.y) * 22.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const CORE_FRAG = /* glsl */ `
uniform float uO; varying float vB;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  vec3 c = mix(vec3(0.18, 0.48, 1.0), vec3(0.75, 0.95, 1.0), clamp(vB - 0.6, 0.0, 1.0));
  gl_FragColor = vec4(c * a * vB * uO, 1.0);
}
`;
const HOLE_FRAG = /* glsl */ `
uniform float uO; varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float ring = exp(-pow((r - 0.62) * 9.0, 2.0));
  float a = smoothstep(0.62, 0.5, r);
  gl_FragColor = vec4(vec3(0.6, 0.9, 1.0) * ring * 1.3 * uO, max(a, ring) * uO);
}
`;
const AiCore: React.FC = () => {
  const frame = useCurrentFrame();
  const { geom, mat, hole } = useMemo(() => {
    const seed = new Float32Array(N_CORE * 3);
    for (let i = 0; i < N_CORE; i++) seed.set([random(`k${i}`), random(`ky${i}`), random(`kz${i}`)], i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_CORE * 3), 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    return {
      geom: g,
      mat: new THREE.ShaderMaterial({ vertexShader: CORE_VERT, fragmentShader: CORE_FRAG, uniforms: { uT: { value: 0 }, uPull: { value: 0 }, uR: { value: CORE_R }, uO: { value: 0 } }, ...additive }),
      hole: new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: HOLE_FRAG, uniforms: { uO: { value: 0 } }, transparent: true, depthWrite: false }),
    };
  }, []);
  if (frame < CORE_IN || frame > CORE_OUT + 16) return null;
  const o = win(frame, CORE_IN, CORE_OUT + 16, 20, 16);
  // each swallowed card kicks the pull as it disappears (hud/S02 Swallowed: +14..+32); "dashboard" is spat out
  const gulp = kickAt(frame, K("S02", "codigo1") + 30, 14) + kickAt(frame, K("S02", "query") + 30, 14) + kickAt(frame, K("S02", "dashboard"), 10);
  mat.uniforms.uT.value = (frame - CORE_IN) / FPS;
  mat.uniforms.uPull.value = 0.4 + gulp;
  mat.uniforms.uO.value = o;
  hole.uniforms.uO.value = o;
  const pos = screenAt(CORE_SCREEN.x, CORE_SCREEN.y);
  const s = mix(0.3, 1, prog(frame, CORE_IN, CORE_IN + 30, easeOut)) * (1 + 0.08 * gulp);
  return (
    <group position={pos} scale={s} rotation={[0.25, 0, -0.12]}>
      <Glow position={[0, 0, -0.2]} size={[7, 7]} color="#2F7BFF" intensity={0.55 * o * (1 + gulp)} falloff={5} order={6} />
      <points geometry={geom} material={mat} frustumCulled={false} renderOrder={7} />
      <mesh material={hole} renderOrder={8} rotation={[-0.25, 0, 0.12]}>
        <planeGeometry args={[0.9, 0.9]} />
      </mesh>
    </group>
  );
};

export const DarkTech: React.FC = () => {
  const frame = useCurrentFrame();
  const I = intensityAt(frame);
  return (
    <ThreeCanvas width={Math.round(W)} height={Math.round(H)} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 400 }}>
      <CameraRig />
      <Backdrop />
      <Floor />
      <Columns />
      <Glow position={[0, FLOOR_Y + 0.4, -70]} size={[180, 26]} color="#1AA8E0" intensity={0.38 * I} falloff={4.5} order={-3} />
      {BIT_LAYERS.map((l, i) => (
        <BitLayer key={i} layer={l} idx={i} />
      ))}
      <UsMap />
      <AiCore />
    </ThreeCanvas>
  );
};
