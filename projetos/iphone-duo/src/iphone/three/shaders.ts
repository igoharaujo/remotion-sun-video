// GLSL for the iPhone Duo scene. Colours are sRGB written straight out (ThreeCanvas runs `flat linear`).
import { NOISE } from "../../three/shaders";

/** Full-screen quad in clip space: the #050510 -> #0A0A15 backdrop. */
export const BACKDROP_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.9999, 1.0); }
`;
export const BACKDROP_FRAG = /* glsl */ `
varying vec2 vUv;
void main() {
  vec3 top = vec3(0.0196, 0.0196, 0.0627);
  vec3 bot = vec3(0.0392, 0.0392, 0.0824);
  gl_FragColor = vec4(mix(bot, top, smoothstep(0.0, 1.0, vUv.y)), 1.0);
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

// One display layer. The plane lies flat (x across, z deep) at its stack height; uCurv bends the whole
// stack around one axis. Each layer keeps its own length on a radius R0 + h, so outer and inner layers
// end at different angles: the "pages of a book" slide falls out of the geometry.
export const LAYER_VERT = /* glsl */ `
uniform float uCurv;
uniform float uH;
uniform float uSlideX;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
void main() {
  vUv = uv;
  vec3 p = vec3(position.x + uSlideX, 0.0, -position.y);
  vec3 n = vec3(0.0, 1.0, 0.0);
  if (uCurv > 1e-4) {
    float R0 = 1.0 / uCurv;
    float r = R0 + uH;
    float a = p.x / r;
    p.x = r * sin(a);
    p.y = -R0 + r * cos(a) - uH;
    n = vec3(sin(a), cos(a), 0.0);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * n);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
export const LAYER_FRAG = /* glsl */ `
uniform vec3 uColor;
uniform vec3 uEdge;
uniform float uOpacity;
uniform float uKind;
uniform float uTime;
uniform float uGlow;
uniform float uGlint;
uniform float uDim;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vView;
${NOISE}
void main() {
  vec2 e2 = min(vUv, 1.0 - vUv);
  float edgeGlow = exp(-min(e2.x, e2.y) * 70.0);
  float fres = pow(1.0 - abs(dot(vN, vView)), 2.0);
  vec3 col;
  float a;
  if (uKind < 0.5) {
    // Generic film: faint tinted fill, glowing rim.
    col = uColor * (0.22 + 0.25 * uGlow) + uEdge * edgeGlow;
    a = 0.2 + 0.15 * uGlow + 0.75 * edgeGlow;
  } else if (uKind < 1.5) {
    // Ultra-thin glass: fresnel sheen and a travelling specular streak.
    float streak = smoothstep(0.07, 0.0, abs(fract(vUv.x * 0.7 + vUv.y * 0.5 - uGlint) - 0.5));
    col = vec3(0.78, 0.9, 1.0) * (0.14 + 0.6 * fres + 1.1 * streak * uGlow) + uEdge * edgeGlow * 1.3;
    a = 0.12 + 0.35 * fres + 0.55 * streak * uGlow + 0.8 * edgeGlow;
  } else if (uKind < 2.5) {
    // OLED emitter: RGB sub-pixel grid that lights with uGlow.
    vec2 g = vUv * vec2(54.0, 46.0);
    vec2 f = fract(g);
    float sub = floor(f.x * 3.0);
    vec3 rgb = sub < 0.5 ? vec3(1.0, 0.18, 0.22) : (sub < 1.5 ? vec3(0.2, 1.0, 0.4) : vec3(0.1, 0.5, 1.0));
    float dotm = smoothstep(0.5, 0.22, abs(fract(f.x * 3.0) - 0.5)) * smoothstep(0.45, 0.28, abs(f.y - 0.5));
    float tw = 0.6 + 0.4 * vnoise(vec3(floor(g) * 0.37, uTime * 0.8));
    col = rgb * dotm * tw * uGlow * 1.3 + uColor * 0.1 + uEdge * edgeGlow;
    a = 0.4 + 0.6 * edgeGlow + 0.5 * uGlow * dotm;
  } else if (uKind < 3.5) {
    // Titanium: brushed grain plus a specular band swept by uGlint.
    float brush = 0.5 * vnoise(vec3(vUv.x * 3.0, vUv.y * 420.0, 0.0)) + 0.5 * vnoise(vec3(vUv.x * 9.0, vUv.y * 900.0, 3.0));
    float band = exp(-pow((vUv.x + vUv.y * 0.35 - uGlint) * 5.0, 2.0));
    col = vec3(0.6, 0.61, 0.64) * (0.5 + 0.4 * brush) + vec3(1.0, 0.97, 0.9) * band * (0.4 + uGlow) + uEdge * edgeGlow * 0.6 + 0.25 * fres;
    a = 0.97;
  } else {
    // Glue: soft amber glow between layers.
    float n = vnoise(vec3(vUv * 7.0, uTime * 0.5));
    col = vec3(1.0, 0.66, 0.26) * (0.55 + 0.45 * n) * uGlow + vec3(1.0, 0.8, 0.5) * edgeGlow * uGlow;
    a = (0.5 * (0.6 + 0.4 * n) + 0.5 * edgeGlow) * uGlow;
  }
  col *= mix(1.0, 0.3, uDim);
  gl_FragColor = vec4(col, a * uOpacity);
}
`;

// Macro OLED panel: a grid of RGB sub-pixels. A seed pixel at the centre lights first, then an ignition
// wave runs outward (uIgnite = wave radius in cells) with a bright front.
export const PIXELS_FRAG = /* glsl */ `
uniform float uCells;
uniform float uAspect;
uniform float uIgnite;
uniform float uSeed;
uniform float uTime;
uniform float uPulse;
uniform float uOpacity;
varying vec2 vUv;
${NOISE}
void main() {
  vec2 p = (vUv - 0.5) * vec2(1.0, uAspect) * uCells + 0.5;
  vec2 c = floor(p);
  vec2 f = fract(p);
  float r = length(c);
  float sub = floor(f.x * 3.0);
  vec3 rgb = sub < 0.5 ? vec3(1.0, 0.16, 0.2) : (sub < 1.5 ? vec3(0.18, 1.0, 0.38) : vec3(0.0, 0.55, 1.0));
  float shape = smoothstep(0.5, 0.26, abs(fract(f.x * 3.0) - 0.5)) * smoothstep(0.46, 0.34, abs(f.y - 0.5));
  float lit = max(step(r, 0.5) * uSeed, smoothstep(uIgnite, uIgnite - 3.0, r));
  float front = exp(-pow((r - uIgnite) * 0.9, 2.0)) * step(0.05, uIgnite);
  float h = hash31(vec3(c, 7.0));
  float tw = 1.0 - uPulse * 0.45 * (0.5 + 0.5 * sin(uTime * (2.0 + 2.0 * h) + h * 6.283));
  vec3 col = rgb * shape * (lit * tw + 1.6 * front + 0.05);
  gl_FragColor = vec4(col * uOpacity, 1.0);
}
`;

// Fake-PBR metal for the hinge parts (works for instanced and plain meshes).
export const METAL_VERT = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
void main() {
#ifdef USE_INSTANCING
  mat4 m = modelViewMatrix * instanceMatrix;
#else
  mat4 m = modelViewMatrix;
#endif
  vec4 mv = m * vec4(position, 1.0);
  vN = normalize(mat3(m) * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;
export const METAL_FRAG = /* glsl */ `
uniform vec3 uTint;
uniform float uOpacity;
uniform float uGlint;
varying vec3 vN;
varying vec3 vView;
void main() {
  vec3 n = normalize(vN);
  float ndv = abs(dot(n, vView));
  vec3 env = mix(vec3(0.06, 0.07, 0.1), vec3(0.86, 0.89, 0.96), smoothstep(-0.4, 0.9, n.y));
  float spec = pow(max(dot(reflect(-vView, n), normalize(vec3(-0.4, 0.7, 0.6))), 0.0), 28.0);
  vec3 col = uTint * (0.22 + 0.6 * env) + spec * vec3(1.0, 0.97, 0.9) + (1.0 - ndv) * 0.3 * vec3(0.45, 0.75, 1.0);
  col += uGlint * vec3(0.55, 0.85, 1.0);
  gl_FragColor = vec4(col, uOpacity);
}
`;
