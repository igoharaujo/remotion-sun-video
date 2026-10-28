// S04 — the solution, lights up. "MUDE O QUE VOCÊ ESTUDA" slams top-left, shrinks to an "EM 3 PONTOS" tag; a glass
// 3D checklist drops in (slight perspective) and each row goes ✕ (red, struck through) -> ✓ (green) on the spoken
// words, with a small glyph per row (star schema, Python <-> LLM, $). The real code-screen photo sits blurred behind
// row 02. Then the checklist leaves for the split: the AI's answer in code vs. the human's question, "?" -> "$ LUCRO".
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, MONO, SHADOW, glow } from "../style";
import { ALERT, BLUE, CHECKLIST, CYAN, GOLD, GOOD, INK, K, MUTED, SC, SRC, backOut, easeIn, easeInOut, expOut, mix, prog } from "../tl";
import { abs, pop } from "./ui";

const Title: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S04", "mudar") - 4;
  const tres = K("S04", "tres");
  const end = K("S04", "resposta2") - 20;
  if (f < at || f > end + 12) return null;
  const o = 1 - prog(f, end, end + 12, easeIn);
  const a = prog(f, at, at + 9, expOut);
  const shrink = prog(f, tres - 4, tres + 16, easeInOut);
  return (
    <div style={abs(70, 200, { opacity: o, transformOrigin: "0 0", transform: `scale(${mix(1, 0.78, shrink)})` })}>
      <div style={{ ...DISPLAY, fontSize: 90, lineHeight: 0.98, letterSpacing: -3, color: INK, opacity: Math.min(1, a * 3), transform: `scale(${mix(2, 1, a)})`, transformOrigin: "0 50%", textShadow: SHADOW }}>
        MUDE O QUE
        <br />
        <span style={{ color: CYAN, textShadow: `${SHADOW}, ${glow(CYAN, 0.6, 1.2)}` }}>VOCÊ ESTUDA</span>
      </div>
      <div style={{ marginTop: 18, display: "inline-block", fontFamily: MONO, fontWeight: 700, fontSize: 46, letterSpacing: 6, color: GOLD, border: `4px solid ${GOLD}`, borderRadius: 14, padding: "6px 22px", opacity: prog(f, tres, tres + 6), transform: `scale(${mix(1.6, 1, prog(f, tres, tres + 10, expOut))})`, transformOrigin: "0 50%", textShadow: glow(GOLD, 0.5) }}>EM 3 PONTOS</div>
    </div>
  );
};

const StarSchema: React.FC<{ p: number }> = ({ p }) => (
  <svg width={130} height={110} viewBox="-65 -55 130 110" style={{ opacity: p }}>
    {[
      [-46, -36],
      [46, -36],
      [-46, 36],
      [46, 36],
    ].map(([x, y], i) => (
      <g key={i}>
        <line x1={0} y1={0} x2={x * p} y2={y * p} stroke={GOOD} strokeWidth={3} />
        <rect x={x * p - 14} y={y * p - 10} width={28} height={20} rx={4} fill="none" stroke={GOOD} strokeWidth={3} />
      </g>
    ))}
    <rect x={-20} y={-14} width={40} height={28} rx={5} fill={GOOD} />
  </svg>
);
const PyLlm: React.FC<{ p: number }> = ({ p }) => (
  <svg width={150} height={110} viewBox="0 0 150 110" style={{ opacity: p }}>
    <text x={8} y={68} fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={34} fill={GOOD}>
      py
    </text>
    <path d={`M58 55 L${58 + 40 * p} 55`} stroke={GOOD} strokeWidth={4} strokeDasharray="6 6" />
    <circle cx={118} cy={55} r={24 * p} fill="none" stroke={GOOD} strokeWidth={4} />
    <text x={118} y={64} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight={700} fontSize={22} fill={GOOD} opacity={p}>
      AI
    </text>
  </svg>
);
const Coin: React.FC<{ p: number }> = ({ p }) => (
  <svg width={110} height={110} viewBox="-55 -55 110 110" style={{ opacity: p }}>
    <circle r={38 * p} fill="none" stroke={GOOD} strokeWidth={5} />
    <text y={16} textAnchor="middle" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={46} fill={GOOD}>
      $
    </text>
  </svg>
);
const GLYPHS = [StarSchema, PyLlm, Coin];

const ROW_H = 200;
const PANEL = { x: 70, y: 640, w: 940 };

const Row: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const r = CHECKLIST.rows[i];
  const xf = r.x.f;
  const cf = r.check.f;
  const isX = f >= xf - 2 && f < cf - 2;
  const isCheck = f >= cf - 2;
  const xp = pop(f, xf, 10);
  const strike = prog(f, xf + 6, xf + 18, easeInOut);
  const cp = prog(f, cf - 2, cf + 12, backOut);
  const Glyph = GLYPHS[i];
  const active = isX || isCheck;
  return (
    <div style={{ position: "relative", height: ROW_H, display: "flex", alignItems: "center", gap: 26, padding: "0 36px", borderTop: i ? "1px solid rgba(255,255,255,0.12)" : undefined, background: isCheck ? `linear-gradient(90deg, ${GOOD}${Math.round(0x22 * cp).toString(16).padStart(2, "0")}, transparent 70%)` : undefined }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, color: active ? INK : MUTED, width: 64 }}>{r.n}</div>
      <div style={{ width: 84, height: 84, borderRadius: 18, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: `4px solid ${isCheck ? GOOD : isX ? ALERT : "rgba(255,255,255,0.25)"}`, background: isCheck ? `${GOOD}33` : isX ? `${ALERT}22` : "transparent", boxShadow: isCheck ? `0 0 30px ${GOOD}88` : isX ? `0 0 24px ${ALERT}66` : undefined, fontFamily: MONO, fontWeight: 700, fontSize: 56, color: isCheck ? GOOD : ALERT, transform: `scale(${isCheck ? mix(1.5, 1, cp) : isX ? mix(1.5, 1, xp) : 1})` }}>
        {isCheck ? "✓" : isX ? "✕" : ""}
      </div>
      <div style={{ position: "relative", flex: 1, height: ROW_H }}>
        {!active && <div style={{ position: "absolute", top: 84, height: 18, width: 380, borderRadius: 9, background: "rgba(255,255,255,0.12)" }} />}
        {isX && (
          <div style={{ position: "absolute", top: 0, height: ROW_H, display: "flex", alignItems: "center", opacity: Math.min(1, xp * 2) }}>
            <div style={{ position: "relative", fontFamily: MONO, fontWeight: 700, fontSize: 38, lineHeight: 1.1, color: ALERT, textShadow: glow(ALERT, 0.35), maxWidth: 520 }}>
              {r.x.label}
              <div style={{ position: "absolute", left: -6, right: -6, top: "50%", height: 6, borderRadius: 3, background: ALERT, transform: `scaleX(${strike})`, transformOrigin: "0 50%" }} />
            </div>
          </div>
        )}
        {isCheck && (
          <div style={{ position: "absolute", top: 0, height: ROW_H, display: "flex", alignItems: "center", opacity: Math.min(1, cp * 2), transform: `translateX(${(1 - cp) * 40}px)` }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 42, lineHeight: 1.1, color: GOOD, textShadow: glow(GOOD, 0.45), maxWidth: 480 }}>{r.check.label}</div>
          </div>
        )}
      </div>
      <div style={{ width: 150, display: "flex", justifyContent: "center" }}>{isCheck && <Glyph p={prog(f, cf + 4, cf + 24, expOut)} />}</div>
    </div>
  );
};

const Checklist: React.FC = () => {
  const f = useCurrentFrame();
  const at = CHECKLIST.in;
  const end = K("S04", "resposta2") - 14;
  if (f < at - 6 || f > end + 16) return null;
  const p = prog(f, at - 6, at + 22, expOut);
  const out = prog(f, end, end + 16, easeIn);
  return (
    <div style={abs(PANEL.x, PANEL.y, { width: PANEL.w, perspective: 1800, opacity: Math.min(1, p * 2) * (1 - out) })}>
      <div style={{ ...GLASS, borderRadius: 30, overflow: "hidden", transform: `translateY(${mix(-500, 0, p) - out * 300}px) rotateX(${mix(40, 7, p) + out * 20}deg) rotateY(${-3 + 1.5 * Math.sin(f / 60)}deg)`, transformOrigin: "50% 0", boxShadow: `${GLASS.boxShadow}, 0 0 60px ${CYAN}33` }}>
        {[0, 1, 2].map((i) => (
          <Row key={i} i={i} />
        ))}
      </div>
    </div>
  );
};

const CodeBackdrop: React.FC = () => {
  const f = useCurrentFrame();
  const s = SRC.codeScreen;
  if (f < s.in - 10 || f > s.out + 20) return null;
  const o = Math.min(prog(f, s.in - 10, s.in + 14), 1 - prog(f, s.out, s.out + 20, easeIn));
  return <Img src={staticFile(s.src)} style={{ position: "absolute", left: -60, top: 560, width: 1200, height: 800, objectFit: "cover", opacity: 0.32 * o, filter: "blur(6px) saturate(0.8)", WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)", maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 40%, transparent 100%)", transform: `scale(${1 + 0.0006 * (f - s.in)})` }} />;
};

// ---- split: answer (AI) vs question (human) ------------------------------------------------------------------
const CODE = ["SELECT regiao,", "  SUM(receita)", "FROM vendas", "GROUP BY 1", "ORDER BY 2 DESC;"];
const Split: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S04", "resposta2") - 6;
  const hum = K("S04", "humano");
  const lucro = K("S04", "lucro");
  const end = SC.S04.to;
  if (f < at || f > end + 14) return null;
  const o = 1 - prog(f, end - 6, end + 12, easeIn);
  const lp = pop(f, at, 14);
  const rp = pop(f, hum - 4, 14);
  const chars = Math.floor(prog(f, at + 6, K("S04", "codigo2") + 30, (x) => x) * CODE.join("\n").length);
  let left = chars;
  const flip = prog(f, lucro - 2, lucro + 12, expOut);
  const pulse = 1 + 0.06 * Math.sin(f / 5);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={abs(60, 720, { width: 440, opacity: Math.min(1, lp * 2), transform: `translateX(${(1 - lp) * -120}px)` })}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: BLUE, marginBottom: 12, textShadow: SHADOW }}>IA → RESPOSTA</div>
        <div style={{ ...GLASS, borderRadius: 22, padding: "24px 26px", height: 380, boxSizing: "border-box", fontFamily: MONO, fontSize: 30, lineHeight: 1.5, color: "#BFD8FF" }}>
          {CODE.map((l, i) => {
            const show = l.slice(0, Math.max(0, left));
            left -= l.length + 1;
            return (
              <div key={i} style={{ whiteSpace: "pre" }}>
                <span style={{ color: i === 0 || i === 2 || i === 3 || i === 4 ? CYAN : "#BFD8FF" }}>{show}</span>
                {left < 0 && left > -l.length - 2 && f % 30 < 16 ? "▌" : ""}
              </div>
            );
          })}
        </div>
      </div>
      <div style={abs(530, 720, { width: 430, opacity: Math.min(1, rp * 2), transform: `translateX(${(1 - rp) * 120}px)` })}>
        <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: GOLD, marginBottom: 12, textShadow: SHADOW }}>HUMANO → PERGUNTA</div>
        <div style={{ ...GLASS, borderRadius: 22, height: 380, display: "flex", alignItems: "center", justifyContent: "center", perspective: 1000, boxShadow: `${GLASS.boxShadow}, 0 0 ${40 * flip}px ${GOLD}66` }}>
          <div style={{ transform: `rotateY(${flip * 180}deg)`, transformStyle: "preserve-3d", position: "relative", width: 340, height: 300 }}>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", display: "flex", alignItems: "center", justifyContent: "center", ...DISPLAY, fontSize: 260, color: INK, transform: `scale(${pulse})`, textShadow: `${SHADOW}, ${glow(GOLD, 0.3)}` }}>?</div>
            <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div style={{ ...DISPLAY, fontSize: 170, lineHeight: 1, color: GOLD, textShadow: `${SHADOW}, ${glow(GOLD, 0.8, 1.4)}` }}>$</div>
              <div style={{ ...DISPLAY, fontSize: 84, letterSpacing: -2, color: GOLD, textShadow: `${SHADOW}, ${glow(GOLD, 0.6)}` }}>LUCRO</div>
            </div>
          </div>
        </div>
      </div>
      {f >= lucro &&
        Array.from({ length: 16 }, (_, i) => {
          const d = f - lucro;
          const a = (i / 16) * Math.PI * 2 + random(`ca${i}`);
          const r = mix(0, 260 + 80 * random(`cr${i}`), prog(f, lucro, lucro + 30, expOut));
          return (
            <div key={i} style={abs(745 + Math.cos(a) * r - 16, 910 + Math.sin(a) * r - 16 + 0.15 * d * d * 0.2, { width: 32, height: 32, borderRadius: 16, background: `radial-gradient(circle at 35% 35%, #FFF1B8, ${GOLD} 60%, #A87A12)`, opacity: 1 - prog(f, lucro + 20, lucro + 44), fontFamily: MONO, fontWeight: 700, fontSize: 20, color: "#6B4A00", display: "flex", alignItems: "center", justifyContent: "center" })}>
              $
            </div>
          );
        })}
    </div>
  );
};

export const S04: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S04.from - 10 || f > SC.S05.from + 20) return null;
  return (
    <>
      <CodeBackdrop />
      <Title />
      <Checklist />
      <Split />
    </>
  );
};
