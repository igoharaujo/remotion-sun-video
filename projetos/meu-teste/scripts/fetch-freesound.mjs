// Download SFX from the Freesound API (CC0 first, CC-BY fallback) and log credits.
// Each slot tries its queries in order; a pinned `id` skips the search.
// Files are the API's HQ mp3 previews (originals need OAuth2), re-encoded to 48 kHz
// stereo wav with leading silence trimmed so the hit lands on the cue frame.
// Usage:
//   node scripts/fetch-freesound.mjs --list   # print candidates per slot
//   node scripts/fetch-freesound.mjs          # download pinned / best picks
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const KEY = process.env.FREESOUND_API_KEY;
if (!KEY) throw new Error("FREESOUND_API_KEY is not set");
const OUT = join(process.cwd(), "public", "sfx");
const TMP = join(OUT, ".download");
const CREDITS = join(OUT, "CREDITS.json");
const LIST = process.argv.includes("--list");

// [file, queries, duration range (s), pinned id]
const SLOTS = [
  ["teste_pop.wav", ["ui pop", "pop digital", "pop"], [0.05, 0.5]],
  ["teste_whoosh.wav", ["fast whoosh", "whoosh fast", "swoosh"], [0.2, 1.2]],
  ["teste_riser.wav", ["short riser", "cinematic riser short", "riser"], [0.8, 3]],
  ["teste_tick.wav", ["ui click digital", "soft click", "click"], [0.02, 0.4]],
  ["teste_check.wav", ["checkmark ui", "success tick ui", "ui confirm"], [0.1, 1]],
  ["teste_error.wav", ["ui error soft", "error beep soft", "wrong buzzer soft"], [0.1, 1.2]],
  ["teste_pageflip.wav", ["page flip", "paper page turn", "book page"], [0.2, 1.5]],
  ["teste_heartbeat.wav", ["heartbeat", "heart beat single", "heartbeat thump"], [0.4, 3]],
  ["teste_spin.wav", ["whoosh spin", "swirl whoosh", "spinning whoosh"], [0.4, 2.5]],
  ["teste_clock.wav", ["clock ticking", "clock tick tock", "ticking clock"], [1.5, 6]],
  ["teste_impact.wav", ["deep cinematic impact", "cinematic boom impact", "impact hit"], [0.8, 4]],
  ["teste_ding.wav", ["soft notification ding", "notification ding", "soft ding"], [0.3, 2.5]],
];
const PINS = existsSync(join(process.cwd(), "scripts/data/freesound_pins.json"))
  ? JSON.parse(readFileSync(join(process.cwd(), "scripts/data/freesound_pins.json"), "utf8"))
  : {};

const api = async (path, params = {}) => {
  const u = new URL(`https://freesound.org/apiv2/${path}`);
  for (const [k, v] of Object.entries({ ...params, token: KEY })) u.searchParams.set(k, v);
  const r = await fetch(u);
  if (!r.ok) throw new Error(`${r.status} ${u.pathname}`);
  return r.json();
};

const FIELDS = "id,name,username,license,duration,avg_rating,num_downloads,url,previews";
const search = async (query, [d0, d1], license) =>
  (
    await api("search/text/", {
      query,
      filter: `duration:[${d0} TO ${d1}] license:"${license}"`,
      sort: "downloads_desc",
      fields: FIELDS,
      page_size: 6,
    })
  ).results;

const licenseName = (url) =>
  url.includes("/zero/") ? "CC0 1.0" : url.includes("/by/") ? `CC BY ${url.match(/by\/([\d.]+)/)?.[1] ?? ""}`.trim() : url;

const candidates = async (queries, dur) => {
  for (const license of ["Creative Commons 0", "Attribution"]) {
    for (const q of queries) {
      const r = await search(q, dur, license);
      if (r.length) return { query: q, results: r };
    }
  }
  return { query: null, results: [] };
};

mkdirSync(TMP, { recursive: true });
const credits = existsSync(CREDITS) ? JSON.parse(readFileSync(CREDITS, "utf8")).filter((c) => !SLOTS.some(([f]) => f === c.file)) : [];

for (const [file, queries, dur] of SLOTS) {
  let pick;
  let query = PINS[file]?.query ?? null;
  if (PINS[file]?.id && !LIST) {
    pick = await api(`sounds/${PINS[file].id}/`, { fields: FIELDS });
  } else {
    const c = await candidates(queries, dur);
    query = c.query;
    if (LIST) {
      console.log(`\n${file}  (query: ${c.query})`);
      for (const r of c.results)
        console.log(`  ${r.id}  ${licenseName(r.license).padEnd(9)} ${r.duration.toFixed(2)}s  ${String(r.num_downloads).padStart(6)} dl  ${r.name}  — ${r.username}`);
      continue;
    }
    pick = c.results[0];
  }
  if (!pick) throw new Error(`no CC0/CC-BY result for ${file}`);
  const raw = join(TMP, `${pick.id}.mp3`);
  writeFileSync(raw, Buffer.from(await (await fetch(pick.previews["preview-hq-mp3"])).arrayBuffer()));
  execFileSync("ffmpeg", [
    "-hide_banner", "-v", "error", "-y", "-i", raw,
    "-af", "silenceremove=start_periods=1:start_threshold=-50dB,aresample=48000",
    "-ac", "2", "-c:a", "pcm_s16le", join(OUT, file),
  ]);
  credits.push({
    file,
    freesound_id: pick.id,
    name: pick.name,
    author: pick.username,
    license: licenseName(pick.license),
    license_url: pick.license,
    source_url: pick.url,
    query,
    note: "Freesound HQ mp3 preview, re-encoded to 48 kHz wav, leading silence trimmed",
  });
  console.log(`${file} <- #${pick.id} ${pick.name} (${licenseName(pick.license)}, ${pick.username})`);
}

if (!LIST) {
  writeFileSync(CREDITS, JSON.stringify(credits, null, 2) + "\n");
  rmSync(TMP, { recursive: true, force: true });
}
