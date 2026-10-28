// Two light-travel clocks: the hook's rolling odometer (0:00 -> 8:20, locks on the slam)
// and the journey's vertical HUD bar that fills while the photon flies.
import { Easing, useCurrentFrame } from "remotion";
import { S3D, T, easeIn, easeInOut, easeOut, ev, mix, prog } from "../timeline";
import { CYAN, GOLD, MONO, ORBITRON, WARM, glow, scanlines } from "./style";

const TOTAL_S = 500; // 8 min 20 s

// ---------- Odometer ----------

const DIGIT_H = 128;

/** One rolling digit column; `pos` is continuous (3.4 = between 3 and 4); `base` digits then wraps to 0. */
const Roller: React.FC<{ pos: number; size: number; base?: number }> = ({ pos, size, base = 10 }) => (
  <div style={{ height: DIGIT_H, overflow: "hidden", width: size * 0.78, textAlign: "center" }}>
    <div style={{ transform: `translateY(${-pos * DIGIT_H}px)` }}>
      {[...Array.from({ length: base }, (_, d) => d), 0].map((d, i) => (
        <div key={i} style={{ height: DIGIT_H, lineHeight: `${DIGIT_H}px` }}>
          {d}
        </div>
      ))}
    </div>
  </div>
);

// A digit only turns over during the last unit of the digit below it, like a real odometer.
const carry = (v: number, mod: number) => Math.max(0, (v % mod) - (mod - 1));

const Bracket: React.FC<{ w: number; h: number; color: string; len?: number }> = ({ w, h, color, len = 26 }) => (
  <svg width={w} height={h} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    {[
      [0, len, 0, 0, len, 0],
      [w - len, 0, w, 0, w, len],
      [w, h - len, w, h, w - len, h],
      [len, h, 0, h, 0, h - len],
    ].map((p, i) => (
      <polyline key={i} points={`${p[0]},${p[1]} ${p[2]},${p[3]} ${p[4]},${p[5]}`} fill="none" stroke={color} strokeWidth={3} />
    ))}
  </svg>
);

export const HookTimer: React.FC = () => {
  const frame = useCurrentFrame();
  const m = T.motion.hookTimer;
  if (frame < m.in || frame > m.out + 18) return null;
  const enter = prog(frame, m.in, m.in + 10, Easing.out(Easing.back(1.6)));
  const exit = prog(frame, m.out, m.out + 14, easeIn);
  // Accelerating roll that brakes hard into the lock frame.
  const v = TOTAL_S * prog(frame, m.rollFrom, m.lockAt, Easing.inOut(Easing.quad));
  const units = (v % 10) as number;
  const tens = (Math.floor(v / 10) % 6) + carry(v, 10);
  const mins = Math.floor(v / 60) + carry(v, 60);
  const locked = frame >= m.lockAt;
  const lockPulse = locked ? Math.exp(-(frame - m.lockAt) / 9) : 0;
  const color = locked ? GOLD : WARM;
  const W_BOX = 520;
  const H_BOX = 196;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - W_BOX / 2,
        top: m.yCenter - H_BOX / 2,
        width: W_BOX,
        height: H_BOX,
        opacity: enter * (1 - exit),
        transform: `scale(${mix(0.7, 1, enter) * (1 + 0.12 * lockPulse)}, ${mix(0.7, 1, enter) * (1 + 0.12 * lockPulse) * (1 - 0.95 * exit)})`,
      }}
    >
      <div style={{ position: "absolute", inset: 0, background: "rgba(8,12,24,0.45)", borderRadius: 8, backdropFilter: "blur(2px)" }} />
      <Bracket w={W_BOX} h={H_BOX} color={locked ? GOLD : CYAN} />
      <div
        style={{
          position: "absolute",
          top: 14,
          width: "100%",
          textAlign: "center",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 20,
          letterSpacing: 5,
          color: CYAN,
          textShadow: glow("rgba(127,231,255,0.7)", 0.3),
        }}
      >
        TEMPO DA LUZ · SOL → TERRA
      </div>
      <div
        style={{
          position: "absolute",
          top: 48,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 118,
          color,
          textShadow: glow(locked ? "rgba(255,197,77,0.9)" : "rgba(255,240,210,0.65)", 0.4 + 0.6 * lockPulse),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        <Roller pos={mins} size={118} />
        <div style={{ height: DIGIT_H, lineHeight: `${DIGIT_H - 8}px`, padding: "0 4px", opacity: frame % 30 < 22 || locked ? 1 : 0.35 }}>:</div>
        <Roller pos={tens} size={118} base={6} />
        <Roller pos={units} size={118} />
      </div>
      <div style={scanlines(frame, 0.28)} />
    </div>
  );
};

// ---------- Vertical journey timer ----------

export const TimerHud: React.FC = () => {
  const frame = useCurrentFrame();
  const run = ev("journey", "Vertical timer bar");
  const fadeOut = ev("payoff", "Timer bar fades out").f;
  const arrive = ev("journey", "Particle reaches Earth").f;
  const { rect } = S3D.timerBar;
  const enter = prog(frame, run.f - 24, run.f, easeOut);
  const shown = enter * (1 - prog(frame, fadeOut, fadeOut + 18, easeIn));
  if (shown <= 0) return null;
  const p = prog(frame, run.f, run.until ?? arrive, easeInOut);
  const secs = p * TOTAL_S;
  const pop = frame >= arrive ? Math.exp(-(frame - arrive) / 8) : 0;
  const done = frame >= arrive;
  const fillTop = rect.y + rect.h * (1 - p);
  const label = `${Math.floor(secs / 60)}:${String(Math.floor(secs % 60)).padStart(2, "0")}`;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: shown }}>
      {/* track, draws on from the bottom */}
      <div
        style={{
          position: "absolute",
          left: rect.x,
          top: rect.y + rect.h * (1 - enter),
          width: rect.w,
          height: rect.h * enter,
          borderRadius: rect.w,
          background: "rgba(127,231,255,0.10)",
          boxShadow: "inset 0 0 0 1px rgba(127,231,255,0.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: `${p * 100}%`,
            background: `linear-gradient(to top, #ff7a1a, ${GOLD} 55%, ${WARM})`,
            boxShadow: `0 0 18px rgba(255,190,90,0.95)`,
          }}
        />
        <div style={scanlines(frame, 0.35)} />
      </div>
      {/* minute ticks */}
      {Array.from({ length: 9 }, (_, i) => {
        const y = rect.y + rect.h * (1 - (i * 60) / TOTAL_S);
        const lit = secs >= i * 60;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: rect.x + rect.w + 5,
              top: y - 1,
              width: i % 2 === 0 ? 16 : 9,
              height: 2,
              background: lit ? GOLD : "rgba(127,231,255,0.45)",
              boxShadow: lit ? "0 0 8px rgba(255,197,77,0.9)" : "none",
            }}
          />
        );
      })}
      {/* glowing head riding the fill */}
      <div
        style={{
          position: "absolute",
          left: rect.x + rect.w / 2 - 14,
          top: fillTop - 14,
          width: 28,
          height: 28,
          borderRadius: 28,
          background: `radial-gradient(circle, #fff 0%, ${GOLD} 35%, rgba(255,160,60,0) 70%)`,
          opacity: p > 0.002 ? 1 - 0.6 * pop : 0,
        }}
      />
      {/* header */}
      <div style={{ position: "absolute", left: rect.x - 18, top: rect.y - 44, fontFamily: MONO, fontWeight: 700, fontSize: 16, letterSpacing: 3, color: CYAN, textShadow: glow("rgba(127,231,255,0.7)", 0.25) }}>
        T+LUZ
      </div>
      {/* readout */}
      <div
        style={{
          position: "absolute",
          left: T.safeZone.contentRect.x[0] + 4,
          top: rect.y + rect.h + 16,
          padding: "6px 10px",
          fontFamily: ORBITRON,
          fontWeight: 900,
          fontSize: 40,
          color: done ? GOLD : WARM,
          fontVariantNumeric: "tabular-nums",
          textShadow: glow(done ? "rgba(255,197,77,0.95)" : "rgba(255,240,210,0.6)", 0.3 + 0.7 * pop),
          transform: `scale(${1 + 0.22 * pop})`,
          transformOrigin: "0% 50%",
          overflow: "hidden",
        }}
      >
        <Bracket w={128} h={60} color={done ? GOLD : CYAN} len={12} />
        {label}
        <div style={scanlines(frame, 0.3)} />
      </div>
    </div>
  );
};
