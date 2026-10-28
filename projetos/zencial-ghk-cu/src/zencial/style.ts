// Shared look for the 2D layer on the dark Keynote stage: one sans family (Inter, close to SF Pro),
// crisp white type with a dark shadow for legibility (never a box).
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const INTER = loadInter("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

/** Keynote display type: semibold, tight tracking. */
export const DISPLAY = { fontFamily: INTER, fontWeight: 700, letterSpacing: -3 } as const;

export const SHADOW = "4px 4px 8px rgba(0,0,0,0.9)";
export const DROP = "drop-shadow(0 2px 8px rgba(0,0,0,0.8))";

/** Soft coloured glow at strength 0..1. */
export const glow = (color: string, k: number, spread = 1) => `0 0 ${10 * spread}px ${color}${alpha(0.45 * k)}, 0 0 ${30 * spread * (0.5 + k)}px ${color}${alpha(0.35 * k)}`;

/** Hex alpha suffix for a 0..1 opacity. */
export const alpha = (a: number) =>
  Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, "0");
