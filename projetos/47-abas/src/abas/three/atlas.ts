// The browser-window UI atlas: 8 dark-theme windows (4x2 cells) drawn once on a 2D canvas.
// Generic browser chrome only (no product logos): traffic lights, tab strip, address bar, page skeleton.
// System fonts on purpose: the canvas is drawn at mount, before web fonts are guaranteed to load.
import * as THREE from "three";

export const CELL_W = 640;
export const CELL_H = 400;
export enum Cell {
  Search = 0,
  Video = 1,
  Shop = 2,
  Recipe = 3,
  Doc = 4,
  News = 5,
  Blank = 6,
  Mail = 7,
}

const FONT = "Helvetica Neue, Helvetica, Arial, sans-serif";
const BLUE = "#4285F4";
const BLUE_SOFT = "#8AB4F8";
const BODY = "#202124";
const BAR = "#2B2C30";
const STRIP = "#17171A";
const SKEL = "#3C3D42";
const SKEL_HI = "#5A5C63";

type Ctx = CanvasRenderingContext2D;

const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string | CanvasGradient) => {
  c.fillStyle = fill;
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
};
const lines = (c: Ctx, x: number, y: number, w: number, n: number, gap = 18, color = SKEL) => {
  for (let i = 0; i < n; i++) rr(c, x, y + i * gap, i === n - 1 ? w * 0.6 : w * (0.85 + 0.15 * ((i * 7) % 3) / 2), 8, 4, color);
};

const URLS: Record<Cell, string> = {
  [Cell.Search]: "pesquisa.academica.org/artigo/4471",
  [Cell.Video]: "videos.com/watch?v=ver-depois",
  [Cell.Shop]: "loja.com.br/produto/oferta",
  [Cell.Recipe]: "receitas.com/bolo-de-cenoura",
  [Cell.Doc]: "docs/documento-sem-titulo/edit",
  [Cell.News]: "noticias.com/tecnologia",
  [Cell.Blank]: "...",
  [Cell.Mail]: "mail.com/inbox",
};
const FAVICON: Record<Cell, string> = {
  [Cell.Search]: BLUE,
  [Cell.Video]: "#E8EAED",
  [Cell.Shop]: "#9AA0A6",
  [Cell.Recipe]: "#C9A27A",
  [Cell.Doc]: BLUE,
  [Cell.News]: "#BDC1C6",
  [Cell.Blank]: "#5F6368",
  [Cell.Mail]: BLUE_SOFT,
};

/** Window chrome: traffic lights, 3 tabs (first active, with favicon + title + ×), address bar. */
const chrome = (c: Ctx, cell: Cell) => {
  rr(c, 0, 0, CELL_W, CELL_H, 0, BODY);
  c.fillStyle = STRIP;
  c.fillRect(0, 0, CELL_W, 46);
  ["#5F6368", "#5F6368", "#5F6368"].forEach((col, i) => rr(c, 16 + i * 20, 17, 12, 12, 6, col));
  const blank = cell === Cell.Blank;
  for (let t = 0; t < 3; t++) {
    const x = 88 + t * 150;
    if (t === 0) rr(c, x, 8, 146, 38, 10, BAR);
    rr(c, x + 14, 20, 14, 14, 4, t === 0 ? FAVICON[cell] : "#4A4C52");
    rr(c, x + 36, 23, t === 0 ? 72 : 64, 8, 4, t === 0 ? (blank ? "#45464B" : SKEL_HI) : "#3A3B40");
    c.strokeStyle = t === 0 ? "#9AA0A6" : "#55575D";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x + 122, 22);
    c.lineTo(x + 132, 32);
    c.moveTo(x + 132, 22);
    c.lineTo(x + 122, 32);
    c.stroke();
  }
  c.fillStyle = "#6E7076";
  c.font = `500 26px ${FONT}`;
  c.fillText("+", 548, 34);
  c.fillStyle = BAR;
  c.fillRect(0, 46, CELL_W, 44);
  rr(c, 70, 54, 520, 28, 14, "#1C1D20");
  rr(c, 84, 63, 9, 10, 2, "#80868B");
  c.fillStyle = "#9AA0A6";
  c.font = `400 15px ${FONT}`;
  c.fillText(URLS[cell], 104, 73);
  ["#5F6368", "#5F6368"].forEach((col, i) => rr(c, 18 + i * 22, 62, 12, 12, 6, col));
};

const content: Record<Cell, (c: Ctx) => void> = {
  [Cell.Search]: (c) => {
    rr(c, 150, 108, 340, 34, 17, "#303134");
    c.strokeStyle = BLUE_SOFT;
    c.lineWidth = 3;
    c.beginPath();
    c.arc(172, 124, 7, 0, Math.PI * 2);
    c.moveTo(177, 129);
    c.lineTo(183, 135);
    c.stroke();
    rr(c, 195, 120, 160, 8, 4, SKEL_HI);
    for (let i = 0; i < 3; i++) {
      const y = 166 + i * 72;
      rr(c, 60, y, 110, 7, 3, "#5F6368");
      rr(c, 60, y + 16, 300, 12, 5, BLUE_SOFT);
      lines(c, 60, y + 38, 470, 2, 14);
    }
  },
  [Cell.Video]: (c) => {
    rr(c, 30, 106, 400, 225, 10, "#0E0E10");
    c.fillStyle = "rgba(255,255,255,0.92)";
    c.beginPath();
    c.arc(230, 218, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#0E0E10";
    c.beginPath();
    c.moveTo(220, 202);
    c.lineTo(246, 218);
    c.lineTo(220, 234);
    c.fill();
    rr(c, 30, 322, 400, 5, 2, "#3A3B40");
    rr(c, 30, 322, 130, 5, 2, BLUE);
    lines(c, 30, 346, 360, 2, 18, SKEL_HI);
    for (let i = 0; i < 4; i++) {
      rr(c, 448, 106 + i * 70, 72, 52, 6, "#2F3034");
      lines(c, 530, 114 + i * 70, 90, 2, 16);
    }
  },
  [Cell.Shop]: (c) => {
    rr(c, 30, 104, 580, 30, 6, "#2A2B2F");
    rr(c, 44, 115, 80, 8, 4, SKEL_HI);
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 3; k++) {
        const x = 30 + k * 196;
        const y = 148 + r * 124;
        rr(c, x, y, 184, 72, 8, "#303136");
        rr(c, x, y + 82, 120, 8, 4, SKEL_HI);
        rr(c, x, y + 98, 70, 8, 4, BLUE_SOFT);
      }
  },
  [Cell.Recipe]: (c) => {
    rr(c, 30, 104, 330, 230, 12, "#2C2A28");
    // Line-art pan with steam.
    c.strokeStyle = "#E8DCCB";
    c.lineWidth = 5;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(110, 240);
    c.lineTo(250, 240);
    c.quadraticCurveTo(250, 290, 200, 290);
    c.lineTo(160, 290);
    c.quadraticCurveTo(110, 290, 110, 240);
    c.moveTo(250, 248);
    c.lineTo(310, 236);
    c.stroke();
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const x = 145 + i * 35;
      c.beginPath();
      c.moveTo(x, 222);
      c.bezierCurveTo(x - 12, 205, x + 12, 190, x, 172);
      c.stroke();
    }
    rr(c, 384, 110, 220, 14, 6, SKEL_HI);
    for (let i = 0; i < 6; i++) {
      rr(c, 384, 146 + i * 28, 8, 8, 4, "#C9A27A");
      rr(c, 402, 146 + i * 28, 150 + ((i * 37) % 50), 8, 4, SKEL);
    }
    lines(c, 30, 352, 560, 2, 16);
  },
  [Cell.Doc]: (c) => {
    c.fillStyle = "#1B1C1F";
    c.fillRect(0, 90, CELL_W, CELL_H - 90);
    rr(c, 0, 90, CELL_W, 26, 0, "#25262A");
    for (let i = 0; i < 9; i++) rr(c, 16 + i * 30, 99, 18, 8, 3, "#4A4C52");
    rr(c, 150, 126, 340, 280, 4, "#F1F3F4");
    rr(c, 180, 156, 200, 14, 5, "#3C4043");
    for (let i = 0; i < 9; i++) rr(c, 180, 188 + i * 20, i % 4 === 3 ? 170 : 280, 7, 3, "#C4C7C5");
    rr(c, 436, 156, 3, 18, 1, BLUE);
  },
  [Cell.News]: (c) => {
    rr(c, 30, 104, 580, 120, 10, "#2A3038");
    const g = c.createLinearGradient(30, 104, 610, 224);
    g.addColorStop(0, "rgba(66,133,244,0.35)");
    g.addColorStop(1, "rgba(66,133,244,0)");
    rr(c, 30, 104, 580, 120, 10, g);
    rr(c, 30, 240, 480, 16, 6, SKEL_HI);
    rr(c, 30, 264, 360, 16, 6, SKEL_HI);
    lines(c, 30, 300, 270, 4, 16);
    lines(c, 330, 300, 270, 4, 16);
  },
  [Cell.Blank]: (c) => {
    c.fillStyle = "#4A4C52";
    c.font = `300 150px ${FONT}`;
    c.textAlign = "center";
    c.fillText("?", CELL_W / 2, 300);
    c.textAlign = "left";
  },
  [Cell.Mail]: (c) => {
    rr(c, 20, 104, 120, 280, 8, "#26272B");
    for (let i = 0; i < 5; i++) rr(c, 34, 120 + i * 30, 80, 8, 4, i === 0 ? BLUE_SOFT : SKEL);
    for (let i = 0; i < 6; i++) {
      const y = 108 + i * 46;
      rr(c, 156, y, 30, 30, 15, i % 2 ? "#3A3B40" : "#4A4C52");
      rr(c, 198, y + 4, 120, 8, 4, SKEL_HI);
      rr(c, 198, y + 20, 380, 7, 3, SKEL);
    }
  },
};

export const makeAtlas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = CELL_W * 4;
  canvas.height = CELL_H * 2;
  const c = canvas.getContext("2d")!;
  for (let i = 0; i < 8; i++) {
    c.save();
    c.translate((i % 4) * CELL_W, Math.floor(i / 4) * CELL_H);
    c.beginPath();
    c.rect(0, 0, CELL_W, CELL_H);
    c.clip();
    chrome(c, i);
    content[i as Cell](c);
    c.restore();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
};

/** Where a window's first-tab × sits, in window UV (0..1, y up) — the S03 cursor clicks it. */
export const CLOSE_UV = { x: (88 + 127) / CELL_W, y: 1 - 27 / CELL_H };
