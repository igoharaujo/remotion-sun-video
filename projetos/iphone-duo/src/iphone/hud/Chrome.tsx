// Frame-level chrome: the concept tag, the voice visualizer (bottom-right, where the PiP used to be),
// impact shake/flash, vignette and the closing fade. Impact frames come from timeline-iphone.json.
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { AbsoluteFill, random, staticFile, useCurrentFrame } from "remotion";
import { MONO, glow } from "../../hud/style";
import { CONCEPT, FPS, K, OLED_BLUE, TITANIUM, TL, VIZ, easeIn, prog, win } from "../tl";

export const VOICE_SRC = staticFile("audio/iphoneduo.mp3");

export const ConceptTag: React.FC = () => {
  const frame = useCurrentFrame();
  const [from, to] = CONCEPT.frames;
  const o = win(frame, from, to, 14, 20);
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        right: 80,
        opacity: o,
        transform: `translateY(${(1 - o) * -10}px)`,
        fontFamily: MONO,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: 3,
        color: TITANIUM,
        textShadow: "2px 2px 6px rgba(0,0,0,0.9)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: 5, background: OLED_BLUE, boxShadow: `0 0 10px ${OLED_BLUE}`, opacity: 0.5 + 0.5 * Math.round((Math.sin((frame / FPS) * 6) + 1) / 2) }} />
      {CONCEPT.text.toUpperCase()}
    </div>
  );
};

const BARS = 24;
/** Bars that follow the voice track's spectrum, mirrored around a centre line, in a titanium bracket. */
export const AudioViz: React.FC = () => {
  const frame = useCurrentFrame();
  const audio = useAudioData(VOICE_SRC);
  const fadeIn = prog(frame, 6, 30);
  const fadeOut = 1 - prog(frame, K("s12_price", "também") + 30, K("s12_price", "também") + 60, easeIn);
  if (!audio) return null;
  const spec = visualizeAudio({ fps: FPS, frame, audioData: audio, numberOfSamples: 64, smoothing: true });
  const bw = (VIZ.w - 36) / BARS;
  const bracket = (x: number, y: number, sx: number, sy: number) => (
    <path d={`M${x} ${y + sy * 16} L${x} ${y} L${x + sx * 16} ${y}`} stroke={TITANIUM} strokeWidth={2.5} fill="none" opacity={0.85} />
  );
  return (
    <div style={{ position: "absolute", left: VIZ.x, top: VIZ.y, width: VIZ.w, height: VIZ.h, opacity: fadeIn * fadeOut }}>
      <svg width={VIZ.w} height={VIZ.h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        {bracket(1, 1, 1, 1)}
        {bracket(VIZ.w - 1, 1, -1, 1)}
        {bracket(1, VIZ.h - 1, 1, -1)}
        {bracket(VIZ.w - 1, VIZ.h - 1, -1, -1)}
        <line x1={18} x2={VIZ.w - 18} y1={VIZ.h / 2 + 8} y2={VIZ.h / 2 + 8} stroke={OLED_BLUE} strokeOpacity={0.25} strokeWidth={1} />
        {Array.from({ length: BARS }, (_, i) => {
          // Low bins carry the voice; spread them over the bars with a gentle tilt toward the highs.
          const v = Math.min(1, Math.sqrt(spec[Math.floor(i * 1.2) + 1] * (14 + i * 1.5)));
          const h = 3 + v * (VIZ.h / 2 - 16);
          const x = 18 + i * bw + bw * 0.2;
          return (
            <rect key={i} x={x} y={VIZ.h / 2 + 8 - h} width={bw * 0.6} height={h * 2} rx={bw * 0.3} fill={OLED_BLUE} opacity={0.45 + 0.55 * v} style={{ filter: `drop-shadow(0 0 ${4 + 8 * v}px ${OLED_BLUE})` }} />
          );
        })}
      </svg>
      <div style={{ position: "absolute", left: 18, top: 6, fontFamily: MONO, fontSize: 15, letterSpacing: 2, color: TITANIUM, opacity: 0.8 }}>
        VOZ · AO VIVO
      </div>
    </div>
  );
};

// Impacts: [frame, shake px, zoom, flash].
const IMPACTS: [number, number, number, number][] = [
  [K("s02_oled_ignite", "OLED"), 0, 0.03, 0.18],
  [K("s05_glass_titanium", "titânio"), 7, 0.02, 0],
  [K("s07_hinge_assembly", "dobradiça"), 9, 0.035, 0.12],
  [K("s09_stress", "tensão"), 18, 0.05, 0.3],
  [K("s11_absurd", "absurda"), 28, 0.14, 1.0],
  [K("s12_price", "coinLand"), 5, 0.01, 0],
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
  for (const [f, , , flash] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 14 || !flash) continue;
    o = Math.max(o, flash * (d < 2 ? 1 : Math.exp(-(d - 1) / 3)));
  }
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: "#fff", opacity: o }} /> : null;
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 62% at 50% 46%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 85%, rgba(0,0,0,0.85) 100%)" }} />
);

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const [a, b] = (TL.scenes[TL.scenes.length - 1].keyBeats as unknown as { fadeOut: [number, number] }).fadeOut;
  const o = prog(frame, a, b, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};

