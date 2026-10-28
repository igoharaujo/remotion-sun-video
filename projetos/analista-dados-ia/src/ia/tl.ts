// Typed access to timeline.json: every cue frame, PiP state and layout zone of AnalistaDadosIA comes from there.
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
export const SRC = timeline.sources;
export const CHECKLIST = timeline.checklist;
/** Last frame of speech: the cut take ends here, the rest is the CTA hold on a frozen frame. */
export const SPEECH_END = DURATION - 84;

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

/** Speaker full screen in the hook until "cruzei", and again from "comenta" in the CTA. */
export const WORLD_IN = K("S01", "cruzei") - 6;
export const WORLD_OUT = K("S05", "comenta") - 4;
/** 0..1: the dark-tech world is on screen. */
export const worldAt = (frame: number) => Math.min(prog(frame, WORLD_IN, WORLD_IN + 14, easeOut), 1 - prog(frame, WORLD_OUT, WORLD_OUT + 8, easeIn));
/** 0..1 lights down: "talvez você não queira ouvir" to the end of the hook, and the serious data scene. */
export const dimAt = (frame: number) => Math.max(win(frame, K("S01", "talvez") - 10, SC.S02.from + 20, 40, 30), win(frame, SC.S03.from - 10, SC.S04.from + 10, 40, 24));

// Palette.
const P = timeline.palette;
export const BG = P.bg;
export const INK = P.ink;
export const MUTED = P.muted;
export const CYAN = P.cyan;
export const BLUE = P.blue;
export const GOOD = P.good;
export const ALERT = P.alert;
export const GOLD = P.gold;
