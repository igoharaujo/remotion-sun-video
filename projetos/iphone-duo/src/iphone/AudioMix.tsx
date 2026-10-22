// Voice (untouched, unity gain) + Freesound SFX + the synthesized drone.
// Every SFX is placed so its peak lands on the cue word (peak offsets measured from the files).
// Ducking under the voice: booms -8 dB, everything else (whooshes, ticks, drone...) -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { COIN_BOUNCES } from "./hud/ScenesB";
import { LAYERS_ROLL, PARTS_ROLL, tickFrames } from "./hud/counters";
import { VOICE_SRC } from "./hud/Chrome";
import { DURATION, K, WORDS } from "./tl";

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
const DUCK_DB: Record<Duck, number> = { whoosh: -3, boom: -8 };
type Cue = { id: string; file: string; at: number; peak?: number; gainDb: number; duck: Duck; to?: number; fadeIn?: number; fadeOut?: number };

// Peak offsets (frames @ 60 fps) measured with ffmpeg astats on the downloaded files.
const PEAK = { chime: 45, ratchet: 11, riser: 117, boomLow: 43, boom: 2, shing: 11, whoosh: 22, swoosh: 13 };

const CUES: Cue[] = [
  ...tickFrames(LAYERS_ROLL).map((f, i) => ({ id: `tick-l${i}`, file: "iph_tick.wav", at: f, gainDb: -10, duck: "whoosh" as Duck })),
  ...tickFrames(PARTS_ROLL, 5).map((f, i) => ({ id: `tick-p${i}`, file: "iph_tick.wav", at: f, gainDb: -12, duck: "whoosh" as Duck })),
  // The chime swells for 0.75 s; start it on the word so the bloom and the attack coincide.
  { id: "chime", file: "iph_chime.wav", at: K("s02_oled_ignite", "OLED") - 4, gainDb: -13, duck: "whoosh" },
  { id: "sparkle", file: "iph_sparkle.wav", at: K("s03_self_emissive", "própria luz"), gainDb: -9, duck: "whoosh" },
  { id: "power-off", file: "iph_power_off.wav", at: K("s04_no_backlight", "backlight"), gainDb: -6, duck: "whoosh" },
  { id: "shing-glass", file: "iph_shing.wav", at: K("s05_glass_titanium", "vidros"), peak: PEAK.shing, gainDb: -13, duck: "whoosh" },
  { id: "shing-ti", file: "iph_shing.wav", at: K("s05_glass_titanium", "titânio"), peak: PEAK.shing, gainDb: -9, duck: "whoosh" },
  { id: "whoosh-slide", file: "iph_whoosh.wav", at: K("s06_glue_book", "deslizarem"), peak: PEAK.whoosh, gainDb: -8, duck: "whoosh" },
  { id: "ratchet", file: "iph_ratchet.wav", at: K("s07_hinge_assembly", "dobradiça"), peak: PEAK.ratchet, gainDb: -9, duck: "whoosh" },
  { id: "riser", file: "iph_riser.wav", at: K("s08_teardrop", "raio"), peak: PEAK.riser, gainDb: -12, duck: "whoosh" },
  { id: "boom-tension", file: "iph_boom_low.wav", at: K("s09_stress", "tensão"), peak: PEAK.boomLow, gainDb: -1, duck: "boom" },
  { id: "swoosh-fina", file: "iph_swoosh.wav", at: K("s10_thinner", "mais fina"), peak: PEAK.swoosh, gainDb: -12, duck: "whoosh" },
  { id: "swoosh-ruga", file: "iph_swoosh.wav", at: K("s10_thinner", "menos ruga"), peak: PEAK.swoosh, gainDb: -14, duck: "whoosh" },
  { id: "boom-absurda", file: "iph_boom.wav", at: K("s11_absurd", "absurda"), peak: PEAK.boom, gainDb: 0, duck: "boom" },
  ...COIN_BOUNCES(K("s12_price", "coinLand")).map((f, i) => ({ id: `coin-${i}`, file: "iph_coin.wav", at: f, gainDb: [-6, -13, -19][i], duck: "whoosh" as Duck })),
  { id: "drone", file: "iph_drone.wav", at: 0, to: DURATION, gainDb: -24, duck: "whoosh", fadeIn: 60, fadeOut: 60 },
];

export const AudioMix: React.FC = () => (
  <>
    <Audio src={VOICE_SRC} volume={1} />
    {CUES.map((c) => {
      const from = Math.max(0, c.at - (c.peak ?? 0));
      const to = c.to ?? DURATION;
      const gain = dbToGain(c.gainDb);
      return (
        <Sequence key={c.id} from={from} durationInFrames={to - from} layout="none" name={`sfx:${c.id}`}>
          <Audio
            src={staticFile(`sfx/${c.file}`)}
            volume={(f) => {
              const abs = from + f;
              const env =
                (c.fadeIn ? interpolate(f, [0, c.fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1) *
                (c.fadeOut ? interpolate(abs, [to - c.fadeOut, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1);
              return Math.min(1, gain * env * dbToGain(DUCK_DB[c.duck] * voiced(abs)));
            }}
          />
        </Sequence>
      );
    })}
  </>
);
