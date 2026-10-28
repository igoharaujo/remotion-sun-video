// B-roll from the TikToks (public/broll, pre-cut by ffmpeg): the stick-figure "bad proof" in a VHS/glitch
// window with a giant red X, its 0.8 s flash in the hook, the floating windows of day 2 that stack into a
// tower, and the real terminal easter egg. All windows are CSS 3D over the space canvas.
import { OffthreadVideo, Sequence, random, staticFile, useCurrentFrame } from "remotion";
import { GLASS, MONO, SHADOW } from "../style";
import { ALERT, EGGS, FPS, INK, K, backOut, easeIn, easeInOut, expOut, kickAt, mix, prog, win } from "../tl";

/** A video cropped into a box: `crop` is the source rect (1080x1920 space) shown in the w x h box. */
const Cropped: React.FC<{ src: string; w: number; h: number; crop: { x: number; y: number; w: number }; startFrom?: number; style?: React.CSSProperties }> = ({ src, w, h, crop, startFrom = 0, style }) => {
  const s = w / crop.w;
  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", ...style }}>
      <div style={{ position: "absolute", left: -crop.x * s, top: -crop.y * s, width: 1080 * s, height: 1920 * s }}>
        <OffthreadVideo src={staticFile(src)} muted startFrom={startFrom} style={{ width: "100%", height: "100%" }} />
      </div>
    </div>
  );
};

/** VHS treatment over a box: scanlines, noise, chroma fringe, tracking band, REC timestamp. */
const VhsOverlay: React.FC<{ w: number; h: number; label: string }> = ({ w, h, label }) => {
  const f = useCurrentFrame();
  const band = (f * 7) % (h + 120);
  const seed = Math.floor(f / 2);
  return (
    <>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)", mixBlendMode: "multiply" }} />
      <svg width={w} height={h} style={{ position: "absolute", inset: 0, opacity: 0.22, mixBlendMode: "screen" }}>
        <filter id={`n${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
        </filter>
        <rect width={w} height={h} filter={`url(#n${seed})`} />
      </svg>
      <div style={{ position: "absolute", left: 0, right: 0, top: band - 120, height: 70, background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.18), rgba(255,255,255,0))", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 6px 0 0 rgba(255,0,60,0.25), inset -6px 0 0 rgba(0,200,255,0.25)" }} />
      <div style={{ position: "absolute", left: 24, top: 18, fontFamily: MONO, fontWeight: 700, fontSize: 30, color: "#fff", textShadow: "2px 0 rgba(255,0,60,0.8), -2px 0 rgba(0,200,255,0.8)" }}>
        <span style={{ color: ALERT }}>●</span> {label}
      </div>
      <div style={{ position: "absolute", right: 24, bottom: 18, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: "#fff", opacity: 0.85, textShadow: "2px 0 rgba(255,0,60,0.8), -2px 0 rgba(0,200,255,0.8)" }}>
        SEG 10:00:{String(Math.floor(f / FPS) % 60).padStart(2, "0")}
      </div>
    </>
  );
};

const BAD_CROP = { x: 0, y: 290, w: 1080 };
/** Glitch jitter: on some frames the whole window jumps sideways and splits. */
const jitter = (f: number, k = 1) => (random(`j${Math.floor(f / 3)}`) > 0.72 ? (random(`jx${f}`) - 0.5) * 34 * k : 0);

// ---- S01: the "horrible video" flashes in on "horrível aqui" -------------------------------------------
export const BadFlash: React.FC = () => {
  const f = useCurrentFrame();
  const a = K("S01", "horrivel");
  const o = win(f, a - 2, a + 50, 4, 8);
  if (o <= 0.001) return null;
  const w = 300;
  const h = 360;
  return (
    <div style={{ position: "absolute", left: 60 + jitter(f, 0.6), top: 470, width: w, height: h, opacity: o, transform: `rotate(-6deg) scale(${mix(0.6, 1, prog(f, a - 2, a + 8, backOut))})`, borderRadius: 18, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.7)", border: `3px solid ${ALERT}` }}>
      <Sequence from={a - 2} layout="none">
        <Cropped src="broll/bad.mp4" w={w} h={h} crop={{ x: 120, y: 380, w: 860 }} startFrom={Math.round(8 * FPS)} />
      </Sequence>
      <VhsOverlay w={w} h={h} label="SEG" />
    </div>
  );
};

// ---- S02: the bad proof ---------------------------------------------------------------------------------
export const BadProof: React.FC = () => {
  const f = useCurrentFrame();
  const from = K("S02", "boneco") - 6;
  const to = K("S02", "licao") - 2;
  const o = win(f, from, to, 10, 12);
  if (o <= 0.001) return null;
  const w = 860;
  const h = (w / BAD_CROP.w) * 1130;
  const zoom = 1 + 0.06 * prog(f, K("S02", "resultado"), K("S02", "bomba"), easeInOut);
  const bomba = K("S02", "bomba");
  const x = prog(f, bomba - 1, bomba + 7, expOut);
  const xKick = kickAt(f, bomba, 8);
  const j = jitter(f) + 22 * xKick * (random(`xk${f}`) - 0.5);
  return (
    <div style={{ position: "absolute", left: 110 + j, top: 470, width: w, height: h, opacity: o, transform: `perspective(1600px) rotateY(${mix(14, 0, prog(f, from, from + 24, easeInOut))}deg) scale(${zoom * mix(0.85, 1, prog(f, from, from + 18, backOut))})` }}>
      <div style={{ ...GLASS, position: "absolute", inset: -14, borderRadius: 30 }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 18, overflow: "hidden", filter: `saturate(0.7) contrast(1.15) hue-rotate(${random(`h${Math.floor(f / 4)}`) * 14 - 7}deg)` }}>
        <Sequence from={from} layout="none">
          <Cropped src="broll/bad.mp4" w={w} h={h} crop={BAD_CROP} startFrom={Math.round(6.5 * FPS)} />
        </Sequence>
        <VhsOverlay w={w} h={h} label="DIA 1 · 70 IMAGENS" />
      </div>
      {x > 0.001 && (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0, overflow: "visible", transform: `scale(${mix(1.6, 1, x)})`, opacity: Math.min(1, x * 2), filter: `drop-shadow(0 0 ${20 + 40 * xKick}px ${ALERT})` }}>
          <path d={`M${w * 0.12} ${h * 0.14} L${w * 0.88} ${h * 0.86} M${w * 0.88} ${h * 0.14} L${w * 0.12} ${h * 0.86}`} stroke={ALERT} strokeWidth={70} strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
};

// ---- S03: floating B-roll windows that stack into a tower, then scatter ------------------------------------
const WINDOWS = [
  { src: "broll/ai-grid.mp4", label: "imagem", x: 70, y: 650, ry: 18, rz: -3 },
  { src: "broll/ai-cine.mp4", label: "vídeo", x: 560, y: 690, ry: -18, rz: 2 },
  { src: "broll/editor.mp4", label: "edição", x: 90, y: 1040, ry: 14, rz: 2 },
  { src: "broll/dataviz.mp4", label: "dados", x: 570, y: 1070, ry: -14, rz: -3 },
];
const WW = 420;
const WH = 330;
export const FloatingBroll: React.FC = () => {
  const f = useCurrentFrame();
  const d2 = K("S03", "dia2");
  const stack = K("S03", "empilhar");
  const virou = K("S03", "jogo");
  if (f < d2 - 6 || f > virou + 30) return null;
  const t = f / FPS;
  return (
    <div style={{ position: "absolute", inset: 0, perspective: 1400 }}>
      {WINDOWS.map((wnd, i) => {
        const at = d2 + i * 12;
        const inP = prog(f, at, at + 22, backOut);
        const st = prog(f, stack + i * 5, stack + i * 5 + 22, easeInOut);
        const out = prog(f, virou + i * 3, virou + i * 3 + 18, easeIn);
        if (inP <= 0.001) return null;
        // tower: centred, each one 70 px higher and a bit smaller, like a pile of tools
        const tx = mix(wnd.x, 330, st) + (random(`o${i}`) - 0.5) * 900 * out;
        const ty = mix(wnd.y, 1080 - i * 95, st) - 600 * out * (i % 2 ? 1 : -0.4);
        const bob = 8 * Math.sin(t * 1.3 + i);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: tx,
              top: ty + bob,
              width: WW,
              height: WH,
              opacity: Math.min(1, inP) * (1 - out),
              transform: `rotateY(${mix(wnd.ry, 0, st)}deg) rotateX(${mix(0, 52, st)}deg) rotateZ(${mix(wnd.rz, 0, st) + 30 * out}deg) scale(${mix(0.7, 1, inP) * mix(1, 0.9, st)})`,
              transformStyle: "preserve-3d",
            }}
          >
            <div style={{ ...GLASS, position: "absolute", inset: -10, borderRadius: 24 }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, overflow: "hidden" }}>
              <Sequence from={at - 6} layout="none">
                <Cropped src={wnd.src} w={WW} h={WH} crop={{ x: 0, y: 560, w: 1080 }} />
              </Sequence>
            </div>
            <div style={{ position: "absolute", left: 14, bottom: -46, fontFamily: MONO, fontWeight: 700, fontSize: 24, letterSpacing: 4, color: INK, opacity: 0.8 * (1 - st), textShadow: SHADOW }}>{`IA #${i + 1} · ${wnd.label.toUpperCase()}`}</div>
          </div>
        );
      })}
    </div>
  );
};

// ---- S03 easter egg: the real terminal, 1.5 s -------------------------------------------------------------
export const TerminalEgg: React.FC = () => {
  const f = useCurrentFrame();
  const { from, to } = EGGS.terminal;
  const o = win(f, from, to, 5, 6);
  if (o <= 0.001) return null;
  const w = 920;
  const h = 720;
  return (
    <div style={{ position: "absolute", left: 80 + jitter(f, 0.3), top: 380, width: w, height: h + 44, opacity: o, transform: `scale(${mix(0.9, 1, prog(f, from, from + 8, expOut))})`, borderRadius: 18, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 0 1.5px rgba(255,255,255,0.18)" }}>
      <div style={{ height: 44, background: "#2A2B30", display: "flex", alignItems: "center", gap: 10, padding: "0 16px" }}>
        {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
          <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />
        ))}
        <div style={{ flex: 1, textAlign: "center", fontFamily: MONO, fontSize: 20, color: "#9AA0A6" }}>zsh — ~/Documents — 120×40</div>
      </div>
      <Sequence from={from - 2} layout="none">
        <Cropped src="broll/terminal.mp4" w={w} h={h} crop={{ x: 40, y: 320, w: 1000 }} />
      </Sequence>
    </div>
  );
};

