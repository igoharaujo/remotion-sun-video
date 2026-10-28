// GLSL for the iPhone Língua scene. Colours are sRGB written straight out (ThreeCanvas runs `flat linear`).

// Hash-based 3D value noise.
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
`;

export const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

/** Full-screen #0A0A0F backdrop with a faint blue glow low in frame; uDark pulls it toward black. */
export const BACKDROP_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }
`;
export const BACKDROP_FRAG = /* glsl */ `
uniform float uDark;
varying vec2 vUv;
void main() {
  vec3 bg = vec3(0.0392, 0.0392, 0.0588);
  float g = exp(-pow(length((vUv - vec2(0.5, 0.42)) * vec2(1.0, 1.6)), 2.0) * 3.0);
  vec3 c = bg + vec3(0.0, 0.035, 0.09) * g;
  gl_FragColor = vec4(c * (1.0 - 0.55 * uDark), 1.0);
}
`;

/** Perspective floor grid: lines scroll toward the camera, fade with distance, pulse on impacts. */
export const GRID_VERT = /* glsl */ `
varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
export const GRID_FRAG = /* glsl */ `
uniform float uScroll;
uniform float uOpacity;
uniform float uPulse;
uniform vec3 uColor;
varying vec3 vW;
float line(float v, float w) {
  float d = abs(fract(v) - 0.5);
  float fw = fwidth(v);
  return 1.0 - smoothstep(w * 0.5 - fw, w * 0.5 + fw, 0.5 - d);
}
void main() {
  vec2 p = vec2(vW.x, vW.z + uScroll) / 1.2;
  float l = max(line(p.x + 0.5, 0.035), line(p.y + 0.5, 0.035));
  float dist = smoothstep(-48.0, -4.0, vW.z) * smoothstep(9.0, 2.0, vW.z);
  float side = 1.0 - smoothstep(6.0, 16.0, abs(vW.x));
  float a = l * dist * side * uOpacity * (1.0 + 2.5 * uPulse);
  gl_FragColor = vec4(uColor * a, 1.0);
}
`;

// Dust motes: rise slowly and wrap inside a box, sway, twinkle; size attenuates with depth.
export const DUST_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uScale;
uniform vec3 uBox;
varying vec3 vColor;
varying float vTw;
void main() {
  vec3 p = position;
  float t = uTime * (0.5 + aPhase);
  p.y = mod(p.y + uBox.y + t * 0.07, 2.0 * uBox.y) - uBox.y;
  p.x += 0.18 * sin(t * 0.31 + aPhase * 6.283);
  p.z += 0.12 * cos(t * 0.23 + aPhase * 3.1);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  vTw = 0.6 + 0.4 * sin(uTime * (1.3 + aPhase * 2.0) + aPhase * 40.0);
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;
export const DUST_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vTw;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  float a = exp(-r2 * 26.0) + 0.6 * exp(-r2 * 120.0);
  gl_FragColor = vec4(vColor * a * vTw * uOpacity, 1.0);
}
`;

/** Glowing points with per-point colour and size (face landmarks, globe). */
export const SPOT_VERT = /* glsl */ `
attribute float aSize;
attribute vec3 aColor;
uniform float uScale;
varying vec3 vColor;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uScale / -mv.z;
  vColor = aColor;
  gl_Position = projectionMatrix * mv;
}
`;
export const SPOT_FRAG = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r2 = dot(d, d);
  float a = exp(-r2 * 60.0) + 0.35 * exp(-r2 * 12.0);
  gl_FragColor = vec4(vColor * a * uOpacity, 1.0);
}
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
