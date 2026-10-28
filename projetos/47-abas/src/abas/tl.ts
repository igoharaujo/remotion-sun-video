// Typed access to timeline.json: every cue frame in the 47 Abas video comes from there.
import { Easing, interpolate, random } from "remotion";
import timeline from "../../timeline.json";

export const TL = timeline;
export const { width: W, height: H, fps: FPS, durationInFrames: DURATION } = timeline.composition;

export type SceneId = "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09";
type Scene = (typeof timeline.scenes)[number];

export const scene = (id: SceneId): Scene => {
  const s = timeline.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`timeline.json: missing scene "${id}"`);
  return s;
};

/** Frame of a key beat inside a scene. */
export const K = (id: SceneId, beat: string): number => {
  const v = (scene(id).keyBeats as Record<string, number | undefined>)[beat];
  if (typeof v !== "number") throw new Error(`timeline.json: scene "${id}" has no key beat "${beat}"`);
  return v;
};

export const SC = Object.fromEntries(timeline.scenes.map((s) => [s.id, { from: s.from, to: s.to }])) as Record<SceneId, { from: number; to: number }>;
/** [from, to] of a scene's [short pause]. */
export const PAUSE = (id: SceneId) => {
  const p = (scene(id) as { pause?: number[] }).pause;
  if (!p) throw new Error(`timeline.json: scene "${id}" has no pause`);
  return p as [number, number];
};

export const WORDS = timeline.voice.words;
export const SAFE = timeline.layout.safeZone;
export const CAPTION_Y = timeline.layout.captions.y;
export const VIZ = timeline.layout.visualizer;
export const FADE_OUT = scene("S09").fadeOut as [number, number];

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.7));
export const expOut = Easing.out(Easing.exp);

/** Eased 0..1 progress of `frame` through [from, to]. */
export const prog = (frame: number, from: number, to: number, easing = easeOut) =>
  interpolate(frame, [from, to], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 0..1 window: fades in over `fin` frames from `from`, out over `fout` frames before `to`. */
export const win = (frame: number, from: number, to: number, fin = 12, fout = 12) =>
  Math.min(prog(frame, from, from + fin), 1 - prog(frame, to - fout, to, easeIn));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Decaying 0..1 kick after `at` (1 on the frame, e-folding over `tau` frames). */
export const kickAt = (frame: number, at: number, tau = 8) => (frame >= at ? Math.exp(-(frame - at) / tau) : 0);

// Visual energy per emotional tag (drives drift speed and camera sway).
const ENERGY: Record<string, number> = {
  curious: 0.35,
  conversational: 0.25,
  "matter-of-fact": 0.5,
  serious: 0.15,
  impactful: 1.0,
};

/** Smoothed energy at `frame`, blended over 20 frames at each scene change. */
export const energyAt = (frame: number) => {
  let e = ENERGY[timeline.scenes[0].tag];
  for (const s of timeline.scenes) e = mix(e, ENERGY[s.tag], prog(frame, s.from - 10, s.from + 10, easeInOut));
  return e;
};

// ---- the PC "choking" (S06 from "lento" through the S07 freeze) ------------------------------------
const LENTO = K("S06", "lento");
const FREEZE = PAUSE("S07")[0];
const BLACKOUT = PAUSE("S07")[1];

/**
 * Motion clock for everything that "runs on the PC": real frame until "lento", then held in steps
 * (the screen stutters: 3–9 frame holds), frozen solid from the S07 pause, real again after it.
 */
export const stutterFrame = (frame: number) => {
  if (frame < LENTO || frame >= BLACKOUT) return frame;
  if (frame >= FREEZE) return FREEZE;
  // Hold length shrinks into the zoo explosion so the stutter speeds up with the multiplication.
  let f = LENTO;
  let i = 0;
  while (true) {
    const hold = 3 + Math.floor(random(`hold-${i}`) * 7);
    const run = 3 + Math.floor(random(`run-${i}`) * 5);
    if (frame < f + run) return frame;
    if (frame < f + run + hold) return f + run - 1;
    f += run + hold;
    i++;
  }
};
/** 1 on the frames the stutter is holding (drives the RGB-split glitch). */
export const isStuck = (frame: number) => (frame >= LENTO && frame < BLACKOUT && stutterFrame(frame) !== frame ? 1 : 0);

/** 0..1 hook darkness: black open, a faint lift on "Você", full studio light on "47". */
export const hookDarkAt = (frame: number) => mix(1, 0.75, prog(frame, K("S01", "voce"), K("S01", "voce") + 30)) * (1 - prog(frame, K("S01", "n47") - 2, K("S01", "n47") + 10, expOut));

/** 0..1 blackout at the end of the S07 freeze (the overloaded screen dies). */
export const blackoutAt = (frame: number) => (frame < BLACKOUT ? prog(frame, BLACKOUT - 14, BLACKOUT - 2, easeIn) : 1 - prog(frame, BLACKOUT, BLACKOUT + 10));

/** 0..1 "lights down": the serious line, partly the climax. */
export const dimAt = (frame: number) => Math.max(win(frame, SC.S04.from - 10, SC.S04.to + 30, 40, 50), 0.5 * win(frame, SC.S06.from, SC.S07.to, 30, 10));

// Palette (Apple Keynote / premium tech UI).
const P = timeline.palette;
export const STAGE = P.stage;
export const STAGE_HI = P.stageHi;
export const BLUE = P.chrome;
export const BLUE_GLOW = P.chromeGlow;
export const INK = P.ink;
export const MUTED = P.muted;
export const ALERT = P.alert;
export const SPOT = P.spot;
