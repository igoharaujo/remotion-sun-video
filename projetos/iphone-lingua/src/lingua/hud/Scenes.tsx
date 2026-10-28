// The 2D layer of every scene: phones, HUD labels pinned to face landmarks, cards, icons, counters.
// All cue frames come from timeline.json via K()/SC.
import { random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { FACE, GLOBE_POS, faceAt, firstOf, landmarkScreen, landmarkWorld, project } from "../three/rig";
import { MONO, INTER, SHADOW, glow } from "../style";
import { AMBER, BLUE, GREEN, K, RED, SC, WHITE, backOut, easeIn, easeInOut, easeOut, mix, prog, win } from "../tl";
import { Feed, PHONE_RATIO, Phone, feedOffset, swipeArrow } from "./Phone";
import { SettingsFlow } from "./Settings";

const BEZEL = 0.035;
const screenOf = (w: number) => ({ w: w * (1 - 2 * BEZEL), h: w * PHONE_RATIO - 2 * w * BEZEL });

/** Small monospace HUD label with an optional leader line to a point. */
const Tag: React.FC<{ x: number; y: number; text: string; color: string; o: number; to?: { x: number; y: number }; size?: number; align?: "left" | "right" | "center" }> = ({
  x,
  y,
  text,
  color,
  o,
  to,
  size = 28,
  align = "left",
}) => {
  if (o <= 0.002) return null;
  const tx = align === "right" ? "-100%" : align === "center" ? "-50%" : "0";
  return (
    <>
      {to ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, overflow: "visible" }}>
          <line x1={x} y1={y} x2={to.x} y2={to.y} stroke={color} strokeWidth={2} strokeDasharray="5 5" />
          <circle cx={to.x} cy={to.y} r={7} fill="none" stroke={color} strokeWidth={2.5} />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(${tx}, -50%) translateX(${(1 - o) * (align === "right" ? 16 : -16)}px)`,
          opacity: o,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: size,
          letterSpacing: 2,
          whiteSpace: "nowrap",
          color,
          textShadow: `${SHADOW}, ${glow(color, 0.3, 0.5)}`,
        }}
      >
        {text}
      </div>
    </>
  );
};

/** Screen-space bounding box of the face outline at `frame`. */
const faceBox = (frame: number) => {
  const f = faceAt(frame);
  const v = new THREE.Vector3();
  let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9];
  for (const i of FACE.strips[0]) {
    const p = project(landmarkWorld(i, f, frame, v), frame);
    [x0, y0, x1, y1] = [Math.min(x0, p.x), Math.min(y0, p.y), Math.max(x1, p.x), Math.max(y1, p.y)];
  }
  return { x0, y0, x1, y1 };
};
const TONGUE_TIP = FACE.tongue[0] + 27;
const MOUTH = FACE.lip[0] + 12; // bottom of the lower lip
const LIP_CORNER = FACE.lip[0];
const EYE = firstOf("eye") + 6;
const BROW = firstOf("brow") + 3;

// ---- S01: hook --------------------------------------------------------------------------------
const HOOK_SWIPES = [K("S01", "língua") + 8, K("S01", "língua") + 30];
export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const enter = prog(frame, K("S01", "iPhone") - 6, K("S01", "iPhone") + 18, backOut);
  const o = Math.min(1, enter) * (1 - prog(frame, SC.S02.from, SC.S02.from + 14, easeIn));
  const w = 230;
  const s = screenOf(w);
  const tongue = faceAt(frame).tongue;
  const lerOn = win(frame, K("S01", "ler"), K("S01", "língua") + 4, 6, 6);
  const tip = landmarkScreen(TONGUE_TIP, frame);
  return (
    <>
      <Phone x={mix(1140, 815, enter)} y={1090} w={w} opacity={o} rotY={-16} rotZ={4} glow={tongue} glowColor={GREEN}>
        <Feed w={s.w} h={s.h} offset={feedOffset(frame, HOOK_SWIPES)} arrow={swipeArrow(frame, HOOK_SWIPES)} />
      </Phone>
      <Tag x={540} y={250} text="LENDO EXPRESSÃO…" color={GREEN} o={lerOn * 0.95} align="center" />
      <Tag x={tip.x - 190} y={tip.y + 120} text="LÍNGUA ✓" color={GREEN} o={win(frame, K("S01", "língua") + 4, SC.S02.from + 6, 8, 12)} to={tip} size={30} />
    </>
  );
};

// ---- S02: prank? no, official ------------------------------------------------------------------
const MaskIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M12 30 Q50 14 88 30 Q86 70 50 86 Q14 70 12 30 Z" fill="none" stroke={WHITE} strokeWidth={5} strokeLinejoin="round" />
    <path d="M28 44 q8 -7 16 0 M56 44 q8 -7 16 0" fill="none" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
    <path d="M34 62 Q50 74 66 62" fill="none" stroke={WHITE} strokeWidth={5} strokeLinecap="round" />
  </svg>
);
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S02;
  const pega = K("S02", "pegadinha");
  const flipAt = pega + 44;
  const enter = prog(frame, pega - 4, pega + 18, backOut);
  const flip = prog(frame, flipAt, flipAt + 22, easeInOut);
  const out = prog(frame, to - 14, to + 2, easeIn);
  const stamp = prog(frame, K("S02", "oficial"), K("S02", "oficial") + 10, easeOut);
  const ios = prog(frame, K("S02", "iOS 26") - 4, K("S02", "iOS 26") + 18, backOut);
  if (frame < from || frame > to + 2) return null;
  const rot = flip * 180;
  const face = (back: boolean): React.CSSProperties => ({
    position: "absolute",
    inset: 0,
    borderRadius: 36,
    backfaceVisibility: "hidden",
    transform: back ? "rotateY(180deg)" : undefined,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 28,
    background: back ? "linear-gradient(160deg, rgba(0,122,255,0.32), rgba(10,10,15,0.85))" : "linear-gradient(160deg, rgba(255,255,255,0.12), rgba(10,10,15,0.85))",
    border: `2px solid ${back ? BLUE : "rgba(255,255,255,0.25)"}`,
    boxShadow: back ? `0 0 50px rgba(0,122,255,0.45)` : "0 20px 60px rgba(0,0,0,0.6)",
  });
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <div style={{ position: "absolute", left: 540 - 300, top: 420, width: 600, height: 300, perspective: 1400, opacity: Math.min(1, enter), transform: `scale(${mix(0.6, 1, enter)}) rotate(${(1 - enter) * -8}deg)` }}>
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateY(${rot}deg)` }}>
          <div style={face(false)}>
            <MaskIcon size={130} />
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 64, color: WHITE, letterSpacing: -1 }}>pegadinha?</div>
          </div>
          <div style={face(true)}>
            <div style={{ fontFamily: INTER, fontWeight: 900, fontSize: 74, color: WHITE, letterSpacing: -1, textShadow: glow(BLUE, 0.4) }}>OFICIAL</div>
          </div>
        </div>
        {stamp > 0 ? (
          <svg width={170} height={170} viewBox="0 0 100 100" style={{ position: "absolute", right: -50, top: -60, opacity: stamp, transform: `scale(${mix(1.8, 1, stamp)}) rotate(${mix(-30, -10, stamp)}deg)`, filter: `drop-shadow(0 0 14px ${BLUE})` }}>
            <path
              d={Array.from({ length: 24 }, (_, k) => {
                const a = (k / 24) * Math.PI * 2;
                const r = k % 2 ? 40 : 46;
                return `${k ? "L" : "M"}${50 + r * Math.cos(a)} ${50 + r * Math.sin(a)}`;
              }).join(" ") + "Z"}
              fill={BLUE}
            />
            <path d="M33 51 L45 63 L68 38" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </div>
      {ios > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 820, textAlign: "center", opacity: Math.min(1, ios), transform: `scale(${mix(0.6, 1, ios)})`, filter: `blur(${(1 - Math.min(1, ios)) * 8}px)` }}>
          <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 70, color: WHITE, letterSpacing: 2, textShadow: SHADOW }}>iOS</div>
          <div style={{ filter: `drop-shadow(0 0 30px rgba(0,122,255,0.55))` }}>
            <span
              style={{
                display: "inline-block",
                fontFamily: INTER,
                fontWeight: 900,
                fontSize: 300,
                lineHeight: 0.95,
                letterSpacing: -12,
                backgroundImage: `linear-gradient(${120 + 40 * Math.sin(frame / 30)}deg, #ffffff 10%, #7fb8ff 45%, ${BLUE} 70%, ${GREEN} 100%)`,
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              26
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
};

// ---- S03: head tracking = accessibility ------------------------------------------------------
const AccessIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 16px ${color})` }}>
    <circle cx={50} cy={50} r={45} fill="none" stroke={color} strokeWidth={5} />
    <circle cx={50} cy={25} r={7} fill={color} />
    <path d="M22 40 H78 M50 40 V60 M50 60 L36 82 M50 60 L64 82" fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const HandIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 16px ${color})` }}>
    <path d="M32 90 V50 M32 50 V22 a6 6 0 0 1 12 0 V48 M44 46 V16 a6 6 0 0 1 12 0 V46 M56 46 V20 a6 6 0 0 1 12 0 V50 M68 50 V32 a6 6 0 0 1 12 0 V62 Q80 90 56 92 H40 Q24 86 18 66 L12 52 a6 6 0 0 1 10 -6 L32 58" fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S03;
  if (frame < from - 10 || frame > to + 2) return null;
  const f = faceAt(frame);
  const box = faceBox(frame);
  const lock = prog(frame, K("S03", "Rastreamento de Cabeça"), K("S03", "Rastreamento de Cabeça") + 14, backOut);
  const out = prog(frame, to - 12, to + 2, easeIn);
  const pad = mix(80, 26, Math.min(1, lock));
  const [bx0, by0, bx1, by1] = [box.x0 - pad, box.y0 - pad, box.x1 + pad, box.y1 + pad];
  const L = 46;
  const corner = (x: number, y: number, sx: number, sy: number) => `M${x} ${y + sy * L} L${x} ${y} L${x + sx * L} ${y}`;
  const deg = (r: number) => `${r >= 0 ? "+" : "−"}${Math.abs((r * 180) / Math.PI).toFixed(1).padStart(4, "0")}°`;
  const o = Math.min(1, lock) * (1 - out);
  const accent = prog(frame, K("S03", "Apple") + 60, K("S03", "Apple") + 80, backOut);
  const hand = prog(frame, K("S03", "limitações motoras"), K("S03", "limitações motoras") + 18, backOut);
  const touch = K("S03", "sem tocar");
  const iconsOut = prog(frame, touch - 16, touch - 2, easeIn);
  const tapP = prog(frame, touch, touch + 26, easeOut);
  const strike = prog(frame, touch + 14, touch + 28, backOut);
  const touchIn = prog(frame, touch - 10, touch + 6, easeOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
        <g stroke={BLUE} strokeWidth={4} fill="none" style={{ filter: `drop-shadow(0 0 8px ${BLUE})` }}>
          <path d={corner(bx0, by0, 1, 1)} />
          <path d={corner(bx1, by0, -1, 1)} />
          <path d={corner(bx0, by1, 1, -1)} />
          <path d={corner(bx1, by1, -1, -1)} />
        </g>
        <line x1={(bx0 + bx1) / 2 - 14} y1={(by0 + by1) / 2} x2={(bx0 + bx1) / 2 + 14} y2={(by0 + by1) / 2} stroke={GREEN} strokeWidth={2} />
        <line x1={(bx0 + bx1) / 2} y1={(by0 + by1) / 2 - 14} x2={(bx0 + bx1) / 2} y2={(by0 + by1) / 2 + 14} stroke={GREEN} strokeWidth={2} />
      </svg>
      <Tag x={(bx0 + bx1) / 2} y={by0 - 40} text="RASTREAMENTO DE CABEÇA" color={BLUE} o={o} align="center" size={28} />
      <div style={{ position: "absolute", left: Math.min(bx1 + 18, 800), top: (by0 + by1) / 2 - 70, opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: 22, lineHeight: 1.6, color: WHITE, textShadow: SHADOW }}>
        <div>YAW&nbsp;&nbsp; <span style={{ color: GREEN }}>{deg(f.yaw)}</span></div>
        <div>PITCH <span style={{ color: GREEN }}>{deg(f.pitch)}</span></div>
        <div>ROLL&nbsp; <span style={{ color: GREEN }}>{deg(f.roll)}</span></div>
      </div>
      {/* "pessoas com limitações motoras": accessibility + hand icons. */}
      <div style={{ position: "absolute", left: 0, width: 1080, top: 1090, height: 220, display: "flex", justifyContent: "center", gap: 90, opacity: 1 - iconsOut }}>
        <div style={{ opacity: Math.min(1, accent), transform: `scale(${mix(0.4, 1, accent)})` }}>
          <AccessIcon size={190} color={BLUE} />
        </div>
        {hand > 0 ? (
          <div style={{ opacity: Math.min(1, hand), transform: `scale(${mix(0.4, 1, hand)})` }}>
            <HandIcon size={190} color={GREEN} />
          </div>
        ) : null}
      </div>
      {/* "sem tocar na tela": a finger taps a screen, the touch is crossed out. */}
      {touchIn > 0 ? (
        <div style={{ position: "absolute", left: 540 - 150, top: 1080, width: 300, height: 250, opacity: touchIn }}>
          <div style={{ position: "absolute", left: 60, top: 20, width: 180, height: 220, borderRadius: 26, border: `3px solid ${WHITE}`, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ position: "absolute", left: 150 - 40, top: 130 - 40, width: 80, height: 80, borderRadius: 40, border: `3px solid ${BLUE}`, transform: `scale(${0.3 + 1.2 * tapP})`, opacity: 1 - tapP }} />
          <div style={{ position: "absolute", left: 150 - 12, top: 130 - 12, width: 24, height: 24, borderRadius: 12, background: BLUE, opacity: 1 - strike * 0.6 }} />
          {strike > 0 ? (
            <svg width={300} height={300} viewBox="0 0 100 100" style={{ position: "absolute", left: 0, top: -20, opacity: Math.min(1, strike), transform: `scale(${mix(1.6, 1, Math.min(1, strike))})`, filter: `drop-shadow(0 0 12px ${RED})` }}>
              <circle cx={50} cy={50} r={36} fill="none" stroke={RED} strokeWidth={6} />
              <line x1={25} y1={75} x2={75} y2={25} stroke={RED} strokeWidth={6} strokeLinecap="round" />
            </svg>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

// ---- S04: the trend goes worldwide -----------------------------------------------------------
const BURST = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2 + random(`b-a-${i}`) * 0.3;
  return { a, r: 330 + 150 * random(`b-r-${i}`), rot: (random(`b-rot-${i}`) - 0.5) * 40, delay: Math.floor(random(`b-d-${i}`) * 8) };
});
// Stylised "going viral" curve (no numbers: the script makes no claim about view counts).
const TREND: [number, number][] = [[0, 175], [70, 165], [130, 170], [190, 140], [250, 148], [310, 105], [370, 90], [420, 55], [500, 25]];
export const TREND_TICKS = (from: number) => Array.from({ length: 9 }, (_, k) => from + 2 + k * 5);
export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S04;
  if (frame < from || frame > to + 10) return null;
  const t = K("S04", "trend mundial");
  const out = prog(frame, to - 6, to + 10, easeIn);
  const c = project(GLOBE_POS, frame);
  const countO = prog(frame, t, t + 8);
  const draw = prog(frame, t, t + 46, easeOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      <Tag x={540} y={210} text="VIRALIZANDO…" color={GREEN} o={prog(frame, K("S04", "descobriu"), K("S04", "descobriu") + 10)} align="center" size={26} />
      {BURST.map((b, i) => {
        const p = prog(frame, t + b.delay, t + b.delay + 26, backOut);
        if (p <= 0) return null;
        const x = c.x + Math.cos(b.a) * b.r * p * 0.78;
        const y = c.y + Math.sin(b.a) * b.r * p * 1.05;
        const w = 104;
        const s = screenOf(w);
        return (
          <div key={i} style={{ position: "absolute", left: x - w / 2, top: y - (w * PHONE_RATIO) / 2, opacity: Math.min(1, p), transform: `rotate(${b.rot * p}deg) scale(${mix(0.2, 1, Math.min(1, p))})` }}>
            <div style={{ position: "absolute", width: w, height: w * PHONE_RATIO * 0.95, borderRadius: 16, overflow: "hidden", border: "2px solid rgba(255,255,255,0.35)", boxShadow: `0 0 24px rgba(16,185,129,0.4)` }}>
              <Feed w={s.w} h={s.h} offset={0} seed={i} />
            </div>
          </div>
        );
      })}
      {countO > 0 ? (
        <svg width={520} height={190} viewBox="0 0 520 190" style={{ position: "absolute", left: 280, top: 1190, opacity: countO, overflow: "visible", filter: `drop-shadow(0 0 12px ${GREEN})` }}>
          <polyline points={TREND.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={GREEN} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          <path d="M478 38 L512 12 L500 52 Z" fill={GREEN} opacity={draw > 0.95 ? 1 : 0} />
        </svg>
      ) : null}
    </div>
  );
};

// ---- S05: tutorial ---------------------------------------------------------------------------
const CRUMBS: [string, string][] = [
  ["Ajustes", "Ajustes"],
  ["Acessibilidade", "Acessibilidade"],
  ["Rastreamento", "Rastreamento de Cabeça"],
];
export const TUTORIAL_PHONE = { x: 540, y: 800, w: 520 };
const UI_ZOOM = 1.3; // the simulated UI is laid out smaller and scaled up so it reads on a phone
const FRONT = { x: 540, y: 1150, w: 240 };
export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S05;
  const handoff = K("S06", "celular") - 20;
  if (frame < from || frame >= handoff) return null;
  const enter = prog(frame, from, from + 40, easeOut);
  // Exit: shrink into the S06 "in front of the face" spot, where the S06 phone takes over.
  const exit = prog(frame, to - 20, to + 30, easeInOut);
  const P = TUTORIAL_PHONE;
  const s = screenOf(P.w);
  return (
    <>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 176, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, fontFamily: MONO, fontWeight: 700, fontSize: 23, opacity: enter * (1 - exit) }}>
        {CRUMBS.map(([cue, label], i) => {
          const at = K("S05", cue);
          const on = prog(frame, at, at + 10, backOut);
          const active = frame >= at && (i === CRUMBS.length - 1 || frame < K("S05", CRUMBS[i + 1][0]));
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {i ? <span style={{ color: on > 0 ? WHITE : "#555", opacity: 0.7 }}>›</span> : null}
              <span
                style={{
                  padding: "6px 12px",
                  borderRadius: 10,
                  color: on > 0 ? WHITE : "#666",
                  border: `2px solid ${on > 0 ? (active ? GREEN : BLUE) : "#333"}`,
                  background: on > 0 ? (active ? "rgba(16,185,129,0.18)" : "rgba(0,122,255,0.15)") : "transparent",
                  transform: `scale(${1 + 0.12 * Math.max(0, Math.min(1, on)) * Math.exp(-Math.max(0, frame - at) / 10)})`,
                  boxShadow: active ? `0 0 16px rgba(16,185,129,0.5)` : undefined,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: active ? GREEN : BLUE }}>{i + 1}</span> {label}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: `${P.x}px ${P.y}px`,
          transform: `translate(${(FRONT.x - P.x) * exit}px, ${(FRONT.y - P.y) * exit}px) scale(${mix(1, FRONT.w / P.w, exit)})`,
        }}
      >
        <Phone x={P.x} y={mix(P.y + 260, P.y, enter)} w={P.w} opacity={enter} rotX={mix(28, 0, enter) + 2 * Math.sin(frame / 50) * (1 - exit)} rotY={-4 * Math.sin(frame / 70) * (1 - exit)} glow={0.3}>
          {exit < 0.5 ? (
            <div style={{ position: "absolute", left: 0, top: 0, transform: `scale(${UI_ZOOM})`, transformOrigin: "0 0" }}>
              <SettingsFlow w={s.w / UI_ZOOM} h={s.h / UI_ZOOM} />
            </div>
          ) : (
            <Feed w={s.w} h={s.h} offset={0} seed={5} />
          )}
        </Phone>
      </div>
    </>
  );
};

// ---- S06 / S07: in front of the face, then the payoff ----------------------------------------
export const FRONT_SWIPES = [K("S07", "passar"), K("S07", "sem"), K("S07", "dedo")];
const CAM_AT = K("S07", "câmera frontal");

/** Light cone from the phone's front camera up to the face. */
const Beam: React.FC<{ from: { x: number; y: number }; o: number; frame: number; color?: string }> = ({ from, o, frame, color = GREEN }) => {
  if (o <= 0.002) return null;
  const box = faceBox(frame);
  const spread = (box.x1 - box.x0) * 0.55;
  const ty = box.y1 - 40;
  const cx = (box.x0 + box.x1) / 2;
  const sweep = 0.5 + 0.5 * Math.sin(frame / 9);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o, mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity={0.55} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M${from.x - 8} ${from.y} L${cx - spread} ${ty} L${cx + spread} ${ty} L${from.x + 8} ${from.y} Z`} fill="url(#beam)" />
      <line x1={from.x} y1={from.y} x2={cx + spread * (sweep * 2 - 1) * 0.9} y2={ty} stroke={color} strokeWidth={2} opacity={0.8} />
    </svg>
  );
};

const FingerIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path d="M40 92 V30 a8 8 0 0 1 16 0 V56 l18 4 q10 3 8 14 l-4 18" fill="none" stroke={WHITE} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const S06S07: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < SC.S06.from - 20 || frame > SC.S07.to + 4) return null;
  // Takes over from the shrunken S05 phone, then lifts toward the face on "celular".
  const handoff = K("S06", "celular") - 20;
  const rise = prog(frame, handoff, K("S06", "celular") + 30, easeInOut);
  const phoneOut = prog(frame, CAM_AT - 24, CAM_AT - 4, easeIn);
  const w = FRONT.w;
  const s = screenOf(w);
  const tongue = faceAt(frame).tongue;
  const island = { x: FRONT.x, y: FRONT.y - 30 - (w * PHONE_RATIO) / 2 + 26 };
  const beamO = Math.max(win(frame, K("S06", "rosto"), CAM_AT - 10, 14, 14) * (0.55 + 0.25 * Math.sin(frame / 7)), 0);
  const enc = K("S07", "encostar");
  const finger = win(frame, enc - 6, K("S07", "dedo") + 40, 14, 14);
  const cross = prog(frame, enc + 18, enc + 30, backOut);
  // Lens close-up after the phone leaves.
  const lens = win(frame, CAM_AT - 6, SC.S07.to + 4, 14, 14);
  const lensC = { x: 540, y: 1180 };
  const tags = [
    { i: TONGUE_TIP, label: "LÍNGUA", conf: 98, dx: -260, dy: 70, at: K("S07", "expressão") },
    { i: MOUTH, label: "BOCA", conf: 94, dx: 230, dy: 60, at: K("S07", "detecta") + 6 },
    { i: EYE, label: "OLHOS", conf: 97, dx: 230, dy: -70, at: K("S07", "detecta") },
    { i: BROW, label: "SOBRANCELHAS", conf: 91, dx: -150, dy: -150, at: K("S07", "detecta") + 12 },
  ];
  const real = prog(frame, K("S07", "tempo real"), K("S07", "tempo real") + 10, backOut);
  return (
    <>
      <Beam from={island} o={beamO} frame={frame} />
      <Beam from={{ x: lensC.x, y: lensC.y - 90 }} o={lens * 0.55} frame={frame} color={BLUE} />
      <Phone
        x={FRONT.x}
        y={FRONT.y - 30 * rise + 40 * phoneOut}
        w={w}
        opacity={(frame >= handoff ? 1 : 0) * (1 - phoneOut)}
        rotX={6 * rise}
        glow={Math.max(0.2, tongue)}
        glowColor={tongue > 0.3 ? GREEN : BLUE}
      >
        <Feed w={s.w} h={s.h} offset={feedOffset(frame, FRONT_SWIPES, 14)} seed={5} arrow={swipeArrow(frame, FRONT_SWIPES, 18)} />
      </Phone>
      {finger > 0 ? (
        <div style={{ position: "absolute", left: FRONT.x + 120 - 30 * finger, top: FRONT.y + 30, opacity: finger }}>
          <FingerIcon size={150} />
          {cross > 0 ? (
            <svg width={170} height={170} viewBox="0 0 100 100" style={{ position: "absolute", left: -10, top: -10, opacity: Math.min(1, cross), transform: `scale(${mix(1.6, 1, Math.min(1, cross))})`, filter: `drop-shadow(0 0 10px ${RED})` }}>
              <circle cx={50} cy={50} r={40} fill="none" stroke={RED} strokeWidth={6} />
              <line x1={22} y1={78} x2={78} y2={22} stroke={RED} strokeWidth={6} strokeLinecap="round" />
            </svg>
          ) : null}
        </div>
      ) : null}
      {lens > 0 ? (
        <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: lens }}>
          <g transform={`translate(${lensC.x} ${lensC.y})`}>
            <circle r={120} fill="#05070d" stroke="#2a2f3a" strokeWidth={10} />
            <circle r={92} fill="none" stroke={BLUE} strokeWidth={2} opacity={0.6} />
            <circle r={66} fill="#0b1430" />
            <circle r={40} fill="#08102a" stroke="#1c2f6b" strokeWidth={4} />
            <circle cx={-18} cy={-20} r={12} fill="#9fc9ff" opacity={0.5} />
            <circle r={18 + 4 * Math.sin(frame / 6)} fill={GREEN} opacity={0.25} />
            <g transform={`rotate(${frame * 1.5})`} stroke={GREEN} strokeWidth={4} fill="none">
              {[0, 90, 180, 270].map((a) => (
                <path key={a} d="M-150 -40 L-150 -150 L-40 -150" transform={`rotate(${a})`} opacity={0.8} />
              ))}
            </g>
          </g>
        </svg>
      ) : null}
      <Tag x={lensC.x} y={lensC.y + 175} text="CÂMERA FRONTAL" color={BLUE} o={lens} align="center" size={26} />
      {tags.map((t) => {
        const p = landmarkScreen(t.i, frame);
        const o = win(frame, t.at, SC.S07.to + 2, 10, 10);
        const jitter = Math.round((random(`conf-${t.label}-${Math.floor(frame / 5)}`) - 0.5) * 3);
        const x = Math.max(80, Math.min(900, p.x + t.dx));
        return <Tag key={t.label} x={x} y={p.y + t.dy} text={`${t.label} ${t.conf + jitter}%`} color={t.label === "LÍNGUA" ? GREEN : WHITE} o={o} to={p} size={27} align={t.dx < 0 ? "left" : "right"} />;
      })}
      {real > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 186, textAlign: "center", opacity: Math.min(1, real) * (1 - prog(frame, SC.S07.to - 8, SC.S07.to + 4)), fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: WHITE, textShadow: SHADOW }}>
          <span style={{ color: RED, opacity: 0.4 + 0.6 * Math.round((Math.sin(frame / 8) + 1) / 2) }}>●</span> REC · 60 FPS · <span style={{ color: GREEN }}>{14 + Math.floor(random(`lat-${Math.floor(frame / 6)}`) * 5)} ms</span>
        </div>
      ) : null}
    </>
  );
};

// ---- S08: the catch: a smile can trigger it ---------------------------------------------------
export const ACCIDENT_SWIPE = K("S08", "comando") + 2;
export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S08;
  if (frame < from || frame > to + 10) return null;
  const out = prog(frame, to - 4, to + 10, easeIn);
  const warn = prog(frame, K("S08", "problema"), K("S08", "problema") + 12, backOut);
  const smile = win(frame, K("S08", "sorrir") + 10, to + 10, 10, 10);
  const lip = landmarkScreen(LIP_CORNER, frame);
  const phoneIn = prog(frame, K("S08", "querer") + 20, K("S08", "querer") + 46, easeOut);
  const cmd = K("S08", "comando");
  const glitch = frame >= cmd && frame < cmd + 18 ? 1 - (frame - cmd) / 18 : 0;
  const alert = prog(frame, cmd, cmd + 8, backOut);
  const w = 220;
  const s = screenOf(w);
  const gx = glitch * (random(`gx-${frame}`) - 0.5) * 30;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: 1 - out }}>
      {warn > 0 ? (
        <svg width={110} height={100} viewBox="0 0 110 100" style={{ position: "absolute", left: 540 - 55, top: 170, opacity: Math.min(1, warn) * (1 - prog(frame, K("S08", "sorrir"), K("S08", "sorrir") + 10)), transform: `scale(${mix(0.5, 1, Math.min(1, warn))})`, filter: `drop-shadow(0 0 14px ${AMBER})` }}>
          <path d="M55 8 L104 92 H6 Z" fill="none" stroke={AMBER} strokeWidth={7} strokeLinejoin="round" />
          <path d="M55 38 V62 M55 76 V78" stroke={AMBER} strokeWidth={8} strokeLinecap="round" />
        </svg>
      ) : null}
      <Tag x={lip.x - 40} y={lip.y + 110} text="SORRISO DETECTADO" color={AMBER} o={smile * (0.7 + 0.3 * Math.sin(frame / 4))} to={lip} size={30} align="right" />
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${gx}px)` }}>
        <Phone x={540} y={1150} w={w} opacity={phoneIn} rotX={6} glow={glitch > 0 ? 1 : 0.15} glowColor={glitch > 0 ? RED : BLUE}>
          <Feed w={s.w} h={s.h} offset={feedOffset(frame, [ACCIDENT_SWIPE], 10)} seed={2} />
          {glitch > 0 ? <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, rgba(239,68,68,${0.35 * glitch}) 0 6px, transparent 6px 14px)`, transform: `translateY(${(frame % 4) * 5}px)` }} /> : null}
        </Phone>
        {glitch > 0 ? (
          <div style={{ position: "absolute", inset: 0, mixBlendMode: "screen", opacity: 0.6 * glitch, transform: `translateX(${-gx * 1.4 + 10}px)`, filter: "hue-rotate(160deg)" }}>
            <Phone x={540} y={1150} w={w} opacity={phoneIn} rotX={6}>
              <Feed w={s.w} h={s.h} offset={feedOffset(frame, [ACCIDENT_SWIPE], 10)} seed={2} />
            </Phone>
          </div>
        ) : null}
      </div>
      {alert > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 250, textAlign: "center", opacity: Math.min(1, alert), transform: `scale(${mix(1.5, 1, Math.min(1, alert))}) translateX(${gx * 0.6}px)`, fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: RED, textShadow: `${SHADOW}, ${glow(RED, 0.5, 0.6)}` }}>
          ⚠ COMANDO EXECUTADO: ROLAR
        </div>
      ) : null}
    </div>
  );
};

// ---- S09: technology... or magic? -------------------------------------------------------------
const STARS = Array.from({ length: 10 }, (_, i) => ({ a: (i / 10) * Math.PI * 2 + random(`st-a-${i}`) * 0.4, r: 170 + 200 * random(`st-r-${i}`), s: 26 + 40 * random(`st-s-${i}`), d: Math.floor(random(`st-d-${i}`) * 10) }));
const Star: React.FC<{ size: number; color: string }> = ({ size, color }) => (
  <svg width={size} height={size} viewBox="-50 -50 100 100" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
    <path d="M0 -50 Q6 -6 50 0 Q6 6 0 50 Q-6 6 -50 0 Q-6 -6 0 -50 Z" fill={color} />
  </svg>
);
export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S09;
  if (frame < from || frame > to) return null;
  const m = K("S09", "mágica");
  const f = faceAt(frame);
  const c = project(f.pos, frame);
  const recap = win(frame, m + 30, to, 14, 1) * (1 - prog(frame, K("S09", "fadeOut"), to));
  return (
    <>
      {STARS.map((s, i) => {
        const p = prog(frame, m + s.d, m + s.d + 40, easeOut);
        if (p <= 0 || p >= 1) return null;
        return (
          <div key={i} style={{ position: "absolute", left: c.x + Math.cos(s.a) * s.r * p - s.s / 2, top: c.y + Math.sin(s.a) * s.r * p - s.s / 2, opacity: Math.sin(Math.PI * p), transform: `rotate(${p * 90}deg) scale(${0.5 + p})` }}>
            <Star size={s.s} color={i % 2 ? GREEN : "#bfe0ff"} />
          </div>
        );
      })}
      {recap > 0 ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 1180, textAlign: "center", opacity: recap, fontFamily: MONO, fontWeight: 700, fontSize: 29, letterSpacing: 0, color: WHITE, textShadow: SHADOW }}>
          <div style={{ color: "#9aa3b2", fontSize: 24, letterSpacing: 4, marginBottom: 10 }}>SALVA PRA TESTAR</div>
          Ajustes <span style={{ color: BLUE }}>›</span> Acessibilidade <span style={{ color: BLUE }}>›</span> <span style={{ color: GREEN }}>Rastreamento de Cabeça</span>
        </div>
      ) : null}
    </>
  );
};
