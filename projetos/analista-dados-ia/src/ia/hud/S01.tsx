// S01 — hook. Full screen: "EXTINTO OU SEGURO?" slams in over the speaker and a glass "ANALISTA DE DADOS" badge
// spins in on top. From "cruzei" (speaker in the PiP, right): anonymous chat bubbles from a closed group stack in the
// left column and a market data line sweeps across them, sparking where they cross; the US dot map (3D) lights up
// with "MERCADO EUA · 2026"; then the badge comes back with a live ECG that flatlines on "morreu" + "TRADICIONAL ✕".
import { random, useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, INTER, MONO, SHADOW, glow } from "../style";
import { ALERT, CYAN, GOLD, GOOD, INK, K, MUTED, SC, TL, WORLD_IN, easeIn, expOut, mix, prog } from "../tl";
import { Chip, Stamp, abs, center, pop } from "./ui";

const HOOK = TL.hookTitle;

const HookTitle: React.FC = () => {
  const f = useCurrentFrame();
  if (f < HOOK.in || f > HOOK.out + 12) return null;
  const o = 1 - prog(f, HOOK.out - 4, HOOK.out + 10, easeIn);
  const slam = (at: number) => prog(f, at, at + 9, expOut);
  const a = slam(HOOK.in);
  const b = slam(HOOK.in + 10);
  const jitter = (s: string) => (f - HOOK.in < 18 ? (random(`${s}${f}`) - 0.5) * 10 : 0);
  return (
    <div style={center(HOOK.pos.y[0], { opacity: o })}>
      <div style={{ ...DISPLAY, fontSize: 168, lineHeight: 0.95, color: ALERT, opacity: Math.min(1, a * 3), transform: `scale(${mix(2.2, 1, a)}) translateX(${jitter("a")}px)`, textShadow: `${-6 + jitter("r")}px 0 0 rgba(61,217,255,0.55), ${SHADOW}, ${glow(ALERT, 0.6, 1.2)}` }}>EXTINTO</div>
      <div style={{ ...DISPLAY, fontSize: 112, lineHeight: 1.05, color: INK, opacity: Math.min(1, b * 3), transform: `scale(${mix(2.2, 1, b)})`, textShadow: SHADOW, marginTop: 6 }}>
        OU <span style={{ color: GOOD, textShadow: `${SHADOW}, ${glow(GOOD, 0.6, 1.2)}` }}>SEGURO?</span>
      </div>
    </div>
  );
};

/** Glass badge: spins in on Y over the speaker's head, leaves when the speaker shrinks. */
const TopBadge: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S01", "analista1");
  if (f < at - 2 || f > WORLD_IN + 12) return null;
  const p = prog(f, at - 2, at + 26, expOut);
  const o = 1 - prog(f, WORLD_IN - 4, WORLD_IN + 10, easeIn);
  return (
    <div style={center(150, { perspective: 1200, opacity: Math.min(1, p * 2) * o })}>
      <div style={{ ...GLASS, display: "inline-flex", alignItems: "center", gap: 18, padding: "16px 34px", borderRadius: 22, transform: `rotateY(${mix(540, 0, p) + 8 * Math.sin(f / 30)}deg)`, fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 5, color: CYAN, textShadow: glow(CYAN, 0.5), boxShadow: `${GLASS.boxShadow}, 0 0 40px ${CYAN}44` }}>
        <svg width="40" height="34" viewBox="0 0 40 34">
          {[10, 20, 14, 28].map((h, i) => (
            <rect key={i} x={i * 10 + 1} y={34 - h} width="7" height={h} rx="2" fill={CYAN} />
          ))}
        </svg>
        ANALISTA DE DADOS
      </div>
    </div>
  );
};

// ---- chat bubbles x data line -----------------------------------------------------------------------------
const BUBBLES = [
  { who: "DBA", w: 360, lines: [0.9, 0.6] },
  { who: "DATA ENG", w: 400, lines: [0.8, 0.95, 0.4] },
  { who: "BI LEAD", w: 330, lines: [0.7] },
  { who: "CIENTISTA", w: 390, lines: [0.95, 0.5] },
  { who: "ANALISTA SR", w: 350, lines: [0.85, 0.6] },
];
const COL = { x: 60, y: 700, w: 460 };
const bubbleY = (i: number) => COL.y + i * 124;

const Bubble: React.FC<{ i: number; at: number; o: number }> = ({ i, at, o }) => {
  const f = useCurrentFrame();
  const b = BUBBLES[i];
  const p = pop(f, at, 14);
  if (p <= 0.001) return null;
  const left = i % 2 ? 60 : 0;
  return (
    <div style={abs(COL.x + left - (1 - p) * 260, bubbleY(i), { opacity: Math.min(1, p * 2) * o, display: "flex", gap: 12, alignItems: "flex-start" })}>
      <div style={{ width: 52, height: 52, borderRadius: 26, background: "linear-gradient(180deg,#5B6372,#30353F)", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 16, top: 9, width: 20, height: 20, borderRadius: 10, background: "#8A93A3" }} />
        <div style={{ position: "absolute", left: 8, top: 32, width: 36, height: 30, borderRadius: 18, background: "#8A93A3" }} />
      </div>
      <div style={{ ...GLASS, width: b.w - 64, padding: "12px 18px 14px", borderRadius: "6px 22px 22px 22px", background: "linear-gradient(180deg, rgba(60,66,80,0.75), rgba(30,34,44,0.8))" }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 18, letterSpacing: 2, color: GOLD, marginBottom: 8 }}>{b.who}</div>
        {b.lines.map((l, k) => (
          <div key={k} style={{ height: 11, width: `${l * 100}%`, borderRadius: 6, background: "#AEB6C4", opacity: 0.55, filter: "blur(2.5px)", marginBottom: 8 }} />
        ))}
      </div>
    </div>
  );
};

// The market line: a jagged up-trend drawn right -> left across the bubbles; sparks where it crosses each one.
const LINE_PTS = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12;
  return { x: mix(530, 70, t), y: mix(1230, 760, t) + (random(`ly${i}`) - 0.5) * 120 };
});
const lineAt = (t: number) => {
  const s = t * (LINE_PTS.length - 1);
  const i = Math.min(LINE_PTS.length - 2, Math.floor(s));
  const k = s - i;
  return { x: mix(LINE_PTS[i].x, LINE_PTS[i + 1].x, k), y: mix(LINE_PTS[i].y, LINE_PTS[i + 1].y, k) };
};

const Sparks: React.FC<{ x: number; y: number; at: number; o: number }> = ({ x, y, at, o }) => {
  const f = useCurrentFrame();
  const d = f - at;
  if (d < 0 || d > 30) return null;
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + random(`sa${at}${i}`);
        const r = mix(0, 70 + 40 * random(`sr${at}${i}`), prog(f, at, at + 22, expOut));
        const life = 1 - d / 30;
        return <div key={i} style={abs(x + Math.cos(a) * r - 3, y + Math.sin(a) * r - 3, { width: 6, height: 6, borderRadius: 3, background: "#FFF3C4", boxShadow: `0 0 12px ${GOLD}`, opacity: life * o })} />;
      })}
      <div style={abs(x - 40, y - 40, { width: 80, height: 80, borderRadius: 40, background: `radial-gradient(circle, #FFFFFFcc, ${GOLD}55 40%, transparent 70%)`, opacity: (1 - d / 14) * o })} />
    </>
  );
};

const ChatCross: React.FC = () => {
  const f = useCurrentFrame();
  const from = K("S01", "mensagens") - 4;
  const end = K("S01", "talvez") + 10;
  if (f < from || f > end + 16) return null;
  const o = 1 - prog(f, end, end + 16, easeIn);
  const step = (K("S01", "especialistas") + 30 - from) / BUBBLES.length;
  const lf = K("S01", "especialistas") + 96;
  const lp = prog(f, lf, lf + 50, (x) => x);
  const n = Math.max(2, Math.ceil(lp * (LINE_PTS.length - 1)) + 1);
  const pts = LINE_PTS.slice(0, n).map((p, i) => (i === n - 1 ? lineAt(lp) : p));
  const crossings = [1, 2, 3].map((i) => ({ i, at: lf + Math.round(((i + 0.6) / BUBBLES.length) * 50) }));
  return (
    <>
      <Chip x={COL.x} y={COL.y - 90} p={pop(f, K("S01", "grupo1"))} o={o * (1 - prog(f, K("S01", "americano") - 20, K("S01", "americano") - 6))} color={GOLD} size={28}>
        🔒 GRUPO FECHADO
      </Chip>
      {BUBBLES.map((_, i) => (
        <Bubble key={i} i={i} at={from + Math.round(i * step)} o={o} />
      ))}
      {lp > 0 && (
        <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: o }}>
          <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={CYAN} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 10px ${CYAN})` }} />
          {lp < 1 && <circle cx={lineAt(lp).x} cy={lineAt(lp).y} r={11} fill="#E8FBFF" style={{ filter: `drop-shadow(0 0 14px ${CYAN})` }} />}
        </svg>
      )}
      {crossings.map(({ i, at }) => {
        const p = lineAt(prog(at, lf, lf + 50, (x) => x));
        return <Sparks key={i} x={p.x} y={p.y} at={at} o={o} />;
      })}
      <div style={abs(COL.x, 1290, { opacity: prog(f, lf, lf + 12) * o, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 3, color: CYAN, textShadow: SHADOW })}>DADOS DE MERCADO ↗</div>
    </>
  );
};

const UsLabel: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S01", "americano");
  const end = K("S01", "talvez") + 10;
  if (f < at - 4 || f > end + 20) return null;
  const o = 1 - prog(f, end, end + 20, easeIn);
  const yr = K("S01", "n2026");
  return (
    <>
      <Chip x={300} y={250} p={pop(f, at)} o={o} color={CYAN} anchor="center" size={30}>
        MERCADO EUA
      </Chip>
      <div style={abs(620, 440, { transform: `translateX(-50%) scale(${mix(1.8, 1, prog(f, yr, yr + 9, expOut))})`, opacity: prog(f, yr, yr + 4) * o, ...DISPLAY, fontSize: 92, color: INK, textShadow: `${SHADOW}, ${glow(CYAN, 0.6, 1.2)}` })}>2026</div>
    </>
  );
};

// ---- ECG badge -----------------------------------------------------------------------------------------------
const ECG_W = 440;
const beat = (x: number) => {
  const u = ((x % 150) + 150) % 150;
  if (u < 40) return 0;
  if (u < 48) return -10 * Math.sin(((u - 40) / 8) * Math.PI);
  if (u < 54) return 12 * ((u - 48) / 6);
  if (u < 60) return 12 - 82 * ((u - 54) / 6);
  if (u < 67) return -70 + 96 * ((u - 60) / 7);
  if (u < 72) return 26 - 26 * ((u - 67) / 5);
  if (u < 95) return -14 * Math.sin(((u - 72) / 23) * Math.PI);
  return 0;
};

const EcgBadge: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S01", "resposta");
  const dead = K("S01", "morreu");
  const end = SC.S02.from + 14;
  if (f < at - 4 || f > end) return null;
  const p = pop(f, at, 16);
  const o = 1 - prog(f, end - 16, end, easeIn);
  const amp = 1 - prog(f, dead - 2, dead + 6, expOut);
  const sick = prog(f, K("S01", "tradicional"), dead, (x) => x);
  const col = amp < 0.5 ? ALERT : sick > 0.3 ? "#FFB347" : GOOD;
  const scroll = f * 5 * (amp > 0.01 ? 1 : 0);
  const pts = Array.from({ length: 111 }, (_, i) => {
    const x = (i / 110) * ECG_W;
    return `${x},${70 + beat(x + scroll) * amp * mix(1, 1.4, sick)}`;
  }).join(" ");
  const bpm = Math.round(mix(78, 41, sick) * (amp > 0.05 ? 1 : 0));
  return (
    <div style={abs(COL.x, 760, { width: 470, opacity: Math.min(1, p * 2) * o, transform: `scale(${mix(0.7, 1, p)})`, transformOrigin: "0 50%" })}>
      <div style={{ ...GLASS, borderRadius: 26, padding: "22px 24px 18px", boxShadow: `${GLASS.boxShadow}, 0 0 40px ${col}33` }}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: CYAN }}>ANALISTA DE DADOS</div>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 24, color: MUTED, marginTop: 4 }}>perfil tradicional</div>
        <svg width={ECG_W} height={140} style={{ marginTop: 10, overflow: "visible" }}>
          <polyline points={pts} fill="none" stroke={col} strokeWidth={5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${col})` }} />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 26, color: col }}>
          <span>♥ {bpm} BPM</span>
          <span>{amp < 0.05 ? "SEM SINAL" : "MONITORANDO"}</span>
        </div>
      </div>
      <div style={{ position: "absolute", left: 40, top: 150 }}>
        <Stamp at={dead + 4} color={ALERT} size={46} rot={-10}>
          TRADICIONAL ✕
        </Stamp>
      </div>
    </div>
  );
};

export const S01: React.FC = () => {
  const f = useCurrentFrame();
  if (f > SC.S02.from + 20) return null;
  return (
    <>
      <ChatCross />
      <UsLabel />
      <EcgBadge />
      <TopBadge />
      <HookTitle />
    </>
  );
};
