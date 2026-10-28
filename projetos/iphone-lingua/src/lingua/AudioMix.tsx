// Voice (untouched, unity gain) + Freesound SFX + the synthesized pad.
// Every SFX is placed so its peak lands on the cue word (peak offsets measured from the files).
// Ducking under the voice: booms -8 dB, everything else (whooshes, ticks, pad...) -3 dB.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { FRONT_SWIPES, TREND_TICKS, ACCIDENT_SWIPE } from "./hud/Scenes";
import { SETTINGS_BEATS as B } from "./hud/Settings";
import { VOICE_SRC } from "./hud/Chrome";
import { DURATION, K, SC, WORDS } from "./tl";

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
type Cue = { id: string; file: string; at: number; peak?: number; gainDb: number; duck?: Duck; to?: number; fadeIn?: number; fadeOut?: number };

// Peak offsets (frames @ 60 fps) measured on the downloaded files.
const PEAK: Record<string, number> = { boot: 6, alert: 8, chime: 26, error: 25, flip: 12, focus: 20, glitch: 16, lock: 3, riser: 117, sparkle: 84, swipe: 4, toggle: 8, boom: 2 };
const sfx = (id: string, name: string, at: number, gainDb: number, duck: Duck = "whoosh"): Cue => ({ id, file: `lng_${name}.wav`, at, peak: PEAK[name] ?? 0, gainDb, duck });

const touch = K("S03", "sem tocar");
const enc = K("S07", "encostar");
const CUES: Cue[] = [
  // S01 hook
  sfx("boot", "boot", 4, -8),
  sfx("scan-ler", "scan", K("S01", "ler"), -10),
  sfx("pop-lingua", "pop", K("S01", "língua"), -5),
  sfx("swipe-h1", "swipe", K("S01", "língua") + 8, -10),
  sfx("swipe-h2", "swipe", K("S01", "língua") + 30, -12),
  // S02
  sfx("flip-in", "flip", K("S02", "pegadinha"), -9),
  sfx("flip-turn", "flip", K("S02", "pegadinha") + 44, -8),
  sfx("stamp", "stamp", K("S02", "oficial"), -5),
  sfx("shimmer-26", "shimmer", K("S02", "iOS 26"), -9),
  // S03
  sfx("lock", "lock", K("S03", "Rastreamento de Cabeça"), -8),
  ...[12, 24, 36].map((d, i) => sfx(`tick-ro${i}`, "tick", K("S03", "Rastreamento de Cabeça") + d, -14)),
  sfx("pop-access", "pop", K("S03", "Apple") + 60, -10),
  sfx("pop-hand", "pop", K("S03", "limitações motoras"), -10),
  sfx("tap-touch", "tap", touch, -6),
  sfx("error-touch", "error", touch + 14, -9),
  // S04
  sfx("impact-mas", "impact", SC.S04.from, -3, "boom"),
  sfx("riser-trend", "riser", K("S04", "trend mundial"), -11),
  sfx("boom-trend", "boom", K("S04", "trend mundial"), -1, "boom"),
  ...TREND_TICKS(K("S04", "trend mundial")).map((f, i) => sfx(`tick-tr${i}`, "tick", f, -15)),
  // S05 tutorial
  sfx("swipe-phone-in", "swipe", SC.S05.from + 6, -12),
  sfx("lock-ajustes", "lock", K("S05", "Ajustes"), -13),
  sfx("tap-a", "tap", B.tapA, -5),
  sfx("swipe-push-a", "swipe", B.tapA + 10, -17),
  sfx("tap-b", "tap", B.tapB, -5),
  sfx("swipe-push-b", "swipe", B.tapB + 10, -17),
  sfx("toggle", "toggle", B.toggle + 3, -3),
  sfx("tap-gesture", "tap", B.gesture, -5),
  sfx("pop-check", "pop", B.action + 6, -7),
  // S06 – S07
  sfx("swipe-lift", "swipe", K("S06", "celular"), -14),
  sfx("scan-rosto", "scan", K("S06", "rosto"), -10),
  sfx("riser-payoff", "riser", K("S07", "passar"), -9),
  sfx("impact-passar", "impact", K("S07", "passar"), -2, "boom"),
  ...FRONT_SWIPES.map((f, i) => sfx(`swipe-f${i}`, "swipe", f, -7)),
  sfx("error-finger", "error", enc + 18, -10),
  sfx("focus", "focus", K("S07", "câmera frontal"), -8),
  ...Array.from({ length: 8 }, (_, i) => sfx(`tick-lm${i}`, "tick", K("S07", "detecta") + i * 10, -16)),
  sfx("lock-real", "lock", K("S07", "tempo real"), -10),
  // S08
  sfx("alert-smile", "alert", K("S08", "sorrir") + 10, -9),
  sfx("glitch", "glitch", K("S08", "comando"), -4),
  sfx("swipe-accident", "swipe", ACCIDENT_SWIPE, -10),
  sfx("impact-comando", "impact", K("S08", "comando"), -12, "boom"),
  // S09
  sfx("shimmer-absurda", "shimmer", K("S09", "absurda"), -11),
  sfx("sparkle", "sparkle", K("S09", "mágica"), -5),
  sfx("chime-end", "chime", K("S09", "mágica") + 40, -11),
  { id: "pad", file: "lng_drone.wav", at: 0, to: DURATION, gainDb: -24, duck: "whoosh", fadeIn: 60, fadeOut: 120 },
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
              return Math.min(1, gain * env * dbToGain(DUCK_DB[c.duck ?? "whoosh"] * voiced(abs)));
            }}
          />
        </Sequence>
      );
    })}
  </>
);
