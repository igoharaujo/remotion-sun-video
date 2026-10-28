// Thin-line SVG icons in the premium UI style (2.5–4 px strokes, round caps). All generic: no product logos.
import { BLUE, INK, MUTED } from "../tl";

type P = { size?: number; color?: string; style?: React.CSSProperties };
const line = (color: string, w = 3.5) => ({ fill: "none", stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round" }) as const;

/** macOS-style arrow pointer, tip at (0, 0) of the box. */
export const Cursor: React.FC<P & { press?: number }> = ({ size = 64, press = 0, style }) => (
  <svg width={size} height={size * 1.4} viewBox="0 0 40 56" style={{ overflow: "visible", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.6))", transform: `scale(${1 - 0.15 * press})`, transformOrigin: "0 0", ...style }}>
    <path d="M2 2 L2 42 L12 32 L19 50 L26 47 L19 30 L33 30 Z" fill="#FFFFFF" stroke="#111" strokeWidth={2.5} strokeLinejoin="round" />
  </svg>
);

export const Clock: React.FC<P> = ({ size = 34, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <circle cx={16} cy={16} r={12.5} {...line(color, 3)} />
    <path d="M16 9 V16 L21 19" {...line(color, 3)} />
  </svg>
);

export const Calendar: React.FC<P> = ({ size = 34, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <rect x={4} y={7} width={24} height={21} rx={4} {...line(color, 3)} />
    <path d="M4 13 H28 M10 4 V9 M22 4 V9" {...line(color, 3)} />
  </svg>
);

export const Pan: React.FC<P> = ({ size = 34, color = INK }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M3 15 H22 Q22 25 13 25 H12 Q3 25 3 15 Z M22 17 L30 15 M9 11 Q7 8 9 5 M14 11 Q12 8 14 5" {...line(color, 2.6)} />
  </svg>
);

export const Copy: React.FC<P> = ({ size = 34, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <rect x={10} y={10} width={18} height={18} rx={4} {...line(color, 3)} />
    <path d="M22 6 Q22 4 20 4 H7 Q4 4 4 7 V20 Q4 22 6 22" {...line(color, 3)} />
  </svg>
);

export const Layers: React.FC<P> = ({ size = 34, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M16 4 L29 11 L16 18 L3 11 Z M3 16 L16 23 L29 16 M3 21 L16 28 L29 21" {...line(color, 2.8)} />
  </svg>
);

export const DocIcon: React.FC<P> = ({ size = 34, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 32 32">
    <path d="M7 3 H19 L26 10 V29 H7 Z M19 3 V10 H26" fill={color} fillOpacity={0.18} stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
    <path d="M11 16 H22 M11 20 H22 M11 24 H18" {...line(color, 2.4)} />
  </svg>
);

/** Speech bubble for the comment CTA. */
export const Bubble: React.FC<P> = ({ size = 160, color = BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible" }}>
    <path d="M10 8 H54 Q60 8 60 14 V40 Q60 46 54 46 H28 L16 56 V46 H10 Q4 46 4 40 V14 Q4 8 10 8 Z" {...line(color, 3.2)} fill={color} fillOpacity={0.14} />
    <circle cx={20} cy={27} r={3.4} fill={color} />
    <circle cx={32} cy={27} r={3.4} fill={color} />
    <circle cx={44} cy={27} r={3.4} fill={color} />
  </svg>
);

export const PaperPlane: React.FC<P> = ({ size = 120, color = INK }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" style={{ overflow: "visible" }}>
    <path d="M4 30 L60 6 L46 58 L30 40 Z M30 40 L60 6 M30 40 L28 54 L36 46" {...line(color, 3)} fill="rgba(255,255,255,0.08)" />
  </svg>
);

/** Four-pane window glyph, drawn in code (a stylised nod, not the official mark). */
export const FourPanes: React.FC<P> = ({ size = 220, color = INK }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <g transform="skewY(-8) translate(0 8)">
      <rect x={6} y={10} width={42} height={38} rx={2} fill={color} />
      <rect x={52} y={6} width={42} height={42} rx={2} fill={color} />
      <rect x={6} y={52} width={42} height={38} rx={2} fill={color} />
      <rect x={52} y={52} width={42} height={42} rx={2} fill={color} />
    </g>
  </svg>
);


/** Loading ring (Chrome blue arc on a muted track). */
export const Spinner: React.FC<P & { angle: number }> = ({ size = 120, angle }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: `rotate(${angle}deg)` }}>
    <circle cx={24} cy={24} r={19} {...line(MUTED, 4)} opacity={0.25} />
    <path d="M24 5 A19 19 0 0 1 43 24" {...line(BLUE, 4.5)} />
  </svg>
);
