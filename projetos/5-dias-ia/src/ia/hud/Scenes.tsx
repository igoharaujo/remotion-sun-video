// Per-scene motion graphics (Keynote type + glass UI) over the space world and the speaker. Timings all come
// from timeline.json; when the speaker is full screen (S05) everything stays above his head (y < 390) or
// between chin and captions (y 1260-1380).
import { Img, random, staticFile, useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, INTER, MONO, SHADOW, glow } from "../style";
import { ALERT, BLUE, BLUE_GLOW, EGGS, GOLD, HUD_Y, INK, K, MUTED, SC, VIOLET, WORDS, backOut, easeIn, easeInOut, easeOut, expOut, kickAt, mix, prog, win } from "../tl";

const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
const center = (y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: 60, width: 960, top: y, textAlign: "center", ...extra });
const line = (color: string, w = 4) => ({ fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" }) as const;

const Chip: React.FC<{ x: number; y: number; p: number; o?: number; color?: string; children: React.ReactNode; anchor?: "left" | "center" }> = ({ x, y, p, o = 1, color = INK, children, anchor = "left" }) =>
  p <= 0.001 || o <= 0.001 ? null : (
    <div style={abs(x, y, { opacity: Math.min(1, p * 1.5) * o, transform: `translateX(${anchor === "center" ? "-50%" : "0"}) scale(${mix(0.6, 1, p)})`, transformOrigin: anchor === "center" ? "50% 50%" : "0 50%" })}>
      <div style={{ ...GLASS, display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 28px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 4, color, textShadow: glow(color, 0.4) }}>{children}</div>
    </div>
  );

// ---- S01 ---------------------------------------------------------------------------------------------------
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const cod = K("S01", "codigo1");
  const ia = K("S01", "ia");
  const end = SC.S01.to;
  return (
    <>
      <Chip x={90} y={680} p={prog(f, cod - 2, cod + 12, backOut)} o={1 - prog(f, end - 14, end, easeIn)} color={BLUE_GLOW}>
        {"</>"} CÓDIGO
      </Chip>
      <Chip x={700} y={680} p={prog(f, ia - 2, ia + 12, backOut)} o={1 - prog(f, end - 14, end, easeIn)} color={VIOLET}>
        ✦ IA
      </Chip>
    </>
  );
};

// ---- S02 ---------------------------------------------------------------------------------------------------
const Page: React.FC<{ i: number }> = ({ i }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 300, height: 400, borderRadius: 10, background: "#F4F5F7", boxShadow: "0 8px 20px rgba(0,0,0,0.35)", padding: 26, boxSizing: "border-box" }}>
    <div style={{ height: 16, width: "70%", borderRadius: 6, background: "#30343B", marginBottom: 18 }} />
    {Array.from({ length: 9 }, (_, k) => (
      <div key={k} style={{ height: 9, width: `${70 + ((k * 13 + i * 7) % 30)}%`, borderRadius: 4, background: "#C6CAD1", marginBottom: 14 }} />
    ))}
    <div style={{ position: "absolute", right: 18, bottom: 14, fontFamily: MONO, fontSize: 18, color: "#8A8F98" }}>{i + 1}/46</div>
  </div>
);

export const S02: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S02.from - 10 || f > SC.S02.to + 12) return null;
  const vol = K("S02", "volume");
  const tec = K("S02", "tecnica");
  const doc = K("S02", "documento");
  const n46 = K("S02", "n46");
  const auto = K("S02", "automatizei");
  const n70 = K("S02", "n70");
  const boneco = K("S02", "boneco");
  const licao = K("S02", "licao");
  // VOLUME > TÉCNICA -> ERRO #1
  const vtO = win(f, vol - 4, doc - 4, 10, 10);
  const strike = prog(f, tec + 14, tec + 26, easeOut);
  // 46 pages fanning out
  const pagesO = win(f, doc - 4, auto - 4, 10, 10);
  const fan = prog(f, n46 - 10, n46 + 40, easeInOut);
  const count46 = Math.round(46 * prog(f, n46 - 10, n46 + 30, easeOut));
  // 70 thumbnails
  const gridO = win(f, auto - 2, boneco - 4, 8, 10);
  const shown70 = Math.floor(70 * prog(f, auto, n70 + 30, (x) => x));
  // Lesson 1 quote, word by word on the spoken frames
  const lO = win(f, licao - 4, SC.S02.to + 8, 10, 12);
  const quoteWords = WORDS.filter((w) => w.f >= K("S02", "direcao") - 140 && w.f <= K("S02", "ruim"));
  return (
    <>
      {vtO > 0.001 && (
        <div style={abs(60, HUD_Y[0] + 120, { width: 600, opacity: vtO, textAlign: "center" })}>
          <div style={{ ...DISPLAY, fontSize: 104, lineHeight: 1, color: INK, textShadow: SHADOW, opacity: prog(f, vol - 4, vol + 8) }}>VOLUME</div>
          <div style={{ position: "relative", display: "inline-block", ...DISPLAY, fontSize: 120, lineHeight: 1, color: GOLD, textShadow: SHADOW, opacity: prog(f, vol + 10, vol + 20) }}>
            &gt;
            <div style={{ position: "absolute", left: -18, right: -18, top: "48%", height: 12, borderRadius: 6, background: ALERT, transform: `scaleX(${strike}) rotate(-10deg)`, transformOrigin: "0 50%" }} />
          </div>
          <div style={{ ...DISPLAY, fontSize: 104, lineHeight: 1, color: INK, textShadow: SHADOW, opacity: prog(f, tec - 2, tec + 10) }}>TÉCNICA</div>
          <div style={{ marginTop: 18, display: "inline-block", fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 6, color: ALERT, border: `4px solid ${ALERT}`, borderRadius: 12, padding: "6px 18px", transform: `rotate(-6deg) scale(${mix(1.6, 1, prog(f, tec + 22, tec + 30, expOut))})`, opacity: prog(f, tec + 22, tec + 26) }}>ERRO #1</div>
        </div>
      )}
      {pagesO > 0.001 && (
        <div style={abs(180, 640, { width: 720, height: 640, opacity: pagesO, perspective: 1400 })}>
          {Array.from({ length: 46 }, (_, i) => {
            const k = i / 45;
            return (
              <div key={i} style={{ position: "absolute", left: 210, top: 120, transformStyle: "preserve-3d", transform: `rotateY(${mix(0, -38, fan)}deg) translateX(${mix(0, (k - 0.5) * 520, fan)}px) translateZ(${-i * 2}px) rotateZ(${mix(0, (k - 0.5) * 20, fan)}deg)`, opacity: prog(f, doc + i * 0.6, doc + i * 0.6 + 6) }}>
                <Page i={45 - i} />
              </div>
            );
          })}
          <div style={center(-90, { left: 0, width: 720, ...DISPLAY, fontSize: 84, color: INK, textShadow: SHADOW })}>
            {count46} <span style={{ fontFamily: MONO, fontSize: 38, letterSpacing: 6, color: MUTED }}>PÁGINAS</span>
          </div>
        </div>
      )}
      {gridO > 0.001 && (
        <div style={abs(90, 700, { width: 900, opacity: gridO })}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 84px)", gap: 6 }}>
            {Array.from({ length: 70 }, (_, i) => {
              const p = i < shown70 ? 1 : 0;
              return <Img key={i} src={staticFile("images/boneco.jpg")} style={{ width: 84, height: 84, borderRadius: 8, opacity: p, transform: `scale(${p ? 1 : 0.4}) rotate(${(random(`r${i}`) - 0.5) * 8}deg)`, filter: `hue-rotate(${(random(`hh${i}`) - 0.5) * 40}deg)` }} />;
            })}
          </div>
          <div style={center(-130, { left: 0, width: 900, ...DISPLAY, fontSize: 96, color: INK, textShadow: SHADOW })}>
            {shown70} <span style={{ fontFamily: MONO, fontSize: 38, letterSpacing: 6, color: MUTED }}>IMAGENS</span>
          </div>
        </div>
      )}
      {lO > 0.001 && (
        <>
          <Chip x={90} y={HUD_Y[0]} p={prog(f, licao - 2, licao + 12, backOut)} o={lO} color={GOLD}>
            LIÇÃO 1
          </Chip>
          <div style={center(HUD_Y[0] + 100, { opacity: lO, ...DISPLAY, fontSize: 76, lineHeight: 1.08, letterSpacing: -2, display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 20 })}>
            {quoteWords.map((w, i) => {
              const p = prog(f, w.f - 2, w.f + 8, backOut);
              const bad = w.w.toLowerCase().startsWith("ruim");
              return (
                <span key={i} style={{ display: "inline-block", opacity: Math.min(1, p * 2), transform: `translateY(${(1 - p) * 24}px) scale(${bad ? 1 + 0.25 * kickAt(f, w.f, 10) : 1})`, color: bad ? ALERT : INK, textShadow: bad ? `${SHADOW}, ${glow(ALERT, 0.8, 1.4)}` : SHADOW }}>
                  {w.w.replace(/^inteligência$/i, "IA").replace(/^artificial$/i, "").toUpperCase()}
                </span>
              );
            })}
          </div>
        </>
      )}
    </>
  );
};

// ---- S03 ---------------------------------------------------------------------------------------------------
const CODE = [
  "const impact = frame >= cue('explodindo');",
  "<Planet shatter={impact} debris={90} />",
  "camera.shake(spring({ frame, fps }));",
  "<Captions words={whisper} box={false} />",
  "mix.loudness = -14; // LUFS",
];
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S03.from - 10 || f > SC.S03.to + 12) return null;
  const d2 = K("S03", "dia2");
  const d3 = K("S03", "dia3");
  const mao = K("S03", "editar");
  const anim = K("S03", "animacoes");
  const glitch = kickAt(f, K("S03", "jogo"), 6);
  const handO = win(f, mao - 4, EGGS.terminal.from - 2, 8, 8);
  const handStrike = prog(f, K("S03", "mao") + 4, K("S03", "mao") + 16);
  const codeO = win(f, EGGS.terminal.to - 4, SC.S03.to + 10, 8, 12);
  const typed = (f - (EGGS.terminal.to - 4)) * 1.6;
  return (
    <>
      <Chip x={90} y={HUD_Y[0]} p={prog(f, d2 - 2, d2 + 12, backOut)} o={1 - prog(f, d3 - 20, d3 - 8, easeIn)} color={BLUE_GLOW}>
        DIA 2 · EMPILHAR
      </Chip>
      <Chip x={90} y={HUD_Y[0]} p={prog(f, d3 - 2, d3 + 12, backOut)} o={1 - prog(f, SC.S03.to - 10, SC.S03.to + 6, easeIn)} color={GOLD}>
        DIA 3 · O JOGO VIROU
      </Chip>
      {glitch > 0.02 && <div style={{ position: "absolute", inset: 0, background: `linear-gradient(0deg, transparent ${40 + random(`g${f}`) * 20}%, rgba(66,133,244,${0.35 * glitch}) 0, transparent ${60 + random(`g2${f}`) * 10}%)`, mixBlendMode: "screen" }} />}
      {handO > 0.001 && (
        <div style={center(HUD_Y[0] + 150, { opacity: handO })}>
          <svg width={260} height={260} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 0 18px ${BLUE})` }}>
            <path d="M22 34 V14 a4 4 0 0 1 8 0 V30 M30 28 V10 a4 4 0 0 1 8 0 V30 M38 28 V14 a4 4 0 0 1 8 0 V34 M46 30 a4 4 0 0 1 8 0 V40 c0 10 -8 18 -18 18 h-4 c-8 0 -12 -4 -16 -10 L10 38 a4 4 0 0 1 6 -5 L22 38" {...line(INK, 3)} />
            <path d="M8 56 L56 8" {...line(ALERT, 5)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - handStrike} />
          </svg>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: INK, textShadow: SHADOW, marginTop: 8 }}>EDITAR À MÃO</div>
        </div>
      )}
      {codeO > 0.001 && (
        <div style={abs(80, HUD_Y[0] + 120, { width: 920, opacity: codeO })}>
          <div style={{ ...GLASS, borderRadius: 24, padding: "26px 30px", fontFamily: MONO, fontSize: 31, lineHeight: 1.6 }}>
            {CODE.map((l, i) => {
              const n = Math.max(0, Math.min(l.length, Math.floor(typed - i * 22)));
              return (
                <div key={i} style={{ color: i % 2 ? BLUE_GLOW : INK, whiteSpace: "pre", minHeight: 50 }}>
                  <span style={{ color: MUTED }}>{String(i + 1).padStart(2, " ")} </span>
                  {l.slice(0, n)}
                  {n > 0 && n < l.length && <span style={{ background: BLUE_GLOW, color: "transparent" }}>_</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: MUTED, textAlign: "center", marginTop: 16, opacity: prog(f, anim, anim + 12) }}>O AGENTE ESCREVE · VOCÊ DIRIGE</div>
        </div>
      )}
    </>
  );
};

// ---- S04 ---------------------------------------------------------------------------------------------------
const TREE = [
  { t: "▾ remotion-sun-video", d: 0, skill: true },
  { t: "▾ .claude", d: 1, skill: true },
  { t: "▾ skills", d: 2, skill: true },
  { t: "▾ motion-video-3d", d: 3, skill: true },
  { t: "SKILL.md", d: 4, skill: true, file: true },
  { t: "▸ projetos", d: 1 },
  { t: "CLAUDE.md", d: 1 },
  { t: ".gitignore", d: 1 },
];
const RULES = ["# Skill: Motion Video 3D", "## Filosofia (REGRA DE OURO)", "Cada frase do roteiro = um elemento visual.", "## Legendas: SEM retângulo", "## Safe zones TikTok: x 60–1020", "## Mix: -14 LUFS, -1 dBTP"];
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S04.from - 10 || f > SC.S04.to + 12) return null;
  const zero = K("S04", "zero1");
  const semana = K("S04", "semana");
  const prompt = K("S04", "prompt");
  const arq = K("S04", "arquivo");
  const { from: eggIn, to: eggOut } = EGGS.skill;
  const barO = win(f, zero - 6, prompt - 6, 10, 10);
  const fill = prog(f, zero, semana + 20, easeInOut);
  const pO = win(f, prompt - 20, arq - 8, 10, 10);
  const pStrike = prog(f, prompt + 4, prompt + 16);
  const edO = win(f, arq - 6, SC.S04.to + 8, 12, 12);
  const egg = win(f, eggIn, eggOut, 3, 4); // the 1 s reveal: real names in focus
  return (
    <>
      {barO > 0.001 && (
        <div style={abs(110, HUD_Y[0] + 60, { width: 860, opacity: barO })}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 5, color: INK, textShadow: SHADOW }}>
            <span>DO ZERO</span>
            <span style={{ color: BLUE_GLOW }}>ESSE NÍVEL</span>
          </div>
          <div style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,0.14)", marginTop: 14, overflow: "hidden" }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 11, background: `linear-gradient(90deg, ${VIOLET}, ${BLUE})`, boxShadow: `0 0 24px ${BLUE}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: MONO, fontSize: 26, color: MUTED }}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} style={{ color: fill * 7 > i + 0.5 ? INK : MUTED }}>D{i + 1}</span>
            ))}
          </div>
        </div>
      )}
      {pO > 0.001 && (
        <div style={abs(110, HUD_Y[0] + 230, { width: 860, opacity: pO })}>
          <div style={{ ...GLASS, position: "relative", borderRadius: 26, padding: "24px 28px", display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 36, color: INK, flex: 1 }}>faça um vídeo incrível com IA ✨</div>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 30 }}>↑</div>
            <div style={{ position: "absolute", left: 18, right: 18, top: "50%", height: 8, borderRadius: 4, background: ALERT, transform: `scaleX(${pStrike})`, transformOrigin: "0 50%", boxShadow: `0 0 16px ${ALERT}` }} />
          </div>
        </div>
      )}
      {edO > 0.001 && (
        <div style={abs(70, 640, { width: 940, height: 640, opacity: edO, transform: `perspective(1600px) rotateX(${mix(10, 0, prog(f, arq - 6, arq + 18, easeOut))}deg)` })}>
          <div style={{ ...GLASS, position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", display: "flex" }}>
            <div style={{ width: 360, background: "rgba(0,0,0,0.35)", padding: "54px 0 0", fontFamily: MONO, fontSize: 25 }}>
              {TREE.map((n, i) => {
                const hi = n.file && egg > 0.5;
                return (
                  <div key={i} style={{ padding: "7px 0 7px", paddingLeft: 18 + n.d * 22, color: hi ? "#fff" : n.skill ? INK : MUTED, background: hi ? `${BLUE}88` : "transparent", filter: n.skill ? `blur(${7 * (1 - egg)}px)` : "none", whiteSpace: "nowrap" }}>
                    {n.file ? "▤ " : ""}
                    {n.t}
                  </div>
                );
              })}
            </div>
            <div style={{ flex: 1, padding: "54px 28px 0", fontFamily: MONO, fontSize: 25, lineHeight: 1.75 }}>
              {RULES.map((l, i) => (
                <div key={i} style={{ color: l.startsWith("#") ? BLUE_GLOW : INK, filter: `blur(${mix(8, i > 3 ? 3 : 0, egg)}px)`, whiteSpace: "nowrap", overflow: "hidden" }}>
                  {l}
                </div>
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 40, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
              ))}
              <div style={{ marginLeft: 16, fontFamily: MONO, fontSize: 20, color: MUTED, filter: `blur(${6 * (1 - egg)}px)` }}>SKILL.md — regras visuais</div>
            </div>
          </div>
          <div style={center(-74, { left: 0, width: 940, fontFamily: MONO, fontWeight: 700, fontSize: 32, letterSpacing: 6, color: GOLD, textShadow: SHADOW })}>ARQUIVO DE REGRAS VISUAIS</div>
        </div>
      )}
    </>
  );
};

// ---- S05 (speaker full screen: type above y 390 or in the 1260-1380 band only) -------------------------------
export const S05: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SC.S05.from - 4) return null;
  const deixei = K("S05", "deixei");
  const comenta = K("S05", "comenta");
  const n500 = K("S05", "n500");
  const abro = K("S05", "abro");
  const teaseO = win(f, deixei - 2, comenta - 4, 10, 10);
  const signIn = prog(f, comenta - 4, comenta + 12, backOut);
  const barO = prog(f, n500 - 4, n500 + 10);
  const fill = prog(f, n500, n500 + 50, easeInOut);
  const lockO = prog(f, abro - 4, abro + 10);
  const open = prog(f, abro + 6, abro + 22, backOut);
  const thumbs = [
    { label: "TERMINAL", color: "#0D1117" },
    { label: "SKILL.md", color: "#1B2236" },
    { label: "4 IAs", color: "#241A30" },
  ];
  return (
    <>
      {teaseO > 0.001 && (
        <div style={{ position: "absolute", left: 90, top: 150, width: 900, display: "flex", justifyContent: "space-between", opacity: teaseO }}>
          {thumbs.map((t, i) => {
            const p = prog(f, deixei + i * 8, deixei + i * 8 + 14, backOut);
            return (
              <div key={i} style={{ ...GLASS, width: 270, height: 200, borderRadius: 20, overflow: "hidden", position: "relative", transform: `scale(${mix(0.5, 1, p)}) rotate(${(i - 1) * 4}deg)`, opacity: Math.min(1, p * 2) }}>
                <div style={{ position: "absolute", inset: 0, background: t.color, filter: "blur(2px)" }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ ...DISPLAY, fontSize: 96, color: GOLD, textShadow: glow(GOLD, 0.6) }}>?</div>
                  <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 4, color: MUTED, filter: "blur(4px)" }}>{t.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {signIn > 0.001 && (
        <div style={center(140, { transform: `scale(${mix(0.7, 1, signIn)})`, opacity: Math.min(1, signIn * 2) })}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 22 }}>
            <svg width={84} height={84} viewBox="0 0 64 64" style={{ filter: `drop-shadow(0 0 16px ${BLUE})`, transform: `scale(${1 + 0.15 * kickAt(f, comenta, 10)})` }}>
              <path d="M10 8 H54 Q60 8 60 14 V40 Q60 46 54 46 H28 L16 56 V46 H10 Q4 46 4 40 V14 Q4 8 10 8 Z" {...line(BLUE_GLOW, 4)} fill={BLUE} fillOpacity={0.3} />
              <circle cx={20} cy={27} r={3.6} fill="#fff" />
              <circle cx={32} cy={27} r={3.6} fill="#fff" />
              <circle cx={44} cy={27} r={3.6} fill="#fff" />
            </svg>
            <div style={{ ...DISPLAY, fontSize: 60, lineHeight: 1.02, letterSpacing: -2, color: INK, textAlign: "left", textShadow: `${SHADOW}, ${glow(BLUE, 0.4)}` }}>
              COMENTE QUAL
              <br />
              <span style={{ color: GOLD }}>FERRAMENTA</span> VOCÊ VIU
            </div>
          </div>
        </div>
      )}
      {barO > 0.001 && (
        <div style={abs(160, 318, { width: 760, opacity: barO })}>
          <div style={{ height: 16, borderRadius: 8, background: "rgba(255,255,255,0.16)", overflow: "hidden" }}>
            <div style={{ width: `${fill * 100}%`, height: "100%", background: `linear-gradient(90deg, ${BLUE}, ${GOLD})`, boxShadow: `0 0 18px ${GOLD}` }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 4, color: INK, marginTop: 8, textShadow: SHADOW }}>
            <span>{Math.round(500 * fill)} / 500</span>
            <span style={{ color: GOLD }}>COMENTÁRIOS</span>
          </div>
        </div>
      )}
      {lockO > 0.001 && (
        <div style={center(1262, { opacity: lockO })}>
          <div style={{ ...GLASS, display: "inline-flex", alignItems: "center", gap: 16, padding: "14px 28px", borderRadius: 999 }}>
            <svg width={44} height={44} viewBox="0 0 32 32">
              <rect x={6} y={14} width={20} height={15} rx={3} fill={GOLD} />
              <path d={`M10 14 V10 a6 6 0 0 1 12 0 ${open > 0.5 ? "" : "V14"}`} {...line(GOLD, 3.2)} transform={`translate(${8 * open} ${-3 * open})`} />
            </svg>
            <span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 5, color: INK }}>ARQUITETURA DO AGENTE</span>
          </div>
        </div>
      )}
    </>
  );
};

