// Typed access to timeline-iphone.json: every cue frame in the iPhone Duo video comes from there.
import { Easing, interpolate } from "remotion";
import timeline from "../../timeline-iphone.json";

export const TL = timeline;
export const { width: W, height: H, fps: FPS, durationInFrames: DURATION } = timeline.composition;

type Scene = (typeof timeline.scenes)[number];
export type SceneId =
  | "s01_layers"
  | "s02_oled_ignite"
  | "s03_self_emissive"
  | "s04_no_backlight"
  | "s05a_not_only"
  | "s05_glass_titanium"
  | "s06_glue_book"
  | "s07_hinge_assembly"
  | "s08_teardrop"
  | "s09_stress"
  | "s10_thinner"
  | "s11_absurd"
  | "s12_price";

export const scene = (id: SceneId): Scene => {
  const s = timeline.scenes.find((x) => x.id === id);
  if (!s) throw new Error(`timeline-iphone.json: missing scene "${id}"`);
  return s;
};

/** Frame of a key beat (the spoken word's onset) inside a scene. */
export const K = (id: SceneId, beat: string): number => {
  const v = (scene(id).keyBeats as unknown as Record<string, number | number[] | undefined>)[beat];
  if (typeof v !== "number") throw new Error(`timeline-iphone.json: scene "${id}" has no beat "${beat}"`);
  return v;
};

export const SC = Object.fromEntries(timeline.scenes.map((s) => [s.id, { from: s.from, to: s.to }])) as Record<
  SceneId,
  { from: number; to: number }
>;

export const WORDS = timeline.voice.words;
export const SAFE = timeline.layout.safeZone;
export const CAPTION_Y = timeline.layout.captions.y;
export const VIZ = timeline.layout.audioVisualizerHUD.box;
export const CONCEPT = timeline.approval.conceptTag;

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
  serious: 0.3,
  impactful: 1.0,
};

/** Smoothed energy at `frame`, blended over 20 frames at each scene change. */
export const energyAt = (frame: number) => {
  let e = ENERGY[timeline.scenes[0].tag];
  for (const s of timeline.scenes) e = mix(e, ENERGY[s.tag], prog(frame, s.from - 10, s.from + 10, easeInOut));
  return e;
};

// Palette.
export const TITANIUM = "#C0C0C0";
export const OLED_BLUE = "#00A8FF";
export const WARM = "#FFF5E0";
export const AMBER = "#FFB347";
export const STRESS_RED = "#FF3B3B";
export const STRESS_GREEN = "#3BFF9A";
