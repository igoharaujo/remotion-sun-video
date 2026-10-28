// Cut the official product photo out of its white studio background (flood fill from the borders
// over near-white, low-saturation pixels, then a feathered alpha) for the dark Keynote stage.
// Usage: node scripts/cutout.mjs <in> <out.png>
import sharp from "sharp";

const [src, out] = process.argv.slice(2);
const { data, info } = await sharp(src).removeAlpha().toColourspace("srgb").raw({ depth: "uchar" }).toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const bg = (i) => {
  const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2];
  const lo = Math.min(r, g, b), hi = Math.max(r, g, b);
  return lo > 243 && hi - lo < 10; // near-white studio sweep (the white dropper bulb has a shaded rim that stops the fill)
};
const mask = new Uint8Array(w * h); // 1 = background
const queue = [];
for (let x = 0; x < w; x++) queue.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) queue.push(y * w, y * w + w - 1);
while (queue.length) {
  const i = queue.pop();
  if (mask[i] || !bg(i)) continue;
  mask[i] = 1;
  const x = i % w, y = (i / w) | 0;
  if (x > 0) queue.push(i - 1);
  if (x < w - 1) queue.push(i + 1);
  if (y > 0) queue.push(i - w);
  if (y < h - 1) queue.push(i + w);
}
const alpha = Buffer.alloc(w * h);
for (let i = 0; i < w * h; i++) alpha[i] = mask[i] ? 0 : 255;
const soft = await sharp(alpha, { raw: { width: w, height: h, channels: 1 } }).blur(1.2).extractChannel(0).raw().toBuffer();
await sharp(data, { raw: { width: w, height: h, channels: 3 } }).joinChannel(soft, { raw: { width: w, height: h, channels: 1 } }).png().toFile(out);
console.log(out, w, h);
