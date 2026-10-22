// Kinetic captions: every word pops on the frame it is spoken (timeline.json motion.captions).
// Key words flash white -> gold, overshoot and glow; "slam" words crash in from 2.6x.
import { Easing, useCurrentFrame } from "remotion";
import { DURATION, T, easeIn, easeOut, mix, prog } from "../timeline";
import { GOLD, INTER, glow } from "./style";

type Word = { t: string; f: number; key?: boolean };
type Chunk = { id: string; style: string; words: Word[]; out?: number };

const CHUNKS = T.motion.captions.chunks as Chunk[];
const ZONE = T.motion.captions.zone;
const EXIT = 6;
const popEase = Easing.out(Easing.back(1.9));
const slamEase = Easing.out(Easing.exp);

const SIZE: Record<string, number> = { caption: 86, hero: 96, slam: 104 };
const BOX_H = 360;

const WordView: React.FC<{ w: Word; style: string; size: number }> = ({ w, style, size }) => {
  const frame = useCurrentFrame();
  const since = frame - w.f;
  if (since < 0) {
    // Reserve the word's space so the line never reflows as words arrive.
    return <span style={{ opacity: 0, fontSize: w.key ? size * 1.08 : size }}>{w.t}</span>;
  }
  const slam = style === "slam";
  const p = slam ? prog(frame, w.f, w.f + 6, slamEase) : prog(frame, w.f, w.f + 9, popEase);
  const shown = prog(frame, w.f, w.f + (slam ? 2 : 4), easeOut);
  const pulse = w.key ? Math.exp(-since / 10) : 0;
  const scale = (slam ? mix(2.6, 1, p) : mix(0.5, 1, p)) * (1 + 0.3 * pulse);
  const lift = slam ? 0 : (1 - p) * 44;
  const color = w.key ? (since < 3 ? "#ffffff" : GOLD) : "#ffffff";
  return (
    <span
      style={{
        display: "inline-block",
        // Key words are set larger in the layout itself so neighbours keep their spacing.
        fontSize: w.key ? size * 1.08 : size,
        color,
        opacity: shown,
        transform: `translateY(${lift}px) scale(${scale})`,
        filter: `blur(${(1 - shown) * (slam ? 14 : 8)}px)`,
        textShadow: w.key
          ? `${glow("rgba(255,197,77,0.85)", 0.35 + 0.65 * pulse)}, 0 4px 24px rgba(0,0,0,0.8)`
          : "0 4px 24px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)",
      }}
    >
      {w.t}
    </span>
  );
};

const ChunkView: React.FC<{ chunk: Chunk; end: number }> = ({ chunk, end }) => {
  const frame = useCurrentFrame();
  const exit = prog(frame, end, end + EXIT, easeIn);
  const base = SIZE[chunk.style] ?? SIZE.caption;
  // Slam: "8 minutos" big on line one, "e 20 segundos" on line two.
  const lines = chunk.style === "slam" ? [chunk.words.slice(0, 2), chunk.words.slice(2)] : [chunk.words];
  return (
    <div
      style={{
        position: "absolute",
        left: ZONE.x[0],
        width: ZONE.x[1] - ZONE.x[0],
        top: ZONE.yCenter - BOX_H / 2,
        height: BOX_H,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: INTER,
        fontWeight: chunk.style === "caption" ? 800 : 900,
        letterSpacing: -2,
        lineHeight: 1.04,
        textAlign: "center",
        opacity: 1 - exit,
        transform: `translateY(${-28 * exit}px) scale(${1 - 0.06 * exit})`,
        filter: `blur(${exit * 8}px)`,
      }}
    >
      {lines.map((line, i) => {
        const size = chunk.style === "slam" && i === 0 ? base * 1.5 : base;
        return (
          <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.3 }}>
            {line.map((w, j) => (
              <WordView key={j} w={w} style={chunk.style} size={size} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {CHUNKS.map((c, i) => {
        const next = CHUNKS[i + 1];
        const end = c.out ?? (next ? next.words[0].f - EXIT : DURATION + EXIT);
        if (frame < c.words[0].f || frame >= end + EXIT) return null;
        return <ChunkView key={c.id} chunk={c} end={end} />;
      })}
    </>
  );
};
