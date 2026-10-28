// GLSL shared by the scene. Colours are authored in sRGB and written straight out
// (ThreeCanvas runs with `flat`, so no tone mapping touches them).

// Hash-based 3D value noise + fBm (written for this project).
export const NOISE = /* glsl */ `
float hash31(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash31(i + vec3(0,0,0)), hash31(i + vec3(1,0,0)), f.x),
        mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
        mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p) {
  float a = 0.5;
  float s = 0.0;
  for (int k = 0; k < 5; k++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }
  return s;
}
`;

export const SPHERE_VERT = /* glsl */ `
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewDir;
void main() {
  vObj = position;
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vViewNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewDir = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

// Sun photosphere: boiling granulation, hot core, limb darkening.
export const SUN_FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
varying vec3 vObj;
varying vec3 vViewNormal;
varying vec3 vViewDir;
${NOISE}
void main() {
  vec3 p = normalize(vObj);
  float g = fbm(p * 5.0 + vec3(0.0, uTime * 0.12, uTime * 0.07));
  float cells = fbm(p * 14.0 - vec3(uTime * 0.2));
  float heat = clamp(0.55 * g + 0.45 * cells, 0.0, 1.0);
  float mu = clamp(dot(vViewNormal, vViewDir), 0.0, 1.0);
  float limb = pow(mu, 0.45);
  vec3 deep = vec3(0.86, 0.29, 0.03);
  vec3 mid = vec3(1.0, 0.62, 0.16);
  vec3 hot = vec3(1.0, 0.95, 0.78);
  vec3 col = mix(deep, mid, smoothstep(0.25, 0.6, heat));
  col = mix(col, hot, smoothstep(0.55, 0.85, heat) * 0.8 + mu * 0.35);
  col *= mix(0.55, 1.15, limb);
  gl_FragColor = vec4(col, uOpacity);
}
`;

// Earth: procedural continents, oceans, ice caps, clouds; lit from the Sun.
export const EARTH_FRAG = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform vec3 uLightDir;
uniform float uFlash;
varying vec3 vObj;
varying vec3 vWorldNormal;
varying vec3 vViewNormal;
varying vec3 vViewDir;
${NOISE}
vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
void main() {
  vec3 p = rotY(normalize(vObj), uTime * 0.18);
  float h = fbm(p * 2.4 + vec3(4.1, 0.0, 2.3));
  float land = smoothstep(0.50, 0.53, h);
  vec3 oceanDeep = vec3(0.02, 0.10, 0.30);
  vec3 oceanShallow = vec3(0.06, 0.32, 0.62);
  vec3 ocean = mix(oceanDeep, oceanShallow, smoothstep(0.38, 0.5, h));
  vec3 green = vec3(0.16, 0.36, 0.14);
  vec3 desert = vec3(0.55, 0.45, 0.28);
  vec3 ground = mix(green, desert, smoothstep(0.45, 0.65, fbm(p * 6.0)));
  vec3 col = mix(ocean, ground, land);
  float ice = smoothstep(0.78, 0.86, abs(p.y) + 0.06 * fbm(p * 8.0));
  col = mix(col, vec3(0.92, 0.95, 1.0), ice);
  vec3 pc = rotY(normalize(vObj), uTime * 0.24);
  float cloud = smoothstep(0.52, 0.72, fbm(pc * 4.0 + vec3(0.0, 0.0, uTime * 0.03)));
  col = mix(col, vec3(1.0), cloud * 0.85);
  float diff = max(dot(normalize(vWorldNormal), normalize(uLightDir)), 0.0);
  float lit = smoothstep(0.0, 0.35, diff) * 0.95 + 0.05;
  vec3 shade = col * lit;
  float spec = pow(max(dot(reflect(-normalize(uLightDir), normalize(vWorldNormal)), vec3(0.0, 0.0, 1.0)), 0.0), 24.0) * (1.0 - land) * (1.0 - cloud);
  shade += vec3(1.0, 0.9, 0.7) * spec * 0.5 * smoothstep(0.0, 0.2, diff);
  float rim = pow(1.0 - clamp(dot(vViewNormal, vViewDir), 0.0, 1.0), 2.5);
  shade += vec3(0.35, 0.62, 1.0) * rim * (0.25 + 0.75 * smoothstep(-0.2, 0.4, diff));
  shade += vec3(0.6, 0.8, 1.0) * uFlash * 0.45;
  gl_FragColor = vec4(shade, uOpacity);
}
`;

// Camera-facing quad (planes sit in XY; the camera always looks down -Z).
export const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Radial glow with soft noisy rays; uR0 is the disc edge in uv radius (0..0.5).
export const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uR0;
uniform float uFalloff;
uniform float uRays;
uniform float uTime;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 d = vUv - 0.5;
  float r = length(d);
  float a = atan(d.y, d.x);
  float rays = 1.0 + uRays * (vnoise(vec3(cos(a) * 3.0, sin(a) * 3.0, uTime * 0.15)) - 0.5) * 2.0;
  float g = exp(-max(r - uR0, 0.0) * uFalloff / rays) * smoothstep(0.5, 0.36, r);
  gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
}
`;

// The light path: a thin hot core with a soft halo, revealed along x; uHead adds a bright trail.
export const BEAM_FRAG = /* glsl */ `
uniform float uReveal;
uniform float uHead;
uniform float uHeadOn;
uniform float uOpacity;
uniform float uTime;
uniform float uLen;
uniform float uHeight;
varying vec2 vUv;
void main() {
  float y = (vUv.y - 0.5) * uHeight;
  float core = exp(-pow(y / 0.0055, 2.0));
  float halo = exp(-pow(y / 0.05, 2.0)) * 0.35 + exp(-pow(y / 0.012, 2.0)) * 0.5;
  float x = vUv.x;
  float shown = smoothstep(uReveal, uReveal - 0.025, x);
  float breathe = 0.85 + 0.15 * sin(uTime * 2.4 - x * 18.0);
  float behind = step(x, uHead) * exp(-(uHead - x) * uLen * 1.4) * uHeadOn;
  vec3 coreCol = vec3(1.0, 0.97, 0.88);
  vec3 haloCol = vec3(1.0, 0.76, 0.38);
  vec3 col = coreCol * core * (0.75 + 1.4 * behind) + haloCol * halo * (breathe + 1.6 * behind);
  gl_FragColor = vec4(col * shown * uOpacity, 1.0);
}
`;

// Expanding ring for the arrival pulse.
export const RING_FRAG = /* glsl */ `
uniform float uProgress;
uniform float uOpacity;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5) * 2.0;
  float radius = mix(0.16, 0.95, uProgress);
  float w = mix(0.03, 0.09, uProgress);
  float ring = exp(-pow((r - radius) / w, 2.0));
  float fill = smoothstep(radius, 0.0, r) * 0.12;
  gl_FragColor = vec4(vec3(0.75, 0.88, 1.0) * (ring + fill) * uOpacity, 1.0);
}
`;

// Star points: round soft dots that twinkle; uDrift slides each layer for parallax.
export const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform vec2 uDrift;
uniform vec2 uWrap;
varying float vTw;
varying vec3 vColor;
void main() {
  vec3 p = position;
  p.xy += uDrift;
  p.xy = mod(p.xy + uWrap, 2.0 * uWrap) - uWrap;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vTw = 0.65 + 0.35 * sin(uTime * (0.6 + aPhase * 1.7) + aPhase * 40.0);
  vColor = aColor;
  gl_PointSize = aSize;
  gl_Position = projectionMatrix * mv;
}
`;

export const STAR_FRAG = /* glsl */ `
uniform float uOpacity;
varying float vTw;
varying vec3 vColor;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float a = exp(-r * r * 4.0) + 0.6 * exp(-r * r * 30.0);
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * a * vTw * uOpacity, 1.0);
}
`;

// Faint nebula backdrop far behind the stars.
export const NEBULA_FRAG = /* glsl */ `
uniform float uTime;
varying vec2 vUv;
${NOISE}
void main() {
  vec3 p = vec3(vUv * vec2(2.2, 3.6), uTime * 0.01);
  float n = fbm(p + fbm(p * 1.7));
  float band = exp(-pow((vUv.y - 0.55 + 0.18 * (vUv.x - 0.5)) / 0.28, 2.0));
  vec3 a = vec3(0.10, 0.05, 0.20);
  vec3 b = vec3(0.02, 0.10, 0.22);
  vec3 col = mix(a, b, smoothstep(0.3, 0.7, n)) * smoothstep(0.35, 0.8, n) * (0.35 + band);
  gl_FragColor = vec4(col * 0.75, 1.0);
}
`;
