import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { join } from "node:path";
import "dotenv/config";

// Pega os argumentos da linha de comando:
// node scripts/generate-voice.mjs <nome-do-projeto> <caminho-do-texto.txt>
const projectName = process.argv[2];
const textFilePath = process.argv[3];

if (!projectName || !textFilePath) {
  console.error("Uso: node scripts/generate-voice.mjs <nome-do-projeto> <arquivo-texto.txt>");
  process.exit(1);
}

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
});

const VOICE_ID = "Hmn4B9B77pf6ttydteJ8"; // Kaique
const MODEL_ID = "eleven_v4";

// Monta o caminho de saída dentro do projeto específico
const outputDir = join(process.cwd(), "projetos", projectName, "public", "audio");
const outputPath = join(outputDir, "narracao.mp3");

async function generateSpeech() {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Lê o texto do arquivo (para não ter que passar texto gigante no terminal)
  const fs = await import("node:fs/promises");
  const text = await fs.readFile(textFilePath, "utf-8");

  console.log(`Gerando áudio para o projeto: ${projectName}`);
  
  const audio = await elevenlabs.textToSpeech.convert(VOICE_ID, {
    text: text,
    modelId: MODEL_ID,
    outputFormat: "mp3_44100_128",
  });

  const fileStream = createWriteStream(outputPath);
  await pipeline(audio, fileStream);
  
  console.log(`✅ Áudio salvo com sucesso em: ${outputPath}`);
}

generateSpeech().catch(console.error);