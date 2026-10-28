// Review still: key frames of the render with the TikTok safe zone, the caption band, the voice
// visualizer and the cart-button boxes drawn on each tile. Frames are extracted by scripts/contact-sheet.sh.
import { AbsoluteFill, Img, staticFile } from "remotion";
import { CAPTION_Y, CART, FPS, H, SAFE, TL, VIZ, W } from "./tl";

export const SHEET_FRAMES = [8, 30, 60, 150, 260, 420, 500, 580, 720, 830, 990, 1110, 1160, 1300, 1380, 1460, 1540, 1650, 1800, 1880, 2000, 2140, 2290, 2400, 2470, 2560, 2630, 2700, 2790, 2880, 3060, 3150, 3230, 3290, 3360];
const COLS = 7;
const TILE_W = 300;
const S = TILE_W / W;
const TILE_H = H * S;
const GAP = 10;
const HEADER = 64;
export const SHEET_W = COLS * TILE_W + (COLS + 1) * GAP;
export const SHEET_H = HEADER + Math.ceil(SHEET_FRAMES.length / COLS) * (TILE_H + 34 + GAP) + GAP;

const box = (x: number, y: number, w: number, h: number): React.CSSProperties => ({ position: "absolute", left: x * S, top: y * S, width: w * S, height: h * S });

const sceneAt = (f: number) => {
  const s = TL.scenes.find((x) => f >= x.from && f <= x.to);
  return s ? `${s.id} ${s.tag}` : "";
};

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
        <div style={{ ...box(960, y0, x1 - 960, y1 - y0), background: "rgba(255,160,40,0.25)" }} />
        <div style={{ ...box(x0, y0, x1 - x0, y1 - y0), outline: "2px solid #18b84a" }} />
        <div style={{ ...box(x0, CAPTION_Y[0], x1 - x0, CAPTION_Y[1] - CAPTION_Y[0]), outline: "1.5px dashed #c79a00" }} />
        <div style={{ ...box(VIZ.x, VIZ.y, VIZ.w, VIZ.h), outline: "1.5px dashed #0090c0" }} />
        <div style={{ ...box(CART.x, CART.y, CART.w, CART.h), outline: "1.5px dashed #b000b0" }} />
      </div>
      <div style={{ color: "#ddd", font: "600 17px Inter, Helvetica, sans-serif", padding: "6px 2px" }}>
        f{frame} · {(frame / FPS).toFixed(2)}s · {sceneAt(frame)}
      </div>
    </div>
  );
};

export const ContactSheet: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#111", padding: GAP }}>
    <div style={{ color: "#fff", font: "700 26px Inter, Helvetica, sans-serif", height: HEADER - GAP, display: "flex", gap: 28, alignItems: "center" }}>
      ZencialGhkCu · contact sheet
      <span style={{ font: "500 18px Inter, Helvetica, sans-serif", color: "#aaa" }}>
        <span style={{ color: "#18b84a" }}>■</span> safe zone x 60–1020, y 120–1670 &nbsp;
        <span style={{ color: "#ff6060" }}>■</span> outside &nbsp;
        <span style={{ color: "#ffa028" }}>■</span> action bar x &gt; 960 &nbsp;
        <span style={{ color: "#c79a00" }}>▭</span> captions y 1400–1550 &nbsp;
        <span style={{ color: "#0090c0" }}>▭</span> voice visualizer &nbsp;
        <span style={{ color: "#b000b0" }}>▭</span> cart button
      </span>
    </div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: GAP }}>
      {SHEET_FRAMES.map((f) => (
        <Tile key={f} frame={f} />
      ))}
    </div>
  </AbsoluteFill>
);
