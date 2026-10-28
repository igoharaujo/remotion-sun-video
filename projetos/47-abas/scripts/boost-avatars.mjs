// Colour pop for the mascot sprites on the dark stage: +15% saturation, +10% contrast (around mid-grey),
// alpha untouched. Originals are kept in public/avatar/_orig/ (copied there on the first run) and every
// run processes from them, so running it twice never boosts twice.
// Usage: node scripts/boost-avatars.mjs
import sharp from "sharp";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = "public/avatar";
const ORIG = join(DIR, "_orig");
const SATURATION = 1.15;
const CONTRAST = 1.1;
mkdirSync(ORIG, { recursive: true });
for (const f of readdirSync(DIR).filter((x) => x.endsWith(".png"))) {
  if (!existsSync(join(ORIG, f))) copyFileSync(join(DIR, f), join(ORIG, f));
}
for (const f of readdirSync(ORIG).filter((x) => x.endsWith(".png"))) {
  const src = join(ORIG, f);
  const alpha = await sharp(src).ensureAlpha().extractChannel(3).toBuffer();
  const rgb = await sharp(src)
    .removeAlpha()
    .modulate({ saturation: SATURATION })
    .linear(CONTRAST, 128 * (1 - CONTRAST))
    .toBuffer();
  await sharp(rgb).joinChannel(alpha).png().toFile(join(DIR, f));
  console.log(`${f}: saturation x${SATURATION}, contrast x${CONTRAST}`);
}
