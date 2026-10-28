// Shared look for the 2D layer: fonts, palette, safe-zone clip.
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { T } from "../timeline";

export const INTER = loadInter("normal", { weights: ["600", "700", "800", "900"], subsets: ["latin"] }).fontFamily;
export const ORBITRON = loadOrbitron("normal", { weights: ["500", "700", "900"], subsets: ["latin"] }).fontFamily;
export const MONO = loadMono("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;

export const GOLD = "#FFC54D";
export const WARM = "#FFF4D6";
export const CYAN = "#7FE7FF";

const [sx0, sx1] = T.safeZone.contentRect.x;
const [sy0, sy1] = T.safeZone.contentRect.y;
const BAR = T.safeZone.rightActionBarX;

/** CSS clip that keeps an overlay inside the safe zone and left of the action bar. */
export const SAFE_CLIP = `inset(${sy0}px ${1080 - Math.min(sx1, BAR)}px ${1920 - sy1}px ${sx0}px)`;

/** Glow text-shadow in the given colour at strength 0..1. */
export const glow = (color: string, k: number, spread = 1) =>
  `0 0 ${6 * spread}px ${color}, 0 0 ${18 * spread * (0.5 + k)}px ${color}, 0 0 ${40 * spread * k}px ${color}`;

/** Horizontal CRT scanlines that crawl downward. */
export const scanlines = (frame: number, alpha = 0.22): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,${alpha}) 0px, rgba(0,0,0,${alpha}) 1.5px, transparent 1.5px, transparent 4px)`,
  backgroundPosition: `0 ${(frame * 0.6) % 4}px`,
  mixBlendMode: "multiply",
});
