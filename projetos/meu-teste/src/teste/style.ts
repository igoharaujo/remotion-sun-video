// Shared look for the 2D layer over the footage: Inter (close to SF Pro) + JetBrains Mono, crisp white
// type with a dark shadow for legibility (never a box), and a frosted dark glass for UI cards.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { GLASS_BG } from "./tl";

export const INTER = loadInter("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

/** Keynote display type: bold, tight tracking. */
export const DISPLAY = { fontFamily: INTER, fontWeight: 800, letterSpacing: -4 } as const;

export const SHADOW = "4px 4px 8px rgba(0,0,0,0.9)";
export const DROP = "drop-shadow(0 2px 8px rgba(0,0,0,0.8))";

/** Frosted dark glass for UI cards (checklist, calendar, meter) — not for captions. */
export const GLASS: React.CSSProperties = {
  background: GLASS_BG,
  backdropFilter: "blur(18px) saturate(1.2)",
  WebkitBackdropFilter: "blur(18px) saturate(1.2)",
  border: "1.5px solid rgba(255,255,255,0.18)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)",
};

/** Soft coloured glow at strength 0..1. */
export const glow = (color: string, k: number, spread = 1) => `0 0 ${10 * spread}px ${color}${alpha(0.45 * k)}, 0 0 ${30 * spread * (0.5 + k)}px ${color}${alpha(0.35 * k)}`;

/** Hex alpha suffix for a 0..1 opacity. */
export const alpha = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
