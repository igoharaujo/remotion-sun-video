"""Build timeline.json for 47Abas from the aligned whisper cues.

Whisper spellings/punctuation are replaced by the script's display text ('está' → 'tá', quotes, ':' '?').
Usage: python3 scripts/build-timeline.py
"""
import json
import subprocess

FPS = 60
AUDIO = "public/audio/narracao.mp3"


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)


cues = json.load(open("scripts/data/abas_words_aligned.json"))

# (whisper word, occurrence) → display word; occurrence counts from 1
FIX = {("abertas,", 1): "abertas.", ("só,", 1): "só:", ("ontem,", 1): "ontem.", ('depois",', 1): 'depois".',
       ("aberto,", 1): "aberto.", ("fazer,", 1): "fazer.", ("está", 1): "tá", ("pior,", 1): "pior:",
       ("pode", 1): '"pode', ("precisar,", 1): 'precisar".', ("delas,", 1): "delas.", ("Windows,", 1): "Windows...",
       ("center,", 1): "center.", ("aí", 1): "aí:", ("está", 2): "tá", ("agora,", 1): "agora?"}
seen = {}
words = []
for c in cues:
    seen[c["w"]] = seen.get(c["w"], 0) + 1
    words.append({**c, "w": FIX.get((c["w"], seen[c["w"]]), c["w"])})
for prev, w in zip(words, words[1:]):  # sentence case after . ! ? (not after ... — 'enquanto' continues the sentence)
    if prev["w"][-1] in ".!?" and not prev["w"].endswith("...") and w["w"][0].islower():
        w["w"] = w["w"][0].upper() + w["w"][1:]


def at(word, after=0):
    """Frame of the first caption word starting with `word` at/after frame `after`."""
    for w in words:
        if w["f"] >= after and w["w"].lower().strip('.,!?":').startswith(word.lower()):
            return w["f"]
    raise KeyError(word)


dur = duration(AUDIO)
audio_frames = round(dur * FPS)
TOTAL = audio_frames + 150  # hold the CTA (blinking cursor + comment bubble) ~2.5 s, then fade

LINES = [  # (tag, first word, text)
    ("impactful", "Você", "Você não tem 47 abas abertas. Você tem um problema."),
    ("conversational", "Olha", "Olha só: uma de pesquisa que você ia ler ontem. Três de \"vou ver depois\". Duas do mesmo site porque você esqueceu que já tinha aberto."),
    ("conversational", "Uma", "Uma de receita que você nunca vai fazer. E aquela aba do Google Docs que tá aberta desde segunda-feira."),
    ("serious", "E", "E o pior: você não fecha porque \"pode precisar\"."),
    ("curious", "Mas", "Mas a verdade é que você já nem lembra o que tem em metade delas."),
    ("matter-of-fact", "E", "E toda vez que o PC fica lento, você culpa o Windows..."),
    ("impactful", "enquanto", "...enquanto mantém um zoológico de abas aberto."),
    ("conversational", "Manda", "Manda esse vídeo pro amigo que vive com o Chrome virando um shopping center."),
    ("curious", "E", "E comenta aí: quantas abas você tá com agora? Sem mentir."),
]
LINE_AFTER = [0, at("Olha"), at("receita") - 60, at("pior") - 10, at("Mas"), at("toda") - 10, at("enquanto"), at("Manda"), at("comenta") - 10]
starts = [at(first, after) for (_, first, _), after in zip(LINES, LINE_AFTER)]

K = {
    "voce": at("Você"), "n47": at("47"), "abas": at("abas"), "abertas": at("abertas"), "problema": at("problema"),
    "olha": at("Olha"), "pesquisa": at("pesquisa"), "ontem": at("ontem"), "tres": at("Três"), "depois": at("vou") ,
    "duas": at("Duas"), "mesmo": at("mesmo"), "site": at("site"), "esqueceu": at("esqueceu"), "aberto1": at("aberto"),
    "receita": at("receita"), "nunca": at("nunca"), "aquela": at("aquela"), "google": at("Google"), "docs": at("Docs"),
    "segunda": at("segunda-feira"),
    "pior": at("pior"), "fecha": at("fecha"), "pode": at("pode"), "precisar": at("precisar"),
    "verdade": at("verdade"), "lembra": at("lembra"), "metade": at("metade"), "delas": at("delas"),
    "toda": at("toda"), "pc": at("PC"), "lento": at("lento"), "culpa": at("culpa"), "windows": at("Windows"),
    "enquanto": at("enquanto"), "zoologico": at("zoológico"), "abas2": at("abas", at("zoológico")), "aberto2": at("aberto", at("zoológico")),
    "manda": at("Manda"), "amigo": at("amigo"), "chrome": at("Chrome"), "shopping": at("shopping"), "center": at("center"),
    "comenta": at("comenta"), "quantas": at("quantas"), "agora": at("agora"), "sem": at("Sem"), "mentir": at("mentir"),
}


def silences():
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", AUDIO, "-af", "silencedetect=n=-40dB:d=0.25", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    vals = [float(l.split(": ")[1].split()[0]) for l in err.splitlines() if "silence_start" in l or "silence_end" in l]
    return [(round(a * FPS), round(b * FPS)) for a, b in zip(vals[::2], vals[1::2])]


SIL = silences()
# whisper word 'end' runs over the following silence, so a word really ends where the next silence starts
end_of_word = lambda key: next(a for a, b in SIL if a > K[key])

end_of = lambda n: starts[n + 1] - 4 if n + 1 < len(starts) else TOTAL
close_tab = end_of_word("segunda") + 4  # the [short pause] after 'segunda-feira'
S = [
    {"id": "S01", "line": 0, "from": 0, "to": end_of(0), "name": "Hook — 47 ABAS ABERTAS",
     "keyBeats": {k: K[k] for k in ("voce", "n47", "abas", "abertas", "problema")}, "pause": [end_of_word("problema") + 6, end_of(0)],
     "visual": "Abre em preto total, um único spot frio acende. Em '47' hard cut + flash: '47' gigante (360px, branco) bate no centro com screen shake; 'ABAS ABERTAS' (Azul Chrome #4285F4, 96px, tracking largo) entra em 'abas'. Ao mesmo tempo ~47 janelas de navegador 3D (vidro fosco, cantos arredondados, barra de abas + URL) voam do fundo em direção à câmera e se acumulam num enxame em camadas. Em 'problema': zoom punch, '47' sai e 'UM PROBLEMA.' bate (branco puro, 150px). Pausa: só as janelas derivando no escuro, respiro.",
     "sfx": [f"whoosh rápido @{K['n47'] - 10}", f"impacto grave @{K['n47']}", f"clicks rápidos (janelas chegando) {K['n47']}→{K['abertas'] + 30}", f"impacto grave @{K['problema']}"]},
    {"id": "S02", "line": 1, "from": end_of(0), "to": end_of(1), "name": "O mural de janelas — pesquisa / ver depois / duplicadas",
     "keyBeats": {k: K[k] for k in ("olha", "pesquisa", "ontem", "tres", "depois", "duas", "site", "esqueceu")},
     "visual": "Câmera passeia (dolly lateral fluido) por um MURAL 3D de janelas flutuantes em grade irregular. Em 'pesquisa' uma janela se destaca (sai do mural, borda acende em azul, glow): artigo com barra de busca + chip 'LER ONTEM' com ícone de relógio. Em 'Três' 3 janelas se empilham em leque com selo '×3 · VER DEPOIS'. Em 'Duas' duas janelas idênticas deslizam e se sobrepõem com ghosting + chip 'DUPLICADA'. Em 'esqueceu' toast minimalista: 'Você já abriu esta página'.",
     "sfx": [f"click @{K['pesquisa']}", f"click ×3 @{K['tres']}", f"click ×2 @{K['duas']}", f"pop suave @{K['esqueceu']}"]},
    {"id": "S03", "line": 2, "from": end_of(1), "to": end_of(2), "name": "Receita + Docs desde segunda → fecha 1, abrem 3",
     "keyBeats": {**{k: K[k] for k in ("receita", "nunca", "google", "docs", "segunda")}, "closeTab": close_tab, "multiply": close_tab + 22},
     "pause": [close_tab, end_of(2)],
     "visual": "Drift contínuo pelo mural. Em 'receita' janela com ícone de receita (panela em linha fina) acende em azul; em 'nunca' ela esfria para cinza com chip 'NUNCA FEITA'. Em 'Google Docs' janela de documento (ícone genérico de doc azul com linhas, sem logo oficial, título 'Documento sem título') se destaca; em 'segunda-feira' chip de calendário 'ABERTA DESDE SEG.' e contador de tempo rodando. Pausa (respiro sem texto novo): cursor 3D desliza até o X de uma aba, clica — a aba fecha — e no mesmo instante 3 abas novas brotam ao lado (pop em sequência).",
     "sfx": [f"click @{K['receita']}", f"click @{K['docs']}", f"click (fechar) @{close_tab}", f"pop ×3 acelerado @{close_tab + 22}"]},
    {"id": "S04", "line": 3, "from": end_of(2), "to": end_of(3), "name": "\"PODE PRECISAR\" — o cursor hesita",
     "keyBeats": {k: K[k] for k in ("pior", "fecha", "pode", "precisar")},
     "visual": "Iluminação cai (serious), enquadramento fechado na barra de abas, câmera lenta e pesada. Em 'fecha' o cursor paira sobre o X, o X acende… e o cursor recua devagar. Em 'pode precisar' texto '\"PODE PRECISAR\"' entre aspas, cinza claro, 120px, sobe e fica.",
     "sfx": [f"click abafado/hover @{K['fecha']}"]},
    {"id": "S05", "line": 4, "from": end_of(3), "to": end_of(4), "name": "Metade delas — títulos se apagam",
     "keyBeats": {k: K[k] for k in ("verdade", "lembra", "metade", "delas")},
     "visual": "Slow zoom out gradual (curious), luz suave volta. A barra de abas mostra ~24 abas com favicon + título. Em 'lembra' os títulos começam a desfocar; em 'metade' exatamente metade das abas perde título e favicon (vira '?'), divisória em azul marcando 50%. Texto 'METADE' com '50%' em contador.",
     "sfx": [f"glitch suave @{K['metade']}"]},
    {"id": "S06", "line": 5, "from": end_of(4), "to": end_of(5), "name": "Clímax 1 — PC lento, culpa no Windows",
     "keyBeats": {k: K[k] for k in ("toda", "pc", "lento", "culpa", "windows")},
     "visual": "Cortes limpos (matter-of-fact). Zoom dramático num ícone de usuário estressado (busto em linha fina, mão na testa, minimalista, nada infantil) diante de um monitor 3D. Em 'lento' a tela começa a ENGASGAR: frame holds, stutter, cursor de carregamento girando, HUD técnico 'CPU 98% · RAM 15,7/16 GB' subindo. Em 'Windows' um símbolo de 4 janelas estilizado (desenhado em código, inspirado no logo, branco) aparece no monitor com seta acusatória.",
     "sfx": [f"PC fan subindo (contínuo) {K['pc']}→{end_of(6)}", f"glitch/stutter @{K['lento']}", f"impacto leve @{K['windows']}"]},
    {"id": "S07", "line": 6, "from": end_of(5), "to": end_of(6), "name": "Clímax 2 — ZOOLÓGICO DE ABAS",
     "keyBeats": {k: K[k] for k in ("enquanto", "zoologico", "abas2", "aberto2")}, "pause": [end_of_word("aberto2") + 6, end_of(6)],
     "visual": "Impactful: em 'enquanto' a câmera puxa pra trás num movimento seco — o símbolo do Windows fica minúsculo diante de um paredão de janelas. Em 'zoológico' as abas se multiplicam em ritmo acelerado (exponencial), contador '47 → 128 → 512 → 999+' em azul, screen shake, flash branco. 'ZOOLÓGICO' (branco, 140px) bate. Pausa: o enxame congela num último engasgo e a tela apaga.",
     "sfx": [f"pops/glitch acelerando {K['zoologico']}→{K['aberto2'] + 20}", f"impacto grave @{K['zoologico']}", "fan corta seco no fim da pausa"]},
    {"id": "S08", "line": 7, "from": end_of(6), "to": end_of(7), "name": "Manda pro amigo — Chrome shopping center",
     "keyBeats": {k: K[k] for k in ("manda", "amigo", "chrome", "shopping", "center")},
     "visual": "Drift relaxado (conversational), palco limpo e claro de novo. Em 'Manda' ícone de compartilhar (avião de papel em linha fina) cruza a tela com rastro azul. Em 'Chrome' uma única janela de navegador genérico (sem logo) entra; em 'shopping center' a barra de abas se espreme até as abas virarem fatias finíssimas (centenas) e a janela estica pros lados como uma galeria. Texto 'SHOPPING CENTER' discreto.",
     "sfx": [f"whoosh @{K['manda']}", f"clicks rápidos (abas espremendo) {K['shopping']}→{K['center'] + 30}"]},
    {"id": "S09", "line": 8, "from": end_of(7), "to": TOTAL, "name": "CTA — Quantas abas você tem abertas agora?",
     "keyBeats": {k: K[k] for k in ("comenta", "quantas", "agora", "sem", "mentir")}, "fadeOut": [TOTAL - 50, TOTAL],
     "visual": "Tela limpa, um spot suave (curious). Ícone de balão de comentário (linha fina, azul) entra em 'comenta'. Em 'quantas' o texto central gigante 'Quantas abas você tem abertas agora?' (branco, 110px, 3 linhas) é digitado com cursor piscando (Azul Chrome). Em 'Sem mentir' subtítulo pequeno 'Sem mentir.' em cinza. Cursor continua piscando no hold até o fade.",
     "sfx": [f"ding suave @{K['comenta']}", f"teclado suave {K['quantas']}→{K['agora'] + 30}", f"ding suave @{K['mentir'] + 20}"]},
]
for s in S:
    s["tag"] = LINES[s["line"]][0]
    s["text"] = LINES[s["line"]][2]

tl = {
    "$comment": "Beat sheet for 47Abas. Frames @ 60 fps. Words: whisper-small (pt) on public/audio/narracao.mp3 (ElevenLabs Kaique, seed 47, speed 1.05, stability 0.5; take 2 — take 1 had a TTS ad-lib 'Ah, isso eu espero' after 'Windows...', fixed by merging the two lines), onsets snapped to first voiced 10 ms window, then mapped to the script's spelling (scripts/build-timeline.py). STATUS: approved 2026-10-24.",
    "status": "approved-2026-10-24",
    "composition": {"id": "Abas47", "width": 1080, "height": 1920, "fps": FPS, "durationInFrames": TOTAL,
                    "durationSec": round(TOTAL / FPS, 3),
                    "durationNote": f"Audio {dur:.3f} s ({audio_frames} frames); last word 'mentir.' ends ~{words[-1]['end']}. Holds ~2.5 s on the CTA (blinking cursor) + fade."},
    "palette": {"stage": "#0A0A0C", "stageHi": "#1C1C1F", "chrome": "#4285F4", "chromeGlow": "#8AB4F8", "ink": "#FFFFFF",
                "muted": "#9AA0A6", "glass": "rgba(255,255,255,0.06)", "glassEdge": "rgba(255,255,255,0.14)", "alert": "#FF453A", "spot": "#EAF2FF"},
    "background3D": "Apple Keynote studio escuro: ciclorama infinito cinza-chumbo #0A0A0C→#1C1C1F, 2–3 spotlights suaves (frio), piso preto levemente reflexivo, fog de profundidade. Parallax em 3 camadas de janelas de navegador (vidro fosco, barra de abas, URL, conteúdo em skeleton) — perto/meio/fundo, derivando em velocidades diferentes. Câmera sempre em movimento (drift/dolly). Bloom leve nas bordas azuis + vinheta. Sem bolhas, partículas fofas ou elementos infantis.",
    "audioOnly": True,
    "pipReplacement": "Audio Visualizer HUD (barras Azul Chrome) bottom-left, x 60–260, y 1590–1660",
    "voice": {"source": AUDIO, "durationSec": round(dur, 3),
              "tts": {"provider": "ElevenLabs", "voiceId": "Hmn4B9B77pf6ttydteJ8", "model": "eleven_multilingual_v2", "speed": 1.05, "stability": 0.5, "seed": 47},
              "script": "scripts/data/voice_script.txt",
              "words": words},
    "lineStarts": dict(zip([f"L{n + 1}" for n in range(len(starts))], starts)),
    "scenes": S,
    "audio": {"bgm": None, "bgmNote": "Sem música por pedido do usuário: só voz + SFX.",
              "sfxPlan": {"whoosh": "fast whoosh", "impact": "deep cinematic impact", "click": "digital click / ui click",
                          "pop": "ui pop / glitch pop", "glitch": "digital glitch stutter", "fan": "computer fan loud / pc fan noise",
                          "ding": "soft notification ding", "keys": "soft keyboard typing"},
              "duck": {"whoosh": -3, "boom": -8, "fan": -18}, "target": {"lufs": -14, "dbtp": -1}},
    "layout": {"safeZone": {"x": [60, 1020], "y": [120, 1670]}, "captions": {"y": [1400, 1550], "minPx": 72},
               "visualizer": {"x": 60, "y": 1590, "w": 200, "h": 70},
               "heroText": {"y": [520, 1100], "note": "47 / UM PROBLEMA / ZOOLÓGICO / CTA ficam acima das legendas"}},
}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
for s in S:
    print(f"{s['id']} {s['from']:>5}–{s['to']:<5} {s['tag']:<15} {s['name']}  {s['keyBeats']}")
print("TOTAL", TOTAL, "audio", audio_frames, "last word end", words[-1]["end"])
print(" ".join(w["w"] for w in words))
