// Procedural SFX for SunVideo: whooshes, chimes and a space pad.
// Pure Node, no samples or dependencies; deterministic (seeded noise).
// Usage: node scripts/gen-sfx.mjs  -> public/sfx/*.wav (48 kHz, 16-bit stereo)
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SR = 48000;
const OUT = join(process.cwd(), "public", "sfx");
mkdirSync(OUT, { recursive: true });

// Mulberry32: tiny seeded PRNG so every run produces identical files.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Chamberlin state-variable filter; returns the bandpass output.
const svf = () => {
  let low = 0;
  let band = 0;
  return (x, fc, q) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return band;
  };
};

const smooth = (x) => x * x * (3 - 2 * x);

const writeWav = (name, left, right, peakDb = -3) => {
  let peak = 1e-9;
  for (let i = 0; i < left.length; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  const g = Math.pow(10, peakDb / 20) / peak;
  const n = left.length;
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
    const l = Math.max(-1, Math.min(1, left[i] * g));
    const r = Math.max(-1, Math.min(1, right[i] * g));
    buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(r * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, name), buf);
  console.log(`wrote public/sfx/${name} (${(n / SR).toFixed(2)} s)`);
};

// Filtered-noise whoosh; `hit` is the loudest moment in seconds.
const whoosh = ({ name, dur, hit, f0, f1, f2, seed, q }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rand = rng(seed);
  const fl = svf();
  const fr = svf();
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const rise = t < hit ? smooth(t / hit) : 1;
    const env = t < hit ? Math.pow(rise, 2.2) : Math.exp(-(t - hit) * 4.2);
    const fc = t < hit ? f0 + (f1 - f0) * smooth(t / hit) : f1 + (f2 - f1) * smooth(Math.min(1, (t - hit) / (dur - hit)));
    const pan = 0.5 + 0.35 * Math.sin(Math.PI * Math.min(1, t / dur) - Math.PI / 2);
    const s = 2 * rand() - 1;
    const b = fl(s, fc, q) * 0.6 + fr(s, fc * 1.5, q) * 0.4;
    L[i] = b * env * (1 - pan * 0.6);
    R[i] = b * env * (0.4 + pan * 0.6);
  }
  writeWav(name, L, R, -3);
};

// Bell-like chime: inharmonic partials with independent decays, plus an optional low swell.
const chime = ({ name, dur, f, swell }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const partials = [
    [1, 1, 1.6],
    [2.0, 0.42, 2.4],
    [2.76, 0.28, 3.1],
    [5.4, 0.12, 5.5],
    [8.93, 0.05, 8],
  ];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const attack = Math.min(1, t / 0.006);
    let s = 0;
    for (const [ratio, amp, decay] of partials) s += amp * Math.sin(2 * Math.PI * f * ratio * t) * Math.exp(-t * decay);
    let low = 0;
    if (swell) {
      const e = t < 0.35 ? smooth(t / 0.35) : Math.exp(-(t - 0.35) * 1.8);
      low = 0.5 * e * (Math.sin(2 * Math.PI * swell * t) + 0.3 * Math.sin(2 * Math.PI * swell * 2 * t));
    }
    // A short ping-pong echo widens the image without reverb.
    const d = Math.round(0.11 * SR);
    L[i] = s * attack + low;
    R[i] = (i >= d ? L[i - d] * 0.45 : 0) + s * attack * 0.75 + low;
  }
  writeWav(name, L, R, -3);
};

// Slow, dark pad: detuned sine stacks with breathing amplitude and a soft noise bed.
const pad = ({ name, dur, seed }) => {
  const n = Math.round(dur * SR);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const rand = rng(seed);
  const nl = svf();
  const nr = svf();
  const notes = [55, 82.41, 110, 164.81, 220];
  const amps = [0.9, 0.7, 0.55, 0.32, 0.16];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let l = 0;
    let r = 0;
    notes.forEach((f, k) => {
      const lfo = 0.75 + 0.25 * Math.sin(2 * Math.PI * (0.05 + k * 0.013) * t + k);
      l += amps[k] * lfo * Math.sin(2 * Math.PI * f * 0.998 * t);
      r += amps[k] * lfo * Math.sin(2 * Math.PI * f * 1.002 * t + 0.7);
    });
    const breath = 0.18 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.07 * t));
    l += breath * nl(2 * rand() - 1, 520, 1.2);
    r += breath * nr(2 * rand() - 1, 610, 1.2);
    L[i] = l;
    R[i] = r;
  }
  writeWav(name, L, R, -6);
};

whoosh({ name: "whoosh_1.wav", dur: 1.4, hit: 0.35, f0: 260, f1: 2600, f2: 700, seed: 7, q: 0.9 });
whoosh({ name: "whoosh_2.wav", dur: 1.2, hit: 0.3, f0: 180, f1: 1200, f2: 380, seed: 21, q: 1.1 });
chime({ name: "chime_1.wav", dur: 2.4, f: 1046.5 });
chime({ name: "chime_2.wav", dur: 3.0, f: 783.99, swell: 98 });
pad({ name: "space_pad.wav", dur: 23.6, seed: 3 });
