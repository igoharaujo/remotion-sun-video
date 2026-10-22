// Impact frames from timeline.json motion.impacts: a 1-2 frame white flash, a zoom punch
// and a decaying camera shake on the 3D + HUD layers (the PiP window stays steady).
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { T } from "../timeline";

const IMPACTS = T.motion.impacts;

const kick = (frame: number) => {
  let x = 0;
  let y = 0;
  let zoom = 0;
  for (const im of IMPACTS) {
    const d = frame - im.f;
    if (d < 0 || d > 24) continue;
    const decay = Math.exp(-d / 4.5);
    x += im.shake * decay * (random(`shx-${im.f}-${d}`) * 2 - 1);
    y += im.shake * decay * (random(`shy-${im.f}-${d}`) * 2 - 1);
    zoom += im.zoom * Math.exp(-d / 5);
  }
  return { x, y, zoom };
};

export const ShakeLayer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const k = kick(frame);
  return (
    <AbsoluteFill style={{ transform: `translate(${k.x}px, ${k.y}px) scale(${1 + k.zoom})`, transformOrigin: "50% 42%" }}>
      {children}
    </AbsoluteFill>
  );
};

export const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  let o = 0;
  for (const im of IMPACTS) {
    const d = frame - im.f;
    if (d < 0 || d > 10 || !im.flash) continue;
    // Frames 0 and 1 are the impact frames; the rest is a quick tail.
    o = Math.max(o, im.flash * (d === 0 ? 1 : d === 1 ? 0.6 : 0.6 * Math.exp(-(d - 1) / 2)));
  }
  return o > 0.003 ? <AbsoluteFill style={{ backgroundColor: "#fff", opacity: o }} /> : null;
};
