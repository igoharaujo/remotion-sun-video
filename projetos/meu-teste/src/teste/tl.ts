// Typed access to timeline.json: every cue frame and layout zone of the MeuTeste video comes from there.
import { Easing, interpolate } from "remotion";
import timeline from "../../timeline.json";

export const TL = timeline;
export const { width: W, height: H, fps: FPS, durationInFrames: DURATION } = timeline.composition;

export type SceneId = "S01" | "S02" | "S03" | "S04";

const scene = (id: SceneId) => {
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

export const WORDS = timeline.voice.words;
export const LAYOUT = timeline.layout;
export const SAFE = timeline.layout.safeZone;
export const FACE = timeline.layout.face;
export const HUD_Y = timeline.layout.hud.y;
export const CAPTION_Y = timeline.layout.captions.y;
export const MASCOT = timeline.mascot;

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

/** 0..1 "lights down" for the serious line (overlay 20% -> 38%, heavier push-in). */
export const seriousAt = (frame: number) => win(frame, SC.S03.from - 10, SC.S03.to + 10, 30, 30);

// Palette (Apple Keynote / dark tech over the real footage).
const P = timeline.palette;
export const INK = P.ink;
export const MUTED = P.muted;
export const BLUE = P.blue;
export const BLUE_GLOW = P.blueGlow;
export const ALERT = P.alert;
export const GOLD = P.gold;
export const GLASS_BG = P.glass;
