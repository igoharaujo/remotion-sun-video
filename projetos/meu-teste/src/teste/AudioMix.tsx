// Freesound SFX only (the voice is the footage's own track, played untouched by <OffthreadVideo>; no music).
// Every SFX is placed so its peak lands on the cue frame (peak offsets measured from the files) and is
// ducked under the voice: booms -8 dB, everything else -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
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
const DUCK_DB: Record<Duck, number> = { whoosh: TL.audio.duck.whoosh, boom: TL.audio.duck.boom };
type Cue = { id: string; file: string; at: number; peak: number; gainDb: number; duck: Duck; len?: number };

// Peak offsets (frames @ 60 fps) measured on the downloaded files.
const PEAK: Record<string, number> = { check: 0, clock: 0, ding: 2, error: 6, heartbeat: 5, impact: 0, pageflip: 10, pop: 1, riser: 117, spin: 9, tick: 0, whoosh: 3 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh", len?: number): Cue => ({ id, file: `teste_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck, len });

const CUES: Cue[] = [
  // S01
  sfx("whoosh-preguicoso", "whoosh", K("S01", "preguicoso") - 2, -10),
  sfx("impact-preguicoso", "impact", K("S01", "preguicoso"), -14, "boom"),
  sfx("whoosh-mascot-in", "whoosh", K("S01", "viciado") - 8, -12),
  sfx("pop-viciado", "pop", K("S01", "viciado"), -7),
  sfx("riser-dopamina", "riser", K("S01", "dopamina") + 40, -12),
  sfx("whoosh-cal-in", "whoosh", K("S01", "deixar"), -8),
  sfx("whoosh-cal-out", "whoosh", K("S01", "amanha1") + 22, -10),
  // S02
  sfx("tick-cerebro", "tick", K("S02", "cerebro"), -12),
  sfx("pop-planejar", "pop", K("S02", "planejar"), -8),
  sfx("check-1", "check", K("S02", "feito"), -8),
  sfx("check-2", "check", K("S02", "feito") + 12, -8),
  sfx("error-esforco", "error", K("S02", "esforco"), -9),
  // S03
  sfx("pageflip-amanha", "pageflip", K("S03", "amanha2"), -5),
  sfx("pop-ansiedade", "pop", K("S03", "ansiedade"), -10),
  sfx("heart-bate", "heartbeat", K("S03", "bate"), -3, "boom"),
  sfx("spin-ciclo", "spin", K("S03", "ciclo") + 6, -8),
  // S04
  sfx("ding-regra", "ding", K("S04", "regra"), -10),
  sfx("pop-dois", "pop", K("S04", "dois"), -9),
  sfx("clock-dois", "clock", K("S04", "dois"), -12, "whoosh", K("S04", "agora") - K("S04", "dois")),
  sfx("impact-agora", "impact", K("S04", "agora"), -3, "boom"),
  sfx("pop-me", "pop", K("S04", "me"), -7),
  sfx("ding-conta", "ding", K("S04", "conta"), -5),
];

export const AudioMix: React.FC = () => (
  <>
    {CUES.map((c) => {
      const from = Math.max(0, c.at - c.peak);
      const gain = dbToGain(c.gainDb);
      const len = c.len ?? DURATION - from;
      return (
        <Sequence key={c.id} from={from} durationInFrames={len} layout="none" name={`sfx:${c.id}`}>
          <Audio
            src={staticFile(`sfx/${c.file}`)}
            volume={(f) => Math.min(1, gain * dbToGain(DUCK_DB[c.duck] * voiced(from + f))) * (c.len ? interpolate(f, [c.len - 10, c.len], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1)}
          />
        </Sequence>
      );
    })}
  </>
);
