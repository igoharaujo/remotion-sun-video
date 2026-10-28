// Shared HUD pieces for the scenes: positioning helpers, the glass chip, the 3D glass window (perspective,
// rotateY swing-in, sheen), the "FONTE" seal (only on real, checked sources), the rubber stamp, and counters.
import { useCurrentFrame } from "remotion";
import { GLASS, MONO, SHADOW, glow } from "../style";
import { INK, MUTED, backOut, expOut, mix, prog } from "../tl";

export const abs = (x: number, y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: x, top: y, ...extra });
export const center = (y: number, extra: React.CSSProperties = {}): React.CSSProperties => ({ position: "absolute", left: 60, width: 960, top: y, textAlign: "center", ...extra });

export const Chip: React.FC<{ x: number; y: number; p: number; o?: number; color?: string; size?: number; children: React.ReactNode; anchor?: "left" | "center" }> = ({ x, y, p, o = 1, color = INK, size = 32, children, anchor = "left" }) =>
  p <= 0.001 || o <= 0.001 ? null : (
    <div style={abs(x, y, { opacity: Math.min(1, p * 1.5) * o, transform: `translateX(${anchor === "center" ? "-50%" : "0"}) scale(${mix(0.6, 1, p)})`, transformOrigin: anchor === "center" ? "50% 50%" : "0 50%" })}>
      <div style={{ ...GLASS, display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 28px", borderRadius: 999, whiteSpace: "nowrap", fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 4, color, textShadow: glow(color, 0.4) }}>{children}</div>
    </div>
  );

/** Glass window that swings in on Y (35° -> 8°) with perspective, then drifts. `p` 0..1 entrance, `o` opacity. */
export const GlassWindow: React.FC<{ x: number; y: number; w: number; h: number; p: number; o?: number; rotY?: number; title?: string; children: React.ReactNode; glowColor?: string }> = ({ x, y, w, h, p, o = 1, rotY, title, children, glowColor }) => {
  const frame = useCurrentFrame();
  if (p <= 0.001 || o <= 0.001) return null;
  const ry = rotY ?? mix(35, 8, p) + 2 * Math.sin(frame / 50);
  return (
    <div style={abs(x, y, { width: w, height: h, perspective: 1600, opacity: Math.min(1, p * 2) * o })}>
      <div
        style={{
          ...GLASS,
          position: "absolute",
          inset: 0,
          borderRadius: 26,
          overflow: "hidden",
          transform: `rotateY(${ry}deg) rotateX(${mix(-10, 3, p)}deg) translateZ(${mix(-300, 0, p)}px) translateY(${4 * Math.sin(frame / 37)}px)`,
          transformOrigin: "50% 50%",
          boxShadow: `${GLASS.boxShadow}${glowColor ? `, 0 0 50px ${glowColor}55` : ""}`,
        }}
      >
        {title && (
          <div style={{ height: 46, display: "flex", alignItems: "center", gap: 10, padding: "0 18px", borderBottom: "1px solid rgba(255,255,255,0.12)", fontFamily: MONO, fontSize: 20, color: MUTED, letterSpacing: 2 }}>
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c, display: "inline-block" }} />
            ))}
            <span style={{ marginLeft: 10, whiteSpace: "nowrap", overflow: "hidden" }}>{title}</span>
          </div>
        )}
        <div style={{ position: "absolute", left: 0, right: 0, top: title ? 46 : 0, bottom: 0 }}>{children}</div>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(115deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.10) ${mix(20, 60, p)}%, rgba(255,255,255,0) 70%)`, pointerEvents: "none" }} />
      </div>
    </div>
  );
};

/** "FONTE: …" seal: a small mono label that stamps in (only for real, checked sources). */
export const Seal: React.FC<{ x: number; y: number; at: number; o?: number; children: string; color?: string }> = ({ x, y, at, o = 1, children, color = "#E8EDF5" }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 10, expOut);
  if (p <= 0.001 || o <= 0.001) return null;
  return (
    <div style={abs(x, y, { opacity: p * o, transform: `scale(${mix(1.5, 1, p)})`, transformOrigin: "0 50%" })}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 16px", borderRadius: 8, border: `2px solid ${color}AA`, background: "rgba(8,10,16,0.55)", fontFamily: MONO, fontWeight: 700, fontSize: 22, letterSpacing: 2, color, whiteSpace: "nowrap", textShadow: SHADOW }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: "#33D1A0", boxShadow: "0 0 10px #33D1A0" }} />
        {children}
      </div>
    </div>
  );
};

/** Rubber stamp that slams in (scale 1.8 -> 1, tilted). */
export const Stamp: React.FC<{ at: number; color: string; children: React.ReactNode; size?: number; rot?: number; o?: number }> = ({ at, color, children, size = 44, rot = -8, o = 1 }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, at + 8, expOut);
  if (frame < at || o <= 0.001) return null;
  return (
    <div style={{ display: "inline-block", fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 5, color, border: `5px solid ${color}`, borderRadius: 12, padding: "6px 20px", transform: `rotate(${rot}deg) scale(${mix(1.8, 1, p)})`, opacity: Math.min(1, p * 2) * o, textShadow: glow(color, 0.5), boxShadow: `0 0 24px ${color}55, inset 0 0 18px ${color}33`, background: "rgba(10,6,8,0.35)", whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
};

/** Pop-in progress with overshoot. */
export const pop = (frame: number, at: number, d = 12) => prog(frame, at - 2, at + d, backOut);
