// Frame-level chrome: the voice visualizer (audio-only: it replaces the PiP), impact shake/zoom/flash,
// vignette, the "simulated" badge and the closing fade. Impact frames come from timeline.json.
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, random, staticFile, useCurrentFrame } from "remotion";
import { MONO, SHADOW } from "../style";
import { BLUE, DURATION, FPS, GREEN, K, RED, SC, VIZ, WHITE, darkAt, easeIn, prog, win } from "../tl";

export const VOICE_SRC = staticFile("audio/narracao.mp3");

const BARS = 22;
/** Bars that follow the voice spectrum, mirrored around a centre line, blue fading to green. */
export const AudioViz: React.FC = () => {
  const frame = useCurrentFrame();
  const audio = useAudioData(VOICE_SRC);
  const o = prog(frame, 6, 30) * (1 - prog(frame, K("S09", "fadeOut") - 20, K("S09", "fadeOut"), easeIn));
  if (!audio || o <= 0) return null;
  const spec = visualizeAudio({ fps: FPS, frame, audioData: audio, numberOfSamples: 64, smoothing: true });
  const bw = (VIZ.w - 24) / BARS;
  return (
    <div style={{ position: "absolute", left: VIZ.x, top: VIZ.y, width: VIZ.w, height: VIZ.h, opacity: o }}>
      <svg width={VIZ.w} height={VIZ.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id="vizg" x1="0" x2="1">
            <stop offset="0" stopColor={BLUE} />
            <stop offset="1" stopColor={GREEN} />
          </linearGradient>
        </defs>
        {Array.from({ length: BARS }, (_, i) => {
          // Symmetric: the centre bars carry the low (voice) bins.
          const bin = Math.abs(i - (BARS - 1) / 2);
          const v = Math.min(1, Math.sqrt(spec[Math.floor(bin * 1.3) + 1] * (14 + bin * 2)));
          const h = 3 + v * (VIZ.h / 2 - 8);
          const x = 12 + i * bw + bw * 0.22;
          return <rect key={i} x={x} y={VIZ.h / 2 - h} width={bw * 0.56} height={h * 2} rx={bw * 0.28} fill="url(#vizg)" opacity={0.45 + 0.55 * v} />;
        })}
      </svg>
    </div>
  );
};

// Impacts: [frame, shake px, zoom, flash, flash colour].
const IMPACTS: [number, number, number, number, string][] = [
  [K("S01", "língua"), 4, 0.025, 0.12, "#ffffff"],
  [SC.S04.from, 12, 0.04, 0.85, "#ffffff"],
  [K("S04", "trend mundial"), 18, 0.05, 0.3, "#ffffff"],
  [K("S07", "passar"), 22, 0.08, 0.55, "#ffffff"],
  [K("S08", "comando"), 14, 0.02, 0.22, RED],
  [K("S09", "mágica"), 5, 0.03, 0.35, "#ffffff"],
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
  return <AbsoluteFill style={{ transform: `translate(${k.x}px, ${k.y}px) scale(${1 + k.zoom})`, transformOrigin: "50% 40%" }}>{children}</AbsoluteFill>;
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
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color, opacity: o, mixBlendMode: color === "#ffffff" ? "normal" : "screen" }} /> : null;
};

export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const d = darkAt(frame);
  return <AbsoluteFill style={{ background: `radial-gradient(ellipse ${75 - 15 * d}% ${62 - 12 * d}% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,${0.5 + 0.2 * d}) 85%, rgba(0,0,0,${0.85 + 0.1 * d}) 100%)` }} />;
};

/** Honest label on the procedural demo shots (no real footage with a clear licence was found). */
export const SimBadge: React.FC = () => {
  const frame = useCurrentFrame();
  const spans: [number, number, string][] = [
    [K("S01", "iPhone"), SC.S02.from + 10, "EXEMPLO SIMULADO"],
    [SC.S05.from + 10, SC.S05.to, "INTERFACE SIMULADA"],
    [K("S07", "passar") - 10, K("S07", "câmera frontal") - 10, "EXEMPLO SIMULADO"],
  ];
  const s = spans.find(([a, b]) => frame >= a && frame < b);
  if (!s) return null;
  const o = win(frame, s[0], s[1], 10, 10);
  return (
    <div style={{ position: "absolute", left: 80, top: 140, opacity: o * 0.9, fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 3, color: WHITE, textShadow: SHADOW, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 9, height: 9, borderRadius: 5, background: GREEN, boxShadow: `0 0 10px ${GREEN}`, opacity: 0.4 + 0.6 * Math.round((Math.sin((frame / FPS) * 6) + 1) / 2) }} />
      {s[2]}
    </div>
  );
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, K("S09", "fadeOut"), DURATION - 4, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
