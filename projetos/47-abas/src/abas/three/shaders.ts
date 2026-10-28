// GLSL for the 47 Abas Keynote stage. Colours are sRGB written straight out (ThreeCanvas runs `flat linear`).
// The stage is dark, so light (pool, glows) is additive; browser windows are instanced glass panes.

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
 * Cyclorama backdrop: charcoal with a soft lift behind the window field (uGlow at uCenter) and a
 * faint top light. uDark pulls everything to black (hook open, blackout), uDim is the serious lights-down.
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
 * Glossy studio floor (world plane y = const). A spotlight pool under the windows, a faint
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
  // Glossy streak toward the camera (reflection of the key light).
  float streak = exp(-pow((vW.x - uPool.x) * 2.2, 2.0)) * smoothstep(uPool.z - 1.0, uPool.z + 4.0, vW.z) * 0.35;
  vec3 c = base + uTint * (0.20 * pool + 0.25 * core + 0.08 * streak) * uPoolK;
  // Fade far floor into the backdrop colour.
  float dist = length(vW.xz - uCam.xz);
  c = mix(c, vec3(0.043, 0.043, 0.051), smoothstep(8.0, 22.0, dist));
  c *= (1.0 - 0.35 * uDim) * (1.0 - 0.92 * uDark);
  gl_FragColor = vec4(c, 1.0);
}
`;


/** Additive round glow (halo behind a highlighted window). */
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

/**
 * Instanced browser window: a dark glass pane with rounded corners cut by an SDF, its UI sampled
 * from a 4x2 atlas (aCell), an outer Chrome-blue halo when highlighted (aHi), a grey-out (aGrey),
 * a cross-fade to the blank "?" window (aBlank) and depth fog into the stage colour. The quad is
 * larger than the window by uMargin so the halo has room. Instances are written back-to-front.
 */
export const WINDOW_VERT = /* glsl */ `
attribute float aCell;
attribute float aAlpha;
attribute float aHi;
attribute float aGrey;
attribute float aBlank;
varying vec2 vUv;
varying float vCell;
varying float vAlpha;
varying float vHi;
varying float vGrey;
varying float vBlank;
varying float vDepth;
void main() {
  vUv = uv;
  vCell = aCell;
  vAlpha = aAlpha;
  vHi = aHi;
  vGrey = aGrey;
  vBlank = aBlank;
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
export const WINDOW_FRAG = /* glsl */ `
uniform sampler2D uAtlas;
uniform vec2 uSize;      // window size (world units)
uniform float uMargin;   // halo margin around the window (world units)
uniform vec3 uStage;
uniform vec3 uBlue;
uniform float uFogNear;
uniform float uFogFar;
uniform float uDark;
uniform float uFocus;    // dims every window that is not highlighted
varying vec2 vUv;
varying float vCell;
varying float vAlpha;
varying float vHi;
varying float vGrey;
varying float vBlank;
varying float vDepth;

float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
vec3 cell(float c, vec2 wuv) {
  float col = mod(c, 4.0);
  float row = floor(c / 4.0 + 0.01);
  // CanvasTexture is flipped: canvas row 0 sits at the top of the texture.
  vec2 a = vec2((col + wuv.x) / 4.0, 1.0 - (row + 1.0 - wuv.y) / 2.0);
  return texture2D(uAtlas, a).rgb;
}
void main() {
  vec2 quad = uSize + 2.0 * uMargin;
  vec2 p = (vUv - 0.5) * quad;
  float d = sdRound(p, uSize * 0.5, 0.05);
  float aa = 0.006;
  float inside = smoothstep(aa, -aa, d);
  vec2 wuv = clamp(p / uSize + 0.5, 0.001, 0.999);
  vec3 ui = mix(cell(vCell, wuv), cell(6.0, wuv), vBlank);
  float lum = dot(ui, vec3(0.299, 0.587, 0.114));
  ui = mix(ui, vec3(lum) * 0.55, vGrey);
  // Glass: faint top sheen and a hairline edge that turns Chrome blue when highlighted.
  ui += vec3(0.05) * smoothstep(0.55, 1.0, wuv.y) * (1.0 - vGrey);
  float edge = smoothstep(0.012, 0.0, abs(d));
  ui = mix(ui, mix(vec3(0.42), uBlue * 1.3, vHi), edge * (0.55 + 0.45 * vHi));
  ui *= mix(1.0, 0.45, uFocus * (1.0 - vHi));
  ui *= 1.0 + 0.12 * vHi;
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  ui = mix(ui, uStage, fog);
  float halo = exp(-max(d, 0.0) * 22.0) * (1.0 - inside) * vHi * 0.75;
  float a = max(inside * 0.96, halo) * vAlpha;
  vec3 c = mix(uBlue, ui, inside / max(inside + halo, 1e-4));
  c *= 1.0 - 0.92 * uDark;
  if (a < 0.003) discard;
  gl_FragColor = vec4(c, a);
}
`;

/** Separable 9-tap Gaussian (direction in texels × radius), used for the depth-of-field background. */
export const BLUR_FRAG = /* glsl */ `
uniform sampler2D uTex;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(uTex, vUv).rgb * 0.2270270270;
  c += texture2D(uTex, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uTex, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uTex, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(uTex, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`;

/** Sharp → blurred background mix, with a slight focus-pull darkening of the defocused field. */
export const DOF_COMPOSITE_FRAG = /* glsl */ `
uniform sampler2D uSharp;
uniform sampler2D uBlur;
uniform float uAmount;
varying vec2 vUv;
void main() {
  vec3 c = mix(texture2D(uSharp, vUv).rgb, texture2D(uBlur, vUv).rgb, uAmount);
  gl_FragColor = vec4(c * (1.0 - 0.12 * uAmount), 1.0);
}
`;
