// Kinetic captions, word by word on the spoken frame (timeline-iphone.json voice.words).
// No background box: legibility comes from the two shadows only. Keywords flash white, then settle
// in OLED blue (or titanium silver) with glow and a scale pulse. "absurda" slams in.
import { Easing, useCurrentFrame } from "remotion";
import { INTER, glow } from "../../hud/style";
import { CAPTION_Y, DURATION, OLED_BLUE, TITANIUM, WORDS, easeIn, easeOut, mix, prog } from "../tl";

type Word = { t: string; f: number; end: number; key?: string };
type Chunk = { words: Word[]; slam: boolean };

const norm = (w: string) => w.toLowerCase().replace(/[.,?!]/g, "");
// Multi-word keywords first; colour per keyword.
const KEYS: [string[], string][] = [
  [["dez", "camadas"], OLED_BLUE],
  [["cem", "peças"], TITANIUM],
  [["oled"], OLED_BLUE],
  [["pixel"], OLED_BLUE],
  [["backlight"], OLED_BLUE],
  [["dobráveis"], OLED_BLUE],
  [["titânio"], TITANIUM],
  [["cola"], OLED_BLUE],
  [["lágrima"], OLED_BLUE],
  [["raio"], OLED_BLUE],
  [["tensão"], OLED_BLUE],
  [["apple"], TITANIUM],
  [["absurda"], OLED_BLUE],
  [["preço"], TITANIUM],
];

const words: Word[] = WORDS.map((w) => ({ t: w.w, f: w.f, end: w.end }));
for (let i = 0; i < words.length; i++) {
  for (const [seq, color] of KEYS) {
    if (seq.every((s, j) => words[i + j] && norm(words[i + j].t) === s)) {
      seq.forEach((_, j) => (words[i + j].key = color));
      break;
    }
  }
}

// Short chunks that fit one line at 80 px: break on punctuation, on a pause, or past ~19 characters.
const MAX_CHARS = 19;
const CHUNKS: Chunk[] = [];
{
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    CHUNKS.push({ words: cur, slam: cur.some((w) => norm(w.t) === "absurda") });
    cur = [];
  };
  words.forEach((w) => {
    const len = cur.reduce((s, x) => s + x.t.length + 1, 0) + w.t.length;
    const gap = cur.length ? w.f - cur[cur.length - 1].end : 0;
    // Keep two-word keywords together.
    const pairContinues = cur.length && cur[cur.length - 1].key && w.key && ["camadas", "peças"].includes(norm(w.t));
    if (cur.length && !pairContinues && (len > MAX_CHARS || gap > 18)) flush();
    cur.push(w);
    if (/[.,?!]$/.test(w.t)) flush();
  });
  flush();
}

const SIZE = 80;
const KEY_SIZE = 88;
const EXIT = 6;
const popEase = Easing.out(Easing.back(1.6));
const slamEase = Easing.out(Easing.exp);
const SHADOW = "4px 4px 8px rgba(0,0,0,0.9)";

const WordView: React.FC<{ w: Word; slam: boolean }> = ({ w, slam }) => {
  const frame = useCurrentFrame();
  const size = w.key ? KEY_SIZE : SIZE;
  const since = frame - w.f;
  if (since < 0) return <span style={{ opacity: 0, fontSize: size }}>{w.t}</span>;
  const bigSlam = slam && !!w.key;
  // 0.15 s ease-out with overshoot.
  const p = bigSlam ? prog(frame, w.f, w.f + 7, slamEase) : prog(frame, w.f, w.f + 9, popEase);
  const shown = prog(frame, w.f, w.f + (bigSlam ? 2 : 4), easeOut);
  const pulse = w.key ? Math.exp(-since / 12) : 0;
  const scale = (bigSlam ? mix(2.6, 1, p) : mix(0.55, 1, p)) * (1 + 0.1 * pulse);
  const color = w.key ? (since < 4 ? "#ffffff" : w.key) : "#ffffff";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: size,
        color,
        opacity: shown,
        transform: `translateY(${bigSlam ? 0 : (1 - p) * 36}px) scale(${scale})`,
        textShadow: w.key ? `${SHADOW}, ${glow(w.key, 0.3 + 0.7 * pulse, 0.8)}` : SHADOW,
      }}
    >
      {w.t}
    </span>
  );
};

export const Captions: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      {CHUNKS.map((c, i) => {
        const start = c.words[0].f;
        const next = CHUNKS[i + 1];
        const lastEnd = c.words[c.words.length - 1].end;
        const end = next ? Math.min(next.words[0].f - EXIT - 1, lastEnd + 40) : Math.min(DURATION - 30, lastEnd + 30);
        if (frame < start || frame >= end + EXIT) return null;
        const exit = prog(frame, end, end + EXIT, easeIn);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 70,
              width: 940,
              top: CAPTION_Y[0],
              height: CAPTION_Y[1] - CAPTION_Y[0],
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              columnGap: 26,
              fontFamily: INTER,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 1.0,
              textAlign: "center",
              opacity: 1 - exit,
              transform: `translateY(${-20 * exit}px)`,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))",
            }}
          >
            {c.words.map((w, j) => (
              <WordView key={j} w={w} slam={c.slam} />
            ))}
          </div>
        );
      })}
    </>
  );
};
