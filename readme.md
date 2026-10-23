# 🎬 Motion Video 3D (Monorepo)

Este é um monorepo dedicado à criação automatizada de vídeos verticais (TikTok, Reels e Shorts) utilizando **Inteligência Artificial (Claude Code)**, **Remotion (React)** e **Three.js**.

O projeto transforma um roteiro de áudio em um vídeo cinematográfico de alta retenção, com cenários 3D gerados por código, legendas animadas (*kinetic typography*), efeitos sonoros sincronizados e motion graphics dinâmicos.

## 🎥 Exemplo de resultado

O projeto `iphone-duo` foi gerado inteiramente por este pipeline.

![Exemplo de vídeo gerado por IA](./projetos/iphone-duo/out/final_iphone_duo.gif)

*(Se o GIF não carregar, ele está salvo localmente no seu computador em `projetos/iphone-duo/out/final_iphone_duo.gif`)*

> **Nota:** Se estiver visualizando o projeto no VS Code, clique no link acima para abrir o vídeo. O arquivo está localizado em `projetos/iphone-duo/out/final_iphone_duo.mp4`.

---

## 🤖 O que a IA espera receber?

A IA é guiada por uma *skill* customizada chamada `motion-video-3d`. Para gerar o melhor vídeo possível, forneça um **briefing completo**, incluindo o tema, o áudio, o estilo visual, a paleta de cores e a emoção desejada.

### Prompt ideal (exemplo)

Ao abrir o Claude Code, utilize um prompt neste formato:

```text
Use a skill motion-video-3d.

# BRIEFING

Tema: [Tema do vídeo, ex.: Como funciona a Inteligência Artificial]
Áudio: public/audio/meu-audio.mp3 (duração: XXs)
Estilo Visual: [Ex.: Minimalista Tech / Cósmico / Cyberpunk / Natureza]
Paleta de Cores: [Ex.: Azul neon e preto / Dourado e verde]
Emoção principal: [Ex.: Curiosidade / Impacto / Urgência]

# O QUE A IA DEVE FAZER

1. Transcrever o áudio com Whisper para identificar o timing exato de cada palavra.
2. Criar um background 3D dinâmico no Three.js, condizente com o tema.
3. Criar animações de texto (Kinetic Typography) sem fundos retangulares.
4. Baixar imagens da web (Wikimedia), se necessário, verificando suas licenças.
5. Baixar efeitos sonoros da API do Freesound e mixar o áudio em -14 LUFS.
6. Renderizar o vídeo final em 1080x1920, a 60 FPS.

Por favor, crie o arquivo timeline.json e mostre-o para aprovação antes de começar a codificar as cenas.
```

### O que NÃO fazer no prompt

- ❌ **Não peça uma duração menor que a do áudio.** Por exemplo, não solicite um vídeo de 20 segundos se o áudio tiver 30 segundos. A skill deve preservar o áudio completo e nunca cortar a *punchline*.
- ❌ **Não solicite fundos pretos atrás das legendas.** A skill prioriza a legibilidade por meio de `text-shadow`, sem utilizar retângulos de fundo.

---

## ⚙️ Como o pipeline funciona

1. **Whisper (IA local):** processa o áudio e extrai os timestamps das palavras para sincronizar as legendas.
2. **Timeline (JSON):** a IA mapeia cada frase do roteiro para um *beat* visual. Por exemplo, a frase "300 mil km/s" pode ser representada por um velocímetro animado em estilo HUD.
3. **Remotion + Three.js:** renderiza o vídeo frame a frame. Os cenários 3D são gerados proceduralmente, sem depender de vídeos de bancos de imagens para compor o fundo.
4. **Freesound API:** busca efeitos sonoros, como *whooshes* e impactos, e os sincroniza com as animações.
5. **FFmpeg:** realiza a mixagem final do áudio, ajustando o volume integrado para -14 LUFS, e exporta o vídeo em MP4.

---

## 📁 Estrutura do monorepo

```text
remotion-sun-video/
├── .claude/
│   └── skills/
│       └── motion-video-3d/       # Regras e instruções da IA
├── CLAUDE.md                      # Regras gerais do monorepo
├── README.md                      # Documentação principal
└── projetos/
    ├── iphone-duo/                # Projeto de vídeo
    │   ├── public/                # Áudios, imagens e efeitos sonoros
    │   ├── src/                   # Código React e Three.js
    │   ├── timeline.json          # Sincronização das cenas com o áudio
    │   ├── package.json           # Dependências do projeto
    │   └── out/                   # Vídeos renderizados
    │       └── final_iphone_duo.mp4
    └── sol-terra/                 # Próximo projeto
```

Cada diretório dentro de `projetos/` representa um vídeo independente, com seus próprios arquivos, configurações, recursos e resultado final.

---

## 🛠️ Pré-requisitos

Para executar o pipeline no Mac, você precisará dos seguintes recursos:

1. **Node.js:** versão 18 ou superior.
2. **FFmpeg:** para processamento e mixagem de áudio e vídeo.
3. **Whisper.cpp:** para transcrição local do áudio.
4. **Chave da API do Freesound:** necessária para buscar efeitos sonoros.

### Instalação das dependências

Instale o FFmpeg e o Whisper.cpp utilizando o Homebrew:

```bash
brew install ffmpeg
brew install whisper-cpp
```

Certifique-se de que o Node.js esteja instalado. Caso ainda não esteja, você pode instalá-lo com:

```bash
brew install node
```

### Configuração da API do Freesound

1. Crie uma conta no [Freesound.org](https://freesound.org/).
2. Solicite uma chave de API na página de [aplicações do Freesound](https://freesound.org/apiv2/apply/).
3. Adicione a chave ao arquivo `~/.zshrc`:

```bash
export FREESOUND_API_KEY="sua_chave_aqui"
```

4. Recarregue as configurações do terminal:

```bash
source ~/.zshrc
```

5. Verifique se a variável está configurada:

```bash
echo $FREESOUND_API_KEY
```

> **Importante:** mantenha sua chave de API privada. Não a inclua no código-fonte, em arquivos versionados ou em repositórios públicos.

---

## 🚀 Como criar um novo projeto

Depois de instalar as dependências e configurar a API, siga estes passos.

### 1. Entre na raiz do monorepo

```bash
cd ~/Documents/remotion-sun-video
```

### 2. Abra o Claude Code

```bash
claude
```

### 3. Prepare o áudio

Coloque o arquivo de áudio na pasta `public/audio/` do projeto correspondente e informe o caminho correto no briefing.

### 4. Envie o briefing

Utilize o [prompt ideal](#-o-que-a-ia-espera-receber) como referência. Informe o tema, a duração do áudio, o estilo visual, a paleta de cores e a emoção principal.

### 5. Aprove a timeline

Peça à IA para gerar o `timeline.json` e apresente a timeline antes de iniciar a implementação das cenas. Revise os timestamps, os momentos de destaque e a correspondência entre o áudio e os elementos visuais.

### 6. Renderize o vídeo

Após a implementação, utilize os comandos de execução e renderização definidos no `package.json` do projeto correspondente.

O vídeo final será salvo no diretório de saída configurado para o projeto, normalmente em `out/`.

---

## 🎨 Princípios visuais do projeto

O pipeline segue algumas diretrizes para produzir vídeos dinâmicos e visualmente consistentes:

- **Sincronização precisa:** legendas, animações e efeitos sonoros devem acompanhar o áudio.
- **Cenários 3D procedurais:** criação de ambientes dinâmicos utilizando Three.js.
- **Kinetic typography:** textos animados que reforçam as informações mais importantes do roteiro.
- **Legibilidade:** uso de contraste, posicionamento e sombras para destacar as legendas sem fundos retangulares.
- **Design orientado ao conteúdo:** cada cena deve representar visualmente a ideia transmitida pela narração.
- **Preservação do áudio:** o vídeo deve acompanhar a duração integral da narração, incluindo a conclusão e a *punchline*.

---

## 📐 Especificações de exportação

| Propriedade | Especificação |
|---|---|
| Formato | MP4 |
| Resolução | 1080 × 1920 pixels |
| Proporção | 9:16 (vertical) |
| Taxa de quadros | 60 FPS |
| Áudio | Mixagem com alvo de -14 LUFS |
| Renderização | Remotion |
| Cenários 3D | Three.js |
| Pós-processamento | FFmpeg |

---

## 🧰 Tecnologias utilizadas

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code): desenvolvimento assistido por IA.
- [Remotion](https://www.remotion.dev/): criação e renderização de vídeos com React.
- [Three.js](https://threejs.org/): criação de cenários e elementos 3D.
- [Whisper.cpp](https://github.com/ggml-org/whisper.cpp): transcrição local de áudio.
- [FFmpeg](https://ffmpeg.org/): processamento e mixagem de áudio e vídeo.
- [Freesound](https://freesound.org/): biblioteca de efeitos sonoros.
- [Wikimedia Commons](https://commons.wikimedia.org/): fonte de imagens, quando necessário.

---

## 📌 Objetivo do projeto

Construir um pipeline reutilizável para transformar roteiros narrados em vídeos verticais de alta qualidade, combinando automação por IA, cenários 3D, tipografia cinética e design de som.

A arquitetura baseada em monorepo permite organizar vários vídeos de forma independente, mantendo regras compartilhadas, ferramentas reutilizáveis e um fluxo de produção consistente.

---

*Desenvolvido com Remotion, Three.js e Claude Code.*