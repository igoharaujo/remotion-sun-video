// Typed access to timeline.json: every cue frame, PiP state and layout zone of CincoDiasIA comes from there.
import { Easing, interpolate } from "remotion";
import timeline from "../../timeline.json";

export const TL = timeline;
export const { width: W, height: H, fps: FPS, durationInFrames: DURATION } = timeline.composition;

export type SceneId = "S01" | "S02" | "S03" | "S04" | "S05";

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
export const SAFE = timeline.layout.safeZone;
export const CAPTION_Y = timeline.layout.captions.y;
export const HUD_Y = timeline.layout.hud.y;
export const SPEAKER = timeline.speaker;
export const MASCOT = timeline.mascot;
export const EGGS = Object.fromEntries(timeline.easterEggs.map((e) => [e.id, e])) as unknown as Record<"terminal" | "skill", { from: number; to: number }>;
/** Last frame of speech: the cut take ends here, the rest is the CTA hold on a frozen frame. */
export const SPEECH_END = SC.S05.to - 84;

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

/** 0..1: the space world is on screen (fades out for the CTA, where the screen goes back to the speaker). */
export const spaceAt = (frame: number) => 1 - prog(frame, SC.S05.from - 4, SC.S05.from + 6, easeIn);
/** 0..1 lights down for the serious tip. */
export const dimAt = (frame: number) => win(frame, SC.S04.from - 20, SC.S04.to + 10, 40, 20);

// Palette.
const P = timeline.palette;
export const SPACE = P.space;
export const INK = P.ink;
export const MUTED = P.muted;
export const BLUE = P.blue;
export const BLUE_GLOW = P.blueGlow;
export const VIOLET = P.violet;
export const FIRE = P.fire;
export const ALERT = P.alert;
export const GOLD = P.gold;
