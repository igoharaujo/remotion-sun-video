// Freesound SFX only (the voice is the jump-cut take's own track — already cleaned and at -14 LUFS by
// scripts/cut.py — played by the speaker's <OffthreadVideo>; no music).
// Every SFX is placed so its peak lands on the cue frame (peak offsets measured from the files) and is
// ducked under the voice: booms -8 dB, everything else -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { DURATION, EGGS, K, SC, TL, WORDS } from "./tl";

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
const PEAK: Record<string, number> = { chime: 12, ding: 2, error: 6, explosion: 4, glitch: 15, impact: 0, keys: 0, meteor: 1, pop: 1, riser: 117, rumble: 141, thud: 0, tick: 0, unlock: 6, vhs: 0, whoosh: 3 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh", len?: number): Cue => ({ id, file: `ia_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck, len });
const run = (id: string, name: string, from: number, n: number, step: number, gainDb: number) => Array.from({ length: n }, (_, i) => sfx(`${id}${i}`, name, from + i * step, gainDb));

const boom = K("S01", "explodindo");
const CUES: Cue[] = [
  // S01 hook
  sfx("glitch-horrivel", "glitch", K("S01", "horrivel"), -8),
  sfx("whoosh-meteor", "whoosh", K("S01", "meteorIn"), -10),
  sfx("meteor", "meteor", boom - 92, -6),
  sfx("explosion", "explosion", boom, -1, "boom"),
  sfx("impact-boom", "impact", boom, -6, "boom"),
  sfx("rumble", "rumble", boom + 150, -12, "boom"),
  sfx("pop-codigo", "pop", K("S01", "codigo1"), -10),
  sfx("pop-ia", "pop", K("S01", "ia"), -10),
  // S02 the bad proof
  sfx("whoosh-pip", "whoosh", SC.S02.from, -12),
  ...run("tick46-", "tick", K("S02", "n46") - 8, 8, 5, -15),
  ...run("tick70-", "tick", K("S02", "automatizei"), 12, 6, -15),
  sfx("glitch-boneco", "glitch", K("S02", "boneco"), -5),
  sfx("vhs", "vhs", K("S02", "boneco") - 6, -16, "whoosh", K("S02", "licao") - K("S02", "boneco")),
  sfx("impact-x", "impact", K("S02", "bomba"), -2, "boom"),
  sfx("glitch-x", "glitch", K("S02", "bomba") + 2, -6),
  sfx("chime-licao", "chime", K("S02", "licao"), -8),
  sfx("error-ruim", "error", K("S02", "ruim"), -10),
  // S03 tools -> agent
  ...[0, 1, 2, 3].map((i) => sfx(`whoosh-win${i}`, "whoosh", K("S03", "dia2") + i * 12, -12)),
  ...[0, 1, 2, 3].map((i) => sfx(`thud-stack${i}`, "thud", K("S03", "empilhar") + i * 5 + 18, -9)),
  sfx("glitch-virou", "glitch", K("S03", "jogo"), -6),
  sfx("pop-dia3", "pop", K("S03", "dia3"), -10),
  sfx("error-mao", "error", K("S03", "mao") + 6, -12),
  sfx("keys-terminal", "keys", EGGS.terminal.from, -12, "whoosh", SC.S03.to - EGGS.terminal.from),
  // S04 the rules file
  sfx("riser-semana", "riser", K("S04", "semana") + 20, -13),
  sfx("error-prompt", "error", K("S04", "prompt") + 6, -8),
  sfx("whoosh-editor", "whoosh", K("S04", "arquivo") - 4, -10),
  sfx("tick-skill", "tick", EGGS.skill.from, -6),
  // S05 CTA
  sfx("whoosh-cut", "whoosh", SC.S05.from, -6),
  sfx("ding-comenta", "ding", K("S05", "comenta"), -4),
  sfx("pop-mascot", "pop", K("S05", "comenta") + 4, -10),
  ...run("tick500-", "tick", K("S05", "n500"), 7, 7, -15),
  sfx("pop-hyped", "pop", K("S05", "n500"), -9),
  sfx("unlock", "unlock", K("S05", "abro") + 12, -6),
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
