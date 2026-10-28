"""Build timeline.json for ZencialGhkCu from the aligned whisper cues.

Whisper spellings are replaced by the script's display text (GHK-Cu, séruns, viço, Nº 1…);
'G'+'HKCU' and 'número'+'1' are merged into one caption word each.
Usage: python3 scripts/build-timeline.py
"""
import json
import subprocess

FPS = 60
AUDIO = "public/audio/narracao.mp3"


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)


# Line 6 was re-recorded and spliced into take 77 at 32.00–39.15 s. Audio outside the splice is
# untouched, so words there keep the take-77 alignment (the tail shifted by the length change);
# only the new line comes from the whisper run on the spliced file.
SPLICE_IN, SPLICE_OUT = 32.00, 39.15
take77 = json.load(open("scripts/data/zencial_words_aligned_take77.json"))
spliced = json.load(open("scripts/data/zencial_words_aligned.json"))
shift = round((duration(AUDIO) - duration("scripts/data/narracao_take77_original.mp3")) * FPS)
cues = ([c for c in take77 if c["f"] < SPLICE_IN * FPS]
        + [c for c in spliced if SPLICE_IN * FPS <= c["f"] < SPLICE_OUT * FPS + shift]
        + [{**c, "f": c["f"] + shift, "end": c["end"] + shift} for c in take77 if c["f"] >= SPLICE_OUT * FPS])

FIX = {"pare": "Pare", "serãos": "séruns", "Serum": "sérum", "HKCU": "GHK-Cu", "GHKCU,": "GHK-Cu,",
       "peptídio": "peptídeo", "visto,": "viço,", '"Zencial",': "Zencial.", "Direct.": "direct.",
       "importados.": "importados!", "textura,": "textura!", "finas,": "finas.", "agora.": "AGORA!", "achou.": "achou!"}
words = []
i = 0
while i < len(cues):
    c = dict(cues[i])
    nxt = cues[i + 1] if i + 1 < len(cues) else None
    if c["w"] == "G" and nxt and nxt["w"] == "HKCU":
        c = {"w": "GHK-Cu", "f": c["f"], "end": nxt["end"]}
        i += 1
    elif c["w"] == "número" and nxt and nxt["w"] == "1":
        c = {"w": "nº 1", "f": c["f"], "end": nxt["end"]}
        i += 1
    else:
        c["w"] = FIX.get(c["w"], c["w"])
    if c["w"] == "R$" and nxt and nxt["w"] == "200":
        c = {"w": "R$ 200", "f": c["f"], "end": nxt["end"]}
        i += 1
    if c["w"].startswith("comentar") and nxt and nxt["w"] != "eu":
        # whisper sometimes hears 'comentar "eu quero"' as 'comentarei o que era': rebuild the quote
        j = i
        while j < len(cues) and cues[j]["w"] != "aqui":
            j += 1
        words.append({"w": "comentar", "f": c["f"], "end": nxt["f"]})
        c = {"w": '"EU QUERO"', "f": nxt["f"], "end": cues[j - 1]["end"]}
        i = j - 1
    elif c["w"] == "eu" and nxt and nxt["w"] == "quero":
        c = {"w": '"EU QUERO"', "f": c["f"], "end": nxt["end"]}
        i += 1
    words.append(c)
    i += 1
for prev, w in zip(words, words[1:]):  # sentence case after . ! ?
    if prev["w"][-1] in ".!?" and w["w"][0].islower():
        w["w"] = w["w"][0].upper() + w["w"][1:]


def at(word, after=0):
    """Frame of the first caption word starting with `word` at/after frame `after`."""
    for w in words:
        if w["f"] >= after and w["w"].lower().strip('.,!?"').startswith(word.lower()):
            return w["f"]
    raise KeyError(word)


dur = duration(AUDIO)
audio_frames = round(dur * FPS)
TOTAL = audio_frames + 80  # hold for the CTA comment bubble + fade

LINES = [  # (tag, first word, text)
    ("impactful", "Pare", "Pare de gastar fortunas com séruns importados!"),
    ("curious", "segredo", "O segredo das influencers para ter uma pele de vidro custa menos de R$ 200 e é 100% brasileiro."),
    ("conversational", "nome", "O nome é Zencial. O sérum de GHK-Cu que já passou de 125 mil pedidos."),
    ("matter-of-fact", "Ele", "Ele tem peptídeo de cobre, o famoso GHK-Cu, que estimula a produção de colágeno e devolve a firmeza da pele."),
    ("impactful", "Olha", "Olha a diferença na textura! É bizarro o que esse ativo faz com as linhas finas."),
    ("serious", "não", "E não é milagre de marketing. O próprio TikTok Shop elegeu a Zencial como a marca nº 1 de beleza do Brasil. Mais de 7 mil criadores já geraram vendas com o produto."),
    ("conversational", "Se", "Se você sente a pele cansada e sem viço, você precisa testar isso."),
    ("impactful", "Clica", "Clica no carrinho amarelo aqui embaixo AGORA, garante o seu com desconto de primeira compra e me conta depois o que achou!"),
    ("curious", "Ah", "Ah, e se você quer o link direto, só comentar \"EU QUERO\" aqui embaixo que eu te mando no direct."),
]
starts = []
after = 0
for tag, first, _ in LINES:
    f = at(first, after)
    starts.append(f)
    after = f + 1

K = {
    "pare": at("Pare"), "fortunas": at("fortunas"), "importados": at("importados"),
    "segredo": at("segredo"), "influencers": at("influencers"), "pele": at("pele"), "vidro": at("vidro"),
    "custa": at("custa"), "preco": at("R$"), "cem": at("100%"), "brasileiro": at("brasileiro"),
    "nome": at("nome"), "zencial": at("Zencial"), "ghk1": at("GHK-Cu"), "passou": at("passou"),
    "n125": at("125"), "pedidos": at("pedidos"),
    "peptideo": at("peptídeo"), "cobre": at("cobre"), "ghk2": at("GHK-Cu", at("famoso")), "estimula": at("estimula"),
    "colageno": at("colágeno"), "firmeza": at("firmeza"),
    "olha": at("Olha"), "diferenca": at("diferença"), "textura": at("textura"), "bizarro": at("bizarro"),
    "ativo": at("ativo"), "linhas": at("linhas"), "finas": at("finas"),
    "milagre": at("milagre"), "marketing": at("marketing"), "tiktok": at("TikTok"), "elegeu": at("elegeu"),
    "n1": at("nº 1"), "brasil": at("Brasil"), "n7": at("7"), "criadores": at("criadores"), "produto": at("produto"),
    "sente": at("sente"), "cansada": at("cansada"), "vico": at("viço"), "testar": at("testar", at("sente")),
    "clica": at("Clica"), "carrinho": at("carrinho"), "embaixo1": at("embaixo"), "agora": at("agora"),
    "garante": at("Garante"), "desconto": at("desconto"), "primeira": at("primeira"), "achou": at("achou"),
    "ah": at("Ah"), "link": at("link"), "comentar": at("comentar"), "euquero": at("eu quero"),
    "embaixo2": at("embaixo", at("comentar")), "direct": at("direct"),
}

end_of = lambda n: starts[n + 1] - 4 if n + 1 < len(starts) else TOTAL
S = [
    {"id": "S01", "line": 0, "from": 0, "to": starts[1] - 4, "name": "Hook — PARE DE GASTAR CARO",
     "keyBeats": {k: K[k] for k in ("pare", "fortunas", "importados")}, "pause": [K["importados"] + 40, starts[1] - 4],
     "visual": "Abre ESCURO (#141010). Em 'Pare' hard cut: luz dourada acende do centro (volumetric god-rays) e o fundo vira off-white→bege. Texto gigante 'PARE' (240px) bate com shake; 'DE GASTAR' entra em 'gastar'; 'CARO' em vermelho em 'fortunas' (3 cortes secos: PARE / DE GASTAR / CARO). Em 'importados' 3 etiquetas de preço genéricas 'IMPORTADO' (sem valores) voam pra fora com um X vermelho. Pausa: só o spot no palco escuro, respiro.",
     "sfx": [f"cash register (sutil −14 dB) @{K['pare']}", f"hit/stinger @{K['pare']}", f"whoosh @{K['fortunas'] - 8}", f"whoosh ×3 etiquetas @{K['importados']}", f"water drop @{K['importados'] + 60}"]},
    {"id": "S02", "line": 1, "from": starts[1] - 4, "to": end_of(1), "name": "Interesse — spot revela o frasco",
     "keyBeats": {k: K[k] for k in ("segredo", "influencers", "vidro", "preco", "cem", "brasileiro")},
     "visual": "Slow zoom suave (curious). O spot acende e varre até o frasco (serum_hero_cut.webp, recorte com alfa) pousado no piso reflexivo. 'pele de vidro': reflexo especular passa pelo frasco (glass sheen). Em 'R$ 200' HUD de preço: 'MENOS DE R$ 200' (dourado). Em '100%' selo circular '100% BRASILEIRO' gira e assenta.",
     "sfx": [f"riser sutil @{starts[1]}", f"glow chime @{K['vidro']}", f"tick @{K['preco']}", f"pop @{K['cem']}"]},
    {"id": "S03", "line": 2, "from": end_of(1), "to": end_of(2), "name": "Nome + 125 MIL PEDIDOS",
     "keyBeats": {k: K[k] for k in ("zencial", "ghk1", "n125", "pedidos")},
     "visual": "Drift fluido (conversational). 'Zencial' em wordmark tipográfico grande (sem logo oficial) com brilho. 'GHK-Cu' chip HUD. Em '125 mil' contador rola 0→125.000 e a imagem serum_army.webp (fileira de frascos) entra por trás como 'exército' de pedidos; caixinhas de pedido 3D caem empilhando.",
     "sfx": [f"chime @{K['zencial']}", f"ticks contador {K['n125']}→{K['n125'] + 40}", f"cash register (sutil) @{K['pedidos']}"]},
    {"id": "S04", "line": 3, "from": end_of(2), "to": end_of(3), "name": "O ativo — peptídeo de cobre → colágeno",
     "keyBeats": {k: K[k] for k in ("peptideo", "cobre", "ghk2", "estimula", "colageno", "firmeza")},
     "visual": "Cortes limpos (matter-of-fact). Molécula 3D procedural: 3 esferas (Gly–His–Lys) + átomo de cobre (Cu²⁺, cor cobre/azul) monta em 'peptídeo'→'cobre'. Em 'colágeno' fibras em tripla hélice crescem e se entrelaçam. Em 'firmeza' a malha de fibras 'tensiona' (wireframe se estica e trava). Data card limpo: 'GHK-Cu · PEPTÍDEO DE COBRE'. ",
     "sfx": [f"pop ×3 @{K['peptideo']}", f"glow chime @{K['cobre']}", f"swipe @{K['colageno']}", f"tick lock @{K['firmeza']}"]},
    {"id": "S05", "line": 4, "from": end_of(3), "to": end_of(4), "name": "Desejo — retrato ilustrativo",
     "keyBeats": {k: K[k] for k in ("olha", "diferenca", "textura", "bizarro", "linhas", "finas")},
     "visual": "Retrato real (Unsplash, Eze Joseph) em card escuro com luz de estúdio varrendo em 'diferença'; zoom punch em 'bizarro'. Sem antes/depois (licença/CONAR). Selo fixo 'SIMULAÇÃO ILUSTRATIVA' (obrigatório — ver approval).",
     "sfx": [f"swipe @{K['diferenca']}", f"glow chime @{K['diferenca'] + 20}", f"hit @{K['bizarro']}", f"glow chime @{K['finas']}"]},
    {"id": "S06", "line": 5, "from": end_of(4), "to": end_of(5), "name": "Prova social — Nº 1 + 7 MIL CRIADORES",
     "keyBeats": {k: K[k] for k in ("milagre", "marketing", "tiktok", "n1", "n7", "criadores", "produto")},
     "visual": "Iluminação um pouco mais baixa, câmera lenta e pesada (serious). Em 'milagre de marketing' palavra 'MILAGRE?' riscada. HUD minimalista: 'Nº 1 DE BELEZA · TIKTOK SHOP BRASIL' (troféu/medalha 3D dourada). Em '7 mil' grade de 7×N avatares procedurais genéricos acendendo + '+7 MIL CRIADORES GERARAM VENDAS'. Linha de fonte: 'Fonte: TikTok via Cosmetic Innovation, set/2026'. O carrinho amarelo aparece pequeno embaixo e começa a pulsar em 'produto'.",
     "sfx": [f"hit @{K['n1']}", f"ticks @{K['n7']}", f"pop @{K['produto']}"]},
    {"id": "S07", "line": 6, "from": end_of(5), "to": end_of(6), "name": "Dor — pele cansada → viço",
     "keyBeats": {k: K[k] for k in ("sente", "cansada", "vico", "testar")},
     "visual": "Drift relaxado (conversational). 'pele cansada?' em tipografia cinza no palco vazio; em 'viço' acende um retrato real (Unsplash, Reece van der Merwe) sem alteração da pele. Em 'testar' o frasco volta deslizando pro centro.",
     "sfx": [f"bubbles @{K['vico'] - 10}", f"whoosh @{K['testar']}"]},
    {"id": "S08", "line": 7, "from": end_of(6), "to": end_of(7), "name": "CTA — CARRINHO AMARELO",
     "keyBeats": {k: K[k] for k in ("clica", "carrinho", "embaixo1", "agora", "desconto", "primeira", "achou")},
     "visual": "Frasco em 3D (billboard com sombra projetada + reflexo no chão) no centro. Ícone 3D do carrinho amarelo (genérico, sem logo) sobe e fica na parte inferior com botão 'CARRINHO AMARELO ↓' e seta pulsando. 'AGORA' slam vermelho com shake. Em 'desconto' tag dourada '1ª COMPRA COM DESCONTO' (sem percentual).",
     "sfx": [f"pop @{K['carrinho']}", f"hit @{K['agora']}", f"cash register (sutil) @{K['desconto']}", f"chime @{K['achou']}"]},
    {"id": "S09", "line": 8, "from": end_of(7), "to": TOTAL, "name": "CTA 2 — COMENTE \"EU QUERO\"",
     "keyBeats": {k: K[k] for k in ("ah", "link", "comentar", "euquero", "direct")}, "fadeOut": [TOTAL - 50, TOTAL],
     "visual": "Revelação suave (curious). Texto grande 'COMENTE' + '\"EU QUERO\"' (dourado, 150px) bate; balão de comentário estilo genérico sobe com 'EU QUERO 🙋' e ícone de DM. Carrinho continua pulsando embaixo. Fade final em preto.",
     "sfx": [f"pop @{K['comentar']}", f"pop @{K['euquero']}", f"ding @{K['direct']}"]},
]
for s in S:
    s["tag"] = LINES[s["line"]][0]
    s["text"] = LINES[s["line"]][2]

tl = {
    "$comment": "Beat sheet for ZencialGhkCu. Frames @ 60 fps. Words: whisper-small (pt) on public/audio/narracao.mp3 (ElevenLabs Kaique, seed 77, speed 1.05; line 6 re-recorded 2026-10-23 with previous/next context and spliced at 32.00–39.15 s of the original take, +1 dB level match), onsets snapped to first voiced 10 ms window, then mapped to the script's spelling (scripts/build-timeline.py). STATUS: approved 2026-10-23 (labels SIMULAÇÃO ILUSTRATIVA + PUBLICIDADE, dark-brown captions, serum-blue drops, generic cart).",
    "status": "approved-2026-10-23; visual redesign (Apple Keynote) 2026-10-23",
    "composition": {"id": "ZencialGhkCu", "width": 1080, "height": 1920, "fps": FPS, "durationInFrames": TOTAL,
                    "durationSec": round(TOTAL / FPS, 3),
                    "durationNote": f"Audio {dur:.3f} s ({audio_frames} frames); last word 'direct.' ends ~{words[-1]['end']}. Holds ~1.3 s for comment bubble + fade."},
    "palette": {"stage": "#0B0B0D", "stageHi": "#1A1A1E", "gold": "#D4AF37", "goldDeep": "#E2C26A", "urgent": "#FF453A",
                "ink": "#F5F5F7", "muted": "#A1A1A6", "serumBlue": "#2E9BFF", "cartYellow": "#FFC92E", "spotWarm": "#FFE2A8", "spotCool": "#EAF2FF"},
    "background3D": "Apple Keynote studio (redesign 2026-10-23): palco carvão #0B0B0D com ciclorama infinito, piso escuro reflexivo, spot volumétrico sobre o frasco (quente no hook, neutro depois), rim light frio atrás, panorâmicas lentas de câmera. Sem bolhas, gotas ou partículas.",
    "audioOnly": True,
    "pipReplacement": "Audio Visualizer HUD (barras douradas) bottom-left, x 60–260, y 1590–1660",
    "voice": {"source": AUDIO, "durationSec": round(dur, 3),
              "tts": {"provider": "ElevenLabs", "voiceId": "Hmn4B9B77pf6ttydteJ8", "model": "eleven_multilingual_v2", "speed": 1.05, "stability": 0.5, "seed": 77},
              "pronunciation": "GHK-Cu falado 'gê agá cá cê u' (evita ler 'Cu'); R$ 200 → 'duzentos reais'.",
              "words": words},
    "lineStarts": dict(zip([f"L{n + 1}" for n in range(len(starts))], starts)),
    "scenes": S,
    "audio": {"bgm": None, "bgmNote": "Removida no redesign 2026-10-23: só voz + SFX.",
              "duck": {"whoosh": -3, "boom": -8}, "target": {"lufs": -14, "dbtp": -1}},
    "layout": {"safeZone": {"x": [60, 1020], "y": [120, 1670]}, "captions": {"y": [1400, 1550], "minPx": 72},
               "visualizer": {"x": 60, "y": 1590, "w": 200, "h": 70},
               "cart": {"x": 300, "y": 1572, "w": 480, "h": 96, "note": "S06 (pequeno, pulsando) → S08/S09 (botão completo)"},
               "disclosure": {"text": "PUBLICIDADE", "x": 60, "y": 150, "frames": "0–TOTAL (pequeno, 28px)"}},
}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
for s in S:
    print(f"{s['id']} {s['from']:>5}–{s['to']:<5} {s['tag']:<15} {s['name']}  {s['keyBeats']}")
print("TOTAL", TOTAL, "audio", audio_frames)
