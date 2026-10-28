// Kinetic captions, word by word on the spoken frame (timeline.json voice.words).
// White text on the dark stage, no box: legibility comes from the two shadows only.
// Keywords flash white, then settle in red (urgency) or champagne gold (premium) with a scale pulse.
// The hook's first words are skipped: the giant PARE / DE GASTAR / CARO type already says them.
import { Easing, useCurrentFrame } from "remotion";
import { DROP, INTER, SHADOW, glow } from "../style";
import { CAPTION_Y, DURATION, GOLD_DEEP, INK, K, RED, TL, WORDS, easeIn, easeOut, mix, prog } from "../tl";

type Word = { t: string; f: number; end: number; key?: string };
type Chunk = { words: Word[]; slam: boolean };

const norm = (w: string) => w.toLowerCase().replace(/[.,?!"]/g, "");
// Multi-word keywords first; colour per keyword.
const KEYS: [string[], string][] = [
  [["pele", "de", "vidro"], GOLD_DEEP],
  [["carrinho", "amarelo"], GOLD_DEEP],
  [["125", "mil", "pedidos"], GOLD_DEEP],
  [["7", "mil", "criadores"], GOLD_DEEP],
  [["linhas", "finas"], RED],
  [["peptídeo", "de", "cobre"], GOLD_DEEP],
  [["eu", "quero"], GOLD_DEEP],
  [["importados"], RED],
  [["agora"], RED],
  [["bizarro"], RED],
  [["zencial"], GOLD_DEEP],
  [["ghk-cu"], GOLD_DEEP],
  [["r$", "200"], GOLD_DEEP],
  [["r$ 200"], GOLD_DEEP],
  [["100%"], GOLD_DEEP],
  [["brasileiro"], GOLD_DEEP],
  [["nº 1"], GOLD_DEEP],
  [["colágeno"], GOLD_DEEP],
  [["firmeza"], GOLD_DEEP],
  [["desconto"], GOLD_DEEP],
];

const HOOK_SKIP = K("S01", "fortunas") + 20;
// Also skipped: "R$ 200", which the S02 price HUD shows at the same moment.
const HUD_SKIP = new Set([K("S02", "preco")]);
const words: Word[] = WORDS.filter((w) => w.f > HOOK_SKIP && !HUD_SKIP.has(w.f)).map((w) => ({ t: w.w, f: w.f, end: w.end }));
for (let i = 0; i < words.length; i++) {
  for (const [seq, color] of KEYS) {
    if (seq.every((s, j) => words[i + j] && norm(words[i + j].t) === s)) {
      seq.forEach((_, j) => (words[i + j].key = color));
      i += seq.length - 1;
      break;
    }
  }
}

const impactful = (f: number) => TL.scenes.some((s) => s.tag === "impactful" && f >= s.from && f < s.to);

// Short chunks that fit one or two lines: break on punctuation, on a pause, or past ~20 characters.
const MAX_CHARS = 20;
const CHUNKS: Chunk[] = [];
{
  let cur: Word[] = [];
  const flush = () => {
    if (!cur.length) return;
    CHUNKS.push({ words: cur, slam: impactful(cur[0].f) });
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

const SIZE = 76;
const KEY_SIZE = 86;
const EXIT = 6;
const popEase = Easing.out(Easing.back(1.6));
const slamEase = Easing.out(Easing.exp);

const WordView: React.FC<{ w: Word; slam: boolean }> = ({ w, slam }) => {
  const frame = useCurrentFrame();
  const size = w.key ? KEY_SIZE : SIZE;
  const since = frame - w.f;
  if (since < 0) return <span style={{ opacity: 0, fontSize: size }}>{w.t}</span>;
  // 0.15 s ease-out with overshoot; impactful lines slam down from 1.3x.
  const p = slam ? prog(frame, w.f, w.f + 7, slamEase) : prog(frame, w.f, w.f + 9, popEase);
  const shown = prog(frame, w.f, w.f + (slam ? 2 : 4), easeOut);
  const pulse = w.key ? Math.exp(-since / 12) : 0;
  const scale = (slam ? mix(w.key ? 1.3 : 1.2, 1, p) : mix(0.55, 1, p)) * (1 + 0.1 * pulse);
  // Keywords flash white for 4 frames, then settle in their colour.
  const color = w.key ? (since < 4 ? "#FFFFFF" : w.key) : INK;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: size,
        color,
        opacity: shown,
        transform: `translateY(${slam ? 0 : (1 - p) * 36}px) scale(${scale})`,
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
        const end = next ? Math.min(next.words[0].f - EXIT - 1, lastEnd + 40) : Math.min(DURATION - 60, lastEnd + 40);
        if (frame < start || frame >= end + EXIT) return null;
        const exit = prog(frame, end, end + EXIT, easeIn);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 80,
              width: 920,
              top: CAPTION_Y[0],
              height: CAPTION_Y[1] - CAPTION_Y[0],
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              alignContent: "center",
              justifyContent: "center",
              columnGap: 24,
              fontFamily: INTER,
              fontWeight: 900,
              letterSpacing: -1.5,
              lineHeight: 1.0,
              textAlign: "center",
              opacity: 1 - exit,
              transform: `translateY(${-20 * exit}px)`,
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
