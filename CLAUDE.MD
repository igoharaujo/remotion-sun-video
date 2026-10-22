Este projeto é um **monorepo** de vídeos. A raiz contém apenas:
- `.claude/skills/motion-video-3d/` — a skill de vídeo 3D
- `CLAUDE.md` — estas regras
- `.gitignore`
- `projetos/` — cada vídeo é uma pasta dentro daqui

## Regras gerais

1. **Toda a codificação acontece dentro de `projetos/[nome-do-projeto]/`**. Nunca na raiz.
2. **Cada sub-projeto é independente** (tem seu próprio `package.json`, `node_modules`, `out/`).
3. **Antes de criar novo projeto**: copiar de `projetos/[último-projeto-mais-recente]/` (ex: `iphone-duo`).
4. **Nome da pasta**: kebab-case (`iphone-duo`, `financas-pessoais`, `saude-mental`).
5. **Nunca mover arquivos entre sub-projetos** sem avisar. Cada um é autônomo.
6. **Nunca compartilhar `node_modules`** — cada projeto tem o seu.

## Skill obrigatória

Toda criação de vídeo segue a skill `motion-video-3d` (em `.claude/skills/motion-video-3d/SKILL.md`). Regras críticas:
- Background 3D temático + dinâmico (nunca estático)
- Legendas SEM retângulo (só text-shadow)
- SFX via Freesound API (obrigatório)
- Criatividade contextual (cada frase = elemento visual)
- Duração real (nunca cortar punchline)
- Safe zones TikTok: x ∈ [60, 1020], y ∈ [120, 1670]
- Mix: -14 LUFS, -1 dBTP

## Workflow para novo vídeo

Quando o usuário pedir "novo vídeo sobre [tema]":

1. Criar `projetos/[tema]/`
2. Copiar do projeto mais recente (`projetos/iphone-duo/`):
   ```bash
   cp -r projetos/iphone-duo/* projetos/[tema]/
   cd projetos/[tema]/
   rm -rf node_modules out/*
   npm install