// Frame-level chrome: impact shake/zoom/flash on the hard beats, and the closing fade.
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { BLUE, DURATION, K, easeIn, prog } from "../tl";

// Impacts: [frame, shake px, zoom, flash, flash colour].
export const IMPACTS: [number, number, number, number, string][] = [
  [K("S01", "preguicoso"), 12, 0.02, 0.18, "#FFFFFF"],
  [K("S01", "viciado"), 6, 0.01, 0, "#fff"],
  [K("S03", "bate"), 14, 0.02, 0, "#fff"],
  [K("S03", "bate") + 22, 8, 0.01, 0, "#fff"],
  [K("S04", "agora"), 24, 0.05, 0.35, "#FFFFFF"],
  [K("S04", "me"), 4, 0.01, 0, "#fff"],
];

const kick = (frame: number) => {
  let x = 0;
  let y = 0;
  let zoom = 0;
  for (const [f, shake, z] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 30) continue;
    const decay = Math.exp(-d / 5);
    x += shake * decay * (random(`ix-${f}-${d}`) * 2 - 1);
    y += shake * decay * (random(`iy-${f}-${d}`) * 2 - 1);
    zoom += z * Math.exp(-d / 6);
  }
  return { x, y, zoom };
};

export const ShakeLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const k = kick(frame);
  return <AbsoluteFill style={{ transform: `translate(${k.x}px, ${k.y}px) scale(${1 + k.zoom})`, transformOrigin: "50% 45%" }}>{children}</AbsoluteFill>;
};

export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  let o = 0;
  let color = "#fff";
  for (const [f, , , flash, c] of IMPACTS) {
    const d = frame - f;
    if (d < 0 || d > 14 || !flash) continue;
    const v = flash * (d < 2 ? 1 : Math.exp(-(d - 1) / 3));
    if (v > o) [o, color] = [v, c];
  }
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: color === BLUE ? BLUE : color, opacity: o, mixBlendMode: "screen" }} /> : null;
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const o = prog(frame, DURATION - 24, DURATION - 2, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
