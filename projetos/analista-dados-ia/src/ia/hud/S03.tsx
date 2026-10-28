// S03 — the data, lights down. Every number on screen is the checked one (public/images/fontes/LICENSE_CHECK.md),
// even where the voice rounds it: WEF Future of Jobs 2025 (real cover, then net growth to 2030: data entry clerks
// -26%, data analysts & scientists +41%), Gartner (by 2028, 60% of self-service analytics users on LLMs) with the
// real Copilot report screenshot, PwC AI Jobs Barometer (AI-skill wage premium +56% in 2025, +62% in 2026). Then a
// bar-chart icon shatters on "gráfico" and its pieces regroup into the "HÍBRIDO" seal.
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, INTER, MONO, SHADOW, glow } from "../style";
import { ALERT, CYAN, GOLD, GOOD, INK, K, MUTED, SC, SRC, backOut, easeIn, easeInOut, easeOut, expOut, mix, prog } from "../tl";
import { GlassWindow, Seal, abs, pop } from "./ui";

const COLORS: Record<string, string> = { alert: ALERT, good: GOOD };

// ---- WEF ---------------------------------------------------------------------------------------------------
const Wef: React.FC = () => {
  const f = useCurrentFrame();
  const cover = SRC.wefCover;
  const data = SRC.wefData;
  if (f < cover.in - 4 || f > data.out + 14) return null;
  const o = 1 - prog(f, data.out - 6, data.out + 10, easeIn);
  // cover: big on the left, then shrinks to a thumbnail top-left when the data card opens
  const p = prog(f, cover.in, cover.in + 24, expOut);
  const toThumb = prog(f, data.in - 6, data.in + 18, easeInOut);
  const cw = mix(560, 220, toThumb);
  const ch = (cw * 1600) / 1131;
  const cx = mix(90, 70, toThumb);
  const cy = mix(330, 190, toThumb);
  // data card
  const dp = prog(f, data.in, data.in + 18, expOut);
  const rows = data.rows;
  const MAXV = 41;
  return (
    <>
      <GlassWindow x={cx} y={cy} w={cw} h={ch} p={p} o={o} rotY={toThumb > 0 ? mix(mix(35, 8, p), 0, toThumb) : undefined} glowColor={CYAN}>
        <Img src={staticFile(cover.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </GlassWindow>
      <div style={abs(cx, cy + ch + 14, { opacity: 1 - toThumb })}>
        <Seal x={0} y={0} at={cover.in + 20} o={o}>
          {cover.seal}
        </Seal>
      </div>
      {dp > 0.001 && (
        <>
          <GlassWindow x={70} y={640} w={940} h={620} p={dp} o={o} rotY={mix(-30, 0, dp)} title="Future of Jobs 2025 · crescimento líquido até 2030" glowColor={CYAN}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 290, height: 3, background: "rgba(255,255,255,0.35)" }} />
            {rows.map((r, i) => {
              const at = i === 0 ? K("S03", "n50") - 20 : K("S03", "operacional") - 10;
              const g = prog(f, at, at + 26, backOut);
              const v = Math.round(r.value * prog(f, at, at + 26, easeOut));
              const c = COLORS[r.color];
              const hgt = (Math.abs(r.value) / MAXV) * 230 * g;
              const x = i === 0 ? 120 : 520;
              return (
                <div key={i} style={{ position: "absolute", left: x, top: 0, width: 300, height: 574, opacity: prog(f, at - 6, at + 4) }}>
                  <div style={{ position: "absolute", left: 70, width: 160, top: r.value < 0 ? 291 : 289 - hgt, height: hgt, borderRadius: r.value < 0 ? "0 0 14px 14px" : "14px 14px 0 0", background: `linear-gradient(${r.value < 0 ? 180 : 0}deg, ${c}55, ${c})`, boxShadow: `0 0 30px ${c}66` }} />
                  <div style={{ position: "absolute", left: 0, width: 300, top: r.value < 0 ? 90 : 320, textAlign: "center", ...DISPLAY, fontSize: 104, letterSpacing: -3, color: c, textShadow: `${SHADOW}, ${glow(c, 0.5)}` }}>
                    {v > 0 ? "+" : v < 0 ? "−" : ""}
                    {Math.abs(v)}%
                  </div>
                  <div style={{ position: "absolute", left: -20, width: 340, top: r.value < 0 ? 470 : 448, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 26, lineHeight: 1.2, letterSpacing: 1, color: INK }}>{r.label}</div>
                </div>
              );
            })}
          </GlassWindow>
          <Seal x={90} y={1276} at={data.in + 20} o={o}>
            {data.seal}
          </Seal>
        </>
      )}
    </>
  );
};

// ---- Gartner -------------------------------------------------------------------------------------------------
const Gartner: React.FC = () => {
  const f = useCurrentFrame();
  const g = SRC.gartner;
  const rep = SRC.copilotReport;
  if (f < g.in - 4 || f > g.out + 14) return null;
  const p = prog(f, g.in, g.in + 22, expOut);
  const o = 1 - prog(f, g.out - 6, g.out + 10, easeIn);
  const pct = Math.round(60 * prog(f, K("S03", "gestor") - 20, K("S03", "gestor") + 20, easeOut));
  const rp = prog(f, rep.in - 6, rep.in + 18, expOut);
  const rw = 600;
  const rh = (rw * 1036) / 2087 + 46;
  return (
    <>
      <GlassWindow x={60} y={200} w={rw} h={rh} p={rp} o={o} rotY={mix(30, 6, rp)} title="Copilot · criar relatório" glowColor={CYAN}>
        <Img src={staticFile(rep.src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </GlassWindow>
      <div style={abs(60, 200 + rh + 12, { opacity: rp * o })}>
        <Seal x={0} y={0} at={rep.in + 10} o={o}>
          {rep.seal}
        </Seal>
      </div>
      <GlassWindow x={70} y={700} w={940} h={520} p={p} o={o} rotY={mix(-32, -3, p)} glowColor={GOLD}>
        <div style={{ position: "absolute", left: 50, top: 44, display: "flex", alignItems: "center", gap: 20 }}>
          <Img src={staticFile(g.src)} style={{ height: 52, filter: "brightness(0) invert(1)" }} />
          <span style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: MUTED }}>PREDICTS 2026</span>
        </div>
        <div style={{ position: "absolute", left: 50, top: 140, fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 4, color: MUTED }}>{g.text[0]}</div>
        <div style={{ position: "absolute", left: 44, top: 180, ...DISPLAY, fontSize: 210, lineHeight: 1, letterSpacing: -8, color: GOLD, textShadow: `${SHADOW}, ${glow(GOLD, 0.5, 1.2)}` }}>{pct}%</div>
        <div style={{ position: "absolute", left: 50, top: 400, fontFamily: INTER, fontWeight: 800, fontSize: 44, lineHeight: 1.1, color: INK, opacity: prog(f, K("S03", "gestor"), K("S03", "gestor") + 12) }}>
          dos usuários de self-service
          <br />
          vão usar <span style={{ color: CYAN }}>LLMs</span>
        </div>
      </GlassWindow>
      <Seal x={90} y={1236} at={g.in + 18} o={o}>
        {g.seal}
      </Seal>
    </>
  );
};

// ---- PwC ----------------------------------------------------------------------------------------------------
const Pwc: React.FC = () => {
  const f = useCurrentFrame();
  const s = SRC.pwc;
  if (f < s.in - 4 || f > s.out + 14) return null;
  const p = prog(f, s.in, s.in + 22, expOut);
  const o = 1 - prog(f, s.out - 4, s.out + 12, easeIn);
  const a = K("S03", "n59");
  const b = K("S03", "dolares");
  const v = Math.round(mix(0, s.values[0], prog(f, a - 30, a + 10, easeOut)) + (s.values[1] - s.values[0]) * prog(f, b, b + 18, easeOut));
  const bar = (val: number, at: number) => (val / 70) * 300 * prog(f, at - 20, at + 14, backOut);
  return (
    <>
      <GlassWindow x={70} y={660} w={940} h={600} p={p} o={o} rotY={mix(30, 3, p)} title="PwC · Global AI Jobs Barometer" glowColor={GOOD}>
        <div style={{ position: "absolute", left: 50, top: 36, fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 4, color: MUTED }}>{s.label}</div>
        <div style={{ position: "absolute", left: 44, top: 90, ...DISPLAY, fontSize: 200, lineHeight: 1, letterSpacing: -8, color: GOOD, textShadow: `${SHADOW}, ${glow(GOOD, 0.5, 1.2)}` }}>+{v}%</div>
        <div style={{ position: "absolute", left: 50, top: 310, fontFamily: INTER, fontWeight: 700, fontSize: 30, lineHeight: 1.2, color: INK, width: 470 }}>
          em vagas que exigem IA,
          <br />
          <span style={{ color: MUTED }}>vs. a mesma função sem IA</span>
        </div>
        {[
          { yr: "2025", val: s.values[0], at: a, x: 600 },
          { yr: "2026", val: s.values[1], at: b, x: 740 },
        ].map((c) => (
          <div key={c.yr} style={{ position: "absolute", left: c.x, top: 0, width: 110, height: 540 }}>
            <div style={{ position: "absolute", left: 15, width: 80, bottom: 70, height: bar(c.val, c.at), borderRadius: "12px 12px 0 0", background: `linear-gradient(0deg, ${GOOD}44, ${GOOD})`, boxShadow: `0 0 26px ${GOOD}66` }} />
            <div style={{ position: "absolute", left: 0, width: 110, bottom: 74 + bar(c.val, c.at), textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, color: GOOD, opacity: prog(f, c.at, c.at + 8) }}>{c.val}%</div>
            <div style={{ position: "absolute", left: 0, width: 110, bottom: 24, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 26, color: MUTED }}>{c.yr}</div>
          </div>
        ))}
      </GlassWindow>
      <Seal x={90} y={1276} at={s.in + 18} o={o}>
        {s.seal}
      </Seal>
    </>
  );
};

// ---- chart -> HÍBRIDO -------------------------------------------------------------------------------------------
const HC = { x: 540, y: 930 };
const BARS = [110, 190, 150, 260];
const N_BITS = 48;
const BITS = Array.from({ length: N_BITS }, (_, i) => {
  const bar = i % 4;
  const k = Math.floor(i / 4) / (N_BITS / 4 - 1);
  const bx = HC.x - 150 + bar * 90;
  const by = HC.y + 140 - k * BARS[bar];
  const a = (i / N_BITS) * Math.PI * 2;
  const ra = random(`ha${i}`) * Math.PI * 2;
  return { bx, by, sx: HC.x + Math.cos(ra) * mix(260, 460, random(`hr${i}`)), sy: HC.y + Math.sin(ra) * mix(220, 380, random(`hs${i}`)), hx: HC.x + Math.cos(a) * 230, hy: HC.y + Math.sin(a) * 230, rot: (random(`hq${i}`) - 0.5) * 720 };
});

const Hybrid: React.FC = () => {
  const f = useCurrentFrame();
  const at = K("S03", "parou") - 6;
  const shatter = K("S03", "grafico") + 8;
  const join = K("S03", "hibrido1") - 4;
  const end = SC.S04.from + 30;
  if (f < at || f > end + 14) return null;
  const o = 1 - prog(f, end, end + 14, easeIn);
  const bp = pop(f, at, 14);
  const sp = prog(f, shatter, shatter + 22, expOut);
  const jp = prog(f, join, join + 22, easeInOut);
  const seal = prog(f, join + 12, join + 26, backOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {f < shatter + 1 && (
        <div style={abs(HC.x - 190, HC.y - 160, { width: 380, height: 320, opacity: bp, transform: `scale(${mix(0.6, 1, bp)})` })}>
          <div style={{ ...GLASS, position: "absolute", inset: 0, borderRadius: 28 }} />
          {BARS.map((h, i) => (
            <div key={i} style={{ position: "absolute", left: 40 + i * 90 - 20, bottom: 30, width: 60, height: h * mix(0.3, 1, bp), borderRadius: 8, background: `linear-gradient(0deg, ${CYAN}55, ${CYAN})` }} />
          ))}
        </div>
      )}
      {f >= shatter &&
        BITS.map((b, i) => {
          const x = mix(mix(b.bx, b.sx, sp), b.hx, jp);
          const y = mix(mix(b.by, b.sy, sp), b.hy, jp);
          const c = jp > 0.5 ? GOLD : CYAN;
          return <div key={i} style={abs(x - 9, y - 9, { width: 18, height: 18, borderRadius: jp > 0.6 ? 9 : 3, background: c, boxShadow: `0 0 12px ${c}`, transform: `rotate(${b.rot * sp * (1 - jp)}deg)` })} />;
        })}
      {seal > 0.001 && (
        <div style={abs(HC.x, HC.y, { transform: `translate(-50%,-50%) scale(${mix(0.4, 1, seal)})`, opacity: Math.min(1, seal * 2), textAlign: "center", width: 440 })}>
          <div style={{ ...DISPLAY, fontSize: 96, letterSpacing: -2, color: GOLD, textShadow: `${SHADOW}, ${glow(GOLD, 0.7, 1.3)}` }}>HÍBRIDO</div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: INK, marginTop: 6, textShadow: SHADOW }}>
            DADOS <span style={{ color: GOLD }}>+</span> IA <span style={{ color: GOLD }}>+</span> NEGÓCIO
          </div>
        </div>
      )}
    </div>
  );
};

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S03.from - 10 || f > SC.S04.from + 50) return null;
  return (
    <>
      <Wef />
      <Gartner />
      <Pwc />
      <Hybrid />
    </>
  );
};
