// Per-scene 2D layer over the 3D window field: hero type, UI chips anchored to the 3D hero windows,
// the cursor, the tab strip close-ups (S04/S05), the choking PC (S06), the tab counter (S07), the
// shopping-center browser (S08) and the typed CTA (S09). Timings all come from timeline.json.
import { random, useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, INTER, MONO, SHADOW, glow } from "../style";
import { CLOSE_UV } from "../three/atlas";
import { CLOSED, MULTIPLY, heroBlendAt, heroIndex, windowPoint, windowRect } from "../three/field";
import { ALERT, BLUE, BLUE_GLOW, FPS, INK, K, MUTED, PAUSE, SC, backOut, blackoutAt, easeIn, easeInOut, easeOut, expOut, kickAt, mix, prog, stutterFrame, win } from "../tl";
import { Bubble, Calendar, Clock, Copy, Cursor, DocIcon, FourPanes, Layers, Pan, PaperPlane, Spinner } from "./icons";

const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
const center = (y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: 60, width: 960, top: y, textAlign: "center", ...extra });

/** UI chip (frosted pill with icon + mono label), centred on (x, y). */
const Chip: React.FC<{ x: number; y: number; p: number; o?: number; icon?: React.ReactNode; color?: string; children: React.ReactNode }> = ({ x, y, p, o = 1, icon, color = INK, children }) => {
  if (p <= 0.001 || o <= 0.001) return null;
  return (
    <div style={abs(x, y, { transform: `translate(-50%, -50%) scale(${mix(0.6, 1, p)})`, opacity: Math.min(1, p * 1.5) * o })}>
      <div
        style={{
          ...GLASS,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 26px",
          borderRadius: 999,
          whiteSpace: "nowrap",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: 3,
          color,
        }}
      >
        {icon}
        {children}
      </div>
    </div>
  );
};

// ---- S01 hook: 47 ABAS ABERTAS → UM PROBLEMA. ------------------------------------------------------
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const n47 = K("S01", "n47");
  const abas = K("S01", "abas");
  const prob = K("S01", "problema");
  const end = SC.S01.to;
  if (f < n47 - 1 || f > end) return null;
  const slam = prog(f, n47, n47 + 8, expOut);
  const out47 = prog(f, prob - 5, prob + 3, easeIn);
  const pAbas = prog(f, abas, abas + 10, expOut);
  const p2 = prog(f, prob, prob + 8, expOut);
  const exit = prog(f, end - 16, end, easeIn);
  return (
    <>
      {out47 < 1 && (
        <div style={center(500, { opacity: (1 - out47) })}>
          <div style={{ ...DISPLAY, fontSize: 420, lineHeight: 0.92, letterSpacing: -18, color: INK, transform: `scale(${mix(1.8, 1, slam) * (1 + 0.35 * out47)})`, opacity: Math.min(1, slam * 3), textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.35 * (1 + kickAt(f, n47, 10)), 1.4)}` }}>
            47
          </div>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 76, letterSpacing: 16, color: BLUE, marginTop: 10, opacity: pAbas, transform: `translateY(${(1 - pAbas) * 40}px)`, textShadow: `${SHADOW}, ${glow(BLUE, 0.6)}` }}>
            ABAS ABERTAS
          </div>
        </div>
      )}
      {f >= prob && (
        <div style={center(600, { opacity: 1 - exit, transform: `translateY(${-30 * exit}px)` })}>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 52, letterSpacing: 20, color: MUTED, opacity: p2, textShadow: SHADOW }}>UM</div>
          <div style={{ ...DISPLAY, fontSize: 172, lineHeight: 1.05, color: INK, transform: `scale(${mix(1.5, 1, p2)})`, opacity: Math.min(1, p2 * 3), textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.3, 1.2)}` }}>
            PROBLEMA.
          </div>
        </div>
      )}
    </>
  );
};

// ---- S02 the mural: chips on the hero windows ------------------------------------------------------
const heroChip = (name: string, f: number, dy = 52) => {
  const r = windowRect(heroIndex(name), f);
  return { x: r.x + r.w / 2, y: r.y + r.h + dy, o: heroBlendAt(name, f) * Math.min(1, r.alpha * 1.5) };
};

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S02.from || f > SC.S02.to + 30) return null;
  const pesq = heroChip("pesquisa", f);
  const tres = heroChip("tres1", f, 74);
  const duas = heroChip("duas1", f);
  const esq = K("S02", "esqueceu");
  const toast = win(f, esq - 4, SC.S02.to + 20, 16, 14);
  const toastIn = prog(f, esq - 4, esq + 12, backOut);
  return (
    <>
      <Chip x={pesq.x} y={pesq.y} o={pesq.o} p={prog(f, K("S02", "ontem") - 4, K("S02", "ontem") + 10, backOut)} icon={<Clock />}>
        LER ONTEM
      </Chip>
      <Chip x={tres.x} y={tres.y} o={tres.o} p={prog(f, K("S02", "depois") - 4, K("S02", "depois") + 10, backOut)} icon={<Layers />}>
        ×3 · VER DEPOIS
      </Chip>
      <Chip x={duas.x} y={duas.y} o={duas.o} color={BLUE_GLOW} p={prog(f, K("S02", "site") + 10, K("S02", "site") + 24, backOut)} icon={<Copy />}>
        DUPLICADA
      </Chip>
      {toast > 0.001 && (
        <div style={abs(110, mix(150, 230, toastIn), { width: 860, opacity: toast })}>
          <div style={{ ...GLASS, borderRadius: 30, padding: "22px 28px", display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${BLUE}33`, border: `2px solid ${BLUE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Copy size={36} color={BLUE_GLOW} />
            </div>
            <div style={{ fontFamily: INTER }}>
              <div style={{ fontWeight: 700, fontSize: 36, color: INK }}>Você já abriu esta página</div>
              <div style={{ fontWeight: 500, fontSize: 26, color: MUTED, marginTop: 4 }}>em outra aba · há 2 horas</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---- S03 recipe / docs / close one → three open -----------------------------------------------------
const TICK0 = 96 * 3600 + 14 * 60 + 7; // "aberta há 96:14:07"
const hms = (s: number) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, "0")).join(":");

export const S03: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S03.from - 10 || f > SC.S03.to + 20) return null;
  const rec = heroChip("receita", f);
  const docs = heroChip("docs", f);
  const nunca = K("S03", "nunca");
  const seg = K("S03", "segunda");
  const close = K("S03", "closeTab");
  const greyed = prog(f, nunca, nunca + 10);
  // Cursor: glides in from the lower right to the × of the closing window, clicks, then drifts off.
  const target = windowPoint(CLOSED, CLOSE_UV.x, CLOSE_UV.y, Math.min(f, close));
  const pIn = prog(f, close - 46, close - 4, easeInOut);
  const pOut = prog(f, MULTIPLY + 16, SC.S03.to + 10, easeInOut);
  const cx = mix(mix(1010, target.x, pIn), 900, pOut);
  const cy = mix(mix(1500, target.y, pIn), 1250, pOut);
  const cursorO = win(f, close - 46, SC.S03.to + 10, 10, 16);
  const press = kickAt(f, close, 4);
  const plus = prog(f, MULTIPLY, MULTIPLY + 30, easeOut);
  return (
    <>
      <Chip x={rec.x} y={rec.y} o={rec.o} p={prog(f, K("S03", "receita") + 6, K("S03", "receita") + 20, backOut)} color={greyed > 0.5 ? MUTED : INK} icon={<Pan color={greyed > 0.5 ? MUTED : INK} />}>
        {greyed > 0.5 ? "NUNCA FEITA" : "RECEITA"}
      </Chip>
      <Chip x={docs.x} y={docs.y} o={docs.o} p={prog(f, K("S03", "docs"), K("S03", "docs") + 14, backOut)} icon={<DocIcon />}>
        DOCUMENTO SEM TÍTULO
      </Chip>
      <Chip x={docs.x} y={docs.y + 92} o={docs.o} color={BLUE_GLOW} p={prog(f, seg - 4, seg + 10, backOut)} icon={<Calendar />}>
        ABERTA DESDE SEG. · {hms(TICK0 + Math.max(0, Math.floor((f - seg) / 2)))}
      </Chip>
      {f >= MULTIPLY && plus < 1 && (
        <div style={abs(target.x + 40, target.y - 40 - 80 * plus, { fontFamily: MONO, fontWeight: 700, fontSize: 72, color: BLUE_GLOW, opacity: 1 - plus * plus, textShadow: `${SHADOW}, ${glow(BLUE, 0.7)}` })}>+3</div>
      )}
      {cursorO > 0.001 && (
        <div style={abs(cx, cy, { opacity: cursorO })}>
          {press > 0.02 && <div style={abs(-30, -30, { width: 60, height: 60, borderRadius: 30, border: `3px solid ${BLUE_GLOW}`, opacity: press, transform: `scale(${mix(1.8, 0.6, press)})` })} />}
          <Cursor press={press} />
        </div>
      )}
    </>
  );
};

// ---- S04/S05 the tab strip close-up ----------------------------------------------------------------
const TITLES = [
  "Artigo que ia ler ontem",
  "Vou ver depois — vídeo",
  "Bolo de cenoura fofinho",
  "Documento sem título",
  "Pesquisa: produtividade",
  "Promoção relâmpago",
  "Caixa de entrada (1.204)",
  "Planilha final v3",
  "Notícias de tecnologia",
  "Tutorial completo 2026",
  "Comparativo notebooks",
  "Receita de lasanha",
  "Como fechar abas?",
  "Mapa — restaurante",
  "Ofertas da semana",
  "Vou ver depois (2)",
  "Loja — carrinho",
  "Artigo (cópia)",
];
const FAV = [BLUE, "#E8EAED", "#C9A27A", BLUE, BLUE_GLOW, "#9AA0A6", BLUE_GLOW, "#7BC67E", "#BDC1C6", "#E8EAED", "#9AA0A6", "#C9A27A", BLUE, "#7BC67E", "#9AA0A6", "#E8EAED", "#9AA0A6", BLUE];
const TAB_W = 300;
const HOVER = 7; // "Planilha final v3": the one the cursor won't close

const Tab: React.FC<{ i: number; blur: number; blank: number; hover: number }> = ({ i, blur, blank, hover }) => (
  <div
    style={{
      position: "relative",
      width: TAB_W - 8,
      height: 84,
      flex: "none",
      borderRadius: "20px 20px 6px 6px",
      background: i === HOVER ? "rgba(70,72,78,0.95)" : "rgba(44,45,50,0.92)",
      border: `1.5px solid ${i === HOVER ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)"}`,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 18px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ width: 30, height: 30, borderRadius: 8, flex: "none", background: blank > 0.5 ? "#4A4C52" : FAV[i], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: 22, color: "#202124" }}>
      {blank > 0.5 ? "?" : ""}
    </div>
    <div style={{ flex: 1, minWidth: 0, fontFamily: INTER, fontWeight: 600, fontSize: 25, color: blank > 0.5 ? MUTED : INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", filter: blur > 0.01 && blank < 0.5 ? `blur(${blur * 6}px)` : undefined, opacity: blank > 0.5 ? 0.8 : 0.92 }}>
      {blank > 0.5 ? "???" : TITLES[i]}
    </div>
    <div style={{ position: "relative", width: 36, height: 36, flex: "none", borderRadius: 18, background: hover > 0 ? `rgba(255,69,58,${0.85 * hover})` : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={18} height={18} viewBox="0 0 18 18">
        <path d="M3 3 L15 15 M15 3 L3 15" stroke={hover > 0.5 ? "#fff" : "#9AA0A6"} strokeWidth={3} strokeLinecap="round" />
      </svg>
    </div>
  </div>
);

/** Screen x of the HOVER tab's × at strip scale 1 (strip centred on that tab). */
const STRIP_Y = 880;
const HOVER_X_SCREEN = 540 + TAB_W / 2 - 46;

export const TabStrip: React.FC = () => {
  const f = useCurrentFrame();
  const from = SC.S04.from;
  const to = SC.S05.to;
  const o = win(f, from - 6, to + 6, 18, 14);
  if (o <= 0.001) return null;
  const fecha = K("S04", "fecha");
  const pode = K("S04", "pode");
  const precisar = K("S04", "precisar");
  const lembra = K("S05", "lembra");
  const metade = K("S05", "metade");
  // S04: frontal and close on the hesitation tab; S05: the strip turns and recedes (curious slow reveal).
  const turn = prog(f, SC.S05.from - 10, SC.S05.from + 120, easeInOut);
  const drift = (f - from) * 0.25;
  const hover = prog(f, fecha - 6, fecha + 2) * (1 - prog(f, pode + 10, pode + 26));
  return (
    <div style={{ position: "absolute", left: 0, top: STRIP_Y - 50, width: 1080, height: 120, perspective: 1400, opacity: o }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 540 - (HOVER + 0.5) * TAB_W - drift * (1 - turn),
          display: "flex",
          gap: 8,
          padding: "16px 10px 0",
          borderRadius: 28,
          background: "linear-gradient(180deg, rgba(30,31,34,0.92), rgba(20,20,22,0.92))",
          border: "1.5px solid rgba(255,255,255,0.10)",
          boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
          transformOrigin: `${(HOVER + 0.5) * TAB_W}px 50%`,
          transform: `translateX(${mix(0, -260, turn)}px) rotateY(${mix(0, -38, turn)}deg) scale(${mix(1, 0.78, turn)})`,
        }}
      >
        {TITLES.map((_, i) => {
          const seed = random(`tab-${i}`);
          const forgotten = i !== HOVER && (i % 2 === 0) !== seed < 0.2;
          return (
            <Tab
              key={i}
              i={i}
              hover={i === HOVER ? hover : 0}
              blur={prog(f, lembra + seed * 30, lembra + 40 + seed * 30)}
              blank={forgotten ? prog(f, metade - 6 + seed * 24, metade + 4 + seed * 24) : 0}
            />
          );
        })}
      </div>
      {/* the hesitating cursor */}
      {f < SC.S05.from + 10 && (
        <div
          style={abs(
            mix(mix(820, HOVER_X_SCREEN, prog(f, fecha - 30, fecha - 2, easeInOut)), 760, prog(f, pode + 4, precisar + 40, easeInOut)) + (f > fecha && f < pode + 4 ? 3 * Math.sin(f * 0.9) : 0),
            mix(mix(330, 66, prog(f, fecha - 30, fecha - 2, easeInOut)), 300, prog(f, pode + 4, precisar + 40, easeInOut)),
            { opacity: win(f, from + 20, SC.S05.from + 10, 14, 14) },
          )}
        >
          <Cursor size={58} />
        </div>
      )}
    </div>
  );
};

export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const pode = K("S04", "pode");
  const o = win(f, pode - 2, SC.S04.to + 4, 10, 18);
  if (o <= 0.001) return null;
  const p = prog(f, pode - 2, pode + 16, easeOut);
  const p2 = prog(f, K("S04", "precisar") - 2, K("S04", "precisar") + 16, easeOut);
  return (
    <div style={center(330, { opacity: o })}>
      <div style={{ ...DISPLAY, fontSize: 132, lineHeight: 1.04, color: "#D7DBE0", textShadow: SHADOW }}>
        <div style={{ opacity: p, transform: `translateY(${(1 - p) * 40}px)` }}>"PODE</div>
        <div style={{ opacity: p2, transform: `translateY(${(1 - p2) * 40}px)` }}>PRECISAR"</div>
      </div>
    </div>
  );
};

export const S05: React.FC = () => {
  const f = useCurrentFrame();
  const metade = K("S05", "metade");
  const o = win(f, metade - 12, SC.S05.to + 4, 12, 16);
  if (o <= 0.001) return null;
  const n = Math.round(50 * prog(f, metade - 8, metade + 30, easeOut));
  return (
    <div style={center(300, { opacity: o })}>
      <div style={{ ...DISPLAY, fontSize: 250, lineHeight: 1, color: INK, textShadow: `${SHADOW}, ${glow(BLUE, 0.4, 1.4)}` }}>
        {n}
        <span style={{ color: BLUE }}>%</span>
      </div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: MUTED, marginTop: 14, textShadow: SHADOW }}>VOCÊ NEM LEMBRA</div>
    </div>
  );
};

// ---- S06 the choking PC ------------------------------------------------------------------------------
export const S06: React.FC = () => {
  const rf = useCurrentFrame();
  const f = stutterFrame(rf);
  const from = SC.S06.from;
  const lento = K("S06", "lento");
  const culpa = K("S06", "culpa");
  const windows = K("S06", "windows");
  const enquanto = K("S07", "enquanto");
  const away = prog(f, enquanto - 2, enquanto + 22, easeIn);
  const o = Math.min(prog(f, from - 4, from + 14), 1 - away);
  if (rf < from - 4 || o <= 0.001) return null;
  // The tired mascot (3D sprite, track.ts) takes the dramatic push; from "lento" it slumps bottom-left and the PC appears.
  const mon = prog(f, lento - 2, lento + 16, backOut);
  const cpu = Math.round(mix(34, 98, prog(f, lento, culpa, easeOut)));
  const ram = mix(6.2, 15.7, prog(f, lento, culpa, easeOut));
  const logo = prog(f, windows - 2, windows + 14, backOut);
  const arrow = prog(f, windows + 8, windows + 26, easeOut);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o, transform: `scale(${mix(1, 0.35, away)})`, transformOrigin: "50% 45%" }}>
      {/* monitor */}
      {mon > 0.001 && (
        <div style={abs(540, 640, { transform: `translate(-50%, -50%) scale(${mon})` })}>
          <div style={{ width: 780, height: 490, borderRadius: 30, background: "#0C0C0E", border: "10px solid #2A2B30", boxShadow: `0 40px 80px rgba(0,0,0,0.7), 0 0 60px ${BLUE}22`, position: "relative", overflow: "hidden" }}>
            {/* frozen browser inside */}
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 52, background: "#17171A", display: "flex", gap: 4, padding: "10px 12px 0" }}>
              {Array.from({ length: 22 }, (_, i) => (
                <div key={i} style={{ flex: 1, borderRadius: "8px 8px 0 0", background: i === 3 ? "#2B2C30" : "#222326" }} />
              ))}
            </div>
            <div style={{ position: "absolute", left: 30, top: 80, width: 460, height: 22, borderRadius: 11, background: "#25262A" }} />
            {[0, 1, 2].map((r) => (
              <div key={r} style={{ position: "absolute", left: 30, top: 130 + r * 70, width: 400 - r * 60, height: 16, borderRadius: 8, background: "#25262A" }} />
            ))}
            {/* HUD */}
            <div style={{ position: "absolute", right: 26, top: 74, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: INK, textAlign: "right", lineHeight: 1.5 }}>
              <div>
                CPU <span style={{ color: cpu > 90 ? ALERT : BLUE_GLOW }}>{cpu}%</span>
              </div>
              <div style={{ width: 230, height: 8, borderRadius: 4, background: "#2A2B30", marginLeft: "auto" }}>
                <div style={{ width: `${cpu}%`, height: 8, borderRadius: 4, background: cpu > 90 ? ALERT : BLUE }} />
              </div>
              <div style={{ marginTop: 10 }}>
                RAM <span style={{ color: ram > 15 ? ALERT : BLUE_GLOW }}>{ram.toFixed(1).replace(".", ",")}/16 GB</span>
              </div>
              <div style={{ width: 230, height: 8, borderRadius: 4, background: "#2A2B30", marginLeft: "auto" }}>
                <div style={{ width: `${(ram / 16) * 100}%`, height: 8, borderRadius: 4, background: ram > 15 ? ALERT : BLUE }} />
              </div>
            </div>
            {/* spinner, replaced by the four-pane glyph on "Windows" */}
            <div style={abs(390, 300, { transform: "translate(-50%, -50%)", opacity: 1 - logo })}>
              <Spinner size={130} angle={f * 9} />
            </div>
            {logo > 0.001 && (
              <div style={abs(390, 285, { transform: `translate(-50%, -50%) scale(${logo})`, filter: `drop-shadow(0 0 30px ${BLUE_GLOW}aa)` })}>
                <FourPanes size={200} />
              </div>
            )}
          </div>
          <div style={{ width: 120, height: 70, margin: "0 auto", background: "linear-gradient(#222327, #18181B)" }} />
          <div style={{ width: 320, height: 16, margin: "0 auto", borderRadius: 8, background: "#2A2B30" }} />
        </div>
      )}
      {/* blame arrow + label */}
      {arrow > 0.001 && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <path d="M 330 1060 Q 330 960 400 900" fill="none" stroke={ALERT} strokeWidth={6} strokeDasharray="14 12" strokeLinecap="round" pathLength={1} style={{ strokeDashoffset: 0, opacity: arrow }} />
            <path d="M 384 930 L 400 900 L 368 908" fill="none" stroke={ALERT} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={arrow} />
          </svg>
          <div style={abs(470, 1080, { fontFamily: MONO, fontWeight: 700, fontSize: 44, letterSpacing: 6, color: ALERT, opacity: arrow, transform: `translateX(${(1 - arrow) * 30}px)`, textShadow: SHADOW })}>CULPADO?</div>
        </>
      )}
      {/* the tired mascot (3D sprite) stands where the blame arrow starts */}
    </div>
  );
};

// ---- S07 the zoo counter -------------------------------------------------------------------------------
export const S07: React.FC = () => {
  const rf = useCurrentFrame();
  const f = stutterFrame(rf);
  const enquanto = K("S07", "enquanto");
  const zoo = K("S07", "zoologico");
  const end = K("S07", "aberto2") + 6;
  const o = prog(f, enquanto + 6, enquanto + 20) * (1 - blackoutAt(rf));
  if (rf < enquanto || rf >= PAUSE("S07")[1] || o <= 0.001) return null;
  const u = prog(f, zoo - 14, end, easeIn);
  const n = Math.round(47 * Math.pow(999 / 47, u));
  const slam = kickAt(f, zoo, 10);
  return (
    <div style={center(380, { opacity: o })}>
      <div style={{ ...DISPLAY, fontFamily: MONO, fontWeight: 700, letterSpacing: -8, fontSize: 250, lineHeight: 1, color: INK, transform: `scale(${1 + 0.18 * slam})`, textShadow: `${SHADOW}, ${glow(BLUE, 0.5 + 0.5 * slam, 1.5)}` }}>
        {n >= 999 ? "999+" : n}
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 64, letterSpacing: 14, color: BLUE, marginTop: 12, textShadow: `${SHADOW}, ${glow(BLUE, 0.5)}` }}>ABAS ABERTAS</div>
    </div>
  );
};

// ---- S08 share + the shopping-center browser --------------------------------------------------------------
export const S08: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S08.from || f > SC.S08.to + 20) return null;
  const manda = K("S08", "manda");
  const chrome = K("S08", "chrome");
  const shop = K("S08", "shopping");
  const fly = prog(f, manda - 4, manda + 54, easeInOut);
  // Quadratic path for the paper plane, with a fading Chrome-blue trail.
  const P0 = [-120, 1260];
  const P1 = [420, 1180];
  const P2 = [1200, 300];
  const at = (t: number) => [0, 1].map((k) => (1 - t) ** 2 * P0[k] + 2 * (1 - t) * t * P1[k] + t ** 2 * P2[k]);
  const [px, py] = at(fly);
  const [qx, qy] = at(Math.min(1, fly + 0.02));
  const ang = (Math.atan2(qy - py, qx - px) * 180) / Math.PI + 22;
  const trail = Array.from({ length: 24 }, (_, i) => at(Math.max(0, fly - i * 0.012)));
  const planeO = win(f, manda - 4, manda + 60, 6, 10);
  const amigo = K("S08", "amigo");
  const share = win(f, manda + 34, chrome - 2, 14, 12);
  const shareIn = prog(f, manda + 34, manda + 50, backOut);
  const pick = prog(f, amigo, amigo + 12, backOut);
  const wo = win(f, chrome - 4, SC.S08.to + 16, 14, 16);
  const wp = prog(f, chrome - 4, chrome + 16, backOut);
  const squeeze = prog(f, shop - 4, shop + 70, easeIn);
  const count = Math.round(6 * Math.pow(220 / 6, squeeze));
  const ww = mix(860, 960, squeeze);
  return (
    <>
      {planeO > 0.001 && (
        <>
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, opacity: planeO }}>
            <polyline points={trail.map((p) => p.join(",")).join(" ")} fill="none" stroke={BLUE} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
          </svg>
          <div style={abs(px, py, { transform: `translate(-50%, -50%) rotate(${ang}deg)`, opacity: planeO, filter: `drop-shadow(0 0 16px ${BLUE}aa)` })}>
            <PaperPlane size={130} />
          </div>
        </>
      )}
      {share > 0.001 && (
        <div style={abs(540, mix(560, 640, shareIn), { transform: `translate(-50%, -50%) scale(${mix(0.85, 1, shareIn)})`, opacity: share })}>
          <div style={{ ...GLASS, width: 760, borderRadius: 36, padding: "30px 36px 34px" }}>
            <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 34, color: INK, display: "flex", alignItems: "center", gap: 14 }}>
              <PaperPlane size={40} color={BLUE_GLOW} />
              Enviar para
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
              {[0, 1, 2, 3].map((i) => {
                const on = i === 1 ? pick : 0;
                return (
                  <div key={i} style={{ width: 150, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 118, height: 118, borderRadius: 59, background: i === 1 ? `${BLUE}33` : "#2E2F34", border: `3px solid ${on > 0.5 ? BLUE : "rgba(255,255,255,0.12)"}`, boxShadow: on > 0 ? `0 0 ${36 * on}px ${BLUE}aa` : undefined, transform: `scale(${1 + 0.12 * on})`, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
                      <svg width={84} height={84} viewBox="0 0 40 40">
                        <circle cx={20} cy={15} r={8} fill={i === 1 ? BLUE_GLOW : "#5F6368"} />
                        <path d="M4 40 Q4 26 20 26 Q36 26 36 40 Z" fill={i === 1 ? BLUE_GLOW : "#5F6368"} />
                      </svg>
                    </div>
                    <div style={{ fontFamily: INTER, fontWeight: 600, fontSize: 24, color: i === 1 ? INK : MUTED, textAlign: "center", lineHeight: 1.2 }}>{["Mãe", "Amigo das abas", "Trabalho", "Grupo"][i]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {wo > 0.001 && (
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, perspective: 1600, opacity: wo }}>
          <div
            style={{
              position: "absolute",
              left: 540 - ww / 2,
              top: 540,
              width: ww,
              height: 560,
              borderRadius: 28,
              overflow: "hidden",
              background: "#202124",
              border: `2px solid ${squeeze > 0.2 ? BLUE : "rgba(255,255,255,0.14)"}`,
              boxShadow: `0 40px 90px rgba(0,0,0,0.7), 0 0 ${60 * squeeze}px ${BLUE}55`,
              transform: `rotateX(${mix(14, 6, wp)}deg) scale(${mix(0.7, 1, wp)})`,
              transformOrigin: "50% 60%",
            }}
          >
            <div style={{ height: 66, background: "#17171A", display: "flex", alignItems: "flex-end", gap: count > 60 ? 1 : 4, padding: "0 16px 0 110px" }}>
              {Array.from({ length: count }, (_, i) => (
                <div key={i} style={{ flex: 1, minWidth: 0, height: 50, borderRadius: "10px 10px 0 0", background: i === 0 ? "#2B2C30" : "#26272B", display: "flex", alignItems: "center", gap: 8, padding: count > 40 ? 0 : "0 10px", overflow: "hidden" }}>
                  <div style={{ width: count > 90 ? 0 : 18, height: 18, borderRadius: 5, flex: "none", background: FAV[i % FAV.length] }} />
                  {count <= 12 && <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#4A4C52" }} />}
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 22, top: 26, display: "flex", gap: 9 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 16, height: 16, borderRadius: 8, background: "#5F6368" }} />
              ))}
            </div>
            <div style={{ height: 58, background: "#2B2C30", display: "flex", alignItems: "center", padding: "0 24px" }}>
              <div style={{ flex: 1, height: 34, borderRadius: 17, background: "#1C1D20", fontFamily: INTER, fontSize: 22, color: MUTED, display: "flex", alignItems: "center", paddingLeft: 20 }}>shopping.center/todas-as-lojas</div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18, padding: 26 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ width: (ww - 52 - 36) / 3 - 1, height: 160, borderRadius: 14, background: "#2A2B30" }} />
              ))}
            </div>
          </div>
          <div style={center(1150, { fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: BLUE_GLOW, opacity: prog(f, shop, shop + 14), textShadow: SHADOW })}>{count} ABAS</div>
        </div>
      )}
    </>
  );
};

// ---- S09 the CTA: typed question + blinking cursor + comment bubble -----------------------------------
const QUESTION = "Quantas abas você tem abertas agora?";
export const S09: React.FC = () => {
  const f = useCurrentFrame();
  const comenta = K("S09", "comenta");
  if (f < comenta - 6) return null;
  const quantas = K("S09", "quantas");
  const agora = K("S09", "agora");
  const sem = K("S09", "sem");
  const bubble = prog(f, comenta - 4, comenta + 14, backOut);
  const typed = Math.floor(prog(f, quantas - 2, agora + 14, (t) => t) * QUESTION.length);
  const typing = f < agora + 14;
  const blink = typing || (f - agora) % 36 < 20;
  const semP = prog(f, sem - 2, sem + 14, easeOut);
  return (
    <>
      <div style={abs(540, 400, { transform: `translate(-50%, -50%) scale(${bubble}) translateY(${4 * Math.sin((f / FPS) * 2.2)}px)`, filter: `drop-shadow(0 0 30px ${BLUE}88)` })}>
        <Bubble size={170} />
      </div>
      <div style={center(560, { ...DISPLAY, fontSize: 104, lineHeight: 1.1, letterSpacing: -3, color: INK, textShadow: SHADOW })}>
        <span>{QUESTION.slice(0, typed)}</span>
        <span style={{ display: "inline-block", width: 0, position: "relative" }}>
          <span style={{ position: "absolute", left: 4, top: -86, width: 9, height: 100, borderRadius: 3, background: BLUE, opacity: blink && f >= quantas - 2 ? 1 : 0, boxShadow: `0 0 18px ${BLUE}` }} />
        </span>
        <span style={{ color: "transparent", textShadow: "none" }}>{QUESTION.slice(typed)}</span>
      </div>
      <div style={center(930, { fontFamily: INTER, fontWeight: 600, fontSize: 58, color: MUTED, opacity: semP, transform: `translateY(${(1 - semP) * 24}px)`, textShadow: SHADOW })}>Sem mentir.</div>
    </>
  );
};
