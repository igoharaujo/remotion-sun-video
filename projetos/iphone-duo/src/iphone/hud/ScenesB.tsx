// 2D overlays for scenes 7-12: hinge readout, V vs teardrop fold, stress heatmap, crease, comparison
// bars and the end card. All cue frames come from timeline-iphone.json through K() / SC.
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { INTER, MONO, ORBITRON, glow } from "../../hud/style";
import { PART_COUNT, partsArrived } from "../three/rig";
import { FPS, K, OLED_BLUE, SC, STRESS_GREEN, STRESS_RED, TITANIUM, WARM, backOut, easeIn, easeInOut, easeOut, mix, prog, win } from "../tl";
import { Backplate } from "./ScenesA";
import { bulbCircle, foldCurve, stress, stressColor, toPath } from "./fold";

const img = (name: string) => staticFile(`images/iphone/${name}`);
const SHADOW = "3px 3px 8px rgba(0,0,0,0.9)";

const Title: React.FC<{ text: string; x: number; y: number; color: string; o: number; size?: number; w?: number }> = ({ text, x, y, color, o, size = 44, w = 460 }) => (
  <div style={{ position: "absolute", left: x - w / 2, top: y, width: w, textAlign: "center", opacity: o, fontFamily: ORBITRON, fontWeight: 900, fontSize: size, color, textShadow: `${SHADOW}, ${glow(color, 0.25)}`, transform: `translateY(${(1 - o) * 16}px)` }}>
    {text}
  </div>
);
const Mono: React.FC<{ text: string; x: number; y: number; color?: string; o: number; size?: number }> = ({ text, x, y, color = TITANIUM, o, size = 24 }) => (
  <div style={{ position: "absolute", left: x - 300, top: y, width: 600, textAlign: "center", opacity: o, fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 3, color, textShadow: SHADOW, whiteSpace: "nowrap" }}>{text}</div>
);

// ---- s07: hinge assembly readout ---------------------------------------------------------------
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.s07_hinge_assembly;
  const snap = K("s07_hinge_assembly", "dobradiça");
  const o = win(frame, from + 4, to + 10, 14, 16);
  const n = partsArrived(frame);
  const done = frame >= snap;
  const pulse = done ? Math.exp(-(frame - snap) / 14) : 0;
  return (
    <>
      <Backplate src="hinge_mobile_phone.webp" from={from + 20} to={snap + 10} opacity={0.22} zoom={[1.15, 1.3]} />
      <div style={{ position: "absolute", left: 0, width: 1080, top: 220, textAlign: "center", opacity: o }}>
        <div style={{ fontFamily: ORBITRON, fontWeight: 900, fontSize: 140, lineHeight: 1, color: "#fff", textShadow: `${SHADOW}, ${glow(done ? OLED_BLUE : TITANIUM, 0.3 + 0.7 * pulse, 1.2)}`, transform: `scale(${1 + 0.1 * pulse})` }}>
          {String(n).padStart(3, "0")}
        </div>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 32, letterSpacing: 6, color: done ? OLED_BLUE : TITANIUM, marginTop: 8, textShadow: SHADOW }}>
          {done ? `${PART_COUNT >= 100 ? "100+" : PART_COUNT} PEÇAS · ENCAIXADAS` : "PEÇAS EM MONTAGEM"}
        </div>
      </div>
    </>
  );
};

// ---- s08 + s09: V fold vs teardrop, then stress -------------------------------------------------
const LX = 290;
const RX = 790;
const CY = 1170;
/** Diagrams zoom in as they fold so the flat state fits a column and the closed state reads big. */
const foldScale = (t: number) => mix(0.62, 1.4, t);

const HeatPath: React.FC<{ pts: ReturnType<typeof foldCurve>; width: number }> = ({ pts, width }) => (
  <g strokeLinecap="round">
    {pts.slice(1).map((p, i) => {
      const a = pts[i];
      const s = Math.max(stress(a.k), stress(p.k));
      return <line key={i} x1={a.x} y1={a.y} x2={p.x} y2={p.y} stroke={stressColor(s)} strokeWidth={width} />;
    })}
  </g>
);

export const S08S09: React.FC = () => {
  const frame = useCurrentFrame();
  const from = SC.s08_teardrop.from;
  const tensao = K("s09_stress", "tensão");
  const marca = K("s09_stress", "marca da dobra");
  if (frame < from || frame >= marca) return null;
  const naoDobra = K("s08_teardrop", "não dobra");
  const meio = K("s08_teardrop", "meio");
  const formar = K("s08_teardrop", "formar");
  const lagrima = K("s08_teardrop", "lágrima");
  const raio = K("s08_teardrop", "raio");
  const largo = K("s08_teardrop", "largo");
  const heat = frame >= tensao; // hard cut, no transition
  const tV = heat ? 1 : prog(frame, naoDobra - 6, meio + 6, easeInOut);
  const tD = heat ? 1 : prog(frame, formar, lagrima + 8, easeInOut);
  const v = foldCurve("v", tV, LX, CY, foldScale(tV));
  const d = foldCurve("drop", tD, RX, CY, foldScale(tD));
  const o = prog(frame, from, from + 16);
  const leftO = prog(frame, from + 6, from + 24);
  const rightO = prog(frame, from + 14, from + 32);
  const vMid = v[v.length >> 1];
  const bulb = bulbCircle(d);
  const arc = heat ? 0 : prog(frame, raio - 4, raio + 24, easeOut);
  const wide = frame >= largo ? Math.exp(-(frame - largo) / 16) : 0;
  const xMark = heat ? 0 : prog(frame, meio, meio + 8, backOut);
  const conc = K("s09_stress", "concentra");
  const legend = heat ? prog(frame, conc - 6, conc + 10) : 0;
  const hot = heat ? 0.6 + 0.4 * Math.sin(((frame - tensao) / FPS) * 9) : 0;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      {heat ? (
        <>
          <Title text="TENSÃO" x={540} y={300} color="#fff" o={1} size={72} w={900} />
          <Mono text="CONCENTRADA" x={LX} y={1230} color={STRESS_RED} o={legend} />
          <Mono text="DISTRIBUÍDA" x={RX} y={1230} color={STRESS_GREEN} o={legend} />
        </>
      ) : (
        <>
          <Title text="DOBRA EM V" x={LX} y={330} color={frame >= meio ? STRESS_RED : WARM} o={leftO} />
          <Title text="EM GOTA" x={RX} y={330} color={frame >= lagrima ? OLED_BLUE : WARM} o={rightO} />
          <Mono text="VINCO NO MEIO" x={LX} y={1230} color={STRESS_RED} o={xMark} />
          <Mono text="FORMATO DE LÁGRIMA" x={RX} y={1230} color={OLED_BLUE} o={prog(frame, lagrima, lagrima + 12)} />
        </>
      )}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <line x1={540} x2={540} y1={420} y2={1220} stroke={TITANIUM} strokeOpacity={0.18} strokeWidth={2} strokeDasharray="6 10" />
        {heat ? (
          <>
            <circle cx={vMid.x} cy={vMid.y} r={34 + 10 * hot} fill={STRESS_RED} opacity={0.35 * hot} style={{ filter: "blur(10px)" }} />
            <HeatPath pts={v} width={16} />
            <HeatPath pts={d} width={16} />
            <defs>
              <linearGradient id="heat" x1="0" x2="1">
                <stop offset="0" stopColor={stressColor(0)} />
                <stop offset="0.5" stopColor={stressColor(0.5)} />
                <stop offset="1" stopColor={stressColor(1)} />
              </linearGradient>
            </defs>
            <g opacity={legend}>
              <rect x={290} y={1330} width={500} height={14} rx={7} fill="url(#heat)" />
              <text x={280} y={1344} textAnchor="end" fontFamily={MONO} fontSize={20} fill={TITANIUM}>baixa</text>
              <text x={800} y={1344} fontFamily={MONO} fontSize={20} fill={TITANIUM}>alta</text>
            </g>
          </>
        ) : (
          <>
            <g opacity={leftO}>
              <path d={toPath(v)} stroke={WARM} strokeWidth={10} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${WARM})` }} />
            </g>
            <g opacity={rightO}>
              <path d={toPath(d)} stroke={OLED_BLUE} strokeWidth={10} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${8 + 14 * prog(frame, lagrima, lagrima + 10) * (1 - prog(frame, lagrima + 10, lagrima + 60))}px ${OLED_BLUE})` }} />
            </g>
            {xMark > 0 ? (
              <g transform={`translate(${vMid.x} ${vMid.y + 40}) scale(${xMark})`} stroke={STRESS_RED} strokeWidth={8} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${STRESS_RED})` }}>
                <line x1={-22} y1={-22} x2={22} y2={22} />
                <line x1={22} y1={-22} x2={-22} y2={22} />
              </g>
            ) : null}
            {arc > 0 ? (
              <g>
                <circle cx={bulb.cx} cy={bulb.cy} r={bulb.r * (1 + 0.08 * wide)} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="10 8" pathLength={100} strokeDashoffset={0} opacity={arc} style={{ filter: `drop-shadow(0 0 ${6 + 14 * wide}px ${OLED_BLUE})` }} />
                <line x1={bulb.cx} y1={bulb.cy} x2={bulb.cx + bulb.r * (1 + 0.08 * wide) * arc} y2={bulb.cy} stroke="#fff" strokeWidth={3} />
                <circle cx={bulb.cx} cy={bulb.cy} r={5} fill="#fff" opacity={arc} />
                <text x={bulb.cx + 14} y={bulb.cy - 12} fontFamily={ORBITRON} fontWeight={900} fontSize={34} fill="#fff" opacity={arc}>
                  R
                </text>
                <circle cx={vMid.x} cy={vMid.y} r={6} fill="none" stroke={STRESS_RED} strokeWidth={3} opacity={arc} />
                <text x={vMid.x + 14} y={vMid.y + 34} fontFamily={MONO} fontWeight={700} fontSize={22} fill={STRESS_RED} opacity={arc}>
                  r ≈ 0
                </text>
              </g>
            ) : null}
          </>
        )}
      </svg>
      {!heat ? <Mono text="RAIO LARGO" x={RX} y={1290} color="#fff" o={prog(frame, largo - 4, largo + 10)} size={30} /> : null}
    </div>
  );
};

// ---- s09 (second half): the crease fades ---------------------------------------------------------
// Screen of the Fold7 photo: x 205-985, y 262-1090 of 1200x1600; the fold is at x ~ 597.
const PHOTO = { sx: 205, sy: 262, sw: 780, sh: 828, fold: 597, iw: 1200, ih: 1600 };
export const S09Crease: React.FC = () => {
  const frame = useCurrentFrame();
  const marca = K("s09_stress", "marca da dobra");
  const des = K("s09_stress", "desaparece");
  const { to } = SC.s09_stress;
  if (frame < marca || frame >= to + 8) return null;
  const k = 780 / PHOTO.sw;
  const pw = 780;
  const ph = PHOTO.sh * k;
  const left = 150;
  const top = 300;
  const creaseX = (PHOTO.fold - PHOTO.sx) * k;
  const fade = 1 - prog(frame, des, des + 50, easeInOut);
  const o = 1 - prog(frame, to - 4, to + 8, easeIn);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <div style={{ position: "absolute", left, top, width: pw, height: ph, borderRadius: 26, overflow: "hidden", border: `2px solid rgba(192,192,192,0.4)`, boxShadow: "0 0 40px rgba(0,168,255,0.25)" }}>
        <Img src={img("fold_z7_unfolded.webp")} style={{ position: "absolute", width: PHOTO.iw * k, height: PHOTO.ih * k, left: -PHOTO.sx * k, top: -PHOTO.sy * k, filter: "brightness(0.85)" }} />
        {/* Illustrated crease: shading band + specular line, fading on "desaparece". */}
        <div style={{ position: "absolute", left: creaseX - 26, top: 0, width: 52, height: ph, opacity: fade, background: "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 38%, rgba(255,255,255,0.75) 50%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,0) 100%)" }} />
        <div style={{ position: "absolute", left: creaseX - 2, top: 0, width: 4, height: ph, opacity: fade, background: "#fff", boxShadow: `0 0 18px ${STRESS_RED}, 0 0 40px ${STRESS_RED}` }} />
      </div>
      <Title text={fade > 0.5 ? "MARCA DA DOBRA" : "QUASE INVISÍVEL"} x={540} y={200} color={fade > 0.5 ? STRESS_RED : OLED_BLUE} o={1} size={56} w={900} />
      <Mono text="ILUSTRAÇÃO · FOTO DE REFERÊNCIA: DOBRÁVEL ATUAL" x={540} y={top + ph + 18} o={0.75} size={17} />
    </div>
  );
};

// ---- s10: relative bars ------------------------------------------------------------------------
const Bar: React.FC<{ y: number; label: string; value: number; color: string; grow: number }> = ({ y, label, value, color, grow }) => (
  <>
    <div style={{ position: "absolute", left: 110, top: y, fontFamily: INTER, fontWeight: 700, fontSize: 30, color: "#fff", textShadow: SHADOW, opacity: Math.min(1, grow * 3) }}>{label}</div>
    <div style={{ position: "absolute", left: 110, top: y + 44, width: 820 * value * grow, height: 38, borderRadius: 19, background: color, boxShadow: `0 0 24px ${color}` }} />
  </>
);

export const S10: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.s10_thinner;
  const apple = K("s10_thinner", "Apple");
  const fina = K("s10_thinner", "mais fina");
  const ruga = K("s10_thinner", "menos ruga");
  const dob = K("s10_thinner", "dobráveis");
  const o = win(frame, from + 2, to, 14, 12);
  if (o <= 0) return null;
  const g1 = prog(frame, fina - 6, fina + 22, easeOut);
  const g2 = prog(frame, ruga - 6, ruga + 22, easeOut);
  const g = (a: number, d: number) => prog(frame, a + d, a + d + 24, easeOut);
  const thumb = win(frame, dob - 4, to, 12, 12);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: o }}>
      <Title text="COMPARATIVO" x={540} y={200} color="#fff" o={prog(frame, apple - 10, apple + 8)} size={60} w={900} />
      <Mono text="RELATIVO · SEM ESCALA" x={540} y={282} o={prog(frame, apple - 10, apple + 8)} size={20} />
      <div style={{ position: "absolute", left: 110, top: 380, opacity: g1, fontFamily: ORBITRON, fontWeight: 900, fontSize: 36, color: OLED_BLUE, textShadow: SHADOW }}>ESPESSURA · MAIS FINA</div>
      <Bar y={450} label="iPhone Duo (conceito)" value={0.55} color={OLED_BLUE} grow={g(fina, 0)} />
      <Bar y={560} label="maioria dos dobráveis" value={1} color={TITANIUM} grow={g(fina, 8)} />
      <div style={{ position: "absolute", left: 110, top: 740, opacity: g2, fontFamily: ORBITRON, fontWeight: 900, fontSize: 36, color: OLED_BLUE, textShadow: SHADOW }}>RUGA · MENOS RUGA</div>
      <Bar y={810} label="iPhone Duo (conceito)" value={0.28} color={OLED_BLUE} grow={g(ruga, 0)} />
      <Bar y={920} label="maioria dos dobráveis" value={1} color={TITANIUM} grow={g(ruga, 8)} />
      {thumb > 0 ? (
        <>
          <div style={{ position: "absolute", left: 790, top: 1060, width: 180, height: 180, borderRadius: "50%", overflow: "hidden", opacity: thumb, border: `3px solid ${TITANIUM}`, transform: `scale(${mix(0.7, 1, prog(frame, dob - 4, dob + 14, backOut))})` }}>
            <Img src={img("fold_z7_unfolded.webp")} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "50% 35%", transform: "scale(1.4)" }} />
          </div>
          <Mono text="DOBRÁVEL ATUAL (REF.)" x={880} y={1252} o={thumb} size={17} />
        </>
      ) : null}
    </div>
  );
};

// ---- s12: coin + "R$ ???" ------------------------------------------------------------------------
const coinY = (frame: number, start: number, land: number) => {
  const rest = 700;
  if (frame < land) return mix(-260, rest, easeIn(prog(frame, start, land, (x) => x)));
  const hops: [number, number, number][] = [
    [land, land + 20, 110],
    [land + 20, land + 33, 36],
  ];
  for (const [a, b, hgt] of hops) {
    if (frame < b) {
      const u = (frame - a) / (b - a);
      return rest - hgt * 4 * u * (1 - u);
    }
  }
  return rest;
};
export const COIN_BOUNCES = (land: number) => [land, land + 20, land + 33];

const GLYPHS = "0123456789$#%&";
export const S12: React.FC = () => {
  const frame = useCurrentFrame();
  const preco = K("s12_price", "preço");
  const land = K("s12_price", "coinLand");
  const { from } = SC.s12_price;
  if (frame < from) return null;
  const y = coinY(frame, preco - 4, land);
  const spin = frame < land + 33 ? Math.cos((frame - preco) * 0.32) : 1;
  const priceO = prog(frame, land, land + 6);
  // Glitch: scrambles for 18 frames, then settles to "???" with brief flickers.
  const t = frame - land;
  const scramble = t >= 0 && t < 18;
  const flick = t >= 18 && t % 26 < 3;
  const q = scramble || flick ? Array.from({ length: 3 }, (_, i) => GLYPHS[Math.floor(random(`g-${frame}-${i}`) * GLYPHS.length)]).join("") : "???";
  const jx = scramble || flick ? (random(`jx-${frame}`) - 0.5) * 24 : 0;
  const split = scramble ? 10 : flick ? 6 : 1.5;
  const text = `R$ ${q}`;
  const priceStyle = (color: string, dx: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    width: 1080,
    top: 900,
    textAlign: "center",
    fontFamily: ORBITRON,
    fontWeight: 900,
    fontSize: 150,
    color,
    transform: `translateX(${jx + dx}px)`,
    mixBlendMode: "screen",
  });
  return (
    <>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="coin" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.45" stopColor="#c9ccd2" />
            <stop offset="1" stopColor="#6d727c" />
          </radialGradient>
        </defs>
        <g transform={`translate(540 ${y}) scale(${Math.max(0.08, Math.abs(spin))} 1)`} style={{ filter: `drop-shadow(0 0 24px ${OLED_BLUE})` }}>
          <circle r={120} fill="url(#coin)" stroke="#e8ebf0" strokeWidth={6} />
          <circle r={98} fill="none" stroke="#8d929c" strokeWidth={3} />
          <text y={30} textAnchor="middle" fontFamily={ORBITRON} fontWeight={900} fontSize={84} fill="#5b606a">
            R$
          </text>
        </g>
        <ellipse cx={540} cy={836} rx={110 * (0.6 + 0.4 * (y / 700))} ry={14} fill="#000" opacity={0.5 * prog(frame, preco, land)} style={{ filter: "blur(6px)" }} />
      </svg>
      {priceO > 0 ? (
        <div style={{ position: "absolute", inset: 0, opacity: priceO }}>
          <div style={priceStyle("#ff2a55", -split)}>{text}</div>
          <div style={priceStyle("#00e0ff", split)}>{text}</div>
          <div style={{ ...priceStyle("#ffffff", 0), mixBlendMode: "normal", textShadow: `${SHADOW}, ${glow(OLED_BLUE, 0.4)}` }}>{text}</div>
          <Mono text="CONCEITO" x={540} y={1090} o={prog(frame, land + 10, land + 22)} size={26} />
        </div>
      ) : null}
    </>
  );
};

export const S11Shine: React.FC = () => {
  const frame = useCurrentFrame();
  const abs = K("s11_absurd", "absurda");
  const o = win(frame, abs, SC.s11_absurd.to, 2, 20) * Math.exp(-Math.max(0, frame - abs) / 40);
  return o > 0.01 ? <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 42%, rgba(255,245,224,${0.35 * o}) 0%, rgba(0,168,255,${0.15 * o}) 35%, rgba(0,0,0,0) 65%)` }} /> : null;
};
