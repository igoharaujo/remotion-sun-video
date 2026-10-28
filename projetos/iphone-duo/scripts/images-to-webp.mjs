// Resize downloaded reference images to max 1200 px wide and convert to webp.
// Usage: node scripts/images-to-webp.mjs <raw-dir>  → public/images/iphone/<name>.webp
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rawDir = process.argv[2];
const outDir = "public/images/iphone";
for (const file of fs.readdirSync(rawDir)) {
  const name = file.split(".")[0];
  const info = await sharp(path.join(rawDir, file))
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(path.join(outDir, `${name}.webp`));
  console.log(`${name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}KB`);
}
