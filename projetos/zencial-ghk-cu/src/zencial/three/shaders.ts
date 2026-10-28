// GLSL for the Zencial Keynote stage. Colours are sRGB written straight out (ThreeCanvas runs `flat linear`).
// The stage is dark, so light (beam, pool, rim) is additive.

export const NOISE = /* glsl */ `
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 x) {
  vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
`;

export const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** Full-screen clip-space quad. */
export const SCREEN_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }
`;

/**
 * Cyclorama backdrop: charcoal with a soft lift behind the product (uGlow at uCenter) and a
 * faint top light. uDark pulls everything to black (hook open), uDim is the serious lights-down.
 */
export const STAGE_FRAG = /* glsl */ `
uniform float uDark;
uniform float uDim;
uniform float uGlow;
uniform vec2 uCenter;
uniform vec3 uTint;
uniform float uTime;
varying vec2 vUv;
${NOISE}
void main() {
  vec3 base = vec3(0.043, 0.043, 0.051);
  vec3 hi = vec3(0.102, 0.102, 0.118);
  float top = smoothstep(0.35, 1.0, vUv.y) * 0.5;
  float lift = exp(-pow(length((vUv - uCenter) * vec2(1.0, 1.6)), 2.0) * 4.0);
  vec3 c = mix(base, hi, top * 0.6 + lift * 0.9 * uGlow);
  c += uTint * lift * 0.06 * uGlow;
  // Very soft haze so the black never bands.
  c += (fbm(vUv * vec2(3.0, 6.0) + vec2(uTime * 0.01, 0.0)) - 0.5) * 0.012;
  c *= (1.0 - 0.35 * uDim) * (1.0 - 0.92 * uDark);
  gl_FragColor = vec4(c, 1.0);
}
`;

/**
 * Glossy studio floor (world plane y = const). A spotlight pool under the product, a faint
 * specular streak, and a fade into the cyclorama with distance so the horizon disappears.
 */
export const FLOOR_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const FLOOR_FRAG = /* glsl */ `
uniform vec3 uPool;      // pool centre (world x, -, z)
uniform float uPoolK;    // pool intensity
uniform vec3 uTint;
uniform float uDark;
uniform float uDim;
uniform vec3 uCam;
varying vec3 vW;
void main() {
  vec3 base = vec3(0.035, 0.035, 0.042);
  vec2 d = (vW.xz - uPool.xz) * vec2(1.0, 1.9);
  float pool = exp(-dot(d, d) * 0.55);
  float core = exp(-dot(d, d) * 3.0);
  // Glossy streak toward the camera (reflection of the beam).
  float streak = exp(-pow((vW.x - uPool.x) * 2.2, 2.0)) * smoothstep(uPool.z - 1.0, uPool.z + 4.0, vW.z) * 0.35;
  vec3 c = base + uTint * (0.20 * pool + 0.25 * core + 0.08 * streak) * uPoolK;
  // Fade far floor into the backdrop colour.
  float dist = length(vW.xz - uCam.xz);
  c = mix(c, vec3(0.043, 0.043, 0.051), smoothstep(8.0, 22.0, dist));
  c *= (1.0 - 0.35 * uDim) * (1.0 - 0.92 * uDark);
  gl_FragColor = vec4(c, 1.0);
}
`;

/** Volumetric spotlight beam on an open cone: soft edges, fades toward the apex, slow dust haze. */
export const BEAM_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
varying float vH;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vH = uv.y;
  gl_Position = projectionMatrix * mv;
}
`;
export const BEAM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying vec3 vN;
varying vec3 vV;
varying float vH;
${NOISE}
void main() {
  float facing = abs(dot(normalize(vN), normalize(vV)));
  float body = pow(facing, 2.2);
  float along = smoothstep(1.0, 0.25, vH) * smoothstep(-0.02, 0.15, vH);
  float haze = 0.75 + 0.25 * fbm(vec2(vH * 4.0 - uTime * 0.05, facing * 3.0 + uTime * 0.03));
  float a = body * along * haze * uIntensity;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;

/** Additive round glow (rim light, Cu atom halo). */
export const GLOW_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uFalloff;
varying vec2 vUv;
void main() {
  float r = length(vUv - 0.5);
  float g = exp(-r * uFalloff) * smoothstep(0.5, 0.3, r);
  gl_FragColor = vec4(uColor * g * uIntensity, 1.0);
}
`;

/**
 * Lit material for the molecule atoms, bonds, helix and cart: lambert + rim + specular from a
 * fixed key light, so it reads as glossy 3D without scene lights. uMetal pushes toward metal.
 */
export const ATOM_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
export const ATOM_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uMetal;
uniform float uGlow;
varying vec3 vN;
varying vec3 vV;
void main() {
  vec3 L = normalize(vec3(-0.5, 0.8, 0.6));
  vec3 n = normalize(vN);
  float lam = max(dot(n, L), 0.0);
  float spec = pow(max(dot(reflect(-L, n), vV), 0.0), mix(24.0, 60.0, uMetal));
  float rim = pow(1.0 - max(dot(n, vV), 0.0), 2.5);
  vec3 base = uColor * (0.32 + 0.72 * lam);
  vec3 c = base + vec3(1.0) * spec * mix(0.5, 1.1, uMetal) + vec3(0.85, 0.9, 1.0) * rim * 0.45;
  c = mix(c, vec3(0.6, 0.85, 1.0), rim * uGlow);
  gl_FragColor = vec4(c, uOpacity);
}
`;
