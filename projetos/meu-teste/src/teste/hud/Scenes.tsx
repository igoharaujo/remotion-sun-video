// Per-scene motion graphics in the HUD band on the wall above the speaker's head (timeline.json layout.hud):
// S01 PREGUIÇOSO struck out, the dopamine meter, the "AMANHÃ" calendar pushed away; S02 the brain + the
// checklist that ticks itself without doing anything; S03 the calendar flip, the heartbeat, the loop arrow;
// S04 the golden rule, the 2-minute clock, AGORA, and the comment CTA. Timings all from timeline.json.
import { useCurrentFrame } from "remotion";
import { DISPLAY, GLASS, INTER, MONO, SHADOW, glow } from "../style";
import { ALERT, BLUE, BLUE_GLOW, FPS, GOLD, HUD_Y, INK, K, MUTED, SC, backOut, easeIn, easeInOut, easeOut, expOut, kickAt, mix, prog, win } from "../tl";

const center = (y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: 60, width: 960, top: y, textAlign: "center", ...extra });
const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
const line = (color: string, w = 4) => ({ fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" }) as const;

// ---- S01 -----------------------------------------------------------------------------------------
export const S01: React.FC = () => {
  const f = useCurrentFrame();
  const preg = K("S01", "preguicoso");
  const vic = K("S01", "viciado");
  const dop = K("S01", "dopamina");
  const deixar = K("S01", "deixar");
  const amanha = K("S01", "amanha1");
  if (f > SC.S01.to + 10) return null;
  // PREGUIÇOSO slams, then a red strike crosses it out.
  const pregO = win(f, preg - 2, vic - 4, 6, 10);
  const slam = prog(f, preg, preg + 8, expOut);
  const strike = prog(f, preg + 14, preg + 28, easeOut);
  // Dopamine meter.
  const dopO = win(f, dop - 4, deixar - 4, 12, 10);
  const level = prog(f, dop, dop + 42, easeOut);
  const spike = prog(f, dop + 6, dop + 40, easeInOut);
  // Calendar "AMANHÃ" slides in, then gets pushed forward (off to the right).
  const calIn = prog(f, deixar - 4, deixar + 16, backOut);
  const calOut = prog(f, amanha + 14, amanha + 40, easeIn);
  const calX = mix(mix(-480, 330, calIn), 1250, calOut);
  return (
    <>
      {pregO > 0.001 && (
        <div style={center(HUD_Y[0] + 150, { opacity: pregO })}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <div style={{ ...DISPLAY, fontSize: 132, lineHeight: 1, color: INK, transform: `scale(${mix(1.6, 1, slam)})`, opacity: Math.min(1, slam * 3), textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.25, 1.2)}` }}>PREGUIÇOSO</div>
            <div style={{ position: "absolute", left: -20, top: "52%", height: 14, width: `calc(${strike * 100}% + 40px)`, borderRadius: 7, background: ALERT, transform: "rotate(-4deg)", transformOrigin: "0 50%", boxShadow: `0 0 18px ${ALERT}aa` }} />
          </div>
        </div>
      )}
      {dopO > 0.001 && (
        <div style={abs(160, HUD_Y[0] + 60, { width: 760, height: 330, opacity: dopO, transform: `translateY(${(1 - prog(f, dop - 4, dop + 12)) * 30}px)` })}>
          <div style={{ ...GLASS, position: "absolute", inset: 0, borderRadius: 36 }} />
          {/* vertical meter */}
          <div style={abs(44, 40, { width: 74, height: 250, borderRadius: 37, background: "rgba(255,255,255,0.12)", overflow: "hidden" })}>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${level * 100}%`, borderRadius: 37, background: `linear-gradient(0deg, ${BLUE}, ${BLUE_GLOW})`, boxShadow: `0 0 30px ${BLUE}` }} />
          </div>
          <div style={abs(160, 46, { fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: MUTED })}>DOPAMINA</div>
          <div style={abs(160, 92, { ...DISPLAY, fontSize: 120, lineHeight: 1, color: INK, textShadow: glow(BLUE, 0.6, 1.2) })}>
            {Math.round(level * 100)}
            <span style={{ color: BLUE_GLOW }}>%</span>
          </div>
          {/* the hit: a spike in the trace */}
          <svg width={540} height={90} viewBox="0 0 540 90" style={abs(160, 222)}>
            <path d="M0 70 L120 70 L150 68 L175 10 L200 80 L222 60 L260 66 L540 66" {...line(BLUE_GLOW, 5)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - spike} />
          </svg>
        </div>
      )}
      {calIn > 0.001 && calOut < 1 && <Calendar x={calX} y={HUD_Y[0] + 50} front="AMANHÃ" frontSub="25 OUT" />}
      {calIn > 0.001 && calOut < 1 && (
        <svg width={160} height={80} viewBox="0 0 160 80" style={abs(calX + 440, HUD_Y[0] + 190, { opacity: calIn * (1 - calOut) })}>
          <path d="M8 40 H140 M110 12 L146 40 L110 68" {...line(INK, 9)} />
        </svg>
      )}
    </>
  );
};

/** Tear-off calendar page; `flip` 0..1 turns it from `front` to `back` (rotateX). */
const Calendar: React.FC<{ x: number; y: number; front: string; frontSub: string; back?: string; backSub?: string; flip?: number; opacity?: number }> = ({ x, y, front, frontSub, back, backSub, flip = 0, opacity = 1 }) => {
  const face = (title: string, sub: string, color: string, rot: number) => (
    <div style={{ ...GLASS, position: "absolute", inset: 0, borderRadius: 32, overflow: "hidden", backfaceVisibility: "hidden", transform: `rotateX(${rot}deg)` }}>
      <div style={{ height: 92, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 44, letterSpacing: 8, color: "#fff" }}>{title}</div>
      <div style={{ ...DISPLAY, fontSize: 150, lineHeight: "200px", textAlign: "center", color: INK }}>{sub.split(" ")[0]}</div>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 8, textAlign: "center", color: MUTED, marginTop: -26 }}>{sub.split(" ")[1]}</div>
    </div>
  );
  return (
    <div style={abs(x, y, { width: 420, height: 380, perspective: 1200, opacity })}>
      <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d", transform: `rotateX(${-180 * flip}deg)`, transformOrigin: "50% 50%" }}>
        {face(front, frontSub, BLUE, 0)}
        {back ? face(back, backSub ?? "", ALERT, 180) : null}
      </div>
    </div>
  );
};

// ---- S02 -----------------------------------------------------------------------------------------
const ITEMS = ["Planejar", "Organizar", "Fazer"];
export const S02: React.FC = () => {
  const f = useCurrentFrame();
  const cer = K("S02", "cerebro");
  const plan = K("S02", "planejar");
  const feito = K("S02", "feito");
  const mas = K("S02", "mas");
  const esf = K("S02", "esforco");
  if (f < SC.S02.from - 10 || f > SC.S02.to + 12) return null;
  const brainO = win(f, cer - 4, plan - 6, 12, 10);
  const pulse = 0.5 + 0.5 * Math.sin((f / FPS) * Math.PI * 2 * 1.6);
  const listO = win(f, plan - 6, SC.S02.to + 10, 14, 14);
  const listIn = prog(f, plan - 6, plan + 14, backOut);
  const checks = [prog(f, feito - 4, feito + 10, backOut), prog(f, feito + 12, feito + 26, backOut), 0];
  const blink = f >= esf ? 0.5 + 0.5 * Math.sin(((f - esf) / FPS) * Math.PI * 2 * 3) : 0;
  const barO = prog(f, mas - 2, mas + 12);
  return (
    <>
      {brainO > 0.001 && (
        <div style={center(HUD_Y[0] + 40, { opacity: brainO, transform: `scale(${mix(0.85, 1, prog(f, cer - 4, cer + 14, backOut))})` })}>
          <svg width={300} height={260} viewBox="0 0 120 104" style={{ filter: `drop-shadow(0 0 ${12 + 14 * pulse}px ${BLUE})` }}>
            <path
              d="M58 14 C48 4 30 6 26 18 C14 18 8 30 13 40 C4 46 6 62 16 66 C14 78 26 88 38 84 C44 94 58 94 58 84 Z M62 14 C72 4 90 6 94 18 C106 18 112 30 107 40 C116 46 114 62 104 66 C106 78 94 88 82 84 C76 94 62 94 62 84 Z M30 34 C38 34 40 42 48 40 M28 56 C36 52 42 60 50 56 M90 34 C82 34 80 42 72 40 M92 56 C84 52 78 60 70 56"
              {...line(BLUE_GLOW, 3.2)}
            />
          </svg>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: INK, textShadow: SHADOW, marginTop: 6, opacity: prog(f, K("S02", "ama"), K("S02", "ama") + 12) }}>
            AMA <span style={{ color: BLUE_GLOW }}>PLANEJAR</span>
          </div>
        </div>
      )}
      {listO > 0.001 && (
        <div style={abs(170, HUD_Y[0] + 10, { width: 740, opacity: listO, transform: `translateY(${(1 - listIn) * 40}px) scale(${mix(0.92, 1, listIn)})` })}>
          <div style={{ ...GLASS, borderRadius: 36, padding: "30px 40px 34px" }}>
            <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 6, color: MUTED, marginBottom: 14 }}>TAREFAS DE HOJE</div>
            {ITEMS.map((it, i) => {
              const last = i === ITEMS.length - 1;
              const c = checks[i];
              const red = last && f >= esf;
              return (
                <div key={it} style={{ display: "flex", alignItems: "center", gap: 24, height: 76 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 26, flex: "none", border: `4px solid ${red ? ALERT : c > 0.5 ? BLUE : "rgba(255,255,255,0.45)"}`, background: c > 0.5 ? BLUE : red ? `rgba(255,69,58,${0.25 * blink})` : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.15 * kickAt(f, i === 0 ? feito : feito + 12, 6) * (c > 0 ? 1 : 0)})` }}>
                    {c > 0.01 && (
                      <svg width={30} height={30} viewBox="0 0 30 30">
                        <path d="M5 16 L12 23 L25 8" {...line("#fff", 5)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - c} />
                      </svg>
                    )}
                  </div>
                  <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 50, color: red ? ALERT : INK, opacity: c > 0.5 ? 0.6 : 1, textDecoration: c > 0.5 ? "line-through" : "none" }}>{it}</div>
                </div>
              );
            })}
            {barO > 0.001 && (
              <div style={{ marginTop: 18, opacity: barO }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: MONO, fontWeight: 700, fontSize: 28, letterSpacing: 4, color: MUTED }}>
                  <span>PROGRESSO REAL</span>
                  <span style={{ color: ALERT }}>0%</span>
                </div>
                <div style={{ height: 14, borderRadius: 7, background: "rgba(255,255,255,0.15)", marginTop: 10 }}>
                  <div style={{ width: 10, height: 14, borderRadius: 7, background: ALERT }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ---- S03 -----------------------------------------------------------------------------------------
export const S03: React.FC = () => {
  const f = useCurrentFrame();
  const chega = K("S03", "chega");
  const am = K("S03", "amanha2");
  const ans = K("S03", "ansiedade");
  const bate = K("S03", "bate");
  const ciclo = K("S03", "ciclo");
  if (f < SC.S03.from - 10 || f > SC.S03.to + 12) return null;
  // Calendar comes back and flips HOJE -> AMANHÃ.
  const calO = win(f, chega - 6, ans - 2, 12, 10);
  const flip = prog(f, am - 2, am + 18, easeInOut);
  // Heartbeat trace: a dot scans left to right and reaches the big spike on "bate".
  const ecgO = win(f, ans - 4, ciclo - 2, 10, 10);
  const scan = prog(f, ans - 4, bate + 22, (t) => t);
  const spikeX = 0.5;
  // Loop arrow.
  const loopO = win(f, ciclo - 4, SC.S03.to + 10, 10, 14);
  const draw = prog(f, ciclo - 4, ciclo + 22, easeOut);
  const turn = 540 * prog(f, ciclo, SC.S03.to + 10, easeInOut);
  return (
    <>
      {calO > 0.001 && <Calendar x={330} y={HUD_Y[0] + 50} front="HOJE" frontSub="24 OUT" back="AMANHÃ" backSub="25 OUT" flip={flip} opacity={calO} />}
      {ecgO > 0.001 && (
        <div style={abs(60, HUD_Y[0] + 120, { width: 960, height: 260, opacity: ecgO })}>
          <div style={center(-70, { left: 0, fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: ALERT, textShadow: SHADOW })}>ANSIEDADE</div>
          <svg width={960} height={260} viewBox="0 0 960 260" style={{ filter: `drop-shadow(0 0 ${10 + 18 * kickAt(f, bate, 10)}px ${ALERT})` }}>
            <path
              d={`M0 150 L${960 * spikeX - 140} 150 L${960 * spikeX - 110} 130 L${960 * spikeX - 90} 150 L${960 * spikeX - 30} 150 L${960 * spikeX - 10} 20 L${960 * spikeX + 15} 240 L${960 * spikeX + 40} 150 L${960 * spikeX + 110} 150 L${960 * spikeX + 140} 120 L${960 * spikeX + 170} 150 L960 150`}
              {...line(ALERT, 7)}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - scan}
            />
          </svg>
        </div>
      )}
      {loopO > 0.001 && (
        <div style={center(HUD_Y[0] + 30, { opacity: loopO })}>
          <div style={{ position: "relative", width: 380, height: 380, margin: "0 auto" }}>
            <svg width={380} height={380} viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, transform: `rotate(${turn}deg)`, filter: `drop-shadow(0 0 16px ${BLUE})` }}>
              <path d="M50 10 A40 40 0 1 1 15.4 30" {...line(BLUE_GLOW, 7)} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
              <path d="M8 20 L15.4 30 L27 24" {...line(BLUE_GLOW, 7)} opacity={prog(f, ciclo + 16, ciclo + 22)} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontWeight: 700, fontSize: 44, letterSpacing: 6, color: INK, textShadow: SHADOW, opacity: prog(f, K("S03", "recomeca"), K("S03", "recomeca") + 10) }}>
              DE NOVO
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---- S04 -----------------------------------------------------------------------------------------
export const S04: React.FC = () => {
  const f = useCurrentFrame();
  const regra = K("S04", "regra");
  const dois = K("S04", "dois");
  const faz = K("S04", "faz");
  const agora = K("S04", "agora");
  const me = K("S04", "me");
  if (f < SC.S04.from - 10) return null;
  const chipO = win(f, regra - 2, agora - 2, 10, 8);
  const chipIn = prog(f, regra - 2, regra + 12, backOut);
  // Clock: the ring sweeps from "2" to "faz", completes with a flash on AGORA, then fades.
  const clockO = win(f, dois - 6, agora + 4, 12, 8);
  const clockIn = prog(f, dois - 6, dois + 12, backOut);
  const sweep = prog(f, dois, faz + 10, easeInOut);
  const done = kickAt(f, agora, 10);
  // AGORA slam.
  const agoraO = win(f, agora - 2, me - 2, 4, 10);
  const slam = prog(f, agora, agora + 8, expOut);
  // CTA.
  const ctaO = prog(f, me - 4, me + 10);
  const ctaIn = prog(f, me - 4, me + 14, backOut);
  const R = 150;
  const C = 2 * Math.PI * R;
  return (
    <>
      {chipO > 0.001 && (
        <div style={center(HUD_Y[0] + 10, { opacity: chipO, transform: `scale(${mix(0.6, 1, chipIn)})` })}>
          <div style={{ ...GLASS, display: "inline-flex", alignItems: "center", gap: 16, padding: "16px 32px", borderRadius: 999, border: `2px solid ${GOLD}aa`, fontFamily: MONO, fontWeight: 700, fontSize: 36, letterSpacing: 6, color: GOLD, textShadow: glow(GOLD, 0.4) }}>
            <svg width={38} height={38} viewBox="0 0 24 24">
              <path d="M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z" fill={GOLD} />
            </svg>
            REGRA DE OURO
          </div>
        </div>
      )}
      {clockO > 0.001 && (
        <div style={center(HUD_Y[0] + 105, { opacity: clockO, transform: `scale(${mix(0.6, 1, clockIn) * (1 + 0.12 * done)})` })}>
          <div style={{ position: "relative", width: 2 * R + 40, height: 2 * R + 40, margin: "0 auto" }}>
            <div style={{ ...GLASS, position: "absolute", inset: 10, borderRadius: "50%" }} />
            <svg width={2 * R + 40} height={2 * R + 40} viewBox={`0 0 ${2 * R + 40} ${2 * R + 40}`} style={{ position: "absolute", inset: 0, filter: `drop-shadow(0 0 ${12 + 30 * done}px ${BLUE})` }}>
              <circle cx={R + 20} cy={R + 20} r={R} {...line("rgba(255,255,255,0.18)", 14)} />
              <circle cx={R + 20} cy={R + 20} r={R} {...line(done > 0.2 ? "#FFFFFF" : BLUE, 14)} strokeDasharray={`${C * sweep} ${C}`} transform={`rotate(-90 ${R + 20} ${R + 20})`} />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return <line key={i} x1={R + 20 + Math.sin(a) * (R - 30)} y1={R + 20 - Math.cos(a) * (R - 30)} x2={R + 20 + Math.sin(a) * (R - 42)} y2={R + 20 - Math.cos(a) * (R - 42)} {...line("rgba(255,255,255,0.5)", 4)} />;
              })}
              <line x1={R + 20} y1={R + 20} x2={R + 20 + Math.sin(sweep * Math.PI * 2) * (R - 50)} y2={R + 20 - Math.cos(sweep * Math.PI * 2) * (R - 50)} {...line(BLUE_GLOW, 6)} />
              <circle cx={R + 20} cy={R + 20} r={8} fill={BLUE_GLOW} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 70 }}>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 92, lineHeight: 1, color: INK, textShadow: SHADOW }}>2:00</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 6, color: MUTED, marginTop: 6 }}>MINUTOS</div>
            </div>
          </div>
        </div>
      )}
      {agoraO > 0.001 && (
        <div style={center(HUD_Y[0] + 170, { opacity: agoraO })}>
          <div style={{ ...DISPLAY, fontSize: 200, lineHeight: 1, letterSpacing: -6, color: slam < 0.4 ? "#FFFFFF" : BLUE_GLOW, transform: `scale(${mix(1.7, 1, slam)})`, textShadow: `${SHADOW}, ${glow(BLUE, 0.8, 1.6)}` }}>AGORA</div>
        </div>
      )}
      {ctaO > 0.001 && (
        <div style={center(HUD_Y[0] + 70, { opacity: ctaO, transform: `translateY(${(1 - ctaIn) * 40}px)` })}>
          <svg width={190} height={190} viewBox="0 0 64 64" style={{ transform: `scale(${mix(0.5, 1, ctaIn)}) translateY(${4 * Math.sin((f / FPS) * 2.4)}px)`, filter: `drop-shadow(0 0 24px ${BLUE})` }}>
            <path d="M10 8 H54 Q60 8 60 14 V40 Q60 46 54 46 H28 L16 56 V46 H10 Q4 46 4 40 V14 Q4 8 10 8 Z" {...line(BLUE_GLOW, 3.2)} fill={BLUE} fillOpacity={0.25} />
            <circle cx={20} cy={27} r={3.6} fill="#fff" />
            <circle cx={32} cy={27} r={3.6} fill="#fff" />
            <circle cx={44} cy={27} r={3.6} fill="#fff" />
          </svg>
          <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 38, letterSpacing: 8, color: INK, textShadow: SHADOW, marginTop: 14 }}>
            ME CONTA <span style={{ color: BLUE_GLOW }}>NOS COMENTÁRIOS</span>
          </div>
        </div>
      )}
    </>
  );
};
