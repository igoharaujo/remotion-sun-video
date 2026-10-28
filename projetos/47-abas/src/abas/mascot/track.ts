// The mascot's choreography: which sprite, where on screen, how far from the lens — as spring-driven
// moves between timeline keys. Pure functions of the frame (shared by the 3D sprite and the DOF amount).
import { spring } from "remotion";
import { FPS, K, PAUSE, SC, mix } from "../tl";

export const POSES = {
  neutral: "main-removebg-preview.png",
  shocked: "shocked.png",
  hyped: "hyped.png",
  pointing: "pointing-removebg-preview.png",
  skeptical: "skeptical.png",
  tired: "tired.png",
} as const;
export type Pose = keyof typeof POSES;

/**
 * A key: from frame `f` the mascot springs to screen centre (sx, sy) at `d` world units from the lens.
 * `pose` swaps the sprite (with a squash-pop), `flip` mirrors it (the pointing pose points left; flipped, right).
 */
type Key = { f: number; sx: number; sy: number; d: number; pose?: Pose; flip?: boolean };

const n47 = K("S01", "n47");
const prob = K("S01", "problema");
const close = K("S03", "closeTab");
const lento = K("S06", "lento");
const quantas = K("S09", "quantas");

export const KEYS: Key[] = [
  // Hook: bounces up from below the frame on "47", shocked; flies right up to the lens for "um problema".
  { f: n47 - 6, sx: 560, sy: 1190, d: 10.5, pose: "shocked" },
  { f: prob - 40, sx: 540, sy: 1790, d: 2.5 },
  // "Olha só": backs off and floats round the hero windows, pointing at them.
  // (the pose swaps once it has backed off: a cross-fade of two lens-filling sprites ghosts)
  { f: PAUSE("S01")[1] - 8, sx: 820, sy: 1200, d: 12 },
  { f: K("S02", "olha") + 10, sx: 820, sy: 1200, d: 12, pose: "pointing" },
  { f: K("S02", "tres") - 4, sx: 265, sy: 1215, d: 12, flip: true },
  { f: K("S02", "duas") - 4, sx: 820, sy: 1230, d: 12, flip: false },
  { f: K("S03", "receita") - 26, sx: 265, sy: 1220, d: 12, pose: "neutral" },
  { f: K("S03", "google") - 8, sx: 820, sy: 1230, d: 12, pose: "pointing" },
  { f: close + 18, sx: 820, sy: 1215, d: 11.5, pose: "shocked" },
  // "E o pior": arms crossed under the tab strip.
  { f: SC.S04.from, sx: 540, sy: 1215, d: 11, pose: "skeptical" },
  { f: SC.S05.from, sx: 800, sy: 1225, d: 12, pose: "neutral" },
  // PC lento: tired and vibrating — a heavy push in, then it slumps beside the choking monitor.
  { f: SC.S06.from, sx: 540, sy: 900, d: 7, pose: "tired" },
  { f: lento - 2, sx: 250, sy: 1175, d: 13 },
  // Zoo: shocked again in the flood of tabs.
  { f: K("S07", "enquanto"), sx: 540, sy: 1265, d: 12, pose: "shocked" },
  // Share + shopping center.
  { f: SC.S08.from, sx: 820, sy: 1190, d: 12, pose: "pointing" },
  { f: K("S08", "chrome") - 6, sx: 850, sy: 1310, d: 13.5 },
  // CTA: hyped, flies to the lens under the typed question.
  { f: K("S09", "comenta") - 6, sx: 540, sy: 1250, d: 11, pose: "hyped" },
  { f: quantas - 8, sx: 540, sy: 1960, d: 2.5 },
];

// Spring feel: lively overshoot for screen moves, a calmer one for depth (no punching through the lens).
const MOVE = { damping: 12, stiffness: 95, mass: 0.9 };
const DEPTH = { damping: 18, stiffness: 70, mass: 1 };
const POP = { damping: 8, stiffness: 160, mass: 0.6 };

const springAt = (frame: number, from: number, config: typeof MOVE) => (frame < from ? 0 : spring({ frame: frame - from, fps: FPS, config }));

export type MascotPose = {
  visible: boolean;
  sx: number;
  sy: number;
  d: number;
  pose: Pose;
  prevPose: Pose;
  swap: number; // 0..1 cross-fade from prevPose to pose
  pop: number; // squash-pop spring 0..1 (1 = settled)
  flip: number; // -1 mirrored .. 1 normal (springs through 0 for a card-turn)
  shake: number;
  vx: number; // screen velocity (px/frame), for leaning into moves
};

const ENTRY_SY = 2700; // below the frame: the hook bounce starts here

const raw = (frame: number) => {
  let sx = KEYS[0].sx;
  let sy = ENTRY_SY;
  let d = KEYS[0].d;
  let flipFrom = 1;
  let flipTo = 1;
  let flipAt = 0;
  for (const k of KEYS) {
    if (frame < k.f) break;
    const m = springAt(frame, k.f, MOVE);
    const z = springAt(frame, k.f, DEPTH);
    sx = mix(sx, k.sx, m);
    sy = mix(sy, k.sy, m);
    d = mix(d, k.d, z);
    if (k.flip !== undefined) {
      flipFrom = flipTo;
      flipTo = k.flip ? -1 : 1;
      flipAt = k.f;
    }
  }
  const flip = mix(flipFrom, flipTo, springAt(frame, flipAt, MOVE));
  return { sx, sy, d, flip };
};

export const mascotAt = (frame: number): MascotPose => {
  const r = raw(frame);
  const posed = KEYS.filter((k) => k.pose && frame >= k.f);
  const cur = posed[posed.length - 1];
  const prev = posed[posed.length - 2] ?? cur;
  const curF = cur?.f ?? 0;
  return {
    visible: frame >= KEYS[0].f,
    ...r,
    pose: cur?.pose ?? "shocked",
    prevPose: prev?.pose ?? "shocked",
    swap: Math.min(1, Math.max(0, (frame - curF) / 6)),
    pop: springAt(frame, curF, POP),
    // Vibration only while the tired pose is on.
    shake: cur?.pose === "tired" ? 1 : 0,
    vx: r.sx - raw(frame - 1).sx,
  };
};

/** Lens-closeness → background defocus (0 beyond ~5.5 units, full at ~2.5). */
export const dofAt = (frame: number) => {
  const d = mascotAt(frame).d;
  return Math.max(0, Math.min(1, (5.5 - d) / 3));
};

