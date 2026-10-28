// Frame-level chrome: impact shake/zoom/flash (the hook title slam, the flatline, the checklist X's, the profit
// reveal, the cut back to the speaker), the vignettes, and the closing fade.
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ALERT, CYAN, DURATION, GOLD, K, WORLD_OUT, easeIn, prog, worldAt } from "../tl";

// Impacts: [frame, shake px, zoom, flash, flash colour].
export const IMPACTS: [number, number, number, number, string][] = [
  [K("S01", "se"), 34, 0.07, 0.7, "#FFFFFF"],
  [K("S01", "morreu"), 22, 0.04, 0.35, ALERT],
  [K("S03", "n50"), 10, 0.015, 0, "#fff"],
  [K("S04", "mudar"), 18, 0.04, 0.25, CYAN],
  [K("S04", "arrastar"), 12, 0.02, 0.18, ALERT],
  [K("S04", "sql"), 12, 0.02, 0.18, ALERT],
  [K("S04", "lucro"), 16, 0.03, 0.3, GOLD],
  [K("S05", "subiu"), 8, 0.02, 0.2, GOLD],
  [WORLD_OUT, 8, 0.03, 0.45, "#FFFFFF"],
  [K("S05", "dados_cta"), 6, 0.015, 0, "#fff"],
];

const kick = (frame: number) => {
  let x = 0;
  let y = 0;
  let zoom = 0;
  for (const [f, shake, z] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 40) continue;
    const decay = Math.exp(-d / 6);
    x += shake * decay * (random(`ix-${f}-${d}`) * 2 - 1);
    y += shake * decay * (random(`iy-${f}-${d}`) * 2 - 1);
    zoom += z * Math.exp(-d / 7);
  }
  return { x, y, zoom };
};

export const ShakeLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const k = kick(frame);
  return <AbsoluteFill style={{ transform: `translate(${k.x}px, ${k.y}px) scale(${1 + k.zoom})`, transformOrigin: "50% 40%" }}>{children}</AbsoluteFill>;
};

export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  let o = 0;
  let color = "#fff";
  for (const [f, , , flash, c] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 16 || !flash) continue;
    const v = flash * (d < 2 ? 1 : Math.exp(-(d - 1) / 3.5));
    if (v > o) [o, color] = [v, c];
  }
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color, opacity: color === "#FFFFFF" ? o : o * 0.6, mixBlendMode: "screen" }} /> : null;
};

/** Vignette on the 3D world; a top/bottom shade on the speaker when full screen (so the title and captions read). */
export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const s = worldAt(frame);
  return (
    <>
      <AbsoluteFill style={{ opacity: s, background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 90%, rgba(0,0,0,0.8) 100%)" }} />
      <AbsoluteFill style={{ opacity: 1 - s, background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 30%, rgba(0,0,0,0.1) 62%, rgba(0,0,0,0.55) 100%)" }} />
    </>
  );
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, DURATION - 24, DURATION - 2, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
