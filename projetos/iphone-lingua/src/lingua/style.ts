// Shared look for the 2D layer: fonts, text shadows, glow.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const INTER = loadInter("normal", { weights: ["400", "500", "600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

export const SHADOW = "4px 4px 8px rgba(0,0,0,0.9)";
export const DROP = "drop-shadow(0 2px 8px rgba(0,0,0,0.8))";

/** Glow text-shadow in the given colour at strength 0..1. */
export const glow = (color: string, k: number, spread = 1) =>
  `0 0 ${6 * spread}px ${color}, 0 0 ${18 * spread * (0.5 + k)}px ${color}, 0 0 ${40 * spread * k}px ${color}`;

/** Horizontal scanlines that crawl downward. */
export const scanlines = (frame: number, alpha = 0.22): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${alpha}) 0px, rgba(0,0,0,${alpha}) 1.5px, transparent 1.5px, transparent 4px)`,
  backgroundPosition: `0 ${(frame * 0.6) % 4}px`,
  mixBlendMode: "multiply",
});
