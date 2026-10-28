// Dark ambient tech pad for the iPhone Língua video (the only synthesized sound; everything else is Freesound).
// Low detuned sines on an A minor-ish stack, slow LFOs and a breath of band-passed noise.
// Usage: node scripts/gen-drone-lingua.mjs -> public/sfx/lng_drone.wav (48 kHz, 16-bit stereo)
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SR = 48000;
const DUR = 49.6;
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const svf = () => {
  let low = 0;
  let band = 0;
  return (x, fc, q) => {
    const f = 2 * Math.sin((Math.PI * fc) / SR);
    low += f * band;
    band += f * (x - low - q * band);
    return band;
  };
};

const n = Math.round(DUR * SR);
const L = new Float32Array(n);
const R = new Float32Array(n);
const rand = rng(11);
const nl = svf();
const nr = svf();
const notes = [55.0, 82.41, 110.0, 164.81, 220.0];
const amps = [1.0, 0.6, 0.5, 0.22, 0.1];
for (let i = 0; i < n; i++) {
  const t = i / SR;
  let l = 0;
  let r = 0;
  notes.forEach((f, k) => {
    const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * (0.04 + k * 0.011) * t + k * 1.3);
    l += amps[k] * lfo * Math.sin(2 * Math.PI * f * 0.997 * t);
    r += amps[k] * lfo * Math.sin(2 * Math.PI * f * 1.003 * t + 0.9);
  });
  const breath = 0.12 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.05 * t));
  l += breath * nl(2 * rand() - 1, 380, 1.4);
  r += breath * nr(2 * rand() - 1, 430, 1.4);
  const edge = Math.min(1, t / 2, (DUR - t) / 2);
  L[i] = l * edge;
  R[i] = r * edge;
}

let peak = 1e-9;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = Math.pow(10, -6 / 20) / peak;
const buf = Buffer.alloc(44 + n * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + n * 4, 4);
buf.write("WAVEfmt ", 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), 46 + i * 4);
}
const out = join(process.cwd(), "public", "sfx", "lng_drone.wav");
writeFileSync(out, buf);
console.log(`wrote ${out} (${DUR}s)`);
