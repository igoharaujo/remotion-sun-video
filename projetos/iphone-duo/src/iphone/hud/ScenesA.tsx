// 2D overlays for scenes 1-6: counters, OLED readouts, macro lens, LCD vs OLED split, exploded-view
// labels, glue and the book. All cue frames come from timeline-iphone.json through K() / SC.
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { INTER, MONO, ORBITRON, glow } from "../../hud/style";
import { LAYER_W, OLED as OLED_I, TI, bentLayerEnd, layerPoint, project } from "../three/rig";
import { AMBER, FPS, K, OLED_BLUE, SC, STRESS_RED, TITANIUM, WARM, backOut, easeIn, easeInOut, easeOut, mix, prog, win } from "../tl";
import { LAYERS_ROLL, PARTS_ROLL, rollValue } from "./counters";
import { foldCurve, toPath } from "./fold";

const img = (name: string) => staticFile(`images/iphone/${name}`);
const SHADOW = "3px 3px 8px rgba(0,0,0,0.9)";

/** A full-frame reference photo, faint and tinted, behind the 3D. */
export const Backplate: React.FC<{ src: string; from: number; to: number; opacity: number; zoom?: [number, number] }> = ({ src, from, to, opacity, zoom = [1.04, 1.12] }) => {
  const frame = useCurrentFrame();
  const o = win(frame, from, to, 30, 24) * opacity;
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{ opacity: o, mixBlendMode: "screen" }}>
      <Img src={img(src)} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${mix(zoom[0], zoom[1], prog(frame, from, to, (x) => x))})`, filter: "grayscale(0.5) brightness(0.75) blur(2px)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(5,5,16,0.2), rgba(0,40,80,0.25))", mixBlendMode: "multiply" }} />
    </AbsoluteFill>
  );
};

const Label: React.FC<{ x: number; y: number; text: string; color?: string; o: number; size?: number; align?: "left" | "center" | "right" }> = ({ x, y, text, color = TITANIUM, o, size = 26, align = "left" }) => (
  <div
    style={{
      position: "absolute",
      left: align === "left" ? x : undefined,
      right: align === "right" ? 1080 - x : undefined,
      top: y,
      width: align === "center" ? 600 : undefined,
      marginLeft: align === "center" ? x - 300 : undefined,
      textAlign: align,
      opacity: o,
      fontFamily: MONO,
      fontWeight: 700,
      fontSize: size,
      letterSpacing: 3,
      color,
      textShadow: SHADOW,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

// ---- s01: "dez camadas e mais de cem peças" ---------------------------------------------------
const Counter: React.FC<{ x: number; value: string; suffix?: string; label: string; from: number; color: string }> = ({ x, value, suffix, label, from, color }) => {
  const frame = useCurrentFrame();
  const o = prog(frame, from - 4, from + 10) * (1 - prog(frame, SC.s01_layers.to - 14, SC.s01_layers.to, easeIn));
  if (o <= 0) return null;
  const pulse = Math.exp(-Math.max(0, frame - from) / 20);
  return (
    <div style={{ position: "absolute", left: x, top: 220, width: 430, textAlign: "center", opacity: o, transform: `translateY(${(1 - prog(frame, from - 4, from + 18, easeOut)) * 40}px)` }}>
      <div style={{ fontFamily: ORBITRON, fontWeight: 900, fontSize: 170, lineHeight: 1, color: "#fff", textShadow: `${SHADOW}, ${glow(color, 0.4 + 0.6 * pulse, 1.2)}` }}>
        {value}
        <span style={{ fontSize: 120, opacity: suffix ? 1 : 0 }}>+</span>
      </div>
      <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: TITANIUM, marginTop: 10, textShadow: SHADOW }}>{label}</div>
    </div>
  );
};

export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const dob = K("s01_layers", "dobradiça");
  const layers = rollValue(frame, LAYERS_ROLL);
  const parts = rollValue(frame, PARTS_ROLL);
  return (
    <>
      <Counter x={75} value={String(layers).padStart(2, "0")} label="CAMADAS" from={LAYERS_ROLL.from} color={OLED_BLUE} />
      <Counter x={575} value={String(parts).padStart(3, "0")} suffix={parts >= 100 ? "+" : undefined} label="PEÇAS NA DOBRADIÇA" from={PARTS_ROLL.from} color={TITANIUM} />
      <Label x={540} y={1300} align="center" text="◆ DOBRADIÇA" color={OLED_BLUE} o={win(frame, dob, SC.s01_layers.to, 10, 14)} size={24} />
    </>
  );
};

// ---- s02: "A mágica começa no OLED" -----------------------------------------------------------
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const magica = K("s02_oled_ignite", "mágica");
  const oled = K("s02_oled_ignite", "OLED");
  const ring = prog(frame, oled, oled + 34, easeOut);
  const on = frame >= oled;
  return (
    <>
      <Label x={540} y={240} align="center" text={on ? "1 PIXEL · LIGADO" : "1 PIXEL · DESLIGADO"} color={on ? OLED_BLUE : TITANIUM} o={win(frame, magica + 6, SC.s02_oled_ignite.to, 12, 14)} size={28} />
      {frame >= oled && ring < 1 ? (
        <div
          style={{
            position: "absolute",
            left: 540 - 760 * ring,
            top: 960 - 760 * ring,
            width: 1520 * ring,
            height: 1520 * ring,
            borderRadius: "50%",
            border: `${10 * (1 - ring) + 2}px solid ${OLED_BLUE}`,
            opacity: 1 - ring,
            boxShadow: `0 0 60px ${OLED_BLUE}, inset 0 0 60px ${OLED_BLUE}`,
          }}
        />
      ) : null}
    </>
  );
};

// ---- s03: "cada pixel gera a própria luz" -----------------------------------------------------
export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.s03_self_emissive;
  const pixel = K("s03_self_emissive", "pixel");
  const luz = K("s03_self_emissive", "própria luz");
  const lens = win(frame, from + 4, to, 20, 16);
  const card = win(frame, pixel - 8, to, 14, 16);
  if (lens <= 0) return null;
  const spin = (frame / FPS) * 8;
  const burst = frame >= luz ? Math.exp(-(frame - luz) / 12) : 0;
  const R = 230;
  const cx = 540;
  const cy = 480;
  return (
    <>
      {/* Microscope lens on a real OLED macro. */}
      <div style={{ position: "absolute", left: cx - R, top: cy - R, width: 2 * R, height: 2 * R, borderRadius: "50%", overflow: "hidden", opacity: lens, transform: `scale(${mix(0.85, 1, lens)})`, boxShadow: `0 0 40px rgba(0,168,255,0.35)` }}>
        <Img src={img("oled_subpixels.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${mix(1.25, 1.6, prog(frame, from, to, (x) => x))})`, filter: `brightness(${1 + 0.6 * burst})` }} />
        <AbsoluteFill style={{ background: "radial-gradient(circle, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)" }} />
      </div>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: lens }}>
        <circle cx={cx} cy={cy} r={R + 6} fill="none" stroke={TITANIUM} strokeWidth={3} />
        {Array.from({ length: 60 }, (_, i) => {
          const a = ((i * 6 + spin) * Math.PI) / 180;
          const l = i % 5 ? 10 : 22;
          return <line key={i} x1={cx + (R + 14) * Math.cos(a)} y1={cy + (R + 14) * Math.sin(a)} x2={cx + (R + 14 + l) * Math.cos(a)} y2={cy + (R + 14 + l) * Math.sin(a)} stroke={i % 5 ? TITANIUM : OLED_BLUE} strokeOpacity={0.7} strokeWidth={2} />;
        })}
      </svg>
      <Label x={cx - R - 10} y={cy - R - 30} text="MACRO · SUB-PIXELS RGB" o={lens} size={22} />
      {/* Data card: self-emissive pixels, no backlight underneath. */}
      <div style={{ position: "absolute", left: 110, top: 790, width: 860, height: 500, opacity: card, transform: `translateY(${(1 - card) * 30}px)`, borderRadius: 22, border: `1.5px solid rgba(192,192,192,0.3)`, background: "rgba(5,8,22,0.62)" }}>
        <div style={{ position: "absolute", left: 40, top: 26, fontFamily: ORBITRON, fontWeight: 900, fontSize: 64, color: OLED_BLUE, textShadow: glow(OLED_BLUE, 0.4) }}>OLED</div>
        <div style={{ position: "absolute", left: 40, top: 112, fontFamily: INTER, fontWeight: 800, fontSize: 40, color: "#fff" }}>cada pixel emite a própria luz</div>
        <svg width={860} height={320} style={{ position: "absolute", left: 0, top: 170 }}>
          {Array.from({ length: 9 }, (_, i) => {
            const c = ["#ff3b4a", "#3bff7a", "#1a8cff"][i % 3];
            const x = 100 + i * 76;
            const lit = prog(frame, pixel + i * 3, pixel + i * 3 + 10);
            const rise = ((frame - pixel) / 40 + i * 0.13) % 1;
            return (
              <g key={i} opacity={lit}>
                <rect x={x} y={150} width={52} height={34} rx={8} fill={c} style={{ filter: `drop-shadow(0 0 ${10 + 18 * burst}px ${c})` }} />
                {[0, 0.5].map((ph) => {
                  const rr = (rise + ph) % 1;
                  return <path key={ph} d={`M${x + 26} ${136 - rr * 90} l-10 14 h20 z`} fill={c} opacity={(1 - rr) * (0.7 + burst)} />;
                })}
              </g>
            );
          })}
          <g opacity={prog(frame, luz - 6, luz + 10)}>
            <rect x={90} y={212} width={680} height={56} rx={10} fill="none" stroke={TITANIUM} strokeDasharray="10 8" strokeOpacity={0.6} strokeWidth={2} />
            <text x={430} y={250} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={26} fill={TITANIUM} letterSpacing={3}>
              SEM BACKLIGHT
            </text>
          </g>
        </svg>
      </div>
    </>
  );
};

// ---- s04: LCD (rigid backlight) vs OLED (bends) -----------------------------------------------
const flicker = (frame: number, at: number) => {
  if (frame < at) return 1;
  const seq = [1, 0.25, 1, 0.12, 0.85, 0.06, 0.7, 0.04, 0.3, 0];
  const i = Math.floor((frame - at) / 3);
  return i < seq.length ? seq[i] : 0;
};

export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.s04_no_backlight;
  const placa = K("s04_no_backlight", "placa rígida");
  const bl = K("s04_no_backlight", "backlight");
  const dob = K("s04_no_backlight", "dobrar");
  const o = win(frame, from, to, 14, 14);
  if (o <= 0) return null;
  const light = flicker(frame, bl);
  const plate = prog(frame, placa, placa + 12);
  const bend = prog(frame, dob - 4, dob + 26, easeInOut);
  const col = (x: number, title: string, sub: string, color: string, delay: number) => {
    const c = prog(frame, from + delay, from + delay + 18, backOut);
    return (
      <div style={{ position: "absolute", left: x, top: 200, width: 440, textAlign: "center", opacity: c, transform: `translateY(${(1 - c) * 30}px)` }}>
        <div style={{ fontFamily: ORBITRON, fontWeight: 900, fontSize: 60, color, textShadow: `${SHADOW}, ${glow(color, 0.3)}` }}>{title}</div>
        <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 28, color: TITANIUM, textShadow: SHADOW }}>{sub}</div>
      </div>
    );
  };
  const oledPts = foldCurve("drop", 0.82 * bend, 780, mix(1000, 1180, bend), mix(0.6, 0.85, bend));
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {col(80, "LCD", "telas antigas", WARM, 0)}
      {col(560, "OLED", "cada pixel acende", OLED_BLUE, 6)}
      {/* Photo panels */}
      <div style={{ position: "absolute", left: 80, top: 330, width: 440, height: 440, borderRadius: 20, overflow: "hidden", border: `2px solid rgba(255,245,224,${0.25 + 0.6 * plate * light})`, boxShadow: `0 0 ${50 * plate * light}px rgba(255,245,224,0.6)` }}>
        <Img src={img("lcd_backlight_leds.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", filter: `brightness(${0.1 + 0.95 * light}) saturate(${0.3 + 0.7 * light})` }} />
        <AbsoluteFill style={{ background: `rgba(255,245,224,${0.18 * plate * light})` }} />
      </div>
      <div style={{ position: "absolute", left: 560, top: 330, width: 440, height: 440, borderRadius: 20, overflow: "hidden", border: `2px solid rgba(0,168,255,0.5)`, boxShadow: `0 0 30px rgba(0,168,255,0.35)` }}>
        <Img src={img("oled_subpixels.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "20% 30%", transform: `scale(${mix(1.6, 1.9, prog(frame, from, to, (x) => x))})` }} />
      </div>
      <Label x={300} y={790} align="center" text={frame >= bl + 30 ? "SEM LUZ PRÓPRIA" : "BACKLIGHT · PLACA RÍGIDA"} color={frame >= bl + 30 ? STRESS_RED : WARM} o={plate} size={22} />
      <Label x={780} y={790} align="center" text="LUZ EM CADA PIXEL" color={OLED_BLUE} o={prog(frame, placa, placa + 12)} size={22} />
      {/* Cross-sections */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <g transform={`translate(${frame >= dob && frame < dob + 14 ? Math.sin(frame * 2.2) * 4 : 0} 0)`}>
          <rect x={110} y={980} width={380} height={14} rx={3} fill="#8aa0b8" />
          <rect x={110} y={998} width={380} height={44} rx={4} fill={`rgba(255,245,224,${0.15 + 0.8 * light})`} style={{ filter: `drop-shadow(0 0 ${20 * light}px rgba(255,245,224,0.9))` }} />
          <rect x={110} y={1046} width={380} height={16} rx={3} fill="#555c68" />
          <text x={300} y={1100} textAnchor="middle" fontFamily={MONO} fontWeight={700} fontSize={22} fill={TITANIUM} letterSpacing={2}>
            BACKLIGHT
          </text>
        </g>
        <path d={toPath(oledPts)} stroke={OLED_BLUE} strokeWidth={9} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 12px ${OLED_BLUE})` }} />
        <g opacity={prog(frame, dob + 6, dob + 18)}>
          <text x={300} y={1180} textAnchor="middle" fontFamily={ORBITRON} fontWeight={900} fontSize={40} fill={STRESS_RED} style={{ filter: `drop-shadow(0 0 8px ${STRESS_RED})` }}>
            ✕ RÍGIDO
          </text>
          <text x={780} y={1270} textAnchor="middle" fontFamily={ORBITRON} fontWeight={900} fontSize={40} fill={OLED_BLUE} style={{ filter: `drop-shadow(0 0 8px ${OLED_BLUE})` }}>
            ✓ DOBRA
          </text>
        </g>
      </svg>
    </div>
  );
};

// ---- s05: exploded view labels -----------------------------------------------------------------
const LayerTag: React.FC<{ i: number; text: string; at: number; color: string; until: number }> = ({ i, text, at, color, until }) => {
  const frame = useCurrentFrame();
  const o = win(frame, at, until, 12, 12);
  if (o <= 0) return null;
  const p = project(layerPoint(frame, i, -LAYER_W * 0.42), frame);
  const lx = 90;
  const ly = p.y - 18;
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: o }}>
        <circle cx={p.x} cy={p.y} r={7} fill={color} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
        <line x1={p.x} y1={p.y} x2={Math.max(lx + 10, p.x - 60)} y2={ly - 14} stroke={color} strokeWidth={2} strokeOpacity={0.8} />
      </svg>
      <div style={{ position: "absolute", left: lx, top: ly - 52, opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color, textShadow: `${SHADOW}, ${glow(color, 0.2, 0.6)}`, whiteSpace: "nowrap" }}>{text}</div>
    </>
  );
};

export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.s05_glass_titanium;
  const ti = K("s05_glass_titanium", "titânio");
  const ultra = K("s05_glass_titanium", "ultratinhos");
  const inset = win(frame, ti + 4, to, 14, 14);
  const end = to;
  return (
    <>
      <Label x={90} y={200} text="VISTA EXPLODIDA" o={win(frame, from + 6, end, 14, 14)} size={24} />
      <LayerTag i={OLED_I} text="OLED" at={K("s05_glass_titanium", "por cima") + 30} color={OLED_BLUE} until={end} />
      <LayerTag i={1} text="VIDRO ULTRAFINO" at={ultra} color={WARM} until={end} />
      <LayerTag i={6} text="VIDRO ULTRAFINO" at={ultra + 8} color={WARM} until={end} />
      <LayerTag i={TI} text="PLACA DE TITÂNIO" at={ti + 2} color={TITANIUM} until={end} />
      {inset > 0 ? (
        <div style={{ position: "absolute", left: 770, top: 1130, width: 210, height: 210, borderRadius: "50%", overflow: "hidden", opacity: inset, transform: `scale(${mix(0.7, 1, prog(frame, ti + 4, ti + 20, backOut))})`, border: `3px solid ${TITANIUM}`, boxShadow: `0 0 30px rgba(192,192,192,0.5)` }}>
          <Img src={img("titanium_cetko.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.5)" }} />
        </div>
      ) : null}
      <Label x={875} y={1348} align="center" text="TITÂNIO REAL" o={inset} size={18} />
    </>
  );
};

// ---- s06: glue + pages of a book ---------------------------------------------------------------
export const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const { to } = SC.s06_glue_book;
  const cola = K("s06_glue_book", "cola");
  const desl = K("s06_glue_book", "deslizarem");
  const pag = K("s06_glue_book", "páginas");
  const glueO = win(frame, cola, to, 10, 14);
  const pulse = Math.exp(-Math.max(0, frame - K("s06_glue_book", "cola 2")) / 14) * (frame >= K("s06_glue_book", "cola 2") ? 1 : 0);
  const slideO = win(frame, desl + 20, to, 12, 14);
  const bookO = win(frame, pag - 4, to, 10, 14);
  const draw = prog(frame, pag - 4, pag + 40, easeInOut);
  // Arrows at both bent ends: top layer vs bottom layer slide past each other.
  const ends = ([1, -1] as const).map((side) => ({ top: project(bentLayerEnd(frame, 0, side), frame), bot: project(bentLayerEnd(frame, 9, side), frame), side }));
  return (
    <>
      <div style={{ position: "absolute", left: 0, width: 1080, top: 300, textAlign: "center", opacity: glueO, fontFamily: ORBITRON, fontWeight: 900, fontSize: 54, color: AMBER, textShadow: `${SHADOW}, ${glow(AMBER, 0.4 + 0.6 * pulse)}`, transform: `scale(${1 + 0.08 * pulse})` }}>
        COLA ESPECIAL
      </div>
      <Label x={540} y={380} align="center" text="ADESIVO ENTRE CAMADAS" o={glueO} size={24} />
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        {slideO > 0
          ? ends.map(({ top, bot, side }) => {
              const mx = (top.x + bot.x) / 2 + side * 46;
              const my = (top.y + bot.y) / 2;
              const wob = 8 * Math.sin((frame / FPS) * 5);
              return (
                <g key={side} opacity={slideO} stroke={AMBER} strokeWidth={4} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${AMBER})` }}>
                  <path d={`M${mx} ${my - 46 + wob} l0 -30 m-10 10 l10 -10 l10 10`} />
                  <path d={`M${mx} ${my + 46 - wob} l0 30 m-10 -10 l10 10 l10 -10`} />
                </g>
              );
            })
          : null}
        {bookO > 0 ? (
          <g opacity={bookO * 0.85} fill="none" stroke={WARM} strokeWidth={2.5} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${WARM})` }}>
            {Array.from({ length: 7 }, (_, k) => {
              const spread = (k - 3) * 0.17;
              const len = 300;
              const bx = 540;
              const by = 1250;
              const ang = -Math.PI / 2 + spread;
              const ex = bx + len * Math.cos(ang);
              const ey = by + len * Math.sin(ang) * 0.55;
              const c1x = bx + (len * 0.5) * Math.cos(ang - 0.5 * Math.sign(spread || 1));
              const c1y = by - len * 0.15;
              const d = `M${bx} ${by} Q${c1x} ${c1y} ${ex} ${ey}`;
              return <path key={k} d={d} strokeDasharray={600} strokeDashoffset={600 * (1 - draw)} opacity={0.5 + 0.5 * (1 - Math.abs(k - 3) / 3)} />;
            })}
          </g>
        ) : null}
      </svg>
      <Label x={540} y={1300} align="center" text="COMO PÁGINAS DE UM LIVRO" color={WARM} o={bookO} size={24} />
    </>
  );
};

export const S05aBackplate: React.FC = () => <Backplate src="fold_pixel_fold.webp" from={SC.s05a_not_only.from} to={SC.s05a_not_only.to + 20} opacity={0.22} />;
export const S01Backplate: React.FC = () => <Backplate src="crease_z_flip.webp" from={0} to={SC.s01_layers.to} opacity={0.2} />;
