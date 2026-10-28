// Global TTS for the monorepo (skill motion-video-3d §11).
// Usage: node scripts/generate-voice.mjs <projeto> <script.txt> [--voice ID] [--speed 1.05] [--stability 0.4] [--seed N] [--prev TEXT] [--next TEXT] [--out name.mp3]
// Writes projetos/<projeto>/public/audio/<out> (default narracao.mp3).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_VOICE = 'Hmn4B9B77pf6ttydteJ8'; // Kaique

const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args.splice(i, 2)[1] : def;
};
const voice = flag('voice', DEFAULT_VOICE);
const speed = Number(flag('speed', '1.0'));
const outName = flag('out', 'narracao.mp3');
const seed = flag('seed', undefined);
const stability = Number(flag('stability', '0.4'));
const previousText = flag('prev', undefined); // context for re-recording a single line
const nextText = flag('next', undefined);
const [project, scriptFile] = args;
if (!project || !scriptFile) {
  console.error('usage: node scripts/generate-voice.mjs <projeto> <script.txt> [--voice ID] [--speed N] [--out name.mp3]');
  process.exit(1);
}

const keyFromZshrc = () => {
  const p = join(homedir(), '.zshrc');
  if (!existsSync(p)) return undefined;
  const m = readFileSync(p, 'utf8').match(/ELEVENLABS_API_KEY=["']?([^"'\s]+)/);
  return m?.[1];
};
const key = process.env.ELEVENLABS_API_KEY || keyFromZshrc();
if (!key) {
  console.error('ELEVENLABS_API_KEY not found (env or ~/.zshrc)');
  process.exit(1);
}

const projectDir = join(ROOT, 'projetos', project);
if (!existsSync(projectDir)) {
  console.error(`project not found: ${projectDir}`);
  process.exit(1);
}
const text = readFileSync(scriptFile, 'utf8').trim();

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`,
  {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      ...(seed !== undefined && { seed: Number(seed) }),
      ...(previousText && { previous_text: previousText }),
      ...(nextText && { next_text: nextText }),
      voice_settings: { stability, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true, speed },
    }),
  },
);
if (!res.ok) {
  console.error(`ElevenLabs ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const outDir = join(projectDir, 'public', 'audio');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, outName);
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
console.log(`wrote ${out} (voice ${voice}, speed ${speed}, ${text.length} chars)`);
