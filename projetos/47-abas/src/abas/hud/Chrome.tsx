// Frame-level chrome: the voice visualizer (audio-only: it replaces the PiP), impact shake/zoom/flash,
// the PC-stutter glitch, the vignette, the S07 blackout and the closing fade.
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, random, staticFile, useCurrentFrame } from "remotion";
import { BLUE, BLUE_GLOW, DURATION, FADE_OUT, FPS, K, VIZ, blackoutAt, easeIn, isStuck, prog } from "../tl";

export const VOICE_SRC = staticFile("audio/narracao.mp3");

const BARS = 16;
/** Chrome-blue bars that follow the voice spectrum, mirrored around a centre line. */
export const AudioViz: React.FC = () => {
  const frame = useCurrentFrame();
  const audio = useAudioData(VOICE_SRC);
  const o = prog(frame, K("S01", "n47"), K("S01", "n47") + 24) * (1 - prog(frame, FADE_OUT[0], FADE_OUT[0] + 20, easeIn)) * (1 - blackoutAt(frame));
  if (!audio || o <= 0) return null;
  const spec = visualizeAudio({ fps: FPS, frame, audioData: audio, numberOfSamples: 64, smoothing: true });
  const bw = VIZ.w / BARS;
  return (
    <svg width={VIZ.w} height={VIZ.h} style={{ position: "absolute", left: VIZ.x, top: VIZ.y, opacity: o, overflow: "visible", filter: `drop-shadow(0 0 8px ${BLUE}66)` }}>
      <defs>
        <linearGradient id="vizg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={BLUE_GLOW} />
          <stop offset="0.5" stopColor={BLUE} />
          <stop offset="1" stopColor={BLUE_GLOW} />
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
  [K("S01", "n47"), 26, 0.07, 0.5, "#FFFFFF"],
  [K("S01", "abas"), 8, 0.02, 0, "#fff"],
  [K("S01", "problema"), 22, 0.08, 0.35, "#FFFFFF"],
  [K("S03", "closeTab"), 4, 0.01, 0, "#fff"],
  [K("S03", "multiply"), 8, 0.02, 0.12, BLUE],
  [K("S06", "windows"), 12, 0.04, 0.2, "#FFFFFF"],
  [K("S07", "enquanto"), 14, 0.03, 0, "#fff"],
  [K("S07", "zoologico"), 28, 0.08, 0.45, "#FFFFFF"],
  [K("S07", "abas2"), 14, 0.03, 0.15, BLUE],
  [K("S09", "comenta"), 4, 0.015, 0, "#fff"],
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
  // The choking PC: a small horizontal jolt on every stuck frame.
  if (isStuck(frame)) x += (random(`stuck-${frame}`) * 2 - 1) * 7;
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
  // Screen-blended light on the dark stage (a solid white frame would look cheap).
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color, opacity: o, mixBlendMode: "screen" }} /> : null;
};

/** Stuck frames: a few torn scanline bands in blue/white, screen-blended. */
export const StutterFX: React.FC = () => {
  const frame = useCurrentFrame();
  if (!isStuck(frame)) return null;
  const n = 3 + Math.floor(random(`bands-${frame}`) * 4);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {Array.from({ length: n }, (_, i) => {
        const y = random(`by-${frame}-${i}`) * 1920;
        const h = 4 + random(`bh-${frame}-${i}`) * 36;
        const blue = random(`bc-${frame}-${i}`) > 0.4;
        return (
          <div
            key={i}
            style={{ position: "absolute", left: (random(`bx-${frame}-${i}`) - 0.5) * 80, top: y, width: 1160, height: h, background: blue ? BLUE : "#FFFFFF", opacity: 0.08 + 0.14 * random(`bo-${frame}-${i}`) }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 85% 65% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 86%, rgba(0,0,0,0.8) 100%)" }} />
);

/** The overloaded screen dies at the end of the S07 freeze; the clean stage fades back up. */
export const Blackout: React.FC = () => {
  const frame = useCurrentFrame();
  const o = blackoutAt(frame);
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, FADE_OUT[0], DURATION - 4, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
