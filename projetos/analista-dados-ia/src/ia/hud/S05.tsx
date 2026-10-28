// S05 — CTA. The hook's badge comes back stamped "TRADICIONAL ✕"; on "não vai acabar" the stamp falls off, on
// "subiu" an XP bar fills and "LEVEL UP · ANALISTA HÍBRIDO" lands in gold. "O mapa exato": a roadmap lights its three
// milestones (the three checklist points) up to the "HÍBRIDO" flag. On "comenta" the screen cuts back to the speaker
// (full screen) and the giant "COMENTE: DADOS" sign sits above his head (y 220-520); "+ SEGUIR" pops on "segue".
import { useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, MONO, SHADOW, glow } from "../style";
import { ALERT, CYAN, GOLD, GOOD, INK, K, MUTED, SC, TL, WORLD_OUT, easeIn, easeInOut, expOut, mix, prog } from "../tl";
import { abs, center, pop } from "./ui";

const LevelUp: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S05", "analista3") - 10;
  const drop = K("S05", "acabar2");
  const subiu = K("S05", "subiu");
  const nivel = K("S05", "nivel");
  const end = K("S05", "mapa") - 6;
  if (f < at || f > end + 14) return null;
  const p = pop(f, at, 16);
  const o = 1 - prog(f, end, end + 14, easeIn);
  const fall = prog(f, drop, drop + 26, easeIn);
  const xp = prog(f, subiu - 6, subiu + 30, easeInOut);
  const lv = prog(f, nivel - 2, nivel + 10, expOut);
  const col = lv > 0.5 ? GOLD : CYAN;
  return (
    <div style={abs(110, 730, { width: 860, opacity: Math.min(1, p * 2) * o, transform: `scale(${mix(0.7, 1, p)})` })}>
      <div style={{ ...GLASS, borderRadius: 30, padding: "34px 40px 36px", boxShadow: `${GLASS.boxShadow}, 0 0 ${30 + 50 * lv}px ${col}55` }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 5, color: col, textShadow: glow(col, 0.5) }}>ANALISTA DE DADOS</div>
        <div style={{ ...DISPLAY, fontSize: 68, letterSpacing: -2, color: lv > 0.5 ? GOLD : MUTED, marginTop: 8, transform: `scale(${mix(1.4, 1, lv)})`, transformOrigin: "0 50%", textShadow: lv > 0.5 ? `${SHADOW}, ${glow(GOLD, 0.6)}` : SHADOW }}>{lv > 0.5 ? "HÍBRIDO" : "tradicional"}</div>
        <div style={{ marginTop: 28, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 26, color: MUTED }}>
          <span>XP</span>
          <span style={{ color: col }}>{Math.round(xp * 100)}%</span>
        </div>
        <div style={{ marginTop: 10, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
          <div style={{ width: `${xp * 100}%`, height: "100%", borderRadius: 15, background: `linear-gradient(90deg, ${CYAN}, ${GOLD})`, boxShadow: `0 0 20px ${GOLD}` }} />
        </div>
      </div>
      {/* the stamp from the hook, falling off */}
      <div style={abs(380, 50, { opacity: 1 - prog(f, drop + 14, drop + 26), transform: `translateY(${fall * 700}px) rotate(${-10 + fall * 70}deg)` })}>
        <div style={{ display: "inline-block", fontFamily: MONO, fontWeight: 700, fontSize: 42, letterSpacing: 5, color: ALERT, border: `5px solid ${ALERT}`, borderRadius: 12, padding: "6px 20px", background: "rgba(10,6,8,0.35)", textShadow: glow(ALERT, 0.5) }}>TRADICIONAL ✕</div>
      </div>
      {lv > 0.001 && (
        <div style={center(-140, { left: -110, width: 1080, ...DISPLAY, fontSize: 104, letterSpacing: -3, color: GOLD, opacity: Math.min(1, lv * 2), transform: `scale(${mix(2, 1, lv)})`, textShadow: `${SHADOW}, ${glow(GOLD, 0.8, 1.4)}` })}>LEVEL UP!</div>
      )}
    </div>
  );
};

const MILES = [
  { label: "MODELAGEM", x: 170, y: 1180 },
  { label: "PYTHON + LLMs", x: 470, y: 960 },
  { label: "NEGÓCIO", x: 250, y: 760 },
];
const FLAG = { x: 560, y: 650 };
const Roadmap: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S05", "mapa") - 4;
  const end = WORLD_OUT;
  if (f < at || f > end + 8) return null;
  const o = Math.min(prog(f, at, at + 10), 1 - prog(f, end - 2, end + 8, easeIn));
  const pts = [...MILES.map((m) => ({ x: m.x, y: m.y })), FLAG];
  const lit = (i: number) => at + 10 + i * Math.round((K("S05", "transicao") + 10 - at - 10) / 3);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const total = prog(f, at + 6, K("S05", "transicao") + 14, easeInOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={abs(70, 200, { fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: CYAN, textShadow: `${SHADOW}, ${glow(CYAN, 0.5)}` })}>O MAPA EXATO</div>
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <path d={path} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={8} strokeDasharray="4 18" strokeLinecap="round" />
        <path d={path} fill="none" stroke={CYAN} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - total} style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }} />
      </svg>
      {MILES.map((m, i) => {
        const p = pop(f, lit(i), 12);
        return (
          <div key={m.label} style={abs(m.x, m.y, { transform: "translate(-50%,-50%)" })}>
            <div style={{ width: 54, height: 54, borderRadius: 27, background: p > 0.5 ? GOOD : "rgba(255,255,255,0.15)", border: `4px solid ${p > 0.5 ? "#C9FFE9" : "rgba(255,255,255,0.3)"}`, boxShadow: p > 0.5 ? `0 0 30px ${GOOD}` : undefined, transform: `scale(${mix(0.8, 1.15, p)})`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 24, color: "#08100C" }}>{i + 1}</div>
            <div style={abs(70, 6, { whiteSpace: "nowrap", fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 2, color: p > 0.5 ? INK : MUTED, opacity: 0.4 + 0.6 * p, textShadow: SHADOW })}>{m.label}</div>
          </div>
        );
      })}
      <div style={abs(FLAG.x, FLAG.y, { transform: `translate(-20%,-90%) scale(${mix(0.5, 1, pop(f, lit(3), 12))})`, opacity: prog(f, lit(3) - 4, lit(3) + 6), ...DISPLAY, fontSize: 64, color: GOLD, textShadow: `${SHADOW}, ${glow(GOLD, 0.7)}` })}>⚑ HÍBRIDO</div>
    </div>
  );
};

const SIGN = TL.ctaSign;
const CtaSign: React.FC = () => {
  const f = useCurrentFrame();
  const at = SIGN.in;
  if (f < at - 2) return null;
  const a = prog(f, at, at + 9, expOut);
  const d = K("S05", "dados_cta");
  const b = prog(f, d - 2, d + 9, expOut);
  const pulse = f >= d ? 0.6 + 0.4 * Math.sin((f - d) / 7) : 0;
  const seg = K("S05", "segue");
  const sp = pop(f, seg, 12);
  return (
    <>
      <div style={center(SIGN.pos.y[0], { opacity: Math.min(1, a * 3) })}>
        <div style={{ ...DISPLAY, fontSize: 96, lineHeight: 1, color: INK, transform: `scale(${mix(2, 1, a)})`, textShadow: SHADOW }}>{SIGN.text[0]}</div>
        <div style={{ ...DISPLAY, fontSize: 190, lineHeight: 1, letterSpacing: -6, color: GOOD, marginTop: 6, opacity: Math.min(1, b * 3 + (f >= d ? 0 : 0.25)), transform: `scale(${mix(1.8, 1, b)})`, textShadow: `${SHADOW}, ${glow(GOOD, 0.5 + 0.5 * pulse, 1.4)}` }}>{SIGN.text[1]}</div>
      </div>
      {sp > 0.001 && (
        <div style={center(548, { opacity: Math.min(1, sp * 2), transform: `scale(${mix(0.6, 1, sp)})` })}>
          <span style={{ ...GLASS, display: "inline-block", padding: "10px 30px", borderRadius: 999, fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 4, color: CYAN, textShadow: glow(CYAN, 0.5) }}>+ SEGUIR</span>
        </div>
      )}
    </>
  );
};

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S05.from - 10) return null;
  return (
    <>
      <LevelUp />
      <Roadmap />
      <CtaSign />
    </>
  );
};
