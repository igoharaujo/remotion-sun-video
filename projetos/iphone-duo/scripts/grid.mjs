// Tile PNGs into one labelled review grid. Usage: node scripts/grid.mjs <out.jpg> <cols> <tileW> <png...>
import sharp from "sharp";
import { basename } from "node:path";

const [out, colsArg, tileArg, ...files] = process.argv.slice(2);
const cols = Number(colsArg);
const tw = Number(tileArg);
const th = Math.round((tw * 1920) / 1080);
const rows = Math.ceil(files.length / cols);
const comp = [];
for (let i = 0; i < files.length; i++) {
  const left = (i % cols) * (tw + 6);
  const top = Math.floor(i / cols) * (th + 30);
  comp.push({ input: await sharp(files[i]).resize(tw, th).toBuffer(), left, top: top + 26 });
  const label = Buffer.from(`<svg width="${tw}" height="24"><text x="2" y="18" fill="#ddd" font-family="Helvetica" font-size="17">${basename(files[i], ".png")}</text></svg>`);
  comp.push({ input: label, left, top });
}
await sharp({ create: { width: cols * (tw + 6), height: rows * (th + 30), channels: 3, background: "#111" } }).composite(comp).jpeg({ quality: 85 }).toFile(out);
console.log(out);
