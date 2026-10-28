// Voice (untouched, unity gain) + Freesound SFX only — no music by request.
// Every SFX is placed so its peak lands on the cue frame (peak offsets measured from the files).
// Ducking under the voice: booms -8 dB, everything else -3 dB. The PC fan is a continuous bed
// that swells from "PC" into the zoo and dies with the blackout.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { VOICE_SRC } from "./hud/Chrome";
import { HOOK_ARRIVALS, MULTIPLY } from "./three/field";
import { DURATION, K, PAUSE, SC, TL, WORDS } from "./tl";

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
const PEAK: Record<string, number> = { click: 0, ding: 2, glitch: 15, glitch_long: 36, impact: 0, keys: 0, pop: 1, whoosh: 3 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh", len?: number): Cue => ({ id, file: `abas_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck, len });

const n47 = K("S01", "n47");
const close = K("S03", "closeTab");
const [freeze, blackout] = PAUSE("S07");
const zoo = K("S07", "zoologico");
const zooEnd = K("S07", "aberto2") + 15;
const shop = K("S08", "shopping");
// Accelerating pops through the zoo (gaps shrink 16 → 3 frames).
const ZOO_POPS: number[] = [];
for (let t = zoo - 10, gap = 16; t < zooEnd; t += gap, gap = Math.max(3, gap * 0.82)) ZOO_POPS.push(Math.round(t));
// Rapid clicks while the S08 tab strip squeezes.
const SHOP_CLICKS: number[] = [];
for (let t = shop, gap = 9; t < shop + 70; t += gap, gap = Math.max(3, gap * 0.85)) SHOP_CLICKS.push(Math.round(t));

const CUES: Cue[] = [
  // S01 hook: whoosh + deep hit on "47", clicks as the windows land, hit on "problema"
  sfx("whoosh-47", "whoosh", n47 - 4, -4),
  sfx("impact-47", "impact", n47, -2, "boom"),
  ...HOOK_ARRIVALS.filter((_, i) => i % 4 === 0).map((a, i) => sfx(`click-land${i}`, "click", a + 10, -16)),
  sfx("impact-problema", "impact", K("S01", "problema"), -3, "boom"),
  // S02 hero windows
  sfx("click-pesquisa", "click", K("S02", "pesquisa") - 4, -7),
  ...[0, 5, 10].map((d, i) => sfx(`click-tres${i}`, "click", K("S02", "tres") + d, -9)),
  ...[0, 6].map((d, i) => sfx(`click-duas${i}`, "click", K("S02", "duas") + d, -9)),
  sfx("whoosh-overlap", "whoosh", K("S02", "site"), -16),
  sfx("pop-toast", "pop", K("S02", "esqueceu"), -10),
  // S03
  sfx("click-receita", "click", K("S03", "receita") - 4, -7),
  sfx("click-docs", "click", K("S03", "docs") - 4, -7),
  sfx("click-close", "click", close, -3),
  ...[0, 6, 11].map((d, i) => sfx(`pop-trio${i}`, "pop", MULTIPLY + d, -7)),
  // S04 the hover that never clicks
  sfx("click-hover", "click", K("S04", "fecha") + 2, -20),
  // S05
  sfx("glitch-metade", "glitch", K("S05", "metade"), -12),
  // S06 the choking PC
  sfx("glitch-lento", "glitch", K("S06", "lento"), -7),
  sfx("glitch-stutter", "glitch", K("S06", "lento") + 40, -13),
  sfx("impact-windows", "impact", K("S06", "windows"), -8, "boom"),
  // S07 the zoo
  sfx("whoosh-pullback", "whoosh", K("S07", "enquanto"), -8),
  sfx("impact-zoo", "impact", zoo, -2, "boom"),
  ...ZOO_POPS.map((t, i) => sfx(`pop-zoo${i}`, "pop", t, -12 + Math.min(4, i * 0.3))),
  sfx("glitch-long-zoo", "glitch_long", zoo + 24, -10),
  sfx("glitch-freeze", "glitch", freeze + 2, -6),
  // S08
  sfx("whoosh-plane", "whoosh", K("S08", "manda") + 20, -6),
  ...SHOP_CLICKS.map((t, i) => sfx(`click-shop${i}`, "click", t, -14)),
  // S09 CTA
  sfx("ding-comenta", "ding", K("S09", "comenta"), -6),
  sfx("keys-typing", "keys", K("S09", "quantas") - 2, -12, "whoosh", K("S09", "agora") + 16 - K("S09", "quantas")),
  sfx("ding-mentir", "ding", K("S09", "mentir") + 26, -8),
];

// PC fan bed: -24 dB at "PC", swelling to -12 dB at the end of the zoo, ducked 4 dB under the voice, cut dead at the blackout.
const FAN_FROM = K("S06", "pc") - 10;
const fanDb = (frame: number) =>
  interpolate(frame, [FAN_FROM, FAN_FROM + 30, zoo, zooEnd], [-48, -24, -17, -12], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) - 4 * voiced(frame);

export const AudioMix: React.FC = () => (
  <>
    <Audio src={VOICE_SRC} volume={1} />
    <Sequence from={FAN_FROM} durationInFrames={blackout - 12 - FAN_FROM} layout="none" name="sfx:fan">
      <Audio src={staticFile("sfx/abas_fan.wav")} volume={(f) => dbToGain(fanDb(FAN_FROM + f))} />
    </Sequence>
    {CUES.map((c) => {
      const from = Math.max(0, c.at - c.peak);
      const gain = dbToGain(c.gainDb);
      const len = c.len ?? Math.min(DURATION, SC.S09.to) - from;
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
