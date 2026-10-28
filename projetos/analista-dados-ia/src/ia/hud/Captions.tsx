// Kinetic captions, word by word on the spoken frame (timeline.json voice.words), in the caption band (y 1400-1550,
// under the chin when the speaker is full screen, under the PiP otherwise). No box: two shadows only. Keywords
// flash white, then settle in their colour with a scale pulse; impactful scenes slam instead of pop.
import { Easing, useCurrentFrame } from "remotion";
import { DROP, INTER, SHADOW, glow } from "../style";
import { ALERT, BLUE, CAPTION_Y, CYAN, DURATION, GOLD, GOOD, INK, TL, WORDS, WORLD_OUT, easeIn, mix, prog } from "../tl";

type Word = { t: string; f: number; end: number; key?: string };
type Chunk = { words: Word[]; slam: boolean };

const norm = (w: string) => w.toLowerCase().replace(/[.,?!":']/g, "");
// Multi-word keywords first; colour per keyword.
const KEYS: [string[], string][] = [
  [["analista", "de", "dados"], CYAN],
  [["inteligência", "artificial"], BLUE],
  [["grupo", "fechado"], GOLD],
  [["mercado", "americano"], CYAN],
  [["arrastar", "caixinha"], ALERT],
  [["power", "bi"], ALERT],
  [["sql", "básico"], ALERT],
  [["regra", "de", "negócio"], GOOD],
  [["59", "mil", "dólares"], GOOD],
  [["três", "pontos"], CYAN],
  [["subiu", "de", "nível"], GOLD],
  [["2026"], CYAN],
  [["tradicional"], ALERT],
  [["morreu"], ALERT],
  [["dba"], CYAN],
  [["25"], GOLD],
  [["97"], GOLD],
  [["acabar"], ALERT],
  [["engoliu"], ALERT],
  [["dashboard"], CYAN],
  [["50%"], ALERT],
  [["gartner"], GOLD],
  [["híbrido"], GOLD],
  [["modelagem"], GOOD],
  [["governança"], GOOD],
  [["python"], GOOD],
  [["llms"], GOOD],
  [["humano"], GOLD],
  [["lucro"], GOLD],
  [["dados"], GOOD],
  [["segue"], CYAN],
];

const words: Word[] = WORDS.map((w) => ({ t: w.w, f: w.f, end: w.end }));
for (let i = 0; i < words.length; i++) {
  for (const [seq, color] of KEYS) {
    if (seq[0] === "dados" && words[i].t !== "DADOS") continue;
    if (seq.every((s, j) => words[i + j] && norm(words[i + j].t) === s)) {
      seq.forEach((_, j) => (words[i + j].key = color));
      i += seq.length - 1;
      break;
    }
  }
}

const slamAt = (f: number) => TL.scenes.some((s) => s.tag === "impactful" && f >= s.from && f < s.to);

// Short chunks that fit one or two lines: break on punctuation, on a pause, or past ~20 characters.
const MAX_CHARS = 20;
const CHUNKS: Chunk[] = [];
{
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    CHUNKS.push({ words: cur, slam: slamAt(cur[0].f) });
    cur = [];
  };
  words.forEach((w) => {
    const len = cur.reduce((s, x) => s + x.t.length + 1, 0) + w.t.length;
    const gap = cur.length ? w.f - cur[cur.length - 1].end : 0;
    // Never split a multi-word keyword.
    const keyContinues = cur.length && cur[cur.length - 1].key && w.key === cur[cur.length - 1].key && !/[.,?!]$/.test(cur[cur.length - 1].t);
    if (cur.length && !keyContinues && (len > MAX_CHARS || gap > 18)) flush();
    cur.push(w);
    if (/[.,?!:]$/.test(w.t)) flush();
  });
  flush();
}

const SIZE = 74;
const KEY_SIZE = 84;
const EXIT = 6;
const popEase = Easing.out(Easing.back(1.6));
const slamEase = Easing.out(Easing.exp);

const WordView: React.FC<{ w: Word; slam: boolean }> = ({ w, slam }) => {
  const frame = useCurrentFrame();
  const size = w.key ? KEY_SIZE : SIZE;
  const since = frame - w.f;
  if (since < 0) return <span style={{ opacity: 0, fontSize: size }}>{w.t}</span>;
  // 0.15 s ease-out with overshoot.
  const p = slam ? prog(frame, w.f, w.f + 7, slamEase) : prog(frame, w.f, w.f + 9, popEase);
  const shown = prog(frame, w.f, w.f + (slam ? 2 : 4));
  const pulse = w.key ? Math.exp(-since / 12) : 0;
  const scale = (slam ? mix(1.2, 1, p) : mix(0.55, 1, p)) * (1 + 0.1 * pulse);
  const color = w.key ? (since < 4 ? "#FFFFFF" : w.key) : INK;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: size,
        color,
        opacity: shown,
        transform: `translateY(${slam ? 0 : (1 - p) * 30}px) scale(${scale})`,
        transformOrigin: "50% 60%",
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
        const end = next ? Math.min(next.words[0].f - EXIT - 1, lastEnd + 40) : Math.min(DURATION - 30, lastEnd + 50);
        if (frame < start || frame >= end + EXIT) return null;
        const exit = prog(frame, end, end + EXIT, easeIn);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              // Once the chameleon is in (CTA) it owns the bottom-right corner: the caption band stops short of it.
              left: start >= WORLD_OUT ? 60 : 80,
              width: start >= WORLD_OUT ? 700 : 920,
              top: CAPTION_Y[0],
              height: CAPTION_Y[1] - CAPTION_Y[0],
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
              columnGap: 22,
              fontFamily: INTER,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 1.0,
              textAlign: "center",
              opacity: 1 - exit,
              transform: `translateY(${-16 * exit}px)`,
              filter: DROP,
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
