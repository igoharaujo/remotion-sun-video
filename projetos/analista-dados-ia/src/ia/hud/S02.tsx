// S02 — the group. Speaker in the top-right corner. An anonymous member card "DBA · 25+ ANOS" (counter 0 -> 25);
// a green-phosphor CRT dated 1997 types "A PROFISSÃO VAI ACABAR", then its year rolls to 2026 on "acabar"; the AI
// core (3D, three/DarkTech) opens and swallows "CÓDIGO REPETITIVO" and "QUERY BÁSICA" one by one on their words,
// and on "dashboard" it spits out the proof: the real Copilot-in-Power-BI screenshot in a glass window.
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { CORE_SCREEN } from "../three/DarkTech";
import { DISPLAY, GLASS, MONO, SHADOW, glow } from "../style";
import { ALERT, BLUE, CYAN, GOLD, INK, K, MUTED, SC, SRC, easeIn, easeInOut, expOut, mix, prog } from "../tl";
import { GlassWindow, Seal, abs, pop } from "./ui";

const Member: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S02", "dba") - 10;
  const end = K("S02", "detalhe") + 10;
  if (f < at || f > end + 14) return null;
  const p = pop(f, at, 16);
  const o = 1 - prog(f, end, end + 14, easeIn);
  const n = Math.round(25 * prog(f, K("S02", "n25") - 24, K("S02", "n25") + 4, easeInOut));
  return (
    <div style={abs(60, 190, { width: 600, opacity: Math.min(1, p * 2) * o, transform: `translateX(${(1 - p) * -80}px)` })}>
      <div style={{ ...GLASS, borderRadius: 26, padding: "24px 28px", display: "flex", gap: 24, alignItems: "center" }}>
        <div style={{ width: 120, height: 120, borderRadius: 60, background: "linear-gradient(180deg,#3A4150,#1E222B)", border: `3px solid ${CYAN}88`, position: "relative", overflow: "hidden", flexShrink: 0 }}>
          <div style={{ position: "absolute", left: 38, top: 20, width: 44, height: 44, borderRadius: 22, background: "#6C7586" }} />
          <div style={{ position: "absolute", left: 18, top: 70, width: 84, height: 70, borderRadius: 40, background: "#6C7586" }} />
          <div style={{ position: "absolute", left: 30, top: 34, width: 60, height: 14, borderRadius: 4, background: "#0B0D12" }} />
        </div>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: MUTED }}>MEMBRO ANÔNIMO</div>
          <div style={{ ...DISPLAY, fontSize: 84, lineHeight: 1, color: INK, letterSpacing: -2 }}>DBA</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: GOLD, textShadow: glow(GOLD, 0.4) }}>{n}+ ANOS DE MERCADO</div>
        </div>
      </div>
    </div>
  );
};

const HEADLINE = "A PROFISSÃO VAI ACABAR";
const Crt: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S02", "n97") - 8;
  const roll = K("S02", "acabar1");
  const end = K("S02", "engoliu") - 16;
  if (f < at || f > end + 14) return null;
  const p = prog(f, at, at + 14, expOut);
  const o = 1 - prog(f, end, end + 14, easeIn);
  const year = Math.round(mix(1997, 2026, prog(f, roll, roll + 40, easeInOut)));
  const typed = HEADLINE.slice(0, Math.floor(HEADLINE.length * prog(f, at + 14, roll - 10, (x) => x)));
  const done = year === 2026;
  const flicker = 0.92 + 0.08 * random(`crt${f}`);
  return (
    <div style={abs(130, 650, { width: 820, height: 560, opacity: p * o, transform: `scaleY(${mix(0.02, 1, p)})` })}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 40, background: "linear-gradient(180deg,#2A2D33,#15171B)", boxShadow: "0 30px 60px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.1)" }} />
      <div style={{ position: "absolute", left: 30, top: 30, right: 30, bottom: 30, borderRadius: 30, overflow: "hidden", background: "radial-gradient(ellipse at 50% 45%, #0C2A12 0%, #04120A 75%)", opacity: flicker }}>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(180deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 5px)" }} />
        <div style={{ position: "absolute", left: 40, top: 34, fontFamily: MONO, fontSize: 26, letterSpacing: 4, color: "#56FF7A", textShadow: "0 0 10px #2BFF5C" }}>JORNAL DA TECNOLOGIA · ED. {year}</div>
        <div style={{ position: "absolute", left: 0, right: 0, top: 110, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 150, letterSpacing: 6, color: done ? "#B4FFC4" : "#56FF7A", textShadow: `0 0 18px #2BFF5C, 0 0 40px #2BFF5C88`, transform: `translateY(${done ? 0 : (random(`yr${year}`) - 0.5) * 6}px)` }}>{year}</div>
        <div style={{ position: "absolute", left: 40, right: 40, top: 320, textAlign: "center", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, fontSize: 52, lineHeight: 1.1, color: "#C8FFD2", textShadow: "0 0 12px #2BFF5C" }}>
          “{typed}
          {typed.length < HEADLINE.length && f % 30 < 15 ? "▌" : ""}
          {typed.length === HEADLINE.length ? "”" : ""}
        </div>
        {done && <div style={{ position: "absolute", right: 36, bottom: 26, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: GOLD, opacity: prog(f, roll + 40, roll + 50) }}>…E AINDA NÃO ACABOU</div>}
      </div>
    </div>
  );
};

/** A card that pops next to the core on its word, then spirals into it. */
const Swallowed: React.FC<{ at: number; label: string; sub: string; color: string; from: { x: number; y: number } }> = ({ at, label, sub, color, from }) => {
  const f = useCurrentFrame();
  if (f < at - 2 || f > at + 34) return null;
  const p = pop(f, at, 10);
  const s = prog(f, at + 14, at + 32, easeIn);
  const ang = s * 2.4;
  const dx = from.x - CORE_SCREEN.x;
  const dy = from.y - CORE_SCREEN.y;
  const x = CORE_SCREEN.x + (dx * Math.cos(ang) - dy * Math.sin(ang)) * (1 - s);
  const y = CORE_SCREEN.y + (dx * Math.sin(ang) + dy * Math.cos(ang)) * (1 - s);
  return (
    <div style={abs(x, y, { transform: `translate(-50%,-50%) scale(${mix(0.5, 1, p) * (1 - 0.85 * s)}) rotate(${s * 160}deg)`, opacity: Math.min(1, p * 2) * (1 - prog(f, at + 26, at + 33)), filter: `blur(${s * 3}px)` })}>
      <div style={{ ...GLASS, borderRadius: 18, padding: "16px 24px", whiteSpace: "nowrap", boxShadow: `${GLASS.boxShadow}, 0 0 30px ${color}55` }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 2, color, textShadow: glow(color, 0.4) }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 22, color: MUTED, marginTop: 4 }}>{sub}</div>
      </div>
    </div>
  );
};

const Copilot: React.FC = () => {
  const f = useCurrentFrame();
  const s = SRC.copilotPanel;
  const at = K("S02", "dashboard");
  const end = K("S03", "forum") + 8;
  if (f < at - 2 || f > end + 12) return null;
  const p = prog(f, at, at + 16, expOut);
  const o = 1 - prog(f, end - 4, end + 10, easeIn);
  const w = 940;
  const h = (w * 1977) / 3829 + 46;
  return (
    <>
      <GlassWindow x={70} y={700} w={w} h={h} p={p} o={o} rotY={mix(-25, -4, p)} title="Copilot no Power BI" glowColor={CYAN}>
        <Img src={staticFile(s.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </GlassWindow>
      <Seal x={90} y={700 + h + 18} at={at + 8} o={o}>
        {s.seal}
      </Seal>
    </>
  );
};

const CoreLabel: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S02", "engoliu") - 10;
  const end = K("S02", "dashboard") + 2;
  if (f < at || f > end + 8) return null;
  const o = Math.min(prog(f, at, at + 12), 1 - prog(f, end, end + 8));
  return <div style={abs(CORE_SCREEN.x, CORE_SCREEN.y + 230, { transform: "translateX(-50%)", opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 8, color: BLUE, textShadow: `${SHADOW}, ${glow(BLUE, 0.6)}` })}>IA · 2026</div>;
};

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S02.from - 10 || f > SC.S03.from + 40) return null;
  return (
    <>
      <Member />
      <Crt />
      <CoreLabel />
      <Swallowed at={K("S02", "codigo1")} label="</> CÓDIGO REPETITIVO" sub="for i in range(...)" color={CYAN} from={{ x: 300, y: 690 }} />
      <Swallowed at={K("S02", "query")} label="SELECT * FROM" sub="QUERY BÁSICA" color={ALERT} from={{ x: 640, y: 1120 }} />
      <Copilot />
    </>
  );
};
