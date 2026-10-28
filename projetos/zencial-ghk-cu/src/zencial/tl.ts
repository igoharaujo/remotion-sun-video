// Typed access to timeline.json: every cue frame in the Zencial GHK-Cu video comes from there.
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
export const CAPTION_Y = timeline.layout.captions.y;
export const VIZ = timeline.layout.visualizer;
export const CART = timeline.layout.cart;
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

// Visual energy per emotional tag (drives drift speed, particle speed and camera sway).
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

/** 0..1 hook darkness: the stage opens black and the warm spotlight switches on at "Pare". */
export const hookDarkAt = (frame: number) => 1 - prog(frame, K("S01", "pare"), K("S01", "pare") + 22, expOut);

/** 0..1 "lights down" for the serious scene. */
export const dimAt = (frame: number) => win(frame, SC.S06.from - 10, SC.S06.to + 10, 40, 40);

// Palette (Apple Keynote stage).
const P = timeline.palette;
export const STAGE = P.stage;
export const STAGE_HI = P.stageHi;
export const GOLD = P.gold;
export const GOLD_DEEP = P.goldDeep; // champagne gold that reads on the dark stage
export const RED = P.urgent;
export const INK = P.ink;
export const MUTED = P.muted;
export const SERUM = P.serumBlue;
export const CART_YELLOW = P.cartYellow;
export const SPOT_WARM = P.spotWarm;
export const SPOT_COOL = P.spotCool;
