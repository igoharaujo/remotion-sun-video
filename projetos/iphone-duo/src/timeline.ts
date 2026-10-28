// Typed access to timeline.json: every frame number in the video comes from there.
import { Easing, interpolate } from "remotion";
import timeline from "../timeline.json";

export const T = timeline;
export const { width: W, height: H, fps: FPS, durationInFrames: DURATION } = timeline.composition;

const beat = (id: string) => {
  const b = timeline.beats.find((x) => x.id === id);
  if (!b) throw new Error(`timeline.json: missing beat "${id}"`);
  return b;
};

/** Frame of the event in `beatId` whose description starts with `prefix`. */
export const ev = (beatId: string, prefix: string) => {
  const e = beat(beatId).events.find((x) => x.what.startsWith(prefix));
  if (!e) throw new Error(`timeline.json: beat "${beatId}" has no event "${prefix}"`);
  return { f: e.f, until: "until" in e ? (e.until as number) : undefined };
};

export const BEAT = {
  hook: beat("hook"),
  explanation: beat("explanation"),
  journey: beat("journey"),
  payoff: beat("payoff"),
  end: beat("end"),
};

export const PIP = timeline.layout.pip;
export const S3D = timeline.layout.scene3d;
export const SAFE = timeline.safeZone;

export const easeOut = Easing.out(Easing.cubic);
export const easeIn = Easing.in(Easing.cubic);
export const easeInOut = Easing.inOut(Easing.cubic);

/** Eased 0..1 progress of `frame` through [from, to]; never linear. */
export const prog = (frame: number, from: number, to: number, easing = easeOut) =>
  interpolate(frame, [from, to], [0, 1], { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
