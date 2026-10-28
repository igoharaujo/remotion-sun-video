// The 2D story layer on the Keynote stage, one component per scene. Every beat frame comes from
// timeline.json (K / SC). Clean type, one idea per beat, nothing floating around.
import * as THREE from "three";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { ATOMS, BOTTLE_IN_IMAGE, bottleAt, moleculeAt, project } from "../three/rig";
import { DISPLAY, DROP, INTER, MONO, SHADOW, glow } from "../style";
import { SimLabel } from "./Chrome";
import { FADE_OUT, GOLD, GOLD_DEEP, INK, K, MUTED, RED, SC, SERUM, WORDS, backOut, easeIn, easeInOut, easeOut, expOut, kickAt, mix, prog, win } from "../tl";

const img = (name: string) => staticFile(`images/skincare/${name}.webp`);
const wordAt = (text: string, after = 0) => WORDS.find((w) => w.f >= after && w.w.toLowerCase().startsWith(text))?.f ?? after;

const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
const centered = (y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: 60, width: 960, top: y, textAlign: "center", ...extra });

/** Keynote reveal: fade up + slight rise (0.15 s ease-out). */
const rise = (frame: number, at: number, dur = 14) => {
  const p = prog(frame, at, at + dur, easeOut);
  return { opacity: p, transform: `translateY(${(1 - p) * 30}px)` };
};
/** Pop-in for badges. */
const popIn = (frame: number, at: number, dur = 10) => {
  const p = prog(frame, at, at + dur, backOut);
  return { opacity: prog(frame, at, at + 4), transform: `scale(${mix(0.6, 1, p)})` };
};

const LABEL: React.CSSProperties = { fontFamily: MONO, fontWeight: 700, letterSpacing: 6, color: MUTED, textShadow: SHADOW };

// ---- the product on stage (cutout over the 3D floor; the 3D spotlight follows it) ---------------------
export const StudioBottle: React.FC = () => {
  const frame = useCurrentFrame();
  const b = bottleAt(frame);
  const o = b.o * (1 - prog(frame, FADE_OUT[0], FADE_OUT[0] + 30, easeIn));
  if (o <= 0.003) return null;
  const left = b.cx - BOTTLE_IN_IMAGE.cx * b.size;
  const top = b.base - BOTTLE_IN_IMAGE.base * b.size;
  const vidro = K("S02", "vidro");
  const sheen = prog(frame, vidro - 4, vidro + 40, easeInOut);
  const yaw = 7 * b.sway;
  const mask = `url(${img("serum_hero_cut")})`;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* Reflection on the glossy floor. */}
      <div style={abs(left, b.base - 6, { width: b.size, height: b.size * 0.3, overflow: "hidden", opacity: 0.22 })}>
        <Img src={img("serum_hero_cut")} style={{ width: b.size, height: b.size, transform: `translateY(${-b.size * (1 - BOTTLE_IN_IMAGE.base)}px) scaleY(-1)`, transformOrigin: `50% ${BOTTLE_IN_IMAGE.base * 100}%`, WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.9), transparent 28%)" }} />
      </div>
      {/* Contact shadow. */}
      <div style={abs(b.cx - b.size * 0.13, b.base - b.size * 0.02, { width: b.size * 0.26, height: b.size * 0.035, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,0,0,0.85), rgba(0,0,0,0) 70%)" })} />
      <div style={abs(left, top, { width: b.size, height: b.size, transform: `perspective(1600px) rotateY(${yaw}deg)`, transformOrigin: `${BOTTLE_IN_IMAGE.cx * 100}% 90%`, filter: "drop-shadow(0 0 30px rgba(234,242,255,0.10))" })}>
        <Img src={img("serum_hero_cut")} style={{ width: "100%", height: "100%" }} />
        {/* Specular sweep on "pele de vidro", clipped to the product by its own alpha. */}
        {sheen > 0 && sheen < 1 && (
          <div style={{ position: "absolute", inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: "100% 100%", maskSize: "100% 100%", background: `linear-gradient(110deg, transparent ${mix(-30, 100, sheen)}%, rgba(255,255,255,0.6) ${mix(-22, 108, sheen)}%, transparent ${mix(-14, 116, sheen)}%)`, mixBlendMode: "screen" }} />
        )}
      </div>
    </AbsoluteFill>
  );
};

// ---- S01 hook: PARE / DE GASTAR / CARO ------------------------------------------------------------
const GASTAR = wordAt("gastar");
const TAGS = [
  { x: 120, y: 1120, rot: -12, from: -500 },
  { x: 400, y: 1210, rot: 6, from: 1500 },
  { x: 680, y: 1100, rot: 14, from: 1600 },
];

const PriceTag: React.FC<{ x: number; y: number; rot: number; from: number; frame: number; i: number }> = ({ x, y, rot, from, frame, i }) => {
  const imp = K("S01", "importados");
  const inP = prog(frame, imp + i * 5, imp + i * 5 + 14, expOut);
  const xMark = prog(frame, imp + 26 + i * 4, imp + 34 + i * 4, backOut);
  const outP = prog(frame, imp + 52 + i * 3, imp + 70 + i * 3, easeIn);
  if (inP <= 0 || outP >= 1) return null;
  const px = mix(from, x, inP) + outP * (i === 0 ? -900 : 900);
  return (
    <div style={abs(px, y + outP * -200, { width: 280, height: 150, transform: `rotate(${rot + outP * 40}deg)`, filter: DROP })}>
      <svg width="280" height="150" viewBox="0 0 280 150">
        <path d="M40 8 H268 a8 8 0 0 1 8 8 V134 a8 8 0 0 1 -8 8 H40 L6 75 Z" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="3" />
        <circle cx="38" cy="75" r="10" fill="none" stroke="#3A3A3C" strokeWidth="3" />
      </svg>
      <div style={abs(60, 52, { width: 210, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 2, color: INK })}>IMPORTADO</div>
      {xMark > 0 && (
        <svg width="280" height="150" viewBox="0 0 280 150" style={abs(0, 0, { transform: `scale(${mix(1.6, 1, xMark)})`, opacity: xMark })}>
          <path d="M70 20 L250 130 M250 20 L70 130" stroke={RED} strokeWidth="14" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

export const S01: React.FC = () => {
  const frame = useCurrentFrame();
  const pare = K("S01", "pare");
  const fort = K("S01", "fortunas");
  if (frame >= SC.S01.to + 10) return null;
  const out = 1 - prog(frame, K("S01", "importados") + 70, SC.S01.to, easeIn);
  // Three hard cuts: PARE -> DE GASTAR -> the full lockup with CARO.
  const cut = frame < GASTAR ? 0 : frame < fort ? 1 : 2;
  const slam = (at: number) => mix(1.5, 1, prog(frame, at, at + 7, expOut));
  return (
    <AbsoluteFill style={{ opacity: out }}>
      {cut === 0 && frame >= pare && <div style={centered(560, { ...DISPLAY, fontWeight: 900, fontSize: 300, letterSpacing: -12, color: RED, transform: `scale(${slam(pare)})`, textShadow: `${SHADOW}, ${glow(RED, kickAt(frame, pare, 10))}` })}>PARE</div>}
      {cut === 1 && <div style={centered(600, { ...DISPLAY, fontWeight: 900, fontSize: 140, lineHeight: 1, letterSpacing: -5, color: INK, transform: `scale(${slam(GASTAR)})`, textShadow: SHADOW })}>DE GASTAR</div>}
      {cut === 2 && (
        <div style={centered(440, { transform: `translateY(${-30 * prog(frame, K("S01", "importados"), K("S01", "importados") + 20)}px)` })}>
          <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 116, lineHeight: 1, letterSpacing: -4, color: INK, textShadow: SHADOW }}>Pare de gastar</div>
          <div style={{ position: "relative", display: "inline-block", marginTop: 10, ...DISPLAY, fontWeight: 900, fontSize: 280, lineHeight: 1, letterSpacing: -12, color: RED, transform: `scale(${slam(fort)})`, textShadow: `${SHADOW}, ${glow(RED, kickAt(frame, fort, 12))}` }}>
            caro.
            <div style={{ position: "absolute", left: 0, bottom: -6, height: 10, borderRadius: 5, background: GOLD, width: `${100 * prog(frame, fort + 6, fort + 20, easeInOut)}%` }} />
          </div>
        </div>
      )}
      {TAGS.map((t, i) => (
        <PriceTag key={i} {...t} frame={frame} i={i} />
      ))}
    </AbsoluteFill>
  );
};

// ---- S02: the spotlight reveal (the bottle itself is StudioBottle) -------------------------------------
export const S02: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S02;
  const o = win(frame, from, to + 8, 1, 16);
  if (o <= 0) return null;
  const preco = K("S02", "preco");
  const cem = K("S02", "cem");
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={centered(1110, rise(frame, preco))}>
        <div style={{ ...LABEL, fontSize: 30 }}>MENOS DE</div>
        <div style={{ ...DISPLAY, fontSize: 150, lineHeight: 1, color: GOLD_DEEP, textShadow: `${SHADOW}, ${glow(GOLD, 0.3 + kickAt(frame, preco, 12))}` }}>R$ 200</div>
      </div>
      {/* 100% BRASILEIRO seal */}
      <div style={abs(770, 470, { width: 220, height: 220, ...popIn(frame, cem, 12) })}>
        <svg width="220" height="220" viewBox="0 0 250 250" style={{ filter: DROP }}>
          <defs>
            <path id="sealpath" d="M125 125 m-92 0 a92 92 0 1 1 184 0 a92 92 0 1 1 -184 0" />
          </defs>
          <circle cx="125" cy="125" r="118" fill="#141416" stroke={GOLD} strokeWidth="3" />
          <circle cx="125" cy="125" r="70" fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray="4 6" />
          <g transform={`rotate(${(frame - cem) * 0.8} 125 125)`}>
            <text fontFamily={MONO} fontWeight={700} fontSize="22" letterSpacing="5" fill={GOLD_DEEP}>
              <textPath href="#sealpath">BRASILEIRO • BRASILEIRO • BRASILEIRO •</textPath>
            </text>
          </g>
          <text x="125" y="142" textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize="50" fill={INK}>
            100%
          </text>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

// ---- S03: Zencial + 125 MIL PEDIDOS -------------------------------------------------------------------
const fmt = (n: number) => Math.round(n).toLocaleString("pt-BR");
export const S03: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S03;
  const o = win(frame, from, to + 8, 10, 16);
  if (o <= 0) return null;
  const z = K("S03", "zencial");
  const n125 = K("S03", "n125");
  const up = prog(frame, n125 - 24, n125, easeInOut);
  const count = interpolate(frame, [n125, n125 + 40], [0, 125000], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  const track = mix(30, -4, prog(frame, z, z + 40, expOut));
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={centered(mix(600, 200, up), { opacity: prog(frame, z, z + 10), transform: `scale(${mix(1, 0.6, up)})`, transformOrigin: "50% 0%" })}>
        <div style={{ ...DISPLAY, fontWeight: 600, fontSize: 200, lineHeight: 1, letterSpacing: track, color: INK, textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.15 + 0.5 * kickAt(frame, z, 16))}` }}>Zencial</div>
        <div style={{ ...rise(frame, K("S03", "ghk1")), marginTop: 22, opacity: prog(frame, K("S03", "ghk1"), K("S03", "ghk1") + 10) * (1 - up), fontFamily: INTER, fontWeight: 500, fontSize: 44, color: MUTED, textShadow: SHADOW }}>
          Sérum <span style={{ color: SERUM, fontWeight: 700 }}>GHK-Cu</span>
        </div>
      </div>
      {/* Rows of bottles = the orders. */}
      <div style={abs(190, 410, { width: 700, height: 700, borderRadius: 36, overflow: "hidden", opacity: prog(frame, n125 - 10, n125 + 14), transform: `scale(${mix(0.94, 1.03, prog(frame, n125 - 10, to, easeOut))})`, boxShadow: "0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.06)" })}>
        <Img src={img("serum_army")} style={{ width: "100%", height: "100%" }} />
      </div>
      <div style={centered(1145, { opacity: prog(frame, n125, n125 + 4) })}>
        <div style={{ ...DISPLAY, fontSize: 150, lineHeight: 1, color: GOLD_DEEP, textShadow: `${SHADOW}, ${glow(GOLD, 0.25 + kickAt(frame, n125 + 40, 12))}` }}>{fmt(count)}</div>
        <div style={{ ...LABEL, ...rise(frame, K("S03", "pedidos")), fontSize: 40, letterSpacing: 12 }}>PEDIDOS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---- S04: GHK-Cu molecule -> collagen -------------------------------------------------------------------
export const S04: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S04;
  const o = win(frame, from, to + 6, 10, 20);
  if (o <= 0) return null;
  const m = moleculeAt(frame);
  const est = K("S04", "estimula");
  const col = K("S04", "colageno");
  const firm = K("S04", "firmeza");
  const atomLabels = 1 - prog(frame, est, est + 16);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {/* Atom labels follow the projected atoms. */}
      {ATOMS.map((a, i) => {
        const w = a.from.clone().lerp(a.pos, m.arrive[i]).applyAxisAngle(new THREE.Vector3(0, 1, 0), m.spin).multiplyScalar(m.scale).add(m.center);
        const p = project(w.add(new THREE.Vector3(0, -(a.r + 0.25) * m.scale, 0)), frame);
        const lo = Math.min(1, m.arrive[i] * 2) * atomLabels;
        return lo > 0.01 ? (
          <div key={a.id} style={abs(p.x - 80, p.y, { width: 160, textAlign: "center", opacity: lo, fontFamily: MONO, fontWeight: 700, fontSize: a.id === "Cu" ? 34 : 28, color: a.id === "Cu" ? SERUM : MUTED, textShadow: SHADOW })}>
            {a.label}
          </div>
        ) : null;
      })}
      <div style={centered(230, { ...rise(frame, K("S04", "ghk2")), opacity: prog(frame, K("S04", "ghk2"), K("S04", "ghk2") + 14) * (1 - prog(frame, est - 6, est + 10)) })}>
        <div style={{ ...DISPLAY, fontSize: 130, lineHeight: 1, color: INK, textShadow: SHADOW }}>GHK-Cu</div>
        <div style={{ ...LABEL, fontSize: 32, marginTop: 10 }}>PEPTÍDEO DE COBRE</div>
      </div>
      {/* Collagen + firmness */}
      <div style={centered(1180, rise(frame, col))}>
        <div style={{ ...LABEL, fontSize: 30 }}>↑ PRODUÇÃO DE</div>
        <div style={{ ...DISPLAY, fontSize: 100, lineHeight: 1.05, color: GOLD_DEEP, textShadow: SHADOW }}>colágeno</div>
      </div>
      <div style={abs(690, 820, { ...popIn(frame, firm + 6, 12), display: "flex", alignItems: "center", gap: 12, padding: "12px 24px", borderRadius: 40, background: "rgba(28,28,30,0.9)", border: `1.5px solid ${GOLD}`, boxShadow: "0 10px 30px rgba(0,0,0,0.6)" })}>
        <svg width="34" height="34" viewBox="0 0 34 34">
          <circle cx="17" cy="17" r="16" fill={GOLD} />
          <path d="M9 17 L15 23 L25 11" stroke="#111" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ fontFamily: INTER, fontWeight: 800, fontSize: 36, color: INK }}>Firmeza</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- portrait card (real stock photo, never altered; always labelled) ------------------------------
const Portrait: React.FC<{ name: string; x: number; y: number; w: number; h: number; enter: number; zoom: number; light: number; focusY?: number }> = ({ name, x, y, w, h, enter, zoom, light, focusY = 35 }) => (
  <div style={abs(x, y, { width: w, height: h, borderRadius: 40, overflow: "hidden", opacity: enter, transform: `scale(${mix(0.94, 1, enter)})`, boxShadow: "0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07)" })}>
    <Img src={img(name)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `50% ${focusY}%`, transform: `scale(${zoom})`, transformOrigin: `50% ${focusY}%` }} />
    {/* A studio light passing across the card (light only: the photo itself is untouched). */}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, transparent ${mix(-40, 110, light)}%, rgba(255,255,255,0.22) ${mix(-25, 125, light)}%, transparent ${mix(-10, 140, light)}%)`, mixBlendMode: "screen" }} />
  </div>
);

// ---- S05: "olha a diferença na textura" — illustrative portrait --------------------------------------
export const S05: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S05;
  const o = win(frame, from, to + 6, 10, 18);
  if (o <= 0) return null;
  const dif = K("S05", "diferenca");
  const biz = K("S05", "bizarro");
  const enter = prog(frame, from, from + 20, easeOut);
  const zoom = 1.02 + 0.08 * prog(frame, from, to, easeInOut) + 0.12 * kickAt(frame, biz, 14);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <Portrait name="portrait_glow" x={150} y={250} w={780} h={1000} enter={enter} zoom={zoom} light={prog(frame, dif, dif + 70, easeInOut)} focusY={30} />
      <SimLabel x={60} y={1290} w={960} opacity={prog(frame, from + 6, from + 18)} />
    </AbsoluteFill>
  );
};

// ---- S06: social proof ----------------------------------------------------------------------------
const AVATAR_COLS = 7;
const AVATAR_ROWS = 4;
export const S06: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S06;
  const o = win(frame, from, to + 6, 10, 18);
  if (o <= 0) return null;
  const mil = K("S06", "milagre");
  const mkt = K("S06", "marketing");
  const tt = K("S06", "tiktok");
  const n1 = K("S06", "n1");
  const n7 = K("S06", "n7");
  const strike = prog(frame, mkt + 8, mkt + 22, easeInOut);
  const milO = win(frame, mil, tt, 6, 10);
  const medal = prog(frame, tt, tt + 30, expOut);
  const up = prog(frame, n7 - 20, n7 + 6, easeInOut);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <div style={abs(60, 205, { opacity: prog(frame, tt, tt + 10) * 0.75, fontFamily: MONO, fontWeight: 500, fontSize: 22, letterSpacing: 1, color: MUTED, textShadow: SHADOW })}>Fonte: TikTok via Cosmetic Innovation · set/2026</div>
      {milO > 0 && (
        <div style={centered(600, { opacity: milO, transform: `scale(${mix(1.2, 1, prog(frame, mil, mil + 10, expOut))})` })}>
          <span style={{ position: "relative", ...DISPLAY, fontWeight: 600, fontSize: 170, color: INK, textShadow: SHADOW }}>
            Milagre?
            <span style={{ position: "absolute", left: -10, top: "54%", height: 10, borderRadius: 5, background: RED, width: `${strike * 104}%` }} />
          </span>
        </div>
      )}
      {/* Nº 1 medal */}
      <div style={centered(mix(300, 240, up), { opacity: medal, transform: `scale(${mix(1, 0.8, up)})`, transformOrigin: "50% 0%" })}>
        <div style={{ display: "inline-block", width: 280, height: 280, transform: `perspective(900px) rotateY(${mix(540, 0, medal) + 8 * Math.sin(frame / 30)}deg) scale(${1 + 0.1 * kickAt(frame, n1, 10)})`, filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.7))" }}>
          <svg width="280" height="280" viewBox="0 0 300 300">
            <defs>
              <linearGradient id="medal" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F6E3A1" />
                <stop offset="0.45" stopColor={GOLD} />
                <stop offset="1" stopColor="#7A5A0C" />
              </linearGradient>
            </defs>
            <circle cx="150" cy="150" r="140" fill="url(#medal)" />
            <circle cx="150" cy="150" r="112" fill="none" stroke="#FFF4C8" strokeWidth="3" opacity="0.7" />
            <text x="150" y="182" textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize="96" letterSpacing="-4" fill="#1A1406">
              Nº1
            </text>
          </svg>
        </div>
        <div style={{ ...DISPLAY, fontSize: 70, color: INK, textShadow: SHADOW, marginTop: 18 }}>de beleza</div>
        <div style={{ ...LABEL, fontSize: 32, color: GOLD_DEEP }}>TIKTOK SHOP BRASIL</div>
      </div>
      {/* 7 mil creators */}
      {frame >= n7 - 4 && (
        <>
          <div style={abs(540 - (AVATAR_COLS * 104) / 2, 820, { width: AVATAR_COLS * 104, display: "flex", flexWrap: "wrap", gap: 14 })}>
            {Array.from({ length: AVATAR_COLS * AVATAR_ROWS }, (_, i) => {
              const at = n7 + Math.floor(random(`av-${i}`) * 50);
              const p = prog(frame, at, at + 10, backOut);
              return (
                <svg key={i} width="90" height="90" viewBox="0 0 90 90" style={{ opacity: prog(frame, at, at + 4), transform: `scale(${mix(0.4, 1, p)})` }}>
                  <circle cx="45" cy="45" r="42" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="2" />
                  <circle cx="45" cy="36" r="15" fill={i % 3 ? "#8E8E93" : GOLD_DEEP} />
                  <path d="M18 74 a27 22 0 0 1 54 0" fill={i % 3 ? "#8E8E93" : GOLD_DEEP} />
                </svg>
              );
            })}
          </div>
          <div style={centered(1240, rise(frame, K("S06", "criadores")))}>
            <div style={{ ...DISPLAY, fontSize: 96, lineHeight: 1, color: INK, textShadow: SHADOW }}>
              <span style={{ color: GOLD_DEEP }}>+7 mil</span> criadores
            </div>
            <div style={{ ...LABEL, fontSize: 28, marginTop: 8, opacity: prog(frame, wordAt("geraram"), wordAt("geraram") + 8) }}>GERARAM VENDAS</div>
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// ---- S07: "pele cansada?" on the empty stage -> a portrait lights up on "viço" -> bottle returns -------
export const S07: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S07;
  const o = win(frame, from, to + 6, 12, 14);
  if (o <= 0) return null;
  const vico = K("S07", "vico");
  const testar = K("S07", "testar");
  const q = win(frame, K("S07", "cansada") - 6, vico - 2, 12, 8);
  const lit = prog(frame, vico - 4, vico + 24, easeOut);
  const away = prog(frame, testar - 8, testar + 12, easeInOut);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {q > 0 && <div style={centered(720, { opacity: q, ...DISPLAY, fontWeight: 600, fontSize: 120, color: MUTED, textShadow: SHADOW })}>Pele cansada?</div>}
      {lit > 0 && away < 1 && (
        <div style={{ opacity: 1 - away }}>
          <Portrait name="portrait_lookup" x={190} y={300} w={700} h={900} enter={lit} zoom={1.04 + 0.04 * lit} light={prog(frame, vico, vico + 60, easeInOut)} focusY={28} />
          <SimLabel x={60} y={1230} w={960} opacity={lit} />
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- S08: AGORA + discount -----------------------------------------------------------------------
export const S08: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S08;
  const o = win(frame, from, to + 6, 6, 14);
  if (o <= 0) return null;
  const agora = K("S08", "agora");
  const desc = K("S08", "desconto");
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {frame >= agora && (
        <div style={centered(170, { ...DISPLAY, fontWeight: 900, fontSize: 210, lineHeight: 1, letterSpacing: -8, color: RED, transform: `scale(${mix(1.6, 1, prog(frame, agora, agora + 7, expOut)) * (1 + 0.03 * Math.sin(frame / 5))})`, textShadow: `${SHADOW}, ${glow(RED, kickAt(frame, agora, 10))}` })}>
          AGORA!
        </div>
      )}
      <div style={abs(600, 1150, { ...popIn(frame, desc, 12), transform: `${popIn(frame, desc, 12).transform} rotate(-5deg)`, transformOrigin: "50% 50%" })}>
        <div style={{ padding: "16px 30px", borderRadius: 18, background: `linear-gradient(135deg, #F6E3A1, ${GOLD} 60%, #9C7716)`, boxShadow: "0 16px 36px rgba(0,0,0,0.6)", fontFamily: INTER, fontWeight: 900, fontSize: 38, lineHeight: 1.05, color: "#1A1406", textAlign: "center" }}>
          1ª COMPRA
          <br />
          <span style={{ fontSize: 30, letterSpacing: 2 }}>COM DESCONTO</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- S09: COMENTE "EU QUERO" -------------------------------------------------------------------------
export const S09: React.FC = () => {
  const frame = useCurrentFrame();
  const { from, to } = SC.S09;
  const o = win(frame, from, to, 8, 1) * (1 - prog(frame, FADE_OUT[0], FADE_OUT[0] + 30, easeIn));
  if (o <= 0) return null;
  const link = K("S09", "link");
  const com = K("S09", "comentar");
  const eq = K("S09", "euquero");
  const dm = K("S09", "direct");
  const linkO = win(frame, link, com - 4, 8, 10);
  const bubble = prog(frame, eq + 16, eq + 36, backOut);
  const plane = prog(frame, dm - 6, dm + 30, easeInOut);
  return (
    <AbsoluteFill style={{ opacity: o }}>
      {linkO > 0 && (
        <div style={centered(220, { opacity: linkO, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, transform: `translateY(${(1 - prog(frame, link, link + 12)) * 24}px)` })}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={GOLD_DEEP} strokeWidth="2.2" strokeLinecap="round">
            <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
            <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
          </svg>
          <span style={{ ...DISPLAY, fontSize: 64, color: INK, textShadow: SHADOW }}>Link direto</span>
        </div>
      )}
      {frame >= com && (
        <div style={centered(200)}>
          <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 130, lineHeight: 1, letterSpacing: -5, color: INK, textShadow: SHADOW, transform: `scale(${mix(1.4, 1, prog(frame, com, com + 7, expOut))})` }}>Comente</div>
          {frame >= eq && (
            <div style={{ ...DISPLAY, fontWeight: 800, fontSize: 150, lineHeight: 1.1, letterSpacing: -5, color: GOLD_DEEP, textShadow: `${SHADOW}, ${glow(GOLD, 0.35 + kickAt(frame, eq, 12))}`, transform: `scale(${mix(1.5, 1, prog(frame, eq, eq + 8, expOut))})` }}>
              “EU QUERO”
            </div>
          )}
        </div>
      )}
      {/* Generic comment bubble. */}
      {bubble > 0 && (
        <div style={abs(170, mix(860, 700, bubble), { width: 740, opacity: prog(frame, eq + 16, eq + 24), transform: `scale(${mix(0.7, 1, bubble)})`, display: "flex", alignItems: "center", gap: 22, padding: "22px 30px", borderRadius: 40, background: "rgba(36,36,38,0.92)", boxShadow: "0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" })}>
          <svg width="76" height="76" viewBox="0 0 90 90">
            <circle cx="45" cy="45" r="42" fill="#2C2C2E" stroke="#48484A" strokeWidth="2" />
            <circle cx="45" cy="36" r="15" fill="#8E8E93" />
            <path d="M18 74 a27 22 0 0 1 54 0" fill="#8E8E93" />
          </svg>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 26, color: MUTED }}>você · agora</div>
            <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 52, color: INK }}>EU QUERO</div>
          </div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill={RED} style={{ transform: `scale(${1 + 0.3 * kickAt(frame, eq + 40, 8)})` }}>
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.4 2.6h2.4C14 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z" />
          </svg>
        </div>
      )}
      {/* "te mando no direct": a paper plane flies from the bubble to the top-right. */}
      {plane > 0 && plane < 1 && (
        <svg width="90" height="90" viewBox="0 0 24 24" style={abs(mix(820, 900, plane), mix(760, 300, plane), { transform: `rotate(${mix(0, -25, plane)}deg) scale(${mix(0.6, 1.1, plane)})`, opacity: Math.min(1, (1 - plane) * 4) })}>
          <path d="M2 11 L22 2 L15 22 L11 13 Z" fill={SERUM} stroke="#fff" strokeWidth="1" strokeLinejoin="round" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
