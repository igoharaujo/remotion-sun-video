// Review still: key frames of the final render with the TikTok safe zone drawn on each tile.
// Frames are extracted to public/contact/ by scripts/contact-sheet.sh.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FPS, PIP, SAFE, W, H } from "./timeline";

export const SHEET_FRAMES = [18, 200, 333, 425, 520, 600, 670, 740, 830, 880, 960, 1060, 1092, 1250, 1330, 1395];
const COLS = 8;
const TILE_W = 360;
const S = TILE_W / W;
const TILE_H = H * S;
const GAP = 10;
const HEADER = 64;
export const SHEET_W = COLS * TILE_W + (COLS + 1) * GAP;
export const SHEET_H = HEADER + Math.ceil(SHEET_FRAMES.length / COLS) * (TILE_H + 34 + GAP) + GAP;

const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({
  position: "absolute",
  left: x * S,
  top: y * S,
  width: w * S,
  height: h * S,
});

const Tile: React.FC<{ frame: number }> = ({ frame }) => {
  const [x0, x1] = SAFE.contentRect.x;
  const [y0, y1] = SAFE.contentRect.y;
  const shade = "rgba(255,40,40,0.28)";
  const pr = PIP.payoffRect;
  return (
    <div style={{ width: TILE_W }}>
      <div style={{ position: "relative", width: TILE_W, height: TILE_H, overflow: "hidden", borderRadius: 6 }}>
        <Img src={staticFile(`contact/f${String(frame).padStart(4, "0")}.png`)} style={{ width: "100%", height: "100%" }} />
        <div style={{ ...box(0, 0, W, y0), background: shade }} />
        <div style={{ ...box(0, y1, W, H - y1), background: shade }} />
        <div style={{ ...box(0, y0, x0, y1 - y0), background: shade }} />
        <div style={{ ...box(SAFE.rightActionBarX, y0, W - SAFE.rightActionBarX, y1 - y0), background: "rgba(255,40,40,0.4)" }} />
        <div style={{ ...box(x0, y0, x1 - x0, y1 - y0), outline: "2px solid #39ff6a" }} />
        <div style={{ ...box(pr.x, pr.y, pr.w, pr.h), outline: "1.5px dashed #34e0ff" }} />
      </div>
      <div style={{ color: "#ddd", font: "600 18px Inter, Helvetica, sans-serif", padding: "6px 2px" }}>
        f{frame} · {(frame / FPS).toFixed(2)}s
      </div>
    </div>
  );
};

export const ContactSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#111", padding: GAP }}>
    <div style={{ color: "#fff", font: "700 26px Inter, Helvetica, sans-serif", height: HEADER - GAP, display: "flex", gap: 28, alignItems: "center" }}>
      SunVideo · contact sheet
      <span style={{ font: "500 18px Inter, Helvetica, sans-serif", color: "#aaa" }}>
        <span style={{ color: "#39ff6a" }}>■</span> safe zone x 60–1020, y 120–1670 &nbsp;
        <span style={{ color: "#ff6060" }}>■</span> outside / action bar x &gt; 960 &nbsp;
        <span style={{ color: "#34e0ff" }}>▭</span> PiP at payoff scale
      </span>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: GAP }}>
      {SHEET_FRAMES.map((f) => (
        <Tile key={f} frame={f} />
      ))}
    </div>
  </AbsoluteFill>
);
