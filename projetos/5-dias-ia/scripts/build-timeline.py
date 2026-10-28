"""Build timeline.json for CincoDiasIA from the aligned whisper cues of the jump-cut take
(public/eu_falando_cortado.mp4, made by scripts/cut.py).

Whisper spellings are mapped to what was said ('Lissão' -> 'Lição', 'uma gente' -> 'um agente', 'vasar' ->
'vazar', 'promptezinho' -> 'promptzinho'). Frames @ 60 fps.
Usage: python3 scripts/build-timeline.py
"""
import json
import subprocess

FPS = 60
VIDEO = "public/eu_falando_cortado.mp4"
VOICE = "public/audio/voz_cortada.wav"


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)


cues = json.load(open("scripts/data/cut_words_aligned.json"))
cut = json.load(open("scripts/data/cutlist.json"))

FIX = {"Lissão": "Lição", "1,": "1:", "vasar": "vazar", "promptezinho,": "promptzinho.", "usei,": "usei."}
words = []
i = 0
while i < len(cues):
    c = dict(cues[i])
    nxt = cues[i + 1] if i + 1 < len(cues) else None
    if c["w"] == "uma" and nxt and nxt["w"] == "gente":  # "um agente"
        words.append({"w": "um", "f": c["f"], "end": c["end"]})
        words.append({"w": "agente", "f": nxt["f"], "end": nxt["end"]})
        i += 2
        continue
    c["w"] = FIX.get(c["w"], c["w"])
    words.append(c)
    i += 1
for prev, w in zip(words, words[1:]):  # sentence case after . ! ? and after the dropped-line joins
    if prev["w"][-1] in ".!?" and w["w"][0].islower():
        w["w"] = w["w"][0].upper() + w["w"][1:]


def at(word, after=0):
    """Frame of the first word equal to `word` (punctuation/case ignored) at/after frame `after`."""
    for w in words:
        if w["f"] >= after and w["w"].lower().strip(".,!?:") == word.lower():
            return w["f"]
    raise KeyError(word)


dur = duration(VIDEO)
SPEECH_END = round(cut["duration"] * FPS)
HOLD = 84  # 1.4 s freeze on the last frame for the CTA sign
TOTAL = SPEECH_END + HOLD

# Section boundaries come straight from the cut list (first segment of each section).
sec_start = {}
for s in cut["segments"]:
    sec_start.setdefault(s["section"], round(s["out"][0] * FPS))
B = [sec_start[k] for k in ("HOOK", "DICA1", "DICA2", "DICA3", "CTA")] + [TOTAL]

K = {
    # hook
    "segunda": at("segunda-feira"), "horrivel": at("horrível"), "aqui1": at("aqui"), "hoje": at("Hoje"), "depois": at("depois"),
    "explodindo": at("explodindo"), "planeta": at("planeta"), "fundo": at("fundo"), "codigo1": at("código"), "ia": at("inteligência"),
    # dica 1
    "erro": at("erro"), "volume": at("volume"), "tecnica": at("técnica"), "documento": at("documento"), "n46": at("46"),
    "automatizei": at("automatizei"), "n70": at("70"), "boneco": at("boneco"), "palito": at("palito"), "resultado": at("resultado"),
    "bomba": at("bomba"), "nenhuma": at("nenhuma"), "licao": at("Lição"), "direcao": at("direção"), "automatiza": at("automatiza"), "ruim": at("ruim"),
    # dica 2
    "dia2": at("dia", at("ruim")), "empilhar": at("empilhar"), "ferramentas1": at("ferramentas"), "jogo": at("jogo"), "virou": at("virou"),
    "dia3": at("dia", at("virou")), "editar": at("editar"), "mao": at("mão"), "programacao": at("programação"), "agente1": at("agente"),
    "escrever": at("escrever"), "animacoes": at("animações"), "codigo2": at("código", at("animações")),
    # dica 3
    "segredo": at("segredo"), "zero1": at("zero"), "semana": at("semana"), "prompt": at("promptzinho"), "arquivo": at("arquivo"),
    "regra": at("regra"), "visual": at("visual"), "editor": at("editor"), "codigo3": at("código", at("editor")),
    # cta
    "deixei": at("deixei"), "vazar": at("vazar"), "tela": at("tela"), "ferramentas2": at("ferramentas", at("tela")), "pastas": at("pastas"),
    "comenta": at("comenta"), "identificar": at("identificar"), "n500": at("500"), "comentarios": at("comentários"), "abro": at("abro"),
    "arquitetura": at("arquitetura"), "agente2": at("agente", at("arquitetura")), "zero2": at("zero", at("arquitetura")),
}

TERMINAL_IN = K["agente1"] - 10  # easter egg 2: 1.5 s
SKILL_IN = K["regra"]  # easter egg 1: 1 s

S = [
    {"id": "S01", "section": "HOOK", "tag": "impactful", "from": B[0], "to": B[1], "name": "Gancho — o planeta explode",
     "keyBeats": {k: K[k] for k in ("segunda", "horrivel", "aqui1", "hoje", "depois", "explodindo", "planeta", "fundo", "codigo1", "ia")} | {"meteorIn": K["depois"]},
     "visual": "Espaço 3D (Three.js): 3 camadas de estrelas com parallax, nebulosa azul/violeta sutil, planeta rochoso com atmosfera (centro, y≈430, r≈230px) girando devagar. Eu em PiP (janela de vidro arredondada 44px, borda fina + rim azul, recorte do rosto) embaixo, x 290–790, y 760–1650. Em 'horrível aqui' (pattern interrupt) o clipe do boneco palito pisca 0,8 s numa janelinha com glitch ao lado do PiP. Em 'depois' um meteoro entra do canto superior direito com rastro de fogo; IMPACTO EXATO em 'explodindo': flash branco, camera shake, onda de choque (anel), planeta se parte em fragmentos + núcleo incandescente + detritos voando. Em 'código e inteligência artificial' dois chips HUD: '</> CÓDIGO' e '✦ IA'.",
     "sfx": [f"whoosh/meteoro {K['depois']}→{K['explodindo']}", f"EXPLOSÃO @{K['explodindo']}", f"rumble de detritos @{K['planeta']}", f"pop chips @{K['codigo1']}/{K['ia']}"]},
    {"id": "S02", "section": "DICA1", "tag": "conversational", "from": B[1], "to": B[2], "name": "Dica 1 — a prova ruim",
     "keyBeats": {k: K[k] for k in ("erro", "volume", "tecnica", "documento", "n46", "automatizei", "n70", "boneco", "palito", "resultado", "bomba", "nenhuma", "licao", "direcao", "automatiza", "ruim")},
     "visual": "Detritos do planeta derivando no fundo. PiP encolhe para o canto superior direito (x 690–940, y 160–604). 'volume ganha de técnica': HUD 'VOLUME > TÉCNICA' e o '>' é riscado → 'ERRO #1'. 'documento de 46 páginas': pilha de 46 páginas em 3D se abrindo em leque + contador 46. '70 imagens': grade de 70 miniaturas do boneco palito se multiplicando + contador 70. 'boneco palito': o clipe ruim (broll/bad.mp4) entra em janela flutuante grande no centro com filtro VHS/glitch (scanlines, aberração cromática, ruído, tracking jitter, timestamp 'REC ▶ SEG 10:00'). 'O resultado?': zoom lento na janela. 'bomba': X VERMELHO GIGANTE bate com shake + glitch. 'Lição 1': chip 'LIÇÃO 1'. 'IA sem direção de arte… ruim': citação em tipografia gigante (Keynote), 'RUIM' em vermelho; PiP volta ao tamanho médio.",
     "sfx": [f"glitch @{K['boneco']}", f"VHS hum sob o clipe {K['boneco']}→{K['licao']}", f"impacto + glitch no X @{K['bomba']}", f"tick contador @{K['n46']}/{K['n70']}", f"chime @{K['licao']}"]},
    {"id": "S03", "section": "DICA2", "tag": "conversational", "from": B[2], "to": B[3], "name": "Dica 2 — empilhar ferramentas → o agente",
     "keyBeats": {k: K[k] for k in ("dia2", "empilhar", "ferramentas1", "jogo", "virou", "dia3", "editar", "mao", "programacao", "agente1", "escrever", "animacoes", "codigo2")} | {"terminalIn": TERMINAL_IN},
     "visual": "Chip 'DIA 2'. B-roll dos TikToks em janelas 3D flutuando no espaço (Minority Report): ai-grid, ai-cine, editor, dataviz. Em 'empilhar ferramentas' as janelas se empilham numa torre com leve parallax. 'Mas o jogo virou': transição glitch, a torre se desfaz; chip 'DIA 3'. 'editar à mão': ícone de mão/cursor riscado. EASTER EGG 2 (1,5 s, a partir de 'agente'): o terminal real (broll/terminal.mp4) ocupa a tela numa janela de terminal com barra de título, código rolando. 'animações direto em código': linhas de código se digitando sobre o espaço (genéricas, sem nome de ferramenta).",
     "sfx": [f"whoosh ×4 nas janelas @{K['dia2']}", f"stack thuds @{K['empilhar']}", f"glitch @{K['jogo']}", f"teclado @{TERMINAL_IN}→{TERMINAL_IN + 90}"]},
    {"id": "S04", "section": "DICA3", "tag": "serious", "from": B[3], "to": B[4], "name": "Dica 3 — o arquivo de regras",
     "keyBeats": {k: K[k] for k in ("segredo", "zero1", "semana", "prompt", "arquivo", "regra", "visual", "editor", "codigo3")} | {"skillIn": SKILL_IN},
     "visual": "Dolly lento no espaço, luz cai (serious); PiP cresce para o centro. 'do zero a esse nível em uma semana': barra de progresso 0 → 100 em 7 dias. 'não é criar promptzinho': caixa de chat genérica 'faça um vídeo incrível…' é riscada em vermelho. 'arquivo de regra visual dentro do seu editor de código': janela de editor de código (tema escuro genérico) com árvore de arquivos. EASTER EGG 1 (1 s, em 'regra'): a árvore mostra 'remotion-sun-video/' › '.claude/skills/motion-video-3d/SKILL.md' destacado e o arquivo aberto com títulos de regras (texto parcialmente desfocado).",
     "sfx": [f"riser sutil @{K['segredo']}", f"erro/risco @{K['prompt']}", f"click @{SKILL_IN}"]},
    {"id": "S05", "section": "CTA", "tag": "conversational", "from": B[4], "to": B[5], "name": "CTA — comenta qual ferramenta você viu",
     "keyBeats": {k: K[k] for k in ("deixei", "vazar", "tela", "ferramentas2", "pastas", "comenta", "identificar", "n500", "comentarios", "abro", "arquitetura", "agente2", "zero2")},
     "visual": "A tela volta pra mim: tela cheia (corte seco + flash), overlay escuro 20%, espaço some. 'deixei vazar na tela': 3 miniaturas borradas dos easter eggs (terminal, SKILL.md, B-roll) com '?' passam rápido no topo. 'comenta aqui': letreiro fixo no topo 'COMENTE QUAL FERRAMENTA VOCÊ VIU' + balão de comentário; o camaleão entra no canto inferior direito apontando pro letreiro. '500 comentários': barra '0 / 500 COMENTÁRIOS' enchendo. 'abro a arquitetura desse agente do zero': ícone de cadeado abrindo + 'ARQUITETURA DO AGENTE'. Hold de 1,4 s no último frame.",
     "sfx": [f"whoosh corte @{B[4]}", f"DING @{K['comenta']}", f"pop mascote @{K['comenta']}", f"ticks barra @{K['n500']}", f"unlock @{K['abro']}"]},
]

tl = {
    "$comment": "Beat sheet for CincoDiasIA. Frames @ 60 fps. Words: whisper-small (pt) on public/audio/voz_cortada.wav (the jump-cut take, scripts/cut.py), onsets snapped to the first voiced 10 ms window, mapped to what was said (scripts/build-timeline.py). STATUS: draft, waiting for approval.",
    "status": "draft",
    "composition": {"id": "CincoDiasIA", "width": 1080, "height": 1920, "fps": FPS, "durationInFrames": TOTAL, "durationSec": round(TOTAL / FPS, 3),
                    "durationNote": f"Cut take {cut['duration']:.2f} s ({len(cut['segments'])} segments of the 7:12 raw). Holds {HOLD / FPS:.1f} s on the last frame for the CTA sign."},
    "palette": {"space": "#05060B", "ink": "#FFFFFF", "muted": "#A1A1AA", "blue": "#4285F4", "blueGlow": "#8AB4F8", "violet": "#8B5CF6",
                "fire": "#FF7A1A", "alert": "#FF453A", "gold": "#F5C451"},
    "background3D": "Espaço (Three.js): 3 camadas de estrelas com parallax e twinkle, nebulosa procedural azul/violeta em shader, planeta com atmosfera (S01) que explode em fragmentos + detritos (S01→S02), drift contínuo de câmera; bloom leve e vinheta. Some no CTA (tela volta pra mim).",
    "speaker": {"source": VIDEO, "face": {"x": [320, 800], "y": [400, 1230]},
                "pip": {"crop": {"x": 140, "y": 200, "w": 800, "h": 1422}, "radius": 44,
                        "states": {"hook": {"x": 290, "y": 760, "w": 500}, "corner": {"x": 690, "y": 160, "w": 250}, "mid": {"x": 330, "y": 820, "w": 420}, "center": {"x": 270, "y": 640, "w": 540}},
                        "note": "PiP shows the face crop (x 140-940, y 200-1622 of the source); full screen in the CTA"}},
    "broll": {
        "bad": {"src": "broll/bad.mp4", "from": "tiktok/d644ab46…mp4 108-124 s", "use": "S02 prova ruim (VHS/glitch + X)"},
        "aiGrid": {"src": "broll/ai-grid.mp4", "from": "tiktok/874c545d…mp4 52-58 s", "use": "S03 janela flutuante"},
        "aiCine": {"src": "broll/ai-cine.mp4", "from": "tiktok/874c545d…mp4 72-80 s", "use": "S03 janela flutuante"},
        "editor": {"src": "broll/editor.mp4", "from": "tiktok/874c545d…mp4 60-66 s", "use": "S03 janela flutuante"},
        "dataviz": {"src": "broll/dataviz.mp4", "from": "tiktok/dc02c9f2…mp4 48-56 s", "use": "S03 janela flutuante"},
        "terminal": {"src": "broll/terminal.mp4", "from": "tiktok/7c279454…mp4 50.5-54.5 s", "use": "S03 easter egg 2 (1.5 s)"},
    },
    "easterEggs": [
        {"id": "terminal", "from": TERMINAL_IN, "to": TERMINAL_IN + 90, "what": "terminal rodando código (filmagem real), 1.5 s", "requested": "aos 25 s → no cortado cai em 'um agente escrever', mesmo assunto"},
        {"id": "skill", "from": SKILL_IN, "to": SKILL_IN + 60, "what": "pasta remotion-sun-video + SKILL.md, 1 s", "requested": "aos 15 s → proposto em 'arquivo de regra visual' (o SKILL.md é literalmente esse arquivo)"},
    ],
    "mascot": {"pose": "pointing → hyped", "keys": [{"f": K["comenta"], "pose": "pointing", "x": 870, "y": 1480}, {"f": K["n500"], "pose": "hyped", "x": 860, "y": 1490}], "heightPx": 280},
    "voice": {"source": VIDEO, "processing": "high-pass 80 Hz, EQ (-2.5 dB @250 Hz, +2 dB @3.5 kHz), compressor 3:1, loudnorm -14 LUFS (scripts/cut.py)", "words": words},
    "scenes": S,
    "audio": {"bgm": None, "duck": {"whoosh": -3, "boom": -8}, "target": {"lufs": -14, "dbtp": -1}},
    "layout": {"safeZone": {"x": [60, 1020], "y": [120, 1670]}, "captions": {"y": [1400, 1550], "minPx": 72, "note": "abaixo do queixo (rosto termina em y≈1230 na tela cheia; no PiP do gancho cai no peito)"},
               "hud": {"y": [170, 700]}},
}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
for s in S:
    print(f"{s['id']} {s['from']:>5}–{s['to']:<5} {s['from'] / FPS:5.1f}–{s['to'] / FPS:5.1f}s {s['tag']:<14} {s['name']}")
print("TOTAL", TOTAL, f"({TOTAL / FPS:.2f} s)", "terminal", TERMINAL_IN, "skill", SKILL_IN)
print(" ".join(f"{w['w']}@{w['f']}" for w in words))
