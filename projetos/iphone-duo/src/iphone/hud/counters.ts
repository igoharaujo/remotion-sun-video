// The hook's two counters. Visuals and the tick SFX both read these, so each tick lands on a digit change.
import { Easing } from "remotion";
import { DURATION, K, prog } from "../tl";

const ease = Easing.out(Easing.quad);
export const LAYERS_ROLL = { from: K("s01_layers", "dez"), frames: 26, to: 10 };
export const PARTS_ROLL = { from: K("s01_layers", "cem"), frames: 34, to: 100 };

export const rollValue = (frame: number, r: { from: number; frames: number; to: number }) =>
  Math.round(r.to * prog(frame, r.from, r.from + r.frames, ease));

/** Frames where the shown value changes (every `step` units, to keep the 0-100 roll from buzzing). */
export const tickFrames = (r: { from: number; frames: number; to: number }, step = 1) => {
  const out: number[] = [];
  let last = 0;
  for (let f = r.from; f <= Math.min(DURATION, r.from + r.frames); f++) {
    const v = Math.floor(rollValue(f, r) / step);
    if (v !== last) out.push(f);
    last = v;
  }
  return out;
};
