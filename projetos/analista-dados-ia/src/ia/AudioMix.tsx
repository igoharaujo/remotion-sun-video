// Freesound SFX only (the voice is the jump-cut take's own track — already cleaned and at -14 LUFS by
// scripts/cut.py — played by the speaker's <OffthreadVideo>; no music). Files are peak-normalised to -1 dBFS
// (scripts/fetch-freesound.mjs), so the gains below are comparable. Every SFX is placed so its peak lands on the
// cue frame (peak offsets measured from the files) and is ducked under the voice: booms -8 dB, everything else -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { CHECKLIST, DURATION, K, SC, SRC, TL, WORDS, WORLD_IN, WORLD_OUT } from "./tl";

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

// Peak offsets (frames @ 60 fps) measured on the downloaded files. The flatline tone and the typing beds start
// on their cue instead (peak 0): they are beds, not hits.
const PEAK: Record<string, number> = { cash: 20, check: 1, ding: 6, error: 1, glitch: 16, impact: 10, levelup: 35, riser: 117, subdrop: 35, suck: 24, typewriter: 0, whoosh: 3 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh", len?: number): Cue => ({ id, file: `dd_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck, len });
const run = (id: string, name: string, from: number, n: number, step: number, gainDb: number) => Array.from({ length: n }, (_, i) => sfx(`${id}${i}`, name, Math.round(from + i * step), gainDb));

// S01 timings shared with hud/S01 (bubbles, the market line, the ECG beats).
const BUB_FROM = K("S01", "mensagens") - 4;
const BUB_STEP = (K("S01", "especialistas") + 30 - BUB_FROM) / 5;
const LINE_FROM = K("S01", "especialistas") + 96;
const ECG_FROM = K("S01", "resposta");
const DEAD = K("S01", "morreu");
const ecgBeats = Array.from({ length: Math.floor((DEAD - ECG_FROM) / 30) }, (_, i) => ECG_FROM + 12 + i * 30).filter((f) => f < DEAD - 4);
// S05 roadmap milestones (hud/S05 Roadmap).
const MAP_AT = K("S05", "mapa") - 4;
const MAP_STEP = Math.round((K("S05", "transicao") + 10 - MAP_AT - 10) / 3);

const CUES: Cue[] = [
  // S01 hook
  sfx("impact-title", "impact", K("S01", "se"), -3, "boom"),
  sfx("sub-title", "subdrop", K("S01", "se"), -6, "boom"),
  sfx("glitch-title", "glitch", K("S01", "se") + 4, -16),
  sfx("whoosh-badge", "whoosh", K("S01", "analista1"), -10),
  sfx("whoosh-pip", "whoosh", WORLD_IN, -8),
  ...Array.from({ length: 5 }, (_, i) => sfx(`pop-bubble${i}`, "pop", Math.round(BUB_FROM + i * BUB_STEP), -16)),
  sfx("blip-grupo", "blip", K("S01", "grupo1"), -14),
  sfx("whoosh-line", "whoosh", LINE_FROM, -12),
  ...[1, 2, 3].map((i) => sfx(`tick-spark${i}`, "tick", LINE_FROM + Math.round(((i + 0.6) / 5) * 50), -12)),
  sfx("blip-map", "blip", K("S01", "americano") - 6, -12),
  ...run("tick-map", "tick", K("S01", "americano"), 6, 10, -22),
  sfx("pop-2026", "pop", K("S01", "n2026"), -10),
  sfx("downer-talvez", "downer", K("S01", "talvez"), -12),
  sfx("pop-ecg", "pop", ECG_FROM, -14),
  ...ecgBeats.map((f, i) => sfx(`ecg${i}`, "ecg", f, -18)),
  sfx("flatline", "flatline", DEAD, -24, "whoosh", SC.S02.from + 10 - DEAD),
  sfx("glitch-morreu", "glitch", DEAD + 4, -8),
  sfx("sub-morreu", "subdrop", DEAD + 4, -10, "boom"),
  // S02 the group
  sfx("whoosh-corner", "whoosh", SC.S02.from, -12),
  sfx("pop-member", "pop", K("S02", "dba") - 10, -12),
  ...run("tick25-", "tick", K("S02", "n25") - 24, 8, 3.5, -20),
  sfx("glitch-crt", "glitch", K("S02", "n97") - 8, -12),
  sfx("typewriter", "typewriter", K("S02", "n97") + 6, -18, "whoosh", K("S02", "acabar1") - 10 - K("S02", "n97") - 6),
  ...run("tick-year", "tick", K("S02", "acabar1"), 10, 4, -20),
  sfx("riser-core", "riser", K("S02", "engoliu"), -14),
  sfx("suck-codigo", "suck", K("S02", "codigo1") + 30, -6),
  sfx("suck-query", "suck", K("S02", "query") + 30, -6),
  sfx("whoosh-copilot", "whoosh", K("S02", "dashboard"), -8),
  sfx("blip-copilot", "blip", K("S02", "dashboard") + 8, -14),
  // S03 the data
  sfx("whoosh-wef", "whoosh", SRC.wefCover.in, -10),
  sfx("blip-wef", "blip", SRC.wefCover.in + 20, -14),
  sfx("whoosh-wefdata", "whoosh", SRC.wefData.in, -10),
  sfx("downer-26", "downer", K("S03", "n50") - 20, -10),
  sfx("pop-41", "pop", K("S03", "operacional") - 10, -10),
  sfx("blip-wefdata", "blip", SRC.wefData.in + 20, -14),
  sfx("whoosh-gartner", "whoosh", SRC.gartner.in, -10),
  ...run("tick60-", "tick", K("S03", "gestor") - 20, 10, 4, -20),
  sfx("blip-gartner", "blip", SRC.gartner.in + 18, -14),
  sfx("whoosh-report", "whoosh", SRC.copilotReport.in - 6, -12),
  sfx("whoosh-pwc", "whoosh", SRC.pwc.in, -10),
  ...run("tick56-", "tick", K("S03", "n59") - 30, 10, 4, -20),
  sfx("cash-pwc", "cash", K("S03", "dolares") + 4, -10),
  sfx("blip-pwc", "blip", SRC.pwc.in + 18, -14),
  sfx("glitch-shatter", "glitch", K("S03", "grafico") + 8, -10),
  sfx("check-hibrido", "check", K("S03", "hibrido1") + 8, -10),
  // S04 the solution
  sfx("riser-mudar", "riser", K("S04", "mudar") - 4, -14),
  sfx("impact-mudar", "impact", K("S04", "mudar") - 4, -8, "boom"),
  sfx("whoosh-checklist", "whoosh", CHECKLIST.in, -8),
  sfx("blip-3pontos", "blip", K("S04", "tres"), -12),
  ...CHECKLIST.rows.flatMap((r, i) => [sfx(`error-row${i}`, "error", r.x.f, -12), sfx(`check-row${i}`, "check", r.check.f, -9)]),
  sfx("whoosh-split", "whoosh", K("S04", "resposta2") - 6, -10),
  sfx("keys-code", "keys", K("S04", "resposta2"), -20, "whoosh", K("S04", "codigo2") + 30 - K("S04", "resposta2")),
  sfx("pop-humano", "pop", K("S04", "humano") - 4, -12),
  sfx("cash-lucro", "cash", K("S04", "lucro"), -5),
  // S05 CTA
  sfx("pop-badge", "pop", K("S05", "analista3") - 10, -12),
  sfx("whoosh-stamp", "whoosh", K("S05", "acabar2") + 6, -12),
  sfx("levelup", "levelup", K("S05", "nivel"), -7),
  ...[0, 1, 2, 3].map((i) => sfx(`blip-road${i}`, "blip", MAP_AT + 10 + i * MAP_STEP, -12)),
  sfx("whoosh-cut", "whoosh", WORLD_OUT, -6),
  sfx("ding-dados", "ding", K("S05", "dados_cta"), -6),
  sfx("pop-mascot", "pop", K("S05", "comenta") + 4, -10),
  sfx("pop-segue", "pop", K("S05", "segue"), -9),
  sfx("ding-segue", "ding", K("S05", "segue") + 6, -12),
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
