// Sound design bed under the voice. The voice itself plays from the PiP's
// OffthreadVideo at unity gain; everything here ducks while it speaks.
// v2 adds the motion-pass layers (impacts, tick trains, HUD blips, reveal, fly-bys),
// all timed from timeline.json `motion`.
import { Audio, Sequence, interpolate, staticFile } from "remotion";
import { DURATION, T } from "./timeline";

const dbToGain = (db: number) => Math.pow(10, db / 20);
const { duckDb, attackFrames, releaseFrames } = T.audio.ducking;

// 0 when silent, 1 while a phrase is spoken, with attack/release ramps.
const voiced = (frame: number) => {
  let v = 0;
  for (const p of T.voice.phrases) {
    if (frame < p.from - attackFrames || frame > p.to + releaseFrames) continue;
    const a = interpolate(frame, [p.from - attackFrames, p.from], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const r = interpolate(frame, [p.to, p.to + releaseFrames], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    v = Math.max(v, Math.min(a, r));
  }
  return v * v * (3 - 2 * v);
};

/** Gain under the voice; `depth` < 1 lets accents (impacts) punch through more. */
const duck = (frame: number, depth = 1) => dbToGain(duckDb * depth * voiced(frame));

type Cue = { id: string; file: string; from: number; to?: number; gainDb: number; fadeIn?: number; fadeOut?: number; duckDepth?: number };

const M = T.motion;

const BED: Cue[] = T.audio.sfx.map((s) => ({
  id: s.id,
  file: s.file.replace(/^public\//, ""),
  from: "at" in s ? (s.at as number) : (s.from as number),
  to: "to" in s ? (s.to as number) : undefined,
  gainDb: s.gainDb,
  fadeIn: "fadeInFrames" in s ? (s.fadeInFrames as number) : 0,
  fadeOut: "fadeOutFrames" in s ? (s.fadeOutFrames as number) : 0,
}));

const MOTION: Cue[] = [
  // One hit per impact frame that shakes or flashes; louder flash = louder hit.
  ...M.impacts
    .filter((im) => im.shake > 0 || im.flash >= 0.45)
    .map((im) => ({ id: `impact-${im.f}`, file: "sfx/impact.wav", from: im.f, gainDb: -9 + 8 * im.flash, duckDepth: 0.4 })),
  { id: "reveal", file: "sfx/reveal.wav", from: M.impacts[0].f - 30, gainDb: -10, duckDepth: 0.6 },
  { id: "odometer", file: "sfx/odometer_ticks.wav", from: M.hookTimer.rollFrom, gainDb: -15, duckDepth: 0.5 },
  { id: "hud-on", file: "sfx/hud_on.wav", from: M.speedometer.in, gainDb: -14, duckDepth: 0.5 },
  { id: "speedo", file: "sfx/speedo_ticks.wav", from: M.speedometer.countFrom, gainDb: -13, duckDepth: 0.5 },
  { id: "hud-off", file: "sfx/hud_off.wav", from: M.speedometer.out, gainDb: -15, duckDepth: 0.5 },
  { id: "plane", file: "sfx/plane_flyby.wav", from: M.flightPath.fly[0], gainDb: -12, duckDepth: 0.7 },
];

export const AudioMix: React.FC = () => (
  <>
    {[...BED, ...MOTION].map((s) => {
      const to = s.to ?? DURATION;
      const gain = dbToGain(s.gainDb);
      return (
        <Sequence key={s.id} from={s.from} durationInFrames={to - s.from} layout="none" name={`sfx:${s.id}`}>
          <Audio
            src={staticFile(s.file)}
            volume={(f) => {
              const abs = s.from + f;
              const env =
                (s.fadeIn ? interpolate(f, [0, s.fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1) *
                (s.fadeOut ? interpolate(abs, [to - s.fadeOut, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1);
              return Math.min(1, gain * env * duck(abs, s.duckDepth ?? 1));
            }}
          />
        </Sequence>
      );
    })}
  </>
);
