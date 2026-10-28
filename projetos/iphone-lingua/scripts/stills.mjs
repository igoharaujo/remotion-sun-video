// Render selected frames of a composition as PNGs with one bundle (fast review loop).
// Usage: node scripts/stills.mjs <compositionId> <outDir> <frame> [frame ...]
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [id, outDir, ...frames] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: join(process.cwd(), "src/index.ts") });
const chromiumOptions = { gl: "angle" };
const composition = await selectComposition({ serveUrl, id, chromiumOptions });
for (const f of frames.map(Number)) {
  const output = join(outDir, `f${String(f).padStart(4, "0")}.png`);
  await renderStill({ serveUrl, composition, frame: f, output, chromiumOptions, imageFormat: "png" });
  console.log(output);
}
