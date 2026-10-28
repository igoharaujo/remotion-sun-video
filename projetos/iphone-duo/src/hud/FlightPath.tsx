// "um avião comercial daria a volta no mundo": a dashed orbit around Earth with a glowing
// airplane lapping it ~3 times. Tracks Earth's on-screen position through the camera move.
import { Easing, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { T, easeIn, easeInOut, easeOut, mix, prog } from "../timeline";
import { EARTH_POS, R_EARTH, project } from "../three/layout";
import { CYAN, GOLD, MONO, ORBITRON, SAFE_CLIP, glow } from "./style";

const F = T.motion.flightPath;
const TILT = (F.tiltDeg * Math.PI) / 180;
const START = -Math.PI * 0.6;
const BASE_PX_PER_UNIT = 960 / (10 * Math.tan(Math.PI / 9)); // pxPerUnit at camera z = 10

export const FlightPath: React.FC = () => {
  const frame = useCurrentFrame();
  const end = F.out + 14;
  if (frame < F.in || frame >= end) return null;
  const e = project(new THREE.Vector3(EARTH_POS.x, EARTH_POS.y, 0), frame);
  const k = e.pxPerUnit / BASE_PX_PER_UNIT;
  const rEarth = R_EARTH * e.pxPerUnit;
  const rx = F.rx * k;
  const ry = F.ry * k;
  const pt = (a: number) => {
    const lx = rx * Math.cos(a);
    const ly = ry * Math.sin(a);
    return {
      x: e.x + lx * Math.cos(TILT) - ly * Math.sin(TILT),
      y: e.y + lx * Math.sin(TILT) + ly * Math.cos(TILT),
      behind: Math.sin(a) < 0, // upper half of the ellipse is the far side
    };
  };
  const poly = (a0: number, a1: number, n = 90) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const p = pt(mix(a0, a1, i / n));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const enter = prog(frame, F.in, F.in + 10, easeOut);
  const exit = prog(frame, F.out, end, easeIn);
  const drawn = prog(frame, F.drawOn[0], F.drawOn[1], easeOut);
  const fly = prog(frame, F.fly[0], F.fly[1], easeInOut);
  const a = START + fly * F.loops * Math.PI * 2;
  const plane = pt(a);
  const ahead = pt(a + 0.02);
  const heading = Math.atan2(ahead.y - plane.y, ahead.x - plane.x);
  const hidden = plane.behind && Math.hypot(plane.x - e.x, plane.y - e.y) < rEarth * 1.05;
  const flying = frame >= F.fly[0];
  const lap = Math.min(3, Math.floor(fly * F.loops) + 1);
  const labelPop = frame >= F.labelAt ? Math.exp(-(frame - F.labelAt) / 10) : 0;
  const bigLabel = frame >= F.labelAt;
  const labelIn = prog(frame, F.labelAt, F.labelAt + 9, Easing.out(Easing.back(2)));

  return (
    <div style={{ position: "absolute", inset: 0, opacity: enter * (1 - exit), clipPath: SAFE_CLIP }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <filter id="fpGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <polyline points={poly(START, START + drawn * Math.PI * 2)} fill="none" stroke={CYAN} strokeOpacity={0.75} strokeWidth={2.2} strokeDasharray="7 9" />
        {/* light trail behind the plane: fading segments */}
        {flying
          ? Array.from({ length: 14 }, (_, i) => {
              const a1 = a - i * 0.07;
              const a0 = a1 - 0.07;
              return (
                <polyline key={i} points={poly(a0, a1, 4)} fill="none" stroke={GOLD} strokeWidth={4 - i * 0.22} strokeOpacity={(1 - i / 14) * 0.9} strokeLinecap="round" filter="url(#fpGlow)" />
              );
            })
          : null}
        {flying && !hidden ? (
          <g transform={`translate(${plane.x} ${plane.y}) rotate(${(heading * 180) / Math.PI}) scale(${plane.behind ? 0.8 : 1.05})`} filter="url(#fpGlow)" opacity={plane.behind ? 0.7 : 1}>
            {/* airplane silhouette, nose to +x */}
            <path d="M 13 0 L 4 -2 L -2 -11 L -5 -11 L -2 -2 L -9 -2 L -12 -6 L -14 -6 L -12 0 L -14 6 L -12 6 L -9 2 L -2 2 L -5 11 L -2 11 L 4 2 Z" fill="#fff" />
          </g>
        ) : null}
      </svg>
      {/* lap counter, then the payoff label on "3 vezes" */}
      <div
        style={{
          position: "absolute",
          // Keep the label clear of the action bar (x > 960).
          left: Math.min(e.x - 150, T.safeZone.rightActionBarX - 310),
          width: 300,
          top: e.y - ry - 104,
          textAlign: "center",
        }}
      >
        {bigLabel ? (
          <div
            style={{
              fontFamily: ORBITRON,
              fontWeight: 900,
              fontSize: 40,
              color: GOLD,
              textShadow: glow("rgba(255,197,77,0.9)", 0.35 + 0.65 * labelPop),
              opacity: Math.min(1, labelIn * 1.4),
              transform: `scale(${mix(0.4, 1, labelIn) * (1 + 0.2 * labelPop)})`,
            }}
          >
            ≈ 3 VOLTAS
          </div>
        ) : flying ? (
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: CYAN, textShadow: glow("rgba(127,231,255,0.7)", 0.3) }}>
            VOLTA {lap}
          </div>
        ) : null}
      </div>
    </div>
  );
};
