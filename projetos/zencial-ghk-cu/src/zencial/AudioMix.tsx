// Voice (untouched, unity gain) + Freesound SFX only (no music bed since the Keynote redesign).
// Every SFX is placed so its peak lands on the cue word (peak offsets measured from the files).
// Ducking under the voice: booms -8 dB, everything else -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { VOICE_SRC } from "./hud/Chrome";
import { DURATION, K, TL, WORDS } from "./tl";

const dbToGain = (db: number) => Math.pow(10, db / 20);
const ATTACK = 6;
const RELEASE = 18;

// Voiced ranges: words merged across gaps shorter than 15 frames.
const PHRASES: [number, number][] = [];
for (const w of WORDS) {
  const last = PHRASES[PHRASES.length - 1];
  if (last && w.f - last[1] < 15) last[1] = Math.max(last[1], w.end);
  else PHRASES.push([w.f, w.end]);
}

const voiced = (frame: number) => {
  let v = 0;
  for (const [a, b] of PHRASES) {
    if (frame < a - ATTACK || frame > b + RELEASE) continue;
    const up = interpolate(frame, [a - ATTACK, a], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const down = interpolate(frame, [b, b + RELEASE], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    v = Math.max(v, Math.min(up, down));
  }
  return v * v * (3 - 2 * v);
};

type Duck = "whoosh" | "boom";
const DUCK_DB: Record<Duck, number> = TL.audio.duck;
type Cue = { id: string; file: string; at: number; peak: number; gainDb: number; duck: Duck };

// Peak offsets (frames @ 60 fps) measured on the downloaded files.
const PEAK: Record<string, number> = { cash: 20, chime: 2, ding: 1, glow: 39, hit: 44, pop: 0, riser: 117, swipe: 4, tick: 0, whoosh: 5 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh"): Cue => ({ id, file: `zen_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck });

const gastar = WORDS.find((w) => w.w.toLowerCase().startsWith("gastar"))!.f;
const imp = K("S01", "importados");
const CUES: Cue[] = [
  // S01 hook: subtle register + whoosh + the PARE hit
  sfx("cash-open", "cash", K("S01", "pare"), -14),
  sfx("hit-pare", "hit", K("S01", "pare"), -2, "boom"),
  sfx("whoosh-gastar", "whoosh", gastar, -8),
  sfx("whoosh-caro", "whoosh", K("S01", "fortunas"), -6),
  ...[0, 5, 10].map((d, i) => sfx(`whoosh-tag${i}`, "swipe", imp + d, -11)),
  ...[26, 30, 34].map((d, i) => sfx(`pop-x${i}`, "pop", imp + d, -8)),
  sfx("whoosh-tags-out", "whoosh", imp + 56, -10),
  // S02 reveal
  sfx("riser-reveal", "riser", K("S02", "segredo") + 80, -12),
  sfx("glow-vidro", "glow", K("S02", "vidro"), -5),
  sfx("tick-preco", "tick", K("S02", "preco"), -6),
  sfx("pop-cem", "pop", K("S02", "cem"), -6),
  // S03
  sfx("chime-zencial", "chime", K("S03", "zencial"), -4),
  sfx("pop-ghk", "pop", K("S03", "ghk1"), -10),
  ...Array.from({ length: 9 }, (_, i) => sfx(`tick-125-${i}`, "tick", K("S03", "n125") + i * 5, -12)),
  sfx("cash-pedidos", "cash", K("S03", "pedidos"), -13),
  // S04
  ...[0, 6, 12].map((d, i) => sfx(`pop-atom${i}`, "pop", K("S04", "peptideo") + d, -9)),
  sfx("glow-cobre", "glow", K("S04", "cobre"), -7),
  sfx("swipe-colageno", "swipe", K("S04", "colageno"), -9),
  sfx("tick-firmeza", "tick", K("S04", "firmeza") + 8, -5),
  // S05 illustrative portrait
  sfx("swipe-light", "swipe", K("S05", "diferenca"), -9),
  sfx("glow-light", "glow", K("S05", "diferenca") + 20, -7),
  sfx("hit-bizarro", "hit", K("S05", "bizarro"), -4, "boom"),
  sfx("glow-finas", "glow", K("S05", "finas"), -8),
  // S06 social proof
  sfx("whoosh-medal", "whoosh", K("S06", "tiktok"), -10),
  sfx("hit-n1", "hit", K("S06", "n1"), -5, "boom"),
  ...Array.from({ length: 12 }, (_, i) => sfx(`tick-av${i}`, "tick", K("S06", "n7") + i * 4, -15)),
  sfx("pop-cart-in", "pop", K("S06", "produto"), -6),
  // S07
  sfx("glow-vico", "glow", K("S07", "vico"), -8),
  sfx("whoosh-bottle", "whoosh", K("S07", "testar"), -8),
  // S08 CTA
  sfx("whoosh-clica", "whoosh", K("S08", "clica"), -10),
  sfx("pop-carrinho", "pop", K("S08", "carrinho"), -3),
  sfx("pop-embaixo", "pop", K("S08", "embaixo1"), -9),
  sfx("hit-agora", "hit", K("S08", "agora"), -2, "boom"),
  sfx("cash-desconto", "cash", K("S08", "desconto"), -11),
  sfx("chime-achou", "chime", K("S08", "achou"), -8),
  // S09 CTA 2
  sfx("pop-link", "pop", K("S09", "link"), -10),
  sfx("pop-comente", "pop", K("S09", "comentar"), -4),
  sfx("pop-euquero", "pop", K("S09", "euquero"), -3),
  sfx("ding-direct", "ding", K("S09", "direct"), -6),
];

export const AudioMix: React.FC = () => (
  <>
    <Audio src={VOICE_SRC} volume={1} />
    {CUES.map((c) => {
      const from = Math.max(0, c.at - c.peak);
      const gain = dbToGain(c.gainDb);
      return (
        <Sequence key={c.id} from={from} durationInFrames={DURATION - from} layout="none" name={`sfx:${c.id}`}>
          <Audio src={staticFile(`sfx/${c.file}`)} volume={(f) => Math.min(1, gain * dbToGain(DUCK_DB[c.duck] * voiced(from + f)))} />
        </Sequence>
      );
    })}
  </>
);
