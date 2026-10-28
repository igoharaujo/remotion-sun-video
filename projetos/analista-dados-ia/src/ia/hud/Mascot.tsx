// The chameleon as a 2.5D sprite in CSS: the trimmed PNG on a plane with perspective, springing between
// the bottom corners (timeline.json mascot.keys), bobbing and swaying in 3D, leaning into moves,
// squash-popping and cross-fading on each pose swap. Bottom-right corner only, never over the face.
import { Img, spring, staticFile, useCurrentFrame } from "remotion";
import meta from "../../../public/avatar/trim/meta.json";
import { FPS, MASCOT, easeIn, mix, prog } from "../tl";

const FILES = {
  neutral: "main-removebg-preview.png",
  shocked: "shocked.png",
  hyped: "hyped.png",
  pointing: "pointing-removebg-preview.png",
  skeptical: "skeptical.png",
  tired: "tired.png",
} as const;
type Pose = keyof typeof FILES;
type Key = { f: number; pose: Pose; x: number; y: number; flip?: boolean };
const KEYS = MASCOT.keys as Key[];

const META = meta as Record<string, { width: number; height: number; aspect: number; srcHeight: number }>;
// On-screen height of the neutral pose; others scale by how much of their source frame the character
// fills, so sprites exported at different resolutions keep one size.
const frac = (f: string) => META[f].height / META[f].srcHeight;
const heightOf = (p: Pose) => (MASCOT.heightPx * frac(FILES[p])) / frac(FILES.neutral);

const MOVE = { damping: 12, stiffness: 95, mass: 0.9 };
const POP = { damping: 8, stiffness: 160, mass: 0.6 };
const springAt = (frame: number, from: number, config: typeof MOVE) => (frame < from ? 0 : spring({ frame: frame - from, fps: FPS, config }));
const ENTRY_Y = 2150; // below the frame: the first key bounces up from here
const DROP = 12; // frames to fall out of frame before a corner change
// A move to the other corner would sweep across the face (it reaches the bottom of the frame), so it
// changes sides off-screen: drops out of its corner, then bounces up in the other one.
const crosses = (a: Key, b: Key) => Math.sign(a.x - 540) !== Math.sign(b.x - 540);

const posAt = (frame: number) => {
  let x = KEYS[0].x;
  let y = ENTRY_Y;
  let flip = 1;
  KEYS.forEach((k, i) => {
    const next = KEYS[i + 1];
    if (frame < k.f) return;
    const m = springAt(frame, k.f, MOVE);
    const cross = i > 0 && crosses(KEYS[i - 1], k);
    x = cross ? k.x : mix(x, k.x, m);
    y = mix(cross ? ENTRY_Y : y, k.y, m);
    flip = mix(flip, k.flip ? -1 : 1, m);
    // Falling out before the next key, if that one is in the other corner.
    if (next && crosses(k, next)) y = mix(y, ENTRY_Y, prog(frame, next.f - DROP, next.f, easeIn));
  });
  return { x, y, flip };
};

export const Mascot: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < KEYS[0].f) return null;
  const t = frame / FPS;
  const { x, y, flip } = posAt(frame);
  const vx = x - posAt(frame - 1).x;
  const idx = KEYS.reduce((n, k, i) => (frame >= k.f ? i : n), 0);
  const cur = KEYS[idx];
  const prev = KEYS[Math.max(0, idx - 1)];
  const swap = Math.min(1, (frame - cur.f) / 6);
  const pop = springAt(frame, cur.f, POP);
  const tired = cur.pose === "tired";
  // Float: bob + 3D sway; lean into horizontal moves; buzz when tired.
  const bob = 10 * Math.sin(t * 2.2) + 4 * Math.sin(t * 3.7 + 1);
  const buzz = tired ? 3 * Math.sin(t * 95) : 0;
  const rotY = 16 * Math.sin(t * 0.9) + 6 * Math.sin(t * 1.7 + 2);
  const rotX = 4 * Math.sin(t * 1.3 + 0.5);
  const lean = Math.max(-18, Math.min(18, vx * 0.9));
  const rotZ = 3 * Math.sin(t * 1.1) + lean + (tired ? 2 * Math.sin(t * 77) : 0);
  const sq = 0.8 + 0.2 * pop;
  const layers: [Pose, number][] = swap < 1 && prev.pose !== cur.pose ? [[prev.pose, 1 - swap], [cur.pose, swap]] : [[cur.pose, 1]];
  return (
    <div style={{ position: "absolute", left: x + buzz, top: y + bob, width: 0, height: 0, perspective: 900 }}>
      <div style={{ transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`, transformStyle: "preserve-3d" }}>
        {layers.map(([p, o]) => {
          const h = heightOf(p);
          const w = h * META[FILES[p]].aspect;
          return (
            <Img
              key={p}
              src={staticFile(`avatar/trim/${FILES[p]}`)}
              style={{
                position: "absolute",
                left: -w / 2,
                top: -h / 2,
                width: w,
                height: h,
                opacity: o,
                // Squash-pop anchored at the feet.
                transform: `scale(${flip * (2 - sq)}, ${sq})`,
                transformOrigin: "50% 100%",
                filter: "drop-shadow(0 16px 18px rgba(0,0,0,0.45))",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
