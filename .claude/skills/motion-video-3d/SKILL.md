---
name: motion-video-3d
description: Pipeline completo para vídeos 3D com PiP (talking-head) usando Remotion + Three.js + Whisper + Freesound. Cria backgrounds dinâmicos temáticos, kinetic typography, HUDs contextuais, e mixagem profissional (-14 LUFS). Use quando o usuário pedir "vídeo 3D", "vídeo com PiP", "vídeo estilo TikTok cinematográfico", ou "vídeo do meu roteiro".
---

# Skill: Motion Video 3D (Remotion + Three.js + PiP)

## Quando usar
- "faz um vídeo 3D com meu vídeo falando no canto"
- "vídeo estilo TikTok cinematográfico sobre [tema]"
- "vídeo com background 3D e legendas animadas"
- "vídeo com [meu áudio/meu vídeo] falando X"

## Filosofia (REGRA DE OURO)
**O vídeo deve ser CRIATIVO e CONTEXTUAL ao tema.** Não basta ter 3D genérico. Cada frase do roteiro precisa inspirar um elemento visual único que traduza o conceito. Exemplo:
- Frase "8 minutos e 20 segundos" → **odômetro digital** que roda até 8:20
- Frase "300.000 km/s" → **velocímetro HUD de ficção científica** com ponteiro
- Frase "um avião daria 3 voltas" → **avião orbitando a Terra** com rastro
- Frase "luz viaja do Sol à Terra" → **fóton com lens flare** viajando

O usuário exige esse nível de criatividade contextual. **NUNCA** faça só texto estático com fade-in.

## Pré-requisitos (verificar antes de começar)
1. **Node.js + npm** instalados
2. **FFmpeg** instalado (`brew install ffmpeg`)
3. **Whisper-cpp** instalado (`brew install whisper-cpp`) — para sincronizar palavras
4. **FREESOUND_API_KEY** em `~/.zshrc` (API de SFX obrigatória)
5. **Vídeo/áudio do narrador** em `public/eu.mp4` ou `public/audio/*.mp3`

Se algum faltar, PARE e avise o usuário.

## 1. Estrutura do Projeto
~/Documents/[nome-do-projeto]/
├── public/
│ ├── eu.mp4 # vídeo do narrador (se houver PiP)
│ ├── audio/*.mp3 # áudio puro (se não houver vídeo)
│ ├── images/[tema]/ # imagens baixadas (com credits.json)
│ └── sfx/ # SFX baixados do Freesound
├── src/
│ ├── three/ # cena 3D (Three.js)
│ ├── components/ # Legendas, HUDs, overlays
│ ├── timeline.json # TODOS os timings (fonte da verdade)
│ └── Root.tsx
├── scripts/
│ ├── align-words.py # Whisper → word timestamps
│ ├── gen-sfx.mjs # síntese local (pads, drones)
│ ├── fetch-freesound.mjs # OBRIGATÓRIO: baixa SFX da API
│ ├── finalize.sh # -14 LUFS + faststart
│ └── contact-sheet.sh # contact sheet com safe zones
├── out/
│ ├── final_[tema].mp4
│ ├── thumbnail.png # capa 1080x1920
│ └── contact_sheet.png
└── timeline.json

text

## 2. Workflow Obrigatório (em ordem)

### Fase 0: Briefing
Confirmar com o usuário:
- **Tema** do vídeo
- **Duração real** do áudio (nunca cortar punchline)
- **Paleta** (padrão: deep black + accent color coerente com tema)
- **Estilo do background 3D** (ver seção 3)
- **PiP** (se houver vídeo): posição bottom-right, x ≤ 940
- **Legendas**: kinetic (ver seção 5)

### Fase 1: Setup + Whisper
1. Inicializar/verificar Remotion + @remotion/three + @react-three/fiber + three
2. Rodar `scripts/align-words.py` para transcrever o áudio
3. Criar `timeline.json` com timings EXATOS de cada palavra
4. **PARAR E ESPERAR APROVAÇÃO** antes de codar cenas

### Fase 2: Background 3D temático (ver seção 3)

### Fase 3: PiP (se houver) + Legendas + HUDs (ver seções 4 e 5)

### Fase 4: SFX via Freesound (ver seção 6) — OBRIGATÓRIO

### Fase 5: Render + Mix + Contact Sheet + Thumbnail

## 3. Background 3D Dinâmico (CRIATIVIDADE OBRIGATÓRIA)

**Regra:** o background NÃO pode ser estático. Deve ter movimento contínuo e elementos flutuantes. Use o tema para decidir o estilo:

| Tema | Background 3D |
|------|---------------|
| **Espaço / Universo** | 3 camadas de estrelas com parallax, nebulosa sutil, planetas no horizonte |
| **Programação / Tech** | Matriz de código flutuante, partículas de "bits", circuitos em wireframe, grid animado |
| **iPhone / Minimalista** | Partículas de poeira flutuantes (lentas, tamanhos variados), luz volumétrica suave, estilo Stranger Things upside down |
| **Natureza** | Folhas/partículas orgânicas flutuando, luz de sol filtrada, profundidade com parallax |
| **Cidade / Urbano** | Luzes de neon distantes, partículas de chuva, skyline com parallax |
| **Ciência / Laboratório** | Moléculas flutuando, tubos de ensaio em wireframe, partículas brilhantes |

**Sempre incluir:**
- **Parallax** (mínimo 3 camadas com velocidades diferentes)
- **Movimento de câmera** (drift sutil ao longo de todo o vídeo)
- **Iluminação volumétrica** (luz suave, não flat)
- **Pós-processamento** (bloom, vinheta sutil)
- **Cores coerentes com o tema** (não usar paleta genérica)

## 4. PiP (Talking-head) — se houver vídeo

- Usar `<OffthreadVideo>` do Remotion
- **Aspect ratio exato** (não distorcer o rosto)
- **Posição:** bottom-right, MAS respeitando safe zone (x ≤ 940)
- **Estilo:** rounded corners 24px, soft shadow, thin border
- **Nunca** alterar cores, background, aspect ratio ou áudio do vídeo original
- **Scale up** apenas em momentos de payoff (ex: 1.12x)
- **Se for apenas áudio:** adicionar um "Audio Visualizer HUD" pulsando com a voz no lugar do PiP

## 5. Legendas (KINETIC + sem "retângulo")

### Regras de animação:
- **Word-by-word** (não frase por frase) — cada palavra no frame exato da fala
- **Ease-out com overshoot** (~0.15s por palavra)
- **Palavras-chave**: flash branco + settle em accent color + glow + scale up breve
- **Linhas pré-layoutadas** (não deixar palavras "pularem" de linha)

### ⚠️ REGRA CRÍTICA: SEM RETÂNGULOS
**NÃO usar background-color sólido atrás do texto.**
Para legibilidade, usar **APENAS**:
- `text-shadow: 4px 4px 8px rgba(0,0,0,0.9)`
- `filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8))`
- Opcional: gradient radial ≤ 15% de opacidade atrás de palavras isoladas
- **NUNCA**: `<div style="background: rgba(0,0,0,0.7)">` ao redor da frase

O texto deve **flutuar** sobre o background, não parecer um card.

### Posicionamento:
- Centro horizontal
- Y entre 1400-1550
- Tamanho mínimo: 72px (legível em celular)

## 6. SFX via Freesound API (OBRIGATÓRIO)

**O usuário EXIGE que os sons sejam baixados da Freesound API.** Não use apenas síntese local.

### Fluxo:
1. Verificar `FREESOUND_API_KEY` em `~/.zshrc`
2. Criar/usar `scripts/fetch-freesound.mjs` para buscar e baixar
3. **Mapa mínimo de SFX** (adapte ao tema):

| Momento | Tipo | Query no Freesound |
|---------|------|---------------------|
| Abertura | digital boot suave | "soft digital boot" |
| Impactos de texto | cinematic hit | "cinematic impact hit" |
| Contador | clock tick | "digital counter tick" |
| Velocímetro | speedometer whine | "engine whine pitch up" |
| Objeto voando | jet whoosh | "jet flyby whoosh" |
| Revelação 3D | swelling rise | "cinematic riser" |
| Chegada / clímax | boom + chime | "cinematic boom chime" |
| CTA final | soft chime | "soft notification chime" |

4. Filtrar por **CC0** primeiro; fallback **CC-BY** (anotar em `public/sfx/CREDITS.json`)
5. Salvar em `public/sfx/`
6. **Sintetizar LOCALMENTE** apenas o contínuo (space pad, drone, riser longo) via `scripts/gen-sfx.mjs`

### Mixagem:
- Voz: **NUNCA processar** (só +ganho para atingir -14 LUFS, com limiter -1 dBTP)
- SFX: **ducking -3dB** (whooshes), **-8dB** (booms) — significa abaixar o SFX sob a voz, não a voz
- Space pad: **-24dB** contínuo, fade-in 1s, fade-out 2s
- **Loudness final: -14 LUFS, peak máximo -1 dBTP**

## 7. TikTok Safe Zones (OBRIGATÓRIO)

- Canvas: 1080×1920, 60fps
- **Safe area:** x ∈ [60, 1020], y ∈ [120, 1670]
- **Action bar (direita):** não invadir x > 960
- **Top bar:** y < 120
- **Bottom (caption):** y > 1670
- **PiP:** nunca sobrepor x > 940
- **Sempre** validar com contact sheet com overlay das safe zones

## 8. Checklist Final

- [ ] Duração = duração real do áudio (não cortar punchline)
- [ ] Whisper transcreveu e sincronizou palavra por palavra
- [ ] Background 3D temático + dinâmico + parallax
- [ ] Legendas em kinetic typography, SEM background retangular
- [ ] PiP respeita safe zone (x ≤ 940) — se houver
- [ ] Pelo menos 5 elementos criativos contextuais (HUDs, objetos voando)
- [ ] SFX baixados da Freesound API (não só síntese)
- [ ] Mixagem -14 LUFS / -1 dBTP
- [ ] Contact sheet com overlay de safe zones
- [ ] Thumbnail gerado (out/thumbnail.png)
- [ ] Hook de 3s validado (elemento 3D + texto + SFX + câmera)
- [ ] ffprobe valida 1080x1920, 60fps, H.264 + AAC

## 9. Lidando com trava do macOS (Sandbox)

Se o Claude Code perder acesso à pasta por "Operation not permitted":
1. Preparar todos os arquivos em scratchpad
2. Gerar script único `finish-v2.sh` que instala e renderiza
3. O usuário roda manualmente no terminal
4. Claude Code então lê o ffprobe output que o usuário cola de volta

**Sempre** incluir fallback manual no final.

## 10. Sobre licenças de imagens (se houver download)

- PREFERIR Wikimedia Commons (CC0/CC-BY/CC-BY-SA) — sempre checar licença
- PREFERIR Apple/empresas oficiais (fair use editorial)
- AVOID sites aleatórios / Pinterest / stock
- Salvar `credits.json` com {filename, source_url, author, license}
- Criar `LICENSE_CHECK.md` antes de baixar, auditando cada uma
- Se não tiver licença clara, gerar alternativa procedural com Three.js

---

**Resumo:** esta skill transforma qualquer roteiro em vídeo TikTok cinematográfico com 3D temático, kinetic typography, HUDs criativos, PiP (opcional), e sound design profissional via Freesound. A criatividade contextual é OBRIGATÓRIA — cada frase do roteiro deve inspirar um elemento visual único.
