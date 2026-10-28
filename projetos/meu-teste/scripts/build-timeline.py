"""Build timeline.json for MeuTeste from the aligned whisper cues on the speaker's own voice (public/eu.mp4).

Whisper spellings/punctuation are mapped to the script ('deixa' -> 'deixar', 'Regras' -> 'Regra', 'dois' -> '2',
'está' -> 'tá', quotes, ':' '?'); the 'de' whisper swallowed in 'menos de 2 minutos' is re-inserted mid-'menos'.
Usage: python3 scripts/build-timeline.py
"""
import json
import subprocess

FPS = 60
VIDEO = "public/eu.mp4"
VOICE = "public/audio/voz.wav"


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)


cues = json.load(open("scripts/data/teste_words_aligned.json"))

# (whisper word, occurrence) -> display word; occurrence counts from 1
FIX = {("preguiçoso,", 1): "preguiçoso.", ('"deixa', 1): "'deixar", ('amanhã".', 1): "amanhã'.", ("planejar,", 1): "planejar.",
       ("real,", 1): "real.", ("aí", 1): "Aí", ("amanhã", 1): "amanhã,", ("bate", 1): "bate,", ("Regras", 1): "Regra",
       ("ouro,", 1): "ouro:", ("dois", 1): "2", ("agora.", 1): "AGORA.", ("conta,", 1): "conta:", ("está", 2): "tá"}
seen = {}
words = []
for c in cues:
    seen[c["w"]] = seen.get(c["w"], 0) + 1
    w = {**c, "w": FIX.get((c["w"], seen[c["w"]]), c["w"])}
    if w["w"] == "menos":
        mid = (w["f"] + w["end"]) // 2 + 3
        words.append({"w": "menos", "f": w["f"], "end": mid})
        words.append({"w": "de", "f": mid, "end": w["end"]})
        continue
    words.append(w)
# Whisper squeezed the first words into the leading silence (Você 0.44-0.49 s); onsets re-measured on the
# RMS envelope: "Vo-" 0.50 s, "não" 0.73 s, "é" 0.90 s, "preguiçoso" ~1.01 s.
ONSET = {0: 30, 1: 43, 2: 54, 3: 61}
for i, f in ONSET.items():
    words[i]["f"] = f
    if i > 0:
        words[i - 1]["end"] = f
for prev, w in zip(words, words[1:]):  # sentence case after . ! ? :
    if prev["w"][-1] in ".!?" and w["w"][0].islower():
        w["w"] = w["w"][0].upper() + w["w"][1:]


def at(word, after=0):
    """Frame of the first caption word equal to `word` (punctuation/case ignored) at/after frame `after`."""
    for w in words:
        if w["f"] >= after and w["w"].lower().strip(".,!?\":'") == word.lower():
            return w["f"]
    raise KeyError(word)


def silences():
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", VOICE, "-af", "silencedetect=n=-38dB:d=0.2", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    vals = [float(l.split(": ")[1].split()[0]) for l in err.splitlines() if "silence_start" in l or "silence_end" in l]
    return [(round(a * FPS), round(b * FPS)) for a, b in zip(vals[::2], vals[1::2])]


SIL = silences()
end_of_word = lambda f: next((a for a, b in SIL if a > f), f + 30)  # whisper 'end' runs over silences

dur = duration(VIDEO)
TOTAL = round(dur * FPS)  # the video's own length: the CTA holds on the last 0.8 s of footage

LINES = [  # (tag, first word, text)
    ("curious", "Você", "Você não é preguiçoso. Você só está viciado na dopamina de 'deixar pra amanhã'."),
    ("matter-of-fact", "Seu", "Seu cérebro ama a sensação de planejar. É como se você já tivesse feito a tarefa, mas sem o esforço real."),
    ("serious", "Aí", "Aí chega amanhã, a ansiedade bate, e o ciclo recomeça."),
    ("conversational", "Regra", "Regra de ouro: se leva menos de 2 minutos, faz AGORA. Me conta: o que você tá deixando pra amanhã?"),
]
starts = [at(first) for _, first, _ in LINES]

K = {
    "voce": at("Você"), "nao": at("não"), "preguicoso": at("preguiçoso"), "viciado": at("viciado"), "dopamina": at("dopamina"),
    "deixar": at("deixar"), "amanha1": at("amanhã"),
    "cerebro": at("cérebro"), "ama": at("ama"), "planejar": at("planejar"), "feito": at("feito"), "tarefa": at("tarefa"),
    "mas": at("mas"), "esforco": at("esforço"), "real": at("real"),
    "chega": at("chega"), "amanha2": at("amanhã", at("chega")), "ansiedade": at("ansiedade"), "bate": at("bate"),
    "ciclo": at("ciclo"), "recomeca": at("recomeça"),
    "regra": at("Regra"), "ouro": at("ouro"), "menos": at("menos"), "dois": at("2"), "minutos": at("minutos"),
    "faz": at("faz"), "agora": at("AGORA"), "me": at("Me"), "conta": at("conta"), "deixando": at("deixando"),
    "amanha3": at("amanhã", at("deixando")),
}

end_of = lambda n: starts[n + 1] - 4 if n + 1 < len(starts) else TOTAL
S = [
    {"id": "S01", "line": 0, "from": 0, "to": end_of(0), "name": "Hook — não é preguiça, é dopamina",
     "keyBeats": {k: K[k] for k in ("voce", "nao", "preguicoso", "viciado", "dopamina", "deixar", "amanha1")},
     "visual": "Vídeo em tela cheia, overlay escuro 20%, push-in lento (1.00→1.04). Em 'preguiçoso' a palavra PREGUIÇOSO (hero, 132px, branco) bate na zona superior e um risco vermelho a atravessa em 'preguiçoso'+12. Em 'viciado' o camaleão (shocked) sobe quicando no canto inferior esquerdo (spring). Em 'dopamina' HUD 'DOPAMINA' — barra/medidor vertical azul enchendo até o topo com um pico em linha (ECG-like) ao lado. Em 'deixar pra amanhã' um cartão de calendário glass 'AMANHÃ →' entra e desliza pra direita (empurrado pra frente).",
     "sfx": [f"pop (mascote) @{K['viciado']}", f"riser curto @{K['dopamina']}", f"whoosh (calendário) @{K['deixar']}"]},
    {"id": "S02", "line": 1, "from": end_of(0), "to": end_of(1), "name": "Planejar = sensação de feito",
     "keyBeats": {k: K[k] for k in ("cerebro", "ama", "planejar", "feito", "tarefa", "mas", "esforco", "real")},
     "visual": "Cortes limpos (matter-of-fact). Em 'planejar' o camaleão troca pra skeptical (squash-pop) e um checklist glass entra na zona superior: 'Planejar', 'Organizar', 'Fazer'. Em 'feito' os dois primeiros itens se marcam ✓ em sequência (azul). Em 'mas sem o esforço real' o item 'Fazer' fica vazio, pisca em vermelho, e uma barra 'PROGRESSO REAL 0%' aparece embaixo.",
     "sfx": [f"pop (pose) @{K['planejar']}", f"tick ×2 @{K['feito']}", f"glitch/erro suave @{K['esforco']}"]},
    {"id": "S03", "line": 2, "from": end_of(1), "to": end_of(2), "name": "Ansiedade → o ciclo recomeça",
     "keyBeats": {k: K[k] for k in ("chega", "amanha2", "ansiedade", "bate", "ciclo", "recomeca")},
     "visual": "Iluminação mais escura (overlay 20%→38%), push-in pesado no vídeo (serious). Em 'amanhã' o calendário volta e vira a página (HOJE → AMANHÃ). Em 'ansiedade' o camaleão troca pra tired e vibra; em 'bate' um pulso de batimento (linha ECG vermelha) cruza a zona superior + micro-shake. Em 'ciclo recomeça' uma seta circular grande (azul, 300px) desenha-se e gira 1,5 volta, com 'DE NOVO' no centro.",
     "sfx": [f"page flip @{K['amanha2']}", f"heartbeat @{K['bate']}", f"whoosh circular @{K['ciclo']}"]},
    {"id": "S04", "line": 3, "from": end_of(2), "to": TOTAL, "name": "Regra dos 2 minutos → AGORA → CTA",
     "keyBeats": {k: K[k] for k in ("regra", "ouro", "menos", "dois", "minutos", "faz", "agora", "me", "conta", "deixando", "amanha3")},
     "visual": "Volta a luz normal (conversational). Em 'Regra de ouro' chip 'REGRA DE OURO' (dourado #F5C451, estrela) no topo. Em '2 minutos' HUD de relógio grande: anel de timer 360px com ponteiro varrendo e '2:00' em mono gigante; o camaleão troca pra pointing e aponta pro relógio. Em 'faz AGORA' o anel completa com flash, 'AGORA' bate em hero (180px, branco→azul) com shake. Em 'Me conta' o camaleão troca pra hyped e um balão de comentário (azul) entra ao lado do texto da pergunta.",
     "sfx": [f"chime @{K['regra']}", f"ticks relógio {K['dois']}→{K['faz']}", f"impacto @{K['agora']}", f"ding @{K['conta']}"]},
]
for s in S:
    s["tag"] = LINES[s["line"]][0]
    s["text"] = LINES[s["line"]][2]

# Where the mascot sits (screen centre, px) — always in a bottom corner, outside the face box.
# Widths at 240 px tall: shocked ~204, skeptical ~134, tired ~160, pointing ~150 (points left, toward the clock), hyped ~170.
MASCOT = [
    {"f": K["viciado"] - 4, "pose": "shocked", "x": 162, "y": 1500},
    {"f": K["planejar"], "pose": "skeptical", "x": 890, "y": 1500},
    {"f": K["ansiedade"], "pose": "tired", "x": 160, "y": 1505},
    {"f": K["dois"], "pose": "pointing", "x": 885, "y": 1490},
    {"f": K["me"], "pose": "hyped", "x": 876, "y": 1495},
]

tl = {
    "$comment": "Beat sheet for MeuTeste. Frames @ 60 fps (source video is 30 fps). Words: whisper-small (pt) on the voice track of public/eu.mp4, onsets snapped to the first voiced 10 ms window, mapped to the script's spelling (scripts/build-timeline.py). STATUS: approved 2026-10-24.",
    "status": "approved-2026-10-24",
    "composition": {"id": "MeuTeste", "width": 1080, "height": 1920, "fps": FPS, "durationInFrames": TOTAL, "durationSec": round(TOTAL / FPS, 3),
                    "durationNote": f"Video {dur:.2f} s (1080x1920 @30 fps, no rotation). Last word 'amanhã?' ends ~{end_of_word(words[-1]['f'])}; CTA holds on the remaining footage."},
    "palette": {"ink": "#FFFFFF", "muted": "#C9CDD2", "blue": "#4285F4", "blueGlow": "#8AB4F8", "alert": "#FF453A", "gold": "#F5C451", "glass": "rgba(20,20,24,0.55)"},
    "background": {"source": VIDEO, "fit": "cover (already 1080x1920)", "overlay": {"base": 0.2, "serious": 0.38}, "pushIn": "1.00→1.04 over the whole video; extra 1.04→1.08 in S03"},
    "audio": {"voice": "the video's own track, untouched (only the final global gain to -14 LUFS)", "bgm": None,
              "duck": {"whoosh": -3, "boom": -8}, "target": {"lufs": -14, "dbtp": -1}},
    "voice": {"source": VIDEO, "words": words},
    "lineStarts": dict(zip([f"L{n + 1}" for n in range(len(starts))], starts)),
    "scenes": S,
    "mascot": {"sprites": "public/avatar (trimmed, 2.5D CSS plane with springs)", "heightPx": 240, "keys": MASCOT},
    "layout": {
        "safeZone": {"x": [60, 1020], "y": [120, 1670]},
        "face": {"x": [250, 810], "y": [880, 1920], "note": "measured at t=1/7/15.5/21 s: hair top 905-1030, chin 1600-1810, x 265-790 (+margin)"},
        "hud": {"y": [170, 640], "note": "relógio, seta de loop, checklist, medidor, hero words — parede lisa acima da cabeça"},
        "captions": {"y": [680, 850], "minPx": 72, "note": "acima da cabeça (a faixa padrão 1400-1550 cai na boca)"},
        "mascotCorners": {"left": {"x": [60, 262], "y": [1380, 1625]}, "right": {"x": [790, 960], "y": [1380, 1625]}},
    },
}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
for s in S:
    print(f"{s['id']} {s['from']:>5}–{s['to']:<5} {s['tag']:<15} {s['name']}  {s['keyBeats']}")
print("TOTAL", TOTAL)
print(" ".join(f"{w['w']}@{w['f']}" for w in words))
