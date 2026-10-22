// "300.000 km/s" as a sci-fi speedometer: semicircular gauge under the beam, glowing ticks
// that light up behind a fast needle, a digital readout locked into the dial, and speed lines.
import { Easing, random, useCurrentFrame } from "remotion";
import { T, easeIn, easeOut, mix, prog } from "../timeline";
import { CYAN, GOLD, MONO, ORBITRON, SAFE_CLIP, WARM, glow, scanlines } from "./style";

const S = T.motion.speedometer;
const [CX, CY] = S.center;
const R = S.radius;
const TICKS = 35; // one per 10 000 km/s up to 350 000
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");

// q in 0..1 -> point on the upper semicircle (left = 0, right = max).
const polar = (q: number, r: number) => {
  const a = Math.PI + q * Math.PI;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};
const arcPath = (q0: number, q1: number, r: number) => {
  const [x0, y0] = polar(q0, r);
  const [x1, y1] = polar(q1, r);
  return `M ${x0} ${y0} A ${r} ${r} 0 ${q1 - q0 > 1 ? 1 : 0} 1 ${x1} ${y1}`;
};

export const Speedometer: React.FC = () => {
  const frame = useCurrentFrame();
  const end = S.out + S.exitFrames;
  if (frame < S.in || frame >= end) return null;
  const enter = prog(frame, S.in, S.in + 14, easeOut);
  const exit = prog(frame, S.out, end, easeIn);
  // Needle/readout: overshoots past 300k then settles, with jitter that dies down.
  const c = prog(frame, S.countFrom, S.countTo, Easing.out(Easing.back(1.5)));
  const settle = prog(frame, S.countFrom, S.countTo + 20, easeOut);
  const jitter = (random(`needle-${frame}`) - 0.5) * 0.02 * (1 - settle);
  const qTarget = S.valueKmS / S.maxKmS;
  const q = Math.max(0, qTarget * c + jitter);
  const value = Math.min(S.valueKmS, S.valueKmS * prog(frame, S.countFrom, S.countTo - 10, Easing.out(Easing.cubic)));
  const unitPulse = frame >= S.unitLock ? Math.exp(-(frame - S.unitLock) / 10) : 0;
  const lockPulse = frame >= S.countTo ? Math.exp(-(frame - S.countTo) / 12) : 0;
  const draw = prog(frame, S.in, S.in + 18, easeOut);
  const [nx, ny] = polar(q, R - 34);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: enter * (1 - exit),
        transformOrigin: `${CX}px ${CY}px`,
        // CRT-off exit: collapses vertically into a line.
        transform: `scale(${mix(0.86, 1, enter) * (1 + 0.04 * exit)}, ${mix(0.86, 1, enter) * (1 - 0.97 * exit)})`,
        clipPath: SAFE_CLIP,
      }}
    >
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="glowF" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="dialBg" cx="50%" cy="100%" r="100%">
            <stop offset="0%" stopColor="rgba(10,16,32,0.65)" />
            <stop offset="100%" stopColor="rgba(10,16,32,0)" />
          </radialGradient>
        </defs>
        <path d={`${arcPath(0, 1, R + 10)} L ${CX + R + 10} ${CY} Z`} fill="url(#dialBg)" />
        {/* outer frame arcs */}
        <path d={arcPath(0, draw, R + 12)} fill="none" stroke={CYAN} strokeOpacity={0.55} strokeWidth={2} />
        <path d={arcPath(0, draw, R - 58)} fill="none" stroke={CYAN} strokeOpacity={0.22} strokeWidth={1.5} strokeDasharray="4 7" />
        {/* lit progress band */}
        {q > 0.002 ? <path d={arcPath(0, Math.min(q, 1), R - 4)} fill="none" stroke={GOLD} strokeWidth={9} strokeLinecap="round" filter="url(#glowF)" /> : null}
        {/* ticks */}
        {Array.from({ length: TICKS + 1 }, (_, i) => {
          const tq = i / TICKS;
          if (tq > draw + 0.001) return null;
          const major = i % 5 === 0;
          const lit = tq <= q;
          const [x0, y0] = polar(tq, R - (major ? 30 : 18));
          const [x1, y1] = polar(tq, R - 6);
          const [lx, ly] = polar(tq, R + 32);
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={lit ? GOLD : CYAN} strokeOpacity={lit ? 1 : 0.5} strokeWidth={major ? 4 : 2} filter={lit ? "url(#glowF)" : undefined} />
              {major && i % 10 === 0 ? (
                <text x={lx} y={ly + 7} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={19} fill={lit ? GOLD : "rgba(127,231,255,0.75)"}>
                  {i * 10}k
                </text>
              ) : null}
            </g>
          );
        })}
        {/* baseline */}
        <line x1={CX - (R + 12) * draw} y1={CY} x2={CX + (R + 12) * draw} y2={CY} stroke={CYAN} strokeOpacity={0.5} strokeWidth={2} />
        {/* needle */}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={WARM} strokeWidth={5} strokeLinecap="round" filter="url(#glowF)" />
        <circle cx={CX} cy={CY} r={13} fill={GOLD} filter="url(#glowF)" />
        <circle cx={CX} cy={CY} r={5} fill="#fff" />
      </svg>
      {/* readout, locked into the dial */}
      <div style={{ position: "absolute", left: CX - 200, width: 400, top: CY - 122, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 5, color: CYAN, textShadow: glow("rgba(127,231,255,0.7)", 0.3) }}>
          VELOCIDADE DA LUZ
        </div>
        <div
          style={{
            fontFamily: ORBITRON,
            fontWeight: 900,
            fontSize: 64,
            lineHeight: 1.12,
            color: lockPulse > 0 ? GOLD : WARM,
            fontVariantNumeric: "tabular-nums",
            textShadow: glow("rgba(255,197,77,0.9)", 0.35 + 0.65 * lockPulse),
            transform: `scale(${1 + 0.1 * lockPulse})`,
          }}
        >
          {fmt(value)}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: CX - 120,
          width: 240,
          top: CY + 14,
          textAlign: "center",
          fontFamily: ORBITRON,
          fontWeight: 700,
          fontSize: 38,
          letterSpacing: 2,
          color: frame >= S.unitLock ? GOLD : "rgba(255,255,255,0.35)",
          textShadow: frame >= S.unitLock ? glow("rgba(255,197,77,0.95)", 0.3 + 0.7 * unitPulse) : "none",
          transform: `scale(${1 + 0.25 * unitPulse})`,
        }}
      >
        km/s
      </div>
      <div style={{ ...scanlines(frame, 0.18), left: CX - R - 20, width: 2 * R + 40, top: CY - R - 20, height: R + 90, inset: undefined }} />
    </div>
  );
};

/** Streaks rushing Sun -> Earth (left to right) while the speed reads out. */
export const SpeedLines: React.FC = () => {
  const frame = useCurrentFrame();
  const L = T.motion.speedLines;
  if (frame < L.from || frame >= L.to) return null;
  const env = prog(frame, L.from, L.from + 10, easeOut) * (1 - prog(frame, L.to - 24, L.to, easeIn));
  const boost = 1 + 1.4 * (frame >= S.countFrom ? Math.exp(-(frame - S.countFrom) / 25) : 0);
  const t = frame - L.from;
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, clipPath: SAFE_CLIP, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="streak" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0} />
          <stop offset="85%" stopColor={WARM} stopOpacity={0.9} />
          <stop offset="100%" stopColor="#ffffff" stopOpacity={1} />
        </linearGradient>
      </defs>
      {Array.from({ length: L.count }, (_, i) => {
        const r = (k: string) => random(`streak-${i}-${k}`);
        const len = mix(70, 340, r("len"));
        const speed = mix(38, 95, r("spd")) * boost;
        const span = 1080 + len * 2;
        const x = ((r("x") * span + speed * t) % span) - len;
        const y = mix(L.band[0], L.band[1], r("y"));
        const thick = mix(1.2, 3.6, Math.pow(r("w"), 2));
        return <rect key={i} x={x} y={y} width={len} height={thick} rx={thick / 2} fill="url(#streak)" opacity={env * mix(0.25, 0.85, r("o"))} />;
      })}
    </svg>
  );
};
