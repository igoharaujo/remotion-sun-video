// Trim the transparent margins of the mascot PNGs (public/avatar/*.png -> public/avatar/trim/) so every
// pose shares the same anchor (feet at the bottom edge, centred) and swaps without jumping on screen.
// Writes public/avatar/trim/meta.json with each sprite's size, aspect ratio and source frame height (srcHeight),
// so sprites exported at different resolutions (same framing) can be drawn at the same on-screen scale.
// Usage: node scripts/trim-avatars.mjs
import sharp from "sharp";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = "public/avatar";
const OUT = join(SRC, "trim");
mkdirSync(OUT, { recursive: true });
const meta = {};
for (const f of readdirSync(SRC).filter((x) => x.endsWith(".png"))) {
  const { data, info } = await sharp(join(SRC, f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  // Bounding box of pixels with alpha > 16 (ignores faint remove.bg fringe).
  let [x0, y0, x1, y1] = [info.width, info.height, -1, -1];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 16) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
  const pad = 4;
  const left = Math.max(0, x0 - pad);
  const top = Math.max(0, y0 - pad);
  const width = Math.min(info.width, x1 + pad + 1) - left;
  const height = Math.min(info.height, y1 + pad + 1) - top;
  await sharp(join(SRC, f)).extract({ left, top, width, height }).png().toFile(join(OUT, f));
  meta[f] = { width, height, aspect: +(width / height).toFixed(4), srcHeight: info.height };
  console.log(`${f}: ${width}x${height}`);
}
writeFileSync(join(OUT, "meta.json"), JSON.stringify(meta, null, 1) + "\n");
