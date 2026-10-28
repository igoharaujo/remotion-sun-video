// Frame-level chrome: impact shake/zoom/flash (the planet, the red X, the cut back to the speaker),
// the vignette over the space world, and the closing fade.
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { ALERT, DURATION, K, SC, easeIn, prog, spaceAt } from "../tl";

// Impacts: [frame, shake px, zoom, flash, flash colour].
export const IMPACTS: [number, number, number, number, string][] = [
  [K("S01", "explodindo"), 34, 0.07, 0.85, "#FFF1D6"],
  [K("S01", "explodindo") + 14, 14, 0.02, 0, "#fff"],
  [K("S02", "bomba"), 26, 0.05, 0.35, ALERT],
  [K("S03", "jogo"), 10, 0.02, 0.12, "#8AB4F8"],
  [SC.S05.from, 6, 0.03, 0.3, "#FFFFFF"],
  [K("S05", "comenta"), 4, 0.01, 0, "#fff"],
  [K("S05", "n500"), 6, 0.015, 0, "#fff"],
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
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color, opacity: color === ALERT ? o * 0.6 : o, mixBlendMode: "screen" }} /> : null;
};

/** Vignette on the space world; a softer one on the speaker when full screen (overlay ~20% for the type). */
export const Vignette: React.FC = () => {
  const frame = useCurrentFrame();
  const s = spaceAt(frame);
  return (
    <>
      <AbsoluteFill style={{ opacity: s, background: "radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 90%, rgba(0,0,0,0.85) 100%)" }} />
      <AbsoluteFill style={{ opacity: 1 - s, background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 22%, rgba(0,0,0,0.15) 66%, rgba(0,0,0,0.5) 100%)" }} />
    </>
  );
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, DURATION - 24, DURATION - 2, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
