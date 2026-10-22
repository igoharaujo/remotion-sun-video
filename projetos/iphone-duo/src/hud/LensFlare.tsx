// Lens flare riding the photon: anamorphic streak, star cross and ghosts mirrored
// through the frame centre. Positions come from projecting the 3D photon.
import { useCurrentFrame } from "remotion";
import * as THREE from "three";
import { easeIn, easeInOut, easeOut, mix, prog } from "../timeline";
import { BEAM_X0, BEAM_X1, JOURNEY, SUN_POS, project } from "../three/layout";
import { SAFE_CLIP } from "./style";

const GHOSTS = [
  { k: 0.45, r: 16, color: "rgba(255,210,140,0.30)" },
  { k: 0.8, r: 40, color: "rgba(120,220,255,0.14)" },
  { k: 1.15, r: 24, color: "rgba(190,140,255,0.18)" },
  { k: 1.5, r: 64, color: "rgba(255,180,90,0.10)" },
  { k: 1.85, r: 12, color: "rgba(140,255,220,0.25)" },
];

export const LensFlare: React.FC = () => {
  const frame = useCurrentFrame();
  const { depart, arrive } = JOURNEY;
  const on = prog(frame, depart, depart + 8, easeOut) * (1 - prog(frame, arrive, arrive + 22, easeIn));
  if (on <= 0) return null;
  const head = prog(frame, depart, arrive, easeInOut);
  const p = project(new THREE.Vector3(mix(BEAM_X0, BEAM_X1, head), SUN_POS.y, 0.05), frame);
  const flicker = 0.9 + 0.1 * Math.sin(frame * 1.7) * Math.sin(frame * 0.63);
  const a = on * flicker;
  const cx = 540;
  const cy = 960;
  return (
    <div style={{ position: "absolute", inset: 0, clipPath: SAFE_CLIP, mixBlendMode: "screen", pointerEvents: "none" }}>
      {/* anamorphic streak */}
      <div
        style={{
          position: "absolute",
          left: p.x - 380,
          top: p.y - 3,
          width: 760,
          height: 6,
          borderRadius: 6,
          background: "linear-gradient(90deg, rgba(120,190,255,0) 0%, rgba(150,210,255,0.55) 35%, rgba(255,250,235,1) 50%, rgba(150,210,255,0.55) 65%, rgba(120,190,255,0) 100%)",
          filter: "blur(1.5px)",
          opacity: a,
        }}
      />
      {/* star cross */}
      <div
        style={{
          position: "absolute",
          left: p.x - 1.5,
          top: p.y - 90,
          width: 3,
          height: 180,
          background: "linear-gradient(180deg, rgba(255,240,210,0) 0%, rgba(255,240,210,0.8) 50%, rgba(255,240,210,0) 100%)",
          opacity: a * 0.8,
        }}
      />
      {/* core bloom */}
      <div
        style={{
          position: "absolute",
          left: p.x - 60,
          top: p.y - 60,
          width: 120,
          height: 120,
          borderRadius: 120,
          background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,215,140,0.45) 25%, rgba(255,160,60,0) 70%)",
          opacity: a,
        }}
      />
      {/* ghosts along the line through the frame centre */}
      {GHOSTS.map((g, i) => {
        const gx = p.x + (cx - p.x) * g.k * 2;
        const gy = p.y + (cy - p.y) * g.k * 2;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: gx - g.r,
              top: gy - g.r,
              width: g.r * 2,
              height: g.r * 2,
              borderRadius: g.r * 2,
              background: `radial-gradient(circle, ${g.color} 0%, ${g.color} 55%, rgba(0,0,0,0) 72%)`,
              boxShadow: `0 0 0 1px ${g.color}`,
              opacity: a,
            }}
          />
        );
      })}
    </div>
  );
};
