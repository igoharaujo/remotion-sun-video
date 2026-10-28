// A stylised phone (generic slab, no brand marks) and the vertical video feed shown on its screen.
// Feed cards are abstract placeholders: gradient, shapes, avatar, caption lines, side actions.
import { Easing, interpolate, random } from "remotion";
import { BLUE, GREEN, prog } from "../tl";
import { INTER, MONO } from "../style";

export const PHONE_RATIO = 2.1;

export const Phone: React.FC<{
  x: number; // centre x
  y: number; // centre y
  w: number;
  opacity?: number;
  rotX?: number;
  rotY?: number;
  rotZ?: number;
  glow?: number; // 0..1 accent rim light
  glowColor?: string;
  children?: React.ReactNode;
}> = ({ x, y, w, opacity = 1, rotX = 0, rotY = 0, rotZ = 0, glow = 0, glowColor = BLUE, children }) => {
  const h = w * PHONE_RATIO;
  const bezel = w * 0.035;
  const r = w * 0.15;
  if (opacity <= 0.002) return null;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, perspective: 1600 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: r,
          background: "linear-gradient(150deg, #3a3d45 0%, #16171b 40%, #0b0b0e 60%, #2a2c33 100%)",
          boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 1.5px rgba(255,255,255,0.12) inset, 0 0 ${20 + 60 * glow}px rgba(0,122,255,${0.15 + 0.45 * glow})`,
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div style={{ position: "absolute", inset: bezel, borderRadius: r - bezel, overflow: "hidden", background: "#000" }}>
          {children}
          {/* Island with the front camera. */}
          <div style={{ position: "absolute", top: w * 0.03, left: "50%", width: w * 0.3, height: w * 0.085, marginLeft: -w * 0.15, borderRadius: w, background: "#000", boxShadow: "0 0 0 1px rgba(255,255,255,0.05)" }}>
            <div style={{ position: "absolute", right: w * 0.035, top: "50%", width: w * 0.04, height: w * 0.04, marginTop: -w * 0.02, borderRadius: w, background: "radial-gradient(circle at 35% 35%, #3b4a7a, #0a0d18 70%)" }} />
          </div>
          {/* Glass sheen. */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 35%)", pointerEvents: "none" }} />
        </div>
        {glow > 0 ? <div style={{ position: "absolute", inset: -2, borderRadius: r + 2, border: `2px solid ${glowColor}`, opacity: glow, boxShadow: `0 0 24px ${glowColor}` }} /> : null}
      </div>
    </div>
  );
};

const HUES = [210, 155, 265, 330, 190, 30, 120, 290];
const VIEWS = ["1,2M", "843 mil", "3,4M", "12M", "506 mil", "7,9M", "2,1M", "990 mil"];

const Card: React.FC<{ i: number; w: number; h: number }> = ({ i, w, h }) => {
  const hue = HUES[i % HUES.length];
  const r = (k: string) => random(`card-${i}-${k}`);
  const u = w / 100;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", background: `linear-gradient(${160 + r("a") * 40}deg, hsl(${hue} 70% 32%), hsl(${hue + 40} 60% 12%))` }}>
      <div style={{ position: "absolute", left: `${10 + r("x") * 50}%`, top: `${15 + r("y") * 30}%`, width: w * 0.55, height: w * 0.55, borderRadius: "50%", background: `radial-gradient(circle, hsla(${hue + 20} 90% 70% / 0.55), transparent 70%)` }} />
      <div style={{ position: "absolute", left: `${r("x2") * 40}%`, top: `${45 + r("y2") * 15}%`, width: w * 0.7, height: w * 0.35, borderRadius: w * 0.1, transform: `rotate(${(r("rot") - 0.5) * 30}deg)`, background: `hsla(${hue - 30} 80% 60% / 0.25)` }} />
      {/* Side actions. */}
      {[0, 1, 2].map((k) => (
        <div key={k} style={{ position: "absolute", right: 4 * u, bottom: h * 0.2 + k * 15 * u, width: 9 * u, height: 9 * u, borderRadius: "50%", background: "rgba(255,255,255,0.85)", opacity: 0.85 - k * 0.15 }} />
      ))}
      {/* Creator + caption. */}
      <div style={{ position: "absolute", left: 5 * u, bottom: h * 0.09, display: "flex", alignItems: "center", gap: 3 * u }}>
        <div style={{ width: 9 * u, height: 9 * u, borderRadius: "50%", background: `hsl(${hue + 90} 70% 65%)`, border: "1.5px solid #fff" }} />
        <div style={{ width: 28 * u, height: 3.2 * u, borderRadius: u, background: "rgba(255,255,255,0.9)" }} />
      </div>
      <div style={{ position: "absolute", left: 5 * u, bottom: h * 0.055, width: 60 * u, height: 2.6 * u, borderRadius: u, background: "rgba(255,255,255,0.6)" }} />
      <div style={{ position: "absolute", left: 5 * u, bottom: h * 0.03, width: 42 * u, height: 2.6 * u, borderRadius: u, background: "rgba(255,255,255,0.45)" }} />
      <div style={{ position: "absolute", left: 5 * u, top: h * 0.09, fontFamily: MONO, fontWeight: 700, fontSize: 5 * u, color: "#fff", opacity: 0.85 }}>▶ {VIEWS[i % VIEWS.length]}</div>
    </div>
  );
};

const swipeEase = Easing.bezier(0.6, 0, 0.2, 1);
/** Cards scrolled so far at `frame`, given the frames where each swipe starts (each lasts `dur`). */
export const feedOffset = (frame: number, swipes: number[], dur = 16) => swipes.reduce((s, f) => s + interpolate(frame, [f, f + dur], [0, 1], { easing: swipeEase, extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 0);

/** The vertical feed; `offset` in cards (fractional while a swipe is moving). */
export const Feed: React.FC<{ w: number; h: number; offset: number; seed?: number; arrow?: number }> = ({ w, h, offset, seed = 0, arrow = 0 }) => {
  const base = Math.floor(offset);
  const frac = offset - base;
  const blur = Math.sin(Math.PI * frac) * 6;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", fontFamily: INTER }}>
      {[0, 1].map((k) => (
        <div key={k} style={{ position: "absolute", left: 0, width: w, height: h, top: (k - frac) * h, filter: blur > 0.3 ? `blur(${blur}px)` : undefined }}>
          <Card i={base + k + seed} w={w} h={h} />
        </div>
      ))}
      {arrow > 0 ? (
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%, -50%) translateY(${-30 * arrow}px)`, opacity: Math.sin(Math.PI * arrow), fontSize: w * 0.28, color: GREEN, fontWeight: 900, textShadow: `0 0 20px ${GREEN}` }}>↑</div>
      ) : null}
    </div>
  );
};

/** 0..1 progress of the most recent swipe (for the arrow overlay). */
export const swipeArrow = (frame: number, swipes: number[], dur = 22) => {
  for (const f of swipes) if (frame >= f && frame < f + dur) return prog(frame, f, f + dur);
  return 0;
};
