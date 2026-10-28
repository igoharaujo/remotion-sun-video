// Typed access to timeline.json: every cue frame in the iPhone Língua video comes from there.
import { Easing, interpolate } from "remotion";
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

/** Frame of a key word's onset inside a scene. */
export const K = (id: SceneId, word: string): number => {
  const v = (scene(id).keyWords as Record<string, number | undefined>)[word];
  if (typeof v !== "number") throw new Error(`timeline.json: scene "${id}" has no key word "${word}"`);
  return v;
};

export const SC = Object.fromEntries(timeline.scenes.map((s) => [s.id, { from: s.from, to: s.to }])) as Record<SceneId, { from: number; to: number }>;

export const WORDS = timeline.voice.words;
export const SAFE = timeline.layout.safeZone;
export const CAPTION_Y = timeline.layout.captions.y;
export const VIZ = timeline.layout.audioVisualizerHUD.box;
export const FACE_Y = timeline.layout.faceCenterY;

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);
export const backOut = Easing.out(Easing.back(1.7));

/** Eased 0..1 progress of `frame` through [from, to]. */
export const prog = (frame: number, from: number, to: number, easing = easeOut) =>
  interpolate(frame, [from, to], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/** 0..1 window: fades in over `fin` frames from `from`, out over `fout` frames before `to`. */
export const win = (frame: number, from: number, to: number, fin = 12, fout = 12) =>
  Math.min(prog(frame, from, from + fin), 1 - prog(frame, to - fout, to, easeIn));

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// Visual energy per emotional tag (drives drift speed, glow and camera sway).
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

/** 0..1 "lights down" amount for the serious scene. */
export const darkAt = (frame: number) => win(frame, SC.S08.from - 10, SC.S08.to + 10, 30, 30);

// Palette.
export const BG = timeline.palette.bg;
export const BLUE = timeline.palette.iosBlue;
export const GREEN = timeline.palette.neonGreen;
export const WHITE = timeline.palette.white;
export const AMBER = timeline.palette.warn;
export const RED = timeline.palette.alert;
