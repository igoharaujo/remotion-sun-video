// v2 sound design for the motion pass: impacts, odometer + speedometer ticks, HUD blips,
// reveal whoosh and the airplane fly-bys. Pure Node, deterministic, no samples.
// Tick trains and fly-bys are pre-timed from the same easing curves the visuals use,
// so every click lands on a digit/tick change and every whoosh on a pass in front of Earth.
// Usage: node scripts/gen-sfx-v2.mjs  -> public/sfx/*.wav (48 kHz, 16-bit stereo)
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SR = 48000;
const FPS = 60;
const OUT = join(process.cwd(), "public", "sfx");
mkdirSync(OUT, { recursive: true });
const TL = JSON.parse(readFileSync(join(process.cwd(), "timeline.json"), "utf8"));
const M = TL.motion;

// --- easing, identical to Remotion's Easing ---
const quad = (t) => t * t;
const cubic = (t) => t * t * t;
const inOut = (e) => (t) => (t < 0.5 ? e(t * 2) / 2 : 1 - e((1 - t) * 2) / 2);
const out = (e) => (t) => 1 - e(1 - t);
const back = (s) => (t) => t * t * ((s + 1) * t - s);
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const prog = (f, a, b, ease) => ease(clamp01((f - a) / (b - a)));

// --- dsp helpers ---
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
    const f = 2 * Math.sin((Math.PI * Math.min(fc, SR / 6)) / SR);
    low += f * band;
    const high = x - low - q * band;
    band += f * high;
    return { low, band, high };
  };
};
const smooth = (x) => x * x * (3 - 2 * x);

const writeWav = (name, L, R, peakDb = -3) => {
  let peak = 1e-9;
  for (let i = 0; i < L.length; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = Math.pow(10, peakDb / 20) / peak;
  const n = L.length;
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
  writeFileSync(join(OUT, name), buf);
  console.log(`wrote public/sfx/${name} (${(n / SR).toFixed(2)} s)`);
};
const buffers = (sec) => [new Float32Array(Math.round(sec * SR)), new Float32Array(Math.round(sec * SR))];

// Cinematic hit: pitched sub drop + noise crack + short metallic ring.
const impact = () => {
  const [L, R] = buffers(1.6);
  const rand = rng(11);
  const f = svf();
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    const freq = 38 + 90 * Math.exp(-t * 18);
    ph += (2 * Math.PI * freq) / SR;
    const sub = Math.sin(ph) * Math.exp(-t * 3.2) * Math.min(1, t / 0.002);
    const crack = f(2 * rand() - 1, 2400, 0.6).band * Math.exp(-t * 40);
    const ring = 0.12 * Math.sin(2 * Math.PI * 523 * t) * Math.sin(2 * Math.PI * 1307 * t) * Math.exp(-t * 9);
    L[i] = 1.0 * sub + 0.7 * crack + ring;
    R[i] = 1.0 * sub + 0.65 * crack - ring;
  }
  writeWav("impact.wav", L, R, -1);
};

// One mechanical click (used inside the tick trains).
const click = (L, R, at, gain, pitch, pan) => {
  const n = Math.round(0.018 * SR);
  const s = Math.round(at * SR);
  for (let i = 0; i < n && s + i < L.length; i++) {
    const t = i / SR;
    const v = gain * Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * 320) + gain * 0.5 * Math.sin(2 * Math.PI * pitch * 2.7 * t) * Math.exp(-t * 500);
    L[s + i] += v * (1 - pan);
    R[s + i] += v * pan;
  }
};

// Odometer: a click every time the seconds tens digit turns over (0:00 -> 8:20).
const odometerTicks = () => {
  const h = M.hookTimer;
  const sec = (h.lockAt - h.rollFrom) / FPS + 0.2;
  const [L, R] = buffers(sec);
  let last = 0;
  for (let k = 0; k <= (h.lockAt - h.rollFrom) * 8; k++) {
    const f = h.rollFrom + k / 8;
    const v = 500 * prog(f, h.rollFrom, h.lockAt, inOut(quad));
    const step = Math.floor(v / 10);
    if (step > last) {
      last = step;
      click(L, R, (f - h.rollFrom) / FPS, 0.8, 2900 + (step % 6) * 60, 0.5);
    }
  }
  writeWav("odometer_ticks.wav", L, R, -3);
};

// Speedometer: needle passing each tick mark + a rising servo whine while it climbs.
const speedoTicks = () => {
  const s = M.speedometer;
  const sec = (s.countTo + 30 - s.countFrom) / FPS;
  const [L, R] = buffers(sec);
  const qTarget = s.valueKmS / s.maxKmS;
  let last = 0;
  for (let k = 0; k <= (s.countTo + 30 - s.countFrom) * 8; k++) {
    const f = s.countFrom + k / 8;
    const q = qTarget * prog(f, s.countFrom, s.countTo, out(back(1.5)));
    const tick = Math.floor(q * 35);
    if (tick > last) {
      last = tick;
      click(L, R, (f - s.countFrom) / FPS, 0.7, 2200 + tick * 40, 0.3 + 0.4 * (tick / 35));
    }
  }
  let ph = 0;
  for (let i = 0; i < L.length; i++) {
    const f = s.countFrom + (i / SR) * FPS;
    const q = prog(f, s.countFrom, s.countTo, out(back(1.5)));
    const env = smooth(clamp01((f - s.countFrom) / 6)) * (1 - smooth(clamp01((f - s.countTo) / 24)));
    ph += (2 * Math.PI * (180 + 900 * q)) / SR;
    const w = 0.12 * env * (Math.sin(ph) + 0.3 * Math.sin(ph * 2.01));
    L[i] += w;
    R[i] += w;
  }
  writeWav("speedo_ticks.wav", L, R, -3);
};

// HUD power-on chirp and CRT power-off zap.
const hudBlips = () => {
  {
    const [L, R] = buffers(0.5);
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (700 + 2600 * smooth(clamp01(t / 0.18)))) / SR;
      const v = (Math.sin(ph) > 0 ? 0.5 : -0.5) * Math.exp(-t * 9) * Math.min(1, t / 0.004);
      L[i] = v;
      R[i] = v * 0.85;
    }
    writeWav("hud_on.wav", L, R, -3);
  }
  {
    const [L, R] = buffers(0.45);
    const rand = rng(5);
    const f = svf();
    let ph = 0;
    for (let i = 0; i < L.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (2400 * Math.exp(-t * 14) + 60)) / SR;
      const v = 0.6 * Math.sin(ph) * Math.exp(-t * 7) + 0.3 * f(2 * rand() - 1, 5000, 0.8).band * Math.exp(-t * 25);
      L[i] = v;
      R[i] = v;
    }
    writeWav("hud_off.wav", L, R, -3);
  }
};

// Soft reverse-swell whoosh for the 3D reveal (peaks at 0.5 s).
const reveal = () => {
  const [L, R] = buffers(1.3);
  const rand = rng(9);
  const fl = svf();
  const fr = svf();
  for (let i = 0; i < L.length; i++) {
    const t = i / SR;
    const env = t < 0.5 ? Math.pow(smooth(t / 0.5), 2) : Math.exp(-(t - 0.5) * 5);
    const fc = t < 0.5 ? 200 + 1600 * smooth(t / 0.5) : 1800 - 1300 * smooth(clamp01((t - 0.5) / 0.8));
    const n = 2 * rand() - 1;
    L[i] = fl(n, fc, 0.8).band * env;
    R[i] = fr(n, fc * 1.12, 0.8).band * env;
  }
  writeWav("reveal.wav", L, R, -3);
};

// Airplane: filtered jet noise that swells and Doppler-shifts each time the plane
// passes the near side of its orbit; panned with its x position.
const planeFlyby = () => {
  const F = M.flightPath;
  const START = -Math.PI * 0.6;
  const TILT = (F.tiltDeg * Math.PI) / 180;
  const sec = (F.out - F.fly[0]) / FPS + 0.3;
  const [L, R] = buffers(sec);
  const rand = rng(17);
  const fl = svf();
  const fr = svf();
  const fh = svf();
  for (let i = 0; i < L.length; i++) {
    const f = F.fly[0] + (i / SR) * FPS;
    const fly = prog(f, F.fly[0], F.fly[1], inOut(cubic));
    const a = START + fly * F.loops * Math.PI * 2;
    const near = (Math.sin(a) + 1) / 2; // 1 = passing in front of Earth
    const vx = -Math.sin(a) * Math.cos(TILT) - Math.cos(a) * Math.sin(TILT) * 0.52; // screen-x velocity sign
    const x = Math.cos(a) * Math.cos(TILT) - Math.sin(a) * 0.52 * Math.sin(TILT);
    const speed = clamp01(Math.abs(prog(f + 1, F.fly[0], F.fly[1], inOut(cubic)) - fly) * 60);
    const env = Math.pow(near, 2.2) * (0.25 + 0.75 * speed) * (1 - smooth(clamp01((f - F.fly[1]) / 10)));
    const fc = 700 + 900 * near + 300 * vx;
    const n = 2 * rand() - 1;
    const hiss = fh(n, 4200 + 800 * vx, 1.4).band * 0.25;
    const body = (fl(n, fc, 0.7).band + 0.5 * fr(n, fc * 0.5, 0.9).band) * 0.8;
    const pan = 0.5 + 0.4 * x;
    L[i] = (body + hiss) * env * (1 - pan) * 2;
    R[i] = (body + hiss) * env * pan * 2;
  }
  writeWav("plane_flyby.wav", L, R, -3);
};

impact();
odometerTicks();
speedoTicks();
hudBlips();
reveal();
planeFlyby();
