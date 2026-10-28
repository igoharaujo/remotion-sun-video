// The speaker (the jump-cut take): full screen for the hook title, then on "cruzei" it shrinks into a glass
// Picture-in-Picture window over the dark-tech world (right of centre for the rest of the hook, then the top-right
// corner from S02 on), and cuts back to full screen on "comenta" for the CTA. One <OffthreadVideo> carries the
// processed voice; after the last word the final frame is held (muted) under the CTA sign. The footage carries a
// vignette anchored on the face so the type reads against a darker background without dimming the face.
import { Freeze, OffthreadVideo, Sequence, staticFile, useCurrentFrame } from "remotion";
import { CYAN, H, SC, SPEAKER, SPEECH_END, W, WORLD_IN, WORLD_OUT, easeInOut, expOut, mix, prog } from "../tl";

type Rect = { x: number; y: number; w: number };
const FACE = SPEAKER.face;
const FACE_CX = (((FACE.x[0] + FACE.x[1]) / 2 + 20) / W) * 100;
const FACE_CY = (((FACE.y[0] + FACE.y[1]) / 2) / H) * 100;
const FACE_RX = ((FACE.x[1] - FACE.x[0]) / W) * 100 * 1.1;
const FACE_RY = ((FACE.y[1] - FACE.y[0]) / H) * 100 * 0.95;
type State = "full" | "hook" | "corner";
const STATES = SPEAKER.pip.states as unknown as Record<string, Rect>;
const CROP = SPEAKER.pip.crop;

// [frame, state, transition frames]
const KEYS: [number, State, number][] = [
  [0, "full", 1],
  [WORLD_IN, "hook", 22],
  [SC.S02.from, "corner", 30],
  [WORLD_OUT, "full", 10],
];

type Box = { x: number; y: number; w: number; h: number; cx: number; cy: number; cw: number; ch: number; r: number };
const boxOf = (s: State): Box => {
  if (s === "full") return { x: 0, y: 0, w: W, h: H, cx: 0, cy: 0, cw: W, ch: H, r: 0 };
  const r = STATES[s];
  return { x: r.x, y: r.y, w: r.w, h: (r.w * CROP.h) / CROP.w, cx: CROP.x, cy: CROP.y, cw: CROP.w, ch: CROP.h, r: SPEAKER.pip.radius };
};
const lerpBox = (a: Box, b: Box, t: number): Box => Object.fromEntries(Object.keys(a).map((k) => [k, mix(a[k as keyof Box], b[k as keyof Box], t)])) as Box;

export const boxAt = (frame: number): Box => {
  let box = boxOf(KEYS[0][1]);
  for (let i = 1; i < KEYS.length; i++) {
    const [f, s, d] = KEYS[i];
    if (frame < f) break;
    box = lerpBox(box, boxOf(s), prog(frame, f, f + d, s === "full" ? expOut : easeInOut));
  }
  return box;
};
/** 0..1 how "windowed" the speaker is (0 when full screen) — drives the glass frame. */
const framed = (frame: number) => Math.min(prog(frame, WORLD_IN, WORLD_IN + 10), 1 - prog(frame, WORLD_OUT, WORLD_OUT + 10, expOut));

const Video: React.FC<{ muted?: boolean }> = ({ muted }) => <OffthreadVideo src={staticFile("eu_falando_cortado.mp4")} muted={muted} volume={1} style={{ width: "100%", height: "100%" }} />;

export const Speaker: React.FC = () => {
  const frame = useCurrentFrame();
  const b = boxAt(frame);
  const s = b.w / b.cw; // px per source px
  const k = framed(frame);
  return (
    <div
      style={{
        position: "absolute",
        left: b.x,
        top: b.y,
        width: b.w,
        height: b.h,
        borderRadius: b.r,
        overflow: "hidden",
        background: "#000",
        boxShadow: k > 0.01 ? `0 30px 70px rgba(0,0,0,${0.6 * k}), 0 0 0 2px rgba(255,255,255,${0.22 * k}), 0 0 40px ${CYAN}${Math.round(0x44 * k).toString(16).padStart(2, "0")}` : undefined,
      }}
    >
      <div style={{ position: "absolute", left: -b.cx * s, top: -b.cy * s, width: W * s, height: H * s, filter: "contrast(1.08) brightness(0.95)" }}>
        <Sequence durationInFrames={SPEECH_END} layout="none">
          <Video />
        </Sequence>
        <Sequence from={SPEECH_END} layout="none">
          <Freeze frame={SPEECH_END - 2}>
            <Video muted />
          </Freeze>
        </Sequence>
        <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse ${FACE_RX}% ${FACE_RY}% at ${FACE_CX}% ${FACE_CY}%, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0.55) 100%)` }} />
      </div>
      {k > 0.01 && <div style={{ position: "absolute", inset: 0, borderRadius: b.r, background: `linear-gradient(160deg, rgba(255,255,255,${0.1 * k}) 0%, rgba(255,255,255,0) 35%)`, pointerEvents: "none" }} />}
    </div>
  );
};
