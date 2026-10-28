// Frame-level chrome: the voice visualizer (audio-only: it replaces the PiP), impact shake/zoom/flash,
// the warm vignette, the PUBLICIDADE disclosure, the yellow-cart CTA button and the closing fade.
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, random, staticFile, useCurrentFrame } from "remotion";
import { Cart3D } from "../three/Panels";
import { INTER, MONO, SHADOW } from "../style";
import { CART, CART_YELLOW, DURATION, FADE_OUT, FPS, GOLD, GOLD_DEEP, INK, K, LAYOUT, RED, SC, VIZ, backOut, easeIn, kickAt, mix, prog } from "../tl";

export const VOICE_SRC = staticFile("audio/narracao.mp3");

const BARS = 16;
/** Gold bars that follow the voice spectrum, mirrored around a centre line. */
export const AudioViz: React.FC = () => {
  const frame = useCurrentFrame();
  const audio = useAudioData(VOICE_SRC);
  const o = prog(frame, 6, 30) * (1 - prog(frame, FADE_OUT[0], FADE_OUT[0] + 20, easeIn));
  if (!audio || o <= 0) return null;
  const spec = visualizeAudio({ fps: FPS, frame, audioData: audio, numberOfSamples: 64, smoothing: true });
  const bw = VIZ.w / BARS;
  return (
    <svg width={VIZ.w} height={VIZ.h} style={{ position: "absolute", left: VIZ.x, top: VIZ.y, opacity: o, overflow: "visible", filter: "drop-shadow(0 2px 6px rgba(90,50,30,0.25))" }}>
      <defs>
        <linearGradient id="vizg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={GOLD} />
          <stop offset="0.5" stopColor={GOLD_DEEP} />
          <stop offset="1" stopColor={GOLD} />
        </linearGradient>
      </defs>
      {Array.from({ length: BARS }, (_, i) => {
        const bin = Math.abs(i - (BARS - 1) / 2);
        const v = Math.min(1, Math.sqrt(spec[Math.floor(bin * 1.4) + 1] * (14 + bin * 2)));
        const h = 3 + v * (VIZ.h / 2 - 6);
        return <rect key={i} x={i * bw + bw * 0.22} y={VIZ.h / 2 - h} width={bw * 0.56} height={h * 2} rx={bw * 0.28} fill="url(#vizg)" opacity={0.5 + 0.5 * v} />;
      })}
    </svg>
  );
};

// Impacts: [frame, shake px, zoom, flash, flash colour].
export const IMPACTS: [number, number, number, number, string][] = [
  [K("S01", "pare"), 22, 0.06, 0.45, "#FFE2A8"],
  [K("S01", "pare") + 18, 10, 0.03, 0, "#fff"],
  [K("S01", "fortunas"), 16, 0.05, 0.25, RED],
  [K("S02", "vidro"), 0, 0.015, 0.15, "#FFFFFF"],
  [K("S03", "n125"), 8, 0.03, 0.2, "#FFF6E0"],
  [K("S05", "bizarro"), 20, 0.08, 0.3, "#FFFFFF"],
  [K("S06", "n1"), 10, 0.03, 0.25, "#FFF3D0"],
  [K("S08", "carrinho"), 6, 0.02, 0, "#fff"],
  [K("S08", "agora"), 22, 0.06, 0.3, RED],
  [K("S09", "euquero"), 10, 0.03, 0.2, "#FFF3D0"],
];

const kick = (frame: number) => {
  let x = 0;
  let y = 0;
  let zoom = 0;
  for (const [f, shake, z] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 30) continue;
    const decay = Math.exp(-d / 5);
    x += shake * decay * (random(`ix-${f}-${d}`) * 2 - 1);
    y += shake * decay * (random(`iy-${f}-${d}`) * 2 - 1);
    zoom += z * Math.exp(-d / 6);
  }
  return { x, y, zoom };
};

export const ShakeLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const k = kick(frame);
  return <AbsoluteFill style={{ transform: `translate(${k.x}px, ${k.y}px) scale(${1 + k.zoom})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>;
};

export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  let o = 0;
  let color = "#fff";
  for (const [f, , , flash, c] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 14 || !flash) continue;
    const v = flash * (d < 2 ? 1 : Math.exp(-(d - 1) / 3));
    if (v > o) [o, color] = [v, c];
  }
  // Flashes are screen-blended light on the dark stage (a solid white frame would look cheap).
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color, opacity: color === RED ? o * 0.5 : o, mixBlendMode: "screen" }} /> : null;
};

/** Soft black vignette: keeps the eye on the lit centre of the stage. */
export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 88%, rgba(0,0,0,0.75) 100%)" }} />
);

/** Ad disclosure (TikTok / CONAR): small, top-left, on the whole video. */
export const Disclosure: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, 0, 10) * (1 - prog(frame, FADE_OUT[1] - 10, FADE_OUT[1]));
  return (
    <div
      style={{
        position: "absolute",
        left: LAYOUT.disclosure.x,
        top: LAYOUT.disclosure.y,
        opacity: o * 0.85,
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: 4,
        color: INK,
        textShadow: SHADOW,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 5, background: GOLD }} />
      {LAYOUT.disclosure.text}
    </div>
  );
};

/** Honest label next to every procedural skin shot. */
export const SimLabel: React.FC<{ x: number; y: number; w: number; opacity: number }> = ({ x, y, w, opacity }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, textAlign: "center", opacity, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: INK, textShadow: SHADOW }}>
    SIMULAÇÃO ILUSTRATIVA
  </div>
);

// ---- yellow-cart CTA ------------------------------------------------------------------------------
const POPS = [K("S06", "produto"), K("S08", "carrinho"), K("S08", "embaixo1"), K("S08", "agora"), K("S09", "comentar"), K("S09", "euquero")];

/** Small pulsing icon from "produto" (S06), hidden in S07, full button from "carrinho" (S08) to the end. */
export const CartCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = prog(frame, K("S06", "produto") - 4, K("S06", "produto") + 16, backOut);
  const full = prog(frame, K("S08", "carrinho") - 6, K("S08", "carrinho") + 14, backOut);
  const away = prog(frame, SC.S07.from + 10, SC.S07.from + 30) * (1 - prog(frame, K("S08", "clica") - 10, K("S08", "carrinho") - 6));
  const out = 1 - prog(frame, FADE_OUT[0], FADE_OUT[0] + 30, easeIn);
  const o = appear * (1 - away) * out;
  if (o <= 0.003) return null;
  const pop = POPS.reduce((m, f) => Math.max(m, kickAt(frame, f, 7)), 0);
  const t = frame / FPS;
  const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.04); // ~ on the 125 BPM half-beat
  const iconSize = Math.round(mix(130, 150, full)); // ThreeCanvas needs integer sizes
  const w = mix(iconSize, CART.w, full);
  const left = CART.x + (CART.w - w) / 2;
  const yaw = -0.5 + 0.25 * Math.sin(t * 1.6) + 0.6 * pop;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: CART.y + CART.h - iconSize,
        width: w,
        height: iconSize,
        opacity: o,
        transform: `scale(${(1 + 0.12 * pop + 0.03 * pulse) * mix(0.8, 1, appear)})`,
        transformOrigin: "50% 80%",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: CART.h,
          borderRadius: 48,
          background: `linear-gradient(180deg, #FFE07A 0%, ${CART_YELLOW} 55%, #E9A800 100%)`,
          boxShadow: `0 10px 24px rgba(160,100,0,${0.35 * full}), inset 0 2px 0 rgba(255,255,255,0.6), 0 0 0 ${4 + 8 * pulse}px rgba(255,201,46,${0.25 * full * (1 - pulse)})`,
          opacity: full,
        }}
      />
      <div style={{ position: "absolute", left: mix((w - iconSize) / 2, -10, full), top: 0, width: iconSize, height: iconSize }}>
        <Cart3D size={iconSize} yaw={yaw} bounce={pop} />
      </div>
      <div
        style={{
          position: "absolute",
          left: iconSize - 20,
          right: 20,
          bottom: 0,
          height: CART.h,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          fontFamily: INTER,
          fontWeight: 900,
          fontSize: 34,
          color: "#2A1A05",
          opacity: prog(frame, K("S08", "carrinho") + 4, K("S08", "carrinho") + 14),
          whiteSpace: "nowrap",
        }}
      >
        CARRINHO AMARELO
        <svg width="30" height="36" viewBox="0 0 30 36" style={{ transform: `translateY(${6 * pulse}px)` }}>
          <path d="M15 2 V30 M4 20 L15 32 L26 20" stroke="#2A1A05" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, FADE_OUT[0], DURATION - 4, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
