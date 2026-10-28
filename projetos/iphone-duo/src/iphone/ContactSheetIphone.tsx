// Review still: key frames of the iPhone Duo render with the TikTok safe zone, the caption band and
// the voice-visualizer box drawn on each tile. Frames are extracted by scripts/contact-sheet.sh.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CAPTION_Y, FPS, H, SAFE, TL, VIZ, W } from "./tl";

export const SHEET_FRAMES = [40, 150, 260, 320, 495, 700, 770, 870, 1045, 1110, 1320, 1475, 1680, 1880, 2040, 2085, 2240, 2500, 2640, 2720, 2790, 3060, 3205, 3340];
const COLS = 8;
const TILE_W = 300;
const S = TILE_W / W;
const TILE_H = H * S;
const GAP = 10;
const HEADER = 64;
export const SHEET_W = COLS * TILE_W + (COLS + 1) * GAP;
export const SHEET_H = HEADER + Math.ceil(SHEET_FRAMES.length / COLS) * (TILE_H + 34 + GAP) + GAP;

const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: x * S, top: y * S, width: w * S, height: h * S });

const sceneAt = (f: number) => TL.scenes.find((s) => f >= s.from && f < s.to)?.id.split("_")[0] ?? "";

const Tile: React.FC<{ frame: number }> = ({ frame }) => {
  const [x0, x1] = SAFE.x;
  const [y0, y1] = SAFE.y;
  const shade = "rgba(255,40,40,0.3)";
  return (
    <div style={{ width: TILE_W }}>
      <div style={{ position: "relative", width: TILE_W, height: TILE_H, overflow: "hidden", borderRadius: 6 }}>
        <Img src={staticFile(`contact/f${String(frame).padStart(4, "0")}.png`)} style={{ width: "100%", height: "100%" }} />
        <div style={{ ...box(0, 0, W, y0), background: shade }} />
        <div style={{ ...box(0, y1, W, H - y1), background: shade }} />
        <div style={{ ...box(0, y0, x0, y1 - y0), background: shade }} />
        <div style={{ ...box(x1, y0, W - x1, y1 - y0), background: shade }} />
        <div style={{ ...box(x0, y0, x1 - x0, y1 - y0), outline: "2px solid #39ff6a" }} />
        <div style={{ ...box(x0, CAPTION_Y[0], x1 - x0, CAPTION_Y[1] - CAPTION_Y[0]), outline: "1.5px dashed #ffd84a" }} />
        <div style={{ ...box(VIZ.x, VIZ.y, VIZ.w, VIZ.h), outline: "1.5px dashed #34e0ff" }} />
      </div>
      <div style={{ color: "#ddd", font: "600 17px Inter, Helvetica, sans-serif", padding: "6px 2px" }}>
        f{frame} · {(frame / FPS).toFixed(2)}s · {sceneAt(frame)}
      </div>
    </div>
  );
};

export const ContactSheetIphone: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#111", padding: GAP }}>
    <div style={{ color: "#fff", font: "700 26px Inter, Helvetica, sans-serif", height: HEADER - GAP, display: "flex", gap: 28, alignItems: "center" }}>
      IphoneDuo · contact sheet
      <span style={{ font: "500 18px Inter, Helvetica, sans-serif", color: "#aaa" }}>
        <span style={{ color: "#39ff6a" }}>■</span> safe zone x 60–1020, y 120–1670 &nbsp;
        <span style={{ color: "#ff6060" }}>■</span> outside &nbsp;
        <span style={{ color: "#ffd84a" }}>▭</span> caption band y 1400–1550 &nbsp;
        <span style={{ color: "#34e0ff" }}>▭</span> voice visualizer
      </span>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: GAP }}>
      {SHEET_FRAMES.map((f) => (
        <Tile key={f} frame={f} />
      ))}
    </div>
  </AbsoluteFill>
);
