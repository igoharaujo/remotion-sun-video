# 🎬 Motion Video 3D (Monorepo)

Monorepo dedicado à criação automatizada de vídeos verticais de alta qualidade para **TikTok, Instagram Reels e YouTube Shorts**, utilizando **Claude Code, Remotion, React, Three.js e ElevenLabs**.

O projeto transforma roteiros em texto ou vídeos brutos (*Talking Head*) em vídeos cinematográficos, com cenários 3D gerados por código, legendas animadas (*kinetic typography*), mascote próprio, efeitos sonoros sincronizados e pesquisa de imagens reais na web para enriquecer o conteúdo.

## 🎥 Exemplos de resultado

Os projetos `iphone-duo` e `analista-dados-ia` foram gerados utilizando este pipeline.

[![Assistir ao vídeo de exemplo](https://img.shields.io/badge/▶_Assistir_Vídeo_Exemplo-blue?style=for-the-badge)](projetos/iphone-duo/out/final_iphone_duo.mp4)

> **Nota:** Para assistir ao vídeo no VS Code, clique no link acima. O arquivo está localizado em `projetos/iphone-duo/out/final_iphone_duo.mp4`.

---

## 🤖 Como funciona o briefing?

A IA utiliza uma skill customizada chamada `motion-video-3d`, responsável por orientar a criação dos vídeos, desde o planejamento visual até a renderização final.

Existem duas formas de utilizar o pipeline:

- **Roteiro em texto:** a IA gera a narração por meio da API do ElevenLabs.
- **Vídeo bruto:** a IA utiliza o áudio original, remove silêncios e erros e sincroniza as legendas com a fala.

### 📝 Exemplo 1 — Criar um vídeo a partir de um roteiro

Utilize o seguinte prompt no Claude Code:

```text
Use a skill motion-video-3d.

# BRIEFING

Tema: A IA vai acabar com o Analista de Dados?
Voz: Padrão (ElevenLabs - Kaique)
Mascote: Sim
Estilo Visual: Apple Keynote / Dark Tech / Dados e Gráficos
Paleta de Cores: Azul Neon (#007AFF), Verde (#10B981) e Vermelho (#EF4444) para alertas.

# ROTEIRO

[ curious ] A IA vai ou não vai acabar com o Analista de Dados?

[ matter-of-fact ] O Fórum Econômico Mundial projeta queda de 26% na entrada manual de dados...

[ impactful ] Mas quem domina Python e Orquestração de Agentes ganha 60% a mais.

[ conversational ] Comenta DADOS aqui embaixo que eu te mando o mapa.

# INSTRUÇÕES EXTRAS

1. Pesquise na web e obtenha imagens reais de relatórios do WEF e da Gartner para contextualizar os dados apresentados na tela.
2. Crie animações e um cenário 3D coerentes com o tema.
3. Pesquise efeitos sonoros no Freesound e sincronize-os com as animações.
4. Faça a mixagem final com loudness alvo de -14 LUFS.
5. Verifique as fontes dos dados e evite apresentar estatísticas sem comprovação.
```

### 🎬 Exemplo 2 — Criar um vídeo a partir de uma gravação

```text
Use a skill motion-video-3d.

# BRIEFING

Tema: Meu primeiro vídeo com IA (Bastidores)
Vídeo Bruto: public/eu_falando.mp4
Duração aproximada: 7 minutos
Mascote: Sim
Estilo Visual: Espaço Sideral + Dark Tech

# INSTRUÇÕES EXTRAS

1. Analise o vídeo bruto e identifique silêncios longos, erros de fala e trechos que possam ser removidos sem prejudicar o contexto.
2. Gere uma versão editada com jump cuts, preservando a naturalidade da fala.
3. Utilize a voz original do vídeo editado para sincronizar as legendas.
4. Nos primeiros 5 segundos, crie uma animação 3D de um meteoro atingindo um planeta.
5. Sincronize os efeitos sonoros com as ações visuais.
6. Preserve o sentido do conteúdo e não corte frases importantes ou a conclusão.
7. Apresente o plano de edição para aprovação antes da renderização final.
```

> **Importante:** Os exemplos são briefings de referência. A execução de cada funcionalidade depende das instruções da skill, dos scripts implementados e das APIs configuradas.

---

## ⚙️ Como o pipeline funciona

O processo transforma o roteiro ou a gravação original em um vídeo vertical pronto para publicação.

1. **Áudio e voz:** quando a entrada é um texto, o pipeline utiliza o ElevenLabs para gerar a narração. Quando a entrada é um vídeo bruto, o FFmpeg pode ser utilizado para processar o áudio e realizar os cortes planejados.
2. **Transcrição com Whisper.cpp:** processa o áudio final e extrai os timestamps das palavras para sincronização das legendas.
3. **Planejamento da timeline:** a IA organiza as cenas em um arquivo `timeline.json`, associando trechos da narração a elementos visuais, animações e imagens de referência.
4. **Pesquisa de imagens:** o agente pesquisa fontes na web para obter imagens reais, gráficos, notícias, logotipos e documentos que contextualizem o roteiro.
5. **Renderização com Remotion e Three.js:** gera o vídeo frame a frame, com cenários 3D procedurais, animações tipográficas e posicionamento do mascote.
6. **Efeitos sonoros:** a integração com a API do Freesound permite pesquisar e obter efeitos sonoros para compor as cenas.
7. **Pós-processamento com FFmpeg:** realiza a mixagem de áudio, o ajuste de loudness e a exportação do vídeo final em MP4.

---

## 📁 Estrutura do monorepo

```text
remotion-sun-video/
├── .claude/
│   └── skills/
│       └── motion-video-3d/       # Regras e instruções da IA
├── avatar/                        # Imagens do mascote global
├── scripts/                       # Scripts e utilitários globais
│   ├── generate-voice.mjs         # Geração de narração
│   └── remove_bg.mjs              # Remoção de fundo
├── CLAUDE.md                      # Regras gerais do monorepo
├── README.md                      # Documentação principal
├── .gitignore                     # Arquivos ignorados pelo Git
└── projetos/
    ├── analista-dados-ia/
    │   ├── public/                # Vídeos, áudios e imagens
    │   ├── src/                   # Código React e Three.js
    │   ├── timeline.json          # Timeline e sincronização
    │   ├── package.json           # Dependências do projeto
    │   └── out/                   # Vídeos renderizados
    └── iphone-duo/
        ├── public/
        ├── src/
        ├── timeline.json
        ├── package.json
        └── out/
            └── final_iphone_duo.mp4
```

> A árvore acima representa a organização esperada do projeto. Ajuste os diretórios conforme os arquivos efetivamente existentes no repositório.

---

## 🛠️ Pré-requisitos e configurações

O ambiente de referência utiliza macOS e Homebrew.

### Requisitos

- **Node.js:** versão 18 ou superior.
- **FFmpeg:** processamento, cortes e mixagem de áudio e vídeo.
- **Whisper.cpp:** transcrição local de áudio.
- **Claude Code:** agente responsável por interpretar o briefing e executar o fluxo de trabalho.
- **Chaves de API:** necessárias para os serviços externos utilizados pelo pipeline.

### Instalação das dependências básicas

Execute os comandos abaixo no terminal:

```bash
brew install node
brew install ffmpeg
brew install whisper-cpp
```

Verifique as versões instaladas:

```bash
node --version
npm --version
ffmpeg -version
```

### Configuração das variáveis de ambiente

Adicione as chaves necessárias ao arquivo `~/.zshrc`:

```bash
export ELEVENLABS_API_KEY="sua_chave_aqui"
export FREESOUND_API_KEY="sua_chave_aqui"
export REPLICATE_API_TOKEN="sua_chave_aqui"
```

Recarregue as configurações do terminal:

```bash
source ~/.zshrc
```

**Finalidade de cada variável:**

| Variável | Finalidade |
|---|---|
| `ELEVENLABS_API_KEY` | Geração de narração por IA. |
| `FREESOUND_API_KEY` | Pesquisa e obtenção de efeitos sonoros. |
| `REPLICATE_API_TOKEN` | Acesso a modelos de IA para tarefas auxiliares, como upscale e remoção de fundo. |

> **Segurança:** nunca compartilhe suas chaves de API nem as versione no Git. Utilize variáveis de ambiente e mantenha os arquivos com credenciais fora do repositório.

---

## 🚀 Como criar um novo projeto

### 1. Acesse a raiz do monorepo

```bash
cd ~/Documents/remotion-sun-video
```

### 2. Inicie o Claude Code

```bash
claude
```

### 3. Prepare os arquivos de entrada

Crie ou organize o projeto em `projetos/[nome-do-projeto]/`.

Para vídeos brutos, coloque a gravação no diretório `public/` do projeto. Por exemplo:

```text
projetos/
└── meu-primeiro-video/
    └── public/
        └── eu_falando.mp4
```

Se utilizar o mascote global, verifique se as imagens necessárias estão disponíveis na pasta `avatar/`.

### 4. Envie o briefing

Solicite a utilização da skill `motion-video-3d` e informe:

- Tema e objetivo do vídeo.
- Público-alvo.
- Roteiro ou caminho do vídeo bruto.
- Tipo de voz e estilo de narração.
- Presença ou ausência do mascote.
- Estilo visual e paleta de cores.
- Instruções de pesquisa, animação e efeitos sonoros.

Utilize tags emocionais como `[curious]`, `[impactful]` e `[conversational]` quando compatíveis com o formato de entrada aceito pelo pipeline.

### 5. Revise o planejamento

Antes de iniciar uma renderização demorada, confira:

- Cortes propostos para o vídeo bruto.
- Roteiro e narração.
- Timeline e sincronização.
- Fontes e imagens pesquisadas.
- Animações e efeitos sonoros.

A aprovação prévia depende de a skill estar implementada para apresentar esse planejamento.

### 6. Renderize o vídeo

Execute o comando de renderização definido pelo projeto. O vídeo final deverá ser salvo no diretório `out/`.

Exemplo de caminho:

```text
projetos/meu-primeiro-video/out/final_meu-primeiro-video.mp4
```

---

## 🎨 Princípios visuais e diretrizes

### Sincronização precisa

Legendas, animações, transições e efeitos sonoros devem acompanhar os momentos relevantes da narração.

### Cenários 3D procedurais

Utilização do Three.js para criar ambientes dinâmicos, partículas, meteoros, gráficos, objetos tridimensionais e efeitos de profundidade, sem depender necessariamente de modelos 3D externos.

### Kinetic typography

Animação de textos com destaque de palavras-chave, mudanças de escala, entradas dinâmicas, efeitos de *punch-in* e sombras para melhorar a legibilidade.

### Mascote global

O camaleão funciona como elemento visual recorrente, podendo flutuar pelos cantos da tela, utilizar animações com física de mola (*spring*) e apresentar expressões diferentes conforme o contexto da narração.

### Prova social visual

Imagens reais, gráficos, documentos e notícias podem complementar os argumentos apresentados no roteiro. As informações devem ser verificadas e as fontes identificadas sempre que necessário.

### Preservação do conteúdo

A edição deve remover erros e silêncios desnecessários sem comprometer o sentido das frases, a naturalidade da fala ou a conclusão do vídeo.

### Identidade visual consistente

Cada projeto deve manter coerência entre tipografia, cores, iluminação, cenários, efeitos sonoros e estilo das animações.

---

## 📐 Especificações de exportação

| Propriedade | Especificação |
|---|---|
| Formato | MP4 |
| Resolução | 1080 × 1920 pixels |
| Proporção | 9:16 |
| Taxa de quadros | 60 FPS |
| Codec de vídeo | H.264 |
| Codec de áudio | AAC |
| Loudness alvo | -14 LUFS |
| True peak alvo | -1 dBTP |
| Renderização | Remotion + React + Three.js |
| Pós-processamento | FFmpeg |

> As especificações representam o padrão desejado de exportação. A configuração efetiva depende dos parâmetros de renderização e dos comandos de pós-processamento utilizados.

---

## 🧰 Tecnologias utilizadas

| Tecnologia | Aplicação | Documentação |
|---|---|---|
| Claude Code | Agente de IA para desenvolvimento e execução do pipeline. | [Documentação oficial](https://docs.anthropic.com/en/docs/claude-code) |
| Remotion | Composição e renderização de vídeos com React. | [remotion.dev](https://www.remotion.dev/) |
| React | Componentização e construção da interface visual. | [react.dev](https://react.dev/) |
| Three.js | Cenários e animações 3D. | [threejs.org](https://threejs.org/) |
| ElevenLabs | Geração de voz e narração. | [elevenlabs.io](https://elevenlabs.io/) |
| Whisper.cpp | Transcrição local de áudio. | [GitHub](https://github.com/ggml-org/whisper.cpp) |
| FFmpeg | Edição, processamento e mixagem de áudio e vídeo. | [ffmpeg.org](https://ffmpeg.org/) |
| Freesound | Pesquisa e obtenção de efeitos sonoros. | [freesound.org](https://freesound.org/) |
| Replicate | Acesso a modelos de IA para processamento de imagens. | [replicate.com](https://replicate.com/) |

---

## 🔒 Boas práticas

- Nunca versione chaves de API, tokens ou credenciais.
- Mantenha vídeos brutos, áudios temporários e arquivos renderizados fora do Git quando forem volumosos.
- Utilize o `.gitignore` para excluir `node_modules`, arquivos temporários, credenciais e artefatos de renderização.
- Verifique os direitos de uso das imagens, músicas e efeitos sonoros utilizados.
- Confira as fontes das estatísticas apresentadas nos vídeos.
- Revise a narração, a sincronização das legendas e a mixagem antes de publicar.
- Mantenha os scripts globais reutilizáveis e a lógica específica de cada vídeo dentro de seu respectivo projeto.

---

*Desenvolvido com Claude Code, Remotion, React e Three.js.*
