// The 3D space world (Three.js): three parallax star layers, a procedural blue/violet nebula, a photoreal
// Earth (textured, clouds, atmospheric scattering) that a meteor blows apart exactly on "explodindo" (flash, shockwave ring,
// fireball, 90 tumbling fragments, 600 sparks), whose debris keeps drifting behind the tips. Every value
// is a pure function of the frame. Colours are written straight out (the canvas renders `flat linear`).
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { useMemo, useState } from "react";
import { cancelRender, continueRender, delayRender, random, staticFile, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { FPS, H, K, SC, W, dimAt, easeIn, easeInOut, kickAt, mix, prog } from "../tl";

const FOV = 40;
const CAM_Z = 10;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const unitPx = (d: number) => H / 2 / (d * TAN);
/** Planet: centre of the screen, upper half (y≈430 px), radius ≈230 px. */
const PLANET = new THREE.Vector3(0, (H / 2 - 430) / unitPx(CAM_Z), 0);
const PLANET_R = 230 / unitPx(CAM_Z);

const METEOR_IN = K("S01", "meteorIn");
const BOOM = K("S01", "explodindo");
const additive = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending } as const;

const NOISE = /* glsl */ `
float hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise3(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash3(i), hash3(i + vec3(1,0,0)), f.x), mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x), mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm3(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vnoise3(p); p *= 2.02; a *= 0.5; } return s; }
`;

// ---- camera ------------------------------------------------------------------------------------------
const cameraAt = (frame: number) => {
  const t = frame / FPS;
  return new THREE.Vector3(0.12 * Math.sin(t * 0.17), 0.08 * Math.sin(t * 0.23 + 1), CAM_Z - 1.4 * dimAt(frame) - 0.4 * prog(frame, SC.S02.from, SC.S04.to, easeInOut));
};
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);
  const c = cameraAt(frame);
  camera.position.copy(c);
  camera.lookAt(c.x * 0.6, c.y * 0.6, c.z - 10);
  camera.updateProjectionMatrix();
  return null;
};

// ---- nebula --------------------------------------------------------------------------------------------
const NEBULA_FRAG = /* glsl */ `
uniform float uTime;
uniform float uDim;
uniform float uFlash;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 p = vUv * vec2(1.0, 1.78);
  float n = fbm3(vec3(p * 1.6, uTime * 0.02));
  float m = fbm3(vec3(p * 3.1 + 7.0, uTime * 0.015));
  vec3 base = vec3(0.012, 0.014, 0.03);
  vec3 blue = vec3(0.10, 0.20, 0.55);
  vec3 violet = vec3(0.32, 0.12, 0.50);
  float cloud = smoothstep(0.45, 0.85, n) * 0.55;
  vec3 c = base + mix(blue, violet, smoothstep(0.3, 0.8, m)) * cloud * 0.35;
  // a warm bloom from the planet when it blows
  float d = length((vUv - vec2(0.5, 0.776)) * vec2(1.0, 1.78));
  c += vec3(1.0, 0.55, 0.2) * exp(-d * 3.0) * uFlash * 0.6;
  c *= 1.0 - 0.45 * uDim;
  gl_FragColor = vec4(c, 1.0);
}
`;
const Nebula: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }",
        fragmentShader: NEBULA_FRAG,
        uniforms: { uTime: { value: 0 }, uDim: { value: 0 }, uFlash: { value: 0 } },
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  mat.uniforms.uTime.value = frame / FPS;
  mat.uniforms.uDim.value = dimAt(frame);
  mat.uniforms.uFlash.value = kickAt(frame, BOOM, 40);
  return (
    <mesh material={mat} frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};

// ---- stars ---------------------------------------------------------------------------------------------
const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aSeed;
uniform float uTime;
uniform float uPx;
varying float vTw;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTw = 0.65 + 0.35 * sin(uTime * (1.5 + aSeed * 3.0) + aSeed * 40.0);
  gl_PointSize = aSize * uPx / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const STAR_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uDim;
varying float vTw;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a * vTw * (1.0 - 0.4 * uDim);
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;
const LAYERS = [
  { n: 2200, z: [-70, -30], spread: 40, size: 0.6, speed: 0.15, color: "#9FB4FF" },
  { n: 700, z: [-30, -8], spread: 18, size: 0.9, speed: 0.45, color: "#DCE6FF" },
  { n: 120, z: [-8, 4], spread: 7, size: 1.4, speed: 1.0, color: "#FFFFFF" },
];
const StarLayer: React.FC<{ layer: (typeof LAYERS)[number]; idx: number }> = ({ layer, idx }) => {
  const frame = useCurrentFrame();
  const { geom, base } = useMemo(() => {
    const pos = new Float32Array(layer.n * 3);
    const size = new Float32Array(layer.n);
    const seed = new Float32Array(layer.n);
    for (let i = 0; i < layer.n; i++) {
      pos[i * 3] = (random(`sx${idx}-${i}`) - 0.5) * layer.spread * 1.2;
      pos[i * 3 + 1] = (random(`sy${idx}-${i}`) - 0.5) * layer.spread * 2;
      pos[i * 3 + 2] = mix(layer.z[0], layer.z[1], random(`sz${idx}-${i}`));
      size[i] = layer.size * (0.5 + random(`ss${idx}-${i}`));
      seed[i] = random(`sd${idx}-${i}`);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos.slice(), 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return { geom: g, base: pos };
  }, [layer, idx]);
  const mat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, uniforms: { uTime: { value: 0 }, uPx: { value: 300 }, uColor: { value: new THREE.Color(layer.color) }, uDim: { value: 0 } }, ...additive }),
    [layer],
  );
  // Stars stream slowly toward the camera (wrapping), faster on the near layers: the parallax.
  const t = frame / FPS;
  const p = geom.getAttribute("position") as THREE.BufferAttribute;
  const depth = layer.z[1] - layer.z[0];
  for (let i = 0; i < layer.n; i++) {
    const z0 = base[i * 3 + 2] - layer.z[0];
    p.setZ(i, layer.z[0] + ((z0 + t * layer.speed) % depth));
  }
  p.needsUpdate = true;
  mat.uniforms.uTime.value = t;
  mat.uniforms.uDim.value = dimAt(frame);
  return <points geometry={geom} material={mat} frustumCulled={false} renderOrder={-5} />;
};

// ---- planet ----------------------------------------------------------------------------------------------
const PLANET_VERT = /* glsl */ `
varying vec3 vN; varying vec3 vP; varying vec3 vV;
void main() {
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
// Photoreal Earth (three.js example textures, public/textures/earth): day colour, normal-mapped relief
// (cotangent frame from screen derivatives, no tangents needed), ocean-only specular from the specular map,
// city lights on the night side, an inner Fresnel atmosphere tinted by the sun, and the pre-impact crack glow.
const EARTH_VERT = /* glsl */ `
varying vec2 vUv; varying vec3 vN; varying vec3 vViewPos; varying vec3 vP;
void main() {
  vUv = uv;
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  vN = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;
const EARTH_FRAG = /* glsl */ `
uniform sampler2D uDay; uniform sampler2D uNormal; uniform sampler2D uSpec; uniform sampler2D uNight;
uniform vec3 uSun; uniform float uHeat; uniform float uCrack;
varying vec2 vUv; varying vec3 vN; varying vec3 vViewPos; varying vec3 vP;
${NOISE}
vec3 perturbNormal(vec3 eyePos, vec3 n, vec3 mapN) {
  vec3 q0 = dFdx(eyePos); vec3 q1 = dFdy(eyePos);
  vec2 st0 = dFdx(vUv); vec2 st1 = dFdy(vUv);
  vec3 q1perp = cross(q1, n); vec3 q0perp = cross(n, q0);
  vec3 T = q1perp * st0.x + q0perp * st1.x;
  vec3 B = q1perp * st0.y + q0perp * st1.y;
  float det = max(dot(T, T), dot(B, B));
  float sc = det == 0.0 ? 0.0 : inversesqrt(det);
  return normalize(T * (mapN.x * sc) + B * (mapN.y * sc) + n * mapN.z);
}
void main() {
  vec3 ng = normalize(vN);
  vec3 V = normalize(-vViewPos);
  vec3 L = normalize(uSun);
  vec3 mapN = texture2D(uNormal, vUv).xyz * 2.0 - 1.0;
  mapN.xy *= 0.85;
  vec3 n = perturbNormal(vViewPos, ng, mapN);
  vec3 day = texture2D(uDay, vUv).rgb;
  float ocean = texture2D(uSpec, vUv).r;
  float diff = max(dot(n, L), 0.0);
  float geo = dot(ng, L);
  // soft terminator, a touch of ambient so the night side is not pure black
  vec3 c = day * (0.035 + 1.15 * diff * smoothstep(-0.15, 0.25, geo));
  // sun glint on the oceans only
  vec3 H = normalize(L + V);
  c += vec3(1.0, 0.95, 0.85) * pow(max(dot(n, H), 0.0), 60.0) * ocean * 0.55 * step(0.0, geo);
  // city lights where the sun has set
  c += texture2D(uNight, vUv).rgb * vec3(1.0, 0.78, 0.45) * smoothstep(0.05, -0.2, geo) * 1.3;
  // inner atmosphere: Fresnel rim, bright on the sunlit limb, faint on the night limb
  float fres = pow(1.0 - max(dot(ng, V), 0.0), 2.6);
  vec3 atmo = vec3(0.30, 0.58, 1.0);
  c = mix(c, atmo, fres * (0.15 + 0.75 * smoothstep(-0.35, 0.6, geo)));
  // Just before impact the crust glows along cracks.
  float crack = smoothstep(0.02, 0.0, abs(fbm3(vP * 4.0) - 0.5)) * uCrack;
  c += vec3(1.0, 0.45, 0.1) * crack * 1.5 + vec3(1.0, 0.6, 0.3) * uHeat;
  gl_FragColor = vec4(c, 1.0);
}
`;
const CLOUD_FRAG = /* glsl */ `
uniform sampler2D uClouds; uniform vec3 uSun; uniform float uFade;
varying vec2 vUv; varying vec3 vN; varying vec3 vViewPos; varying vec3 vP;
void main() {
  // the cloud cover lives in the PNG's alpha (its RGB is undefined where transparent)
  float a = texture2D(uClouds, vUv).a;
  float geo = dot(normalize(vN), normalize(uSun));
  float lit = 0.05 + 1.0 * smoothstep(-0.15, 0.35, geo);
  gl_FragColor = vec4(vec3(lit), a * 0.9 * uFade);
}
`;
/** Outer atmospheric scattering: a back-faced shell whose glow peaks just outside the limb, sun-weighted. */
const HALO_FRAG = /* glsl */ `
uniform vec3 uSun; uniform float uFade;
varying vec2 vUv; varying vec3 vN; varying vec3 vViewPos; varying vec3 vP;
void main() {
  vec3 n = normalize(vN);
  vec3 V = normalize(-vViewPos);
  // Back faces of a 1.14x shell: dot(n, V) runs from 0 at the shell's edge to about -0.48 at the planet's
  // limb, so the glow is zero at the shell's silhouette and densest against the planet.
  float rim = pow(clamp(-dot(n, V) / 0.48, 0.0, 1.0), 3.0);
  float sun = 0.25 + 0.75 * smoothstep(-0.5, 0.6, dot(n, normalize(uSun)));
  gl_FragColor = vec4(vec3(0.28, 0.55, 1.0) * rim * sun * 1.1 * uFade, 1.0);
}
`;
const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor; uniform float uIntensity; uniform float uFalloff;
varying vec2 vUv;
void main() { float r = length(vUv - 0.5); float g = exp(-r * uFalloff) * smoothstep(0.5, 0.25, r); gl_FragColor = vec4(uColor * g * uIntensity, 1.0); }
`;
const QUAD_VERT = "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";

const Glow: React.FC<{ position: THREE.Vector3; size: number; color: string; intensity: number; falloff?: number }> = ({ position, size, color, intensity, falloff = 7 }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: GLOW_FRAG, uniforms: { uColor: { value: new THREE.Color() }, uIntensity: { value: 0 }, uFalloff: { value: falloff } }, ...additive }), [falloff]);
  mat.uniforms.uColor.value.set(color);
  mat.uniforms.uIntensity.value = intensity;
  if (intensity <= 0.002 || size <= 0) return null;
  return (
    <mesh position={position} material={mat} renderOrder={4}>
      <planeGeometry args={[size, size]} />
    </mesh>
  );
};

const EARTH_FILES = { day: "earth_atmos_2048.jpg", normal: "earth_normal_2048.jpg", spec: "earth_specular_2048.jpg", night: "earth_lights_2048.png", clouds: "earth_clouds_1024.png" };
type EarthTex = Record<keyof typeof EARTH_FILES, THREE.Texture>;
const useEarthTextures = (): EarthTex => {
  const [handle] = useState(() => delayRender("Loading Earth textures"));
  // The canvas is drawn once before the images arrive: draw again before releasing the frame.
  const advance = useThree((st) => st.advance);
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const keys = Object.keys(EARTH_FILES) as (keyof typeof EARTH_FILES)[];
    let loaded = 0;
    return Object.fromEntries(
      keys.map((k) => {
        const tex = loader.load(
          staticFile(`textures/earth/${EARTH_FILES[k]}`),
          () => {
            if (++loaded === keys.length) {
              advance(performance.now());
              continueRender(handle);
            }
          },
          undefined,
          (e) => cancelRender(e),
        );
        tex.colorSpace = THREE.NoColorSpace; // raw in, raw out (flat linear canvas)
        tex.anisotropy = 8;
        return [k, tex];
      }),
    ) as EarthTex;
  }, [handle, advance]);
};

/** Sun direction (world): upper left, in front. */
const SUN = new THREE.Vector3(-0.75, 0.35, 0.55).normalize();
// Spin so South America faces the camera, tilted a little to show the southern hemisphere.
const EARTH_ROT = { x: -0.12, y: -1.15, z: 0.18 };

const Planet: React.FC = () => {
  const frame = useCurrentFrame();
  const tex = useEarthTextures();
  const camera = useThree((st) => st.camera);
  const mats = useMemo(() => {
    const sun = { value: new THREE.Vector3() };
    return {
      sun,
      earth: new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG, uniforms: { uDay: { value: tex.day }, uNormal: { value: tex.normal }, uSpec: { value: tex.spec }, uNight: { value: tex.night }, uSun: sun, uHeat: { value: 0 }, uCrack: { value: 0 } } }),
      clouds: new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: CLOUD_FRAG, uniforms: { uClouds: { value: tex.clouds }, uSun: sun, uFade: { value: 1 } }, transparent: true, depthWrite: false }),
      halo: new THREE.ShaderMaterial({ vertexShader: EARTH_VERT, fragmentShader: HALO_FRAG, uniforms: { uSun: sun, uFade: { value: 1 } }, side: THREE.BackSide, ...additive }),
    };
  }, [tex]);
  const geom = useMemo(() => new THREE.SphereGeometry(PLANET_R, 128, 96), []);
  if (frame >= BOOM + 2) return null;
  camera.updateMatrixWorld();
  mats.sun.value.copy(SUN).transformDirection(camera.matrixWorldInverse);
  mats.earth.uniforms.uCrack.value = prog(frame, BOOM - 20, BOOM, easeIn);
  mats.earth.uniforms.uHeat.value = prog(frame, BOOM - 4, BOOM + 1, easeIn);
  const fade = 1 - prog(frame, BOOM - 3, BOOM, easeIn);
  mats.clouds.uniforms.uFade.value = fade;
  mats.halo.uniforms.uFade.value = fade;
  const t = frame / FPS;
  return (
    <group position={PLANET} rotation={[EARTH_ROT.x, 0, EARTH_ROT.z]}>
      <mesh geometry={geom} material={mats.earth} rotation={[0, EARTH_ROT.y + t * 0.04, 0]} />
      <mesh geometry={geom} material={mats.clouds} rotation={[0, EARTH_ROT.y + t * 0.055, 0]} scale={1.012} renderOrder={1} />
      <mesh geometry={geom} material={mats.halo} scale={1.14} renderOrder={2} />
    </group>
  );
};

// ---- meteor ----------------------------------------------------------------------------------------------
const M_FROM = new THREE.Vector3(5.5, 9.5, 2.5);
const M_HIT = PLANET.clone().add(new THREE.Vector3(0.45, 0.55, 0.45).normalize().multiplyScalar(PLANET_R));
const meteorAt = (frame: number) => M_FROM.clone().lerp(M_HIT, prog(frame, METEOR_IN, BOOM, easeIn));
const Meteor: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < METEOR_IN || frame >= BOOM) return null;
  const head = meteorAt(frame);
  const trail = Array.from({ length: 26 }, (_, i) => ({ p: meteorAt(frame - i * 1.4), k: 1 - i / 26 }));
  return (
    <>
      {trail.map(({ p, k }, i) => (
        <Glow key={i} position={p} size={0.9 * k + 0.15} color={i < 6 ? "#FFE3A0" : "#FF7A1A"} intensity={0.55 * k} falloff={7} />
      ))}
      <mesh position={head}>
        <icosahedronGeometry args={[0.1, 1]} />
        <meshBasicMaterial color="#FFD9A0" />
      </mesh>
      <Glow position={head} size={1.4} color="#FFFFFF" intensity={0.9} falloff={9} />
    </>
  );
};

// ---- explosion -------------------------------------------------------------------------------------------
const FRAG_VERT = PLANET_VERT;
const FRAG_FRAG = /* glsl */ `
uniform float uHeat; uniform float uSeed; uniform float uDim;
varying vec3 vN; varying vec3 vP; varying vec3 vV;
${NOISE}
void main() {
  float L = clamp(dot(normalize(vN), normalize(vec3(-0.7, 0.4, 0.6))), 0.0, 1.0);
  vec3 rock = mix(vec3(0.22, 0.21, 0.24), vec3(0.5, 0.42, 0.36), fbm3(vP * 9.0 + uSeed));
  vec3 c = rock * (0.1 + 1.0 * L);
  float edge = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 2.0);
  c += mix(vec3(1.0, 0.35, 0.05), vec3(1.0, 0.85, 0.5), uHeat) * (0.4 + edge) * uHeat * 1.6;
  c *= 1.0 - 0.4 * uDim;
  gl_FragColor = vec4(c, 1.0);
}
`;
const N_FRAG = 90;
const FRAGS = Array.from({ length: N_FRAG }, (_, i) => {
  const dir = new THREE.Vector3(random(`fx${i}`) - 0.5, random(`fy${i}`) - 0.5, random(`fz${i}`) - 0.5).normalize();
  return {
    dir,
    start: dir.clone().multiplyScalar(PLANET_R * Math.cbrt(random(`fr${i}`)) * 0.9),
    speed: mix(2.5, 9, random(`fs${i}`) ** 1.5),
    size: mix(0.05, 0.26, random(`fsz${i}`) ** 2),
    spin: new THREE.Vector3(random(`a${i}`) - 0.5, random(`b${i}`) - 0.5, random(`c${i}`) - 0.5).multiplyScalar(6),
    detail: random(`fd${i}`) > 0.5 ? 0 : 1,
  };
});
/** Distance travelled with exponential drag, then a slow residual drift (space debris behind the tips). */
const travel = (t: number, speed: number) => (speed * (1 - Math.exp(-t * 1.6))) / 1.6 + 0.04 * speed * t;

const Fragments: React.FC = () => {
  const frame = useCurrentFrame();
  const geoms = useMemo(() => [new THREE.DodecahedronGeometry(1, 0), new THREE.IcosahedronGeometry(1, 0)], []);
  const mats = useMemo(() => FRAGS.map((_, i) => new THREE.ShaderMaterial({ vertexShader: FRAG_VERT, fragmentShader: FRAG_FRAG, uniforms: { uHeat: { value: 1 }, uSeed: { value: i * 1.7 }, uDim: { value: 0 } } })), []);
  if (frame < BOOM || frame > SC.S05.from + 10) return null;
  const t = (frame - BOOM) / FPS;
  const heat = Math.exp(-t / 0.9);
  return (
    <group position={PLANET}>
      {FRAGS.map((f, i) => {
        mats[i].uniforms.uHeat.value = heat;
        mats[i].uniforms.uDim.value = dimAt(frame);
        const p = f.start.clone().add(f.dir.clone().multiplyScalar(travel(t, f.speed)));
        return <mesh key={i} geometry={geoms[f.detail]} material={mats[i]} position={p} rotation={[f.spin.x * t, f.spin.y * t, f.spin.z * t]} scale={f.size} />;
      })}
    </group>
  );
};

const SPARK_VERT = /* glsl */ `
attribute vec3 aDir; attribute float aSpeed; attribute float aSize;
uniform float uT;
varying float vLife;
void main() {
  float d = aSpeed * (1.0 - exp(-uT * 1.2)) / 1.2;
  vec3 p = aDir * d;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vLife = exp(-uT / (0.6 + aSize));
  gl_PointSize = aSize * 260.0 / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const SPARK_FRAG = /* glsl */ `
varying float vLife;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vLife;
  gl_FragColor = vec4(mix(vec3(0.6, 0.2, 0.05), vec3(1.0, 0.85, 0.5), vLife) * a, 1.0);
}
`;
const N_SPARK = 600;
const Sparks: React.FC = () => {
  const frame = useCurrentFrame();
  const { geom, mat } = useMemo(() => {
    const dir = new Float32Array(N_SPARK * 3);
    const speed = new Float32Array(N_SPARK);
    const size = new Float32Array(N_SPARK);
    for (let i = 0; i < N_SPARK; i++) {
      const v = new THREE.Vector3(random(`kx${i}`) - 0.5, random(`ky${i}`) - 0.5, random(`kz${i}`) - 0.5).normalize();
      dir.set([v.x, v.y, v.z], i * 3);
      speed[i] = mix(2, 14, random(`ks${i}`) ** 2);
      size[i] = mix(0.3, 1.6, random(`kk${i}`));
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_SPARK * 3), 3));
    g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({ vertexShader: SPARK_VERT, fragmentShader: SPARK_FRAG, uniforms: { uT: { value: 0 } }, ...additive });
    return { geom: g, mat: m };
  }, []);
  if (frame < BOOM || frame > BOOM + 240) return null;
  mat.uniforms.uT.value = (frame - BOOM) / FPS;
  return <points geometry={geom} material={mat} position={PLANET} frustumCulled={false} renderOrder={6} />;
};

const RING_FRAG = /* glsl */ `
uniform float uP; varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float band = exp(-pow((r - 0.9) * 14.0, 2.0));
  gl_FragColor = vec4(vec3(0.7, 0.85, 1.0) * band * (1.0 - uP) * 1.4, 1.0);
}
`;
const Shockwave: React.FC = () => {
  const frame = useCurrentFrame();
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: RING_FRAG, uniforms: { uP: { value: 0 } }, ...additive }), []);
  if (frame < BOOM || frame > BOOM + 45) return null;
  const p = prog(frame, BOOM, BOOM + 45);
  mat.uniforms.uP.value = p;
  const s = mix(PLANET_R * 2, 16, p);
  return (
    <mesh position={PLANET} material={mat} rotation={[-0.35, 0, 0]} renderOrder={7}>
      <planeGeometry args={[s, s]} />
    </mesh>
  );
};

const Fireball: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < BOOM - 2 || frame > BOOM + 90) return null;
  const f = frame - BOOM;
  const flash = kickAt(frame, BOOM, 6);
  const ball = kickAt(frame, BOOM, 30);
  return (
    <>
      <Glow position={PLANET} size={mix(1, 9, prog(frame, BOOM, BOOM + 30))} color="#FF8A2A" intensity={1.2 * ball} falloff={5} />
      <Glow position={PLANET} size={mix(2, 5, prog(frame, BOOM, BOOM + 12))} color="#FFF4D6" intensity={2 * flash + (f < 0 ? 0.5 : 0)} falloff={6} />
    </>
  );
};

export const Space: React.FC = () => (
  <ThreeCanvas width={Math.round(W)} height={Math.round(H)} flat linear gl={{ antialias: true }} camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 400 }}>
    <CameraRig />
    <Nebula />
    {LAYERS.map((l, i) => (
      <StarLayer key={i} layer={l} idx={i} />
    ))}
    <Planet />
    <Meteor />
    <Fragments />
    <Sparks />
    <Shockwave />
    <Fireball />
  </ThreeCanvas>
);
