"""Build timeline.json for AnalistaDadosIA from the aligned whisper cues of the jump-cut take
(public/eu_falando_cortado.mp4, made by scripts/cut.py; lean cut, cues carried over by scripts/remap-words.py).

Whisper spellings are mapped to what was said ('mapei' -> 'mapeei', 'dizinho' -> 'diziam', 'garra demonstrou' ->
'Gartner mostrou', 'Aí há de dar' -> 'A IA te dá a'). The CTA line stays as heard: 'o mapa é exato do que isso dá pra fazer'. Frames @ 60 fps.
Usage: python3 scripts/build-timeline.py
"""
import json
import subprocess

FPS = 60
VIDEO = "public/eu_falando_cortado.mp4"


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                                capture_output=True, text=True).stdout)


cues = json.load(open("scripts/data/cut_words_aligned.json"))
cut = json.load(open("scripts/data/cutlist.json"))

FIX = {"mapei,": "mapeei,", "dizinho": "diziam", "mercado,": "mercado", "Python.": "Python", "mapa,": "mapa", "para": "pra", "transição": "transição,"}
# multi-word whisper errors: (whisper tokens) -> replacement tokens, timed on the original onsets
SEQ = [
    (["garra", "demonstrou"], ["Gartner", "mostrou"]),
    (["Aí", "há", "de", "dar"], ["A", "IA", "te", "dá", "a"]),
]
CTA_FROM = round(next(s["out"][0] for s in cut["segments"] if s["section"] == "CTA") * FPS)
words = []
i = 0
while i < len(cues):
    for src, dst in SEQ:
        if [c["w"] for c in cues[i:i + len(src)]] == src:
            span = cues[i:i + len(src)]
            for k, w in enumerate(dst):
                c = span[min(k, len(span) - 1)]
                words.append({"w": w, "f": c["f"] if k < len(span) else span[-1]["end"] - 6, "end": c["end"]})
            i += len(src)
            break
    else:
        c = dict(cues[i])
        c["w"] = FIX.get(c["w"], c["w"])
        words.append(c)
        i += 1
for prev, w in zip(words, words[1:]):  # the CTA keyword is shouted in caps on screen
    if prev["w"].lower() == "comenta" and w["w"].lower().strip(",") == "dados":
        w["w"] = "DADOS"
for prev, w in zip(words, words[1:]):
    if prev["w"] == "Python" and w["w"] == "E":  # whisper split the line here; it is "Python e conexão"
        w["w"] = "e"
    if prev["w"][-1] in ".!?" and w["w"][0].islower():
        w["w"] = w["w"][0].upper() + w["w"][1:]


def at(word, after=0):
    """Frame of the first word equal to `word` (punctuation/case ignored) at/after frame `after`."""
    for w in words:
        if w["f"] >= after and w["w"].lower().strip(".,!?:%") == word.lower():
            return w["f"]
    raise KeyError(word)


SPEECH_END = round(cut["duration"] * FPS)
HOLD = 84  # 1.4 s freeze on the last frame for the CTA sign
TOTAL = SPEECH_END + HOLD

sec_start = {}
for s in cut["segments"]:
    sec_start.setdefault(s["section"], round(s["out"][0] * FPS))
B = [sec_start[k] for k in ("HOOK", "GRUPO", "DADOS", "SOLUCAO", "CTA")] + [TOTAL]

K = {
    # hook
    "se": words[0]["f"], "analista1": at("analista"), "pula": at("pula"), "cruzei": at("cruzei"), "mensagens": at("mensagens"),
    "grupo1": at("grupo"), "especialistas": at("especialistas"), "americano": at("americano"), "n2026": at("2026"),
    "talvez": at("talvez"), "resposta": at("resposta"), "tradicional": at("tradicional"), "morreu": at("morreu"), "fora1": at("fora"),
    # grupo
    "mapeei": at("mapeei"), "dba": at("DBA"), "n25": at("25"), "n97": at("97"), "acabar1": at("acabar"), "detalhe": at("detalhe"),
    "engoliu": at("engoliu"), "codigo1": at("código"), "query": at("query"), "dashboard": at("dashboard"),
    # dados
    "forum": at("Fórum"), "queda": at("queda"), "n50": at("50"), "operacional": at("operacional"), "gartner": at("Gartner"),
    "gestor": at("gestor"), "relatorios": at("relatórios"), "fora2": at("fora", at("relatórios")), "sobreviveu": at("sobreviveu"),
    "n59": at("59"), "dolares": at("dólares"), "parou": at("parou"), "grafico": at("gráfico"), "hibrido1": at("híbrido"),
    # solução
    "mudar": at("mudar"), "tres": at("três"),
    "primeiro": at("Primeiro"), "arrastar": at("arrastar"), "powerbi": at("Power"), "modelagem": at("modelagem"), "governanca": at("governança"),
    "segundo": at("Segundo"), "sql": at("SQL"), "python": at("Python"), "llms": at("LLMs"),
    "terceiro": at("Terceiro"), "regra": at("regra"), "negocio": at("negócio"),
    "resposta2": at("resposta", at("negócio")), "codigo2": at("código", at("negócio")), "humano": at("humano"), "pergunta": at("pergunta"),
    "lucro": at("lucro"),
    # cta
    "analista3": at("analista", CTA_FROM), "acabar2": at("acabar", CTA_FROM), "subiu": at("subiu"), "nivel": at("nível"), "mapa": at("mapa"),
    "transicao": at("transição"), "comenta": at("comenta"),
    "dados_cta": at("DADOS", at("comenta")), "embaixo": at("embaixo"), "proximo": at("próximo"), "segue": at("segue"), "tras": at("trás"),
}

IMG = "images/fontes/"
S = [
    {"id": "S01", "section": "HOOK", "tag": "impactful", "from": B[0], "to": B[1], "name": "Gancho — extinto ou seguro?",
     "keyBeats": {k: K[k] for k in ("se", "analista1", "pula", "cruzei", "mensagens", "grupo1", "especialistas", "americano", "n2026", "talvez", "resposta", "tradicional", "morreu", "fora1")},
     "visual": "Frame 0: eu em tela cheia (grade escura + vinheta) e 'EXTINTO OU SEGURO?' BATE na tela (escala 2.2→1 com shake + flash), 'EXTINTO' em vermelho e 'SEGURO' em verde, fica até 'pula'. "
               "Em 'analista de dados' surge um crachá de vidro 3D 'ANALISTA DE DADOS' girando no topo. "
               "Em 'cruzei' o PiP encolhe (estado 'hook'), o fundo vira o Dark Tech 3D, e balões de chat anônimos (bolhas cinza, texto borrado) entram pela esquerda e cruzam com linhas de dados/gráficos entrando pela direita — no cruzamento, faíscas. "
               "'mercado americano agora de 2026': mapa dos EUA em matriz de pontos 3D acende + selo '2026'. "
               "'talvez você não queira ouvir isso': o fundo escurece (luz cai). 'tradicional já morreu': o crachá ganha linha de ECG que fica PLANA em 'morreu' + carimbo vermelho 'TRADICIONAL ✕'.",
     "sfx": [f"IMPACTO + sub-drop @{K['se']}", f"whoosh crachá @{K['analista1']}", f"pops de chat @{K['mensagens']}", f"blip mapa @{K['americano']}", f"beep ECG → flatline @{K['morreu']}"]},
    {"id": "S02", "section": "GRUPO", "tag": "conversational", "from": B[1], "to": B[2], "name": "O grupo — o DBA de 25 anos",
     "keyBeats": {k: K[k] for k in ("mapeei", "dba", "n25", "n97", "acabar1", "detalhe", "engoliu", "codigo1", "query", "dashboard")},
     "visual": "PiP no canto superior direito ('corner'). 'DBA com mais de 25 anos': card de perfil anônimo (silhueta) 'DBA · 25+ ANOS' com contador 0→25. "
               "'em 97': contador de ano 1997 num CRT verde com manchete 'A PROFISSÃO VAI ACABAR' (fonte de jornal) que rola até 2026 em 'acabar'. "
               "'a IA hoje já engoliu': um núcleo de IA 3D (esfera de partículas, buraco negro) abre no centro; 'código repetitivo', 'query básica', 'dashboard' aparecem como 3 cards e são sugados um a um, cada um na sua palavra. "
               f"No 'dashboard' a prova: janela de vidro 3D com o print real do Copilot do Power BI ({IMG}03a_powerbi_copilot_painel.png) + selo 'FONTE: MICROSOFT LEARN'.",
     "sfx": [f"tick contador @{K['n25']}", f"CRT hum @{K['n97']}", f"sucção ×3 @{K['codigo1']}/{K['query']}/{K['dashboard']}", f"whoosh janela @{K['dashboard']}"]},
    {"id": "S03", "section": "DADOS", "tag": "serious", "from": B[2], "to": B[3], "name": "Os dados — WEF, Gartner, PwC",
     "keyBeats": {k: K[k] for k in ("forum", "queda", "n50", "operacional", "gartner", "gestor", "relatorios", "sobreviveu", "n59", "dolares", "parou", "grafico", "hibrido1")},
     "visual": "PiP 'corner', luz baixa. "
               f"'Fórum Econômico Mundial': JANELA DE VIDRO 3D com a capa real ({IMG}01a_wef_future_of_jobs_2025_capa.png) entra girando (rotateY 35°→8°) + selo 'FONTE: WEF · Future of Jobs 2025'. "
               "'queda de mais de 50% no trabalho operacional': a janela vira e mostra o card de dados reais do relatório (tabela de perfis, p.112): "
               "'ENTRADA MANUAL DE DADOS −26%' (barra vermelha descendo) e 'ANALISTAS E CIENTISTAS DE DADOS +41%' (barra verde subindo), até 2030. O áudio diz 50%; a tela mostra o número real. "
               f"'Gartner': segunda janela de vidro (logo {IMG}02_gartner_logo.svg) com 'ATÉ 2028: 60% DO SELF-SERVICE USARÁ LLMs' + selo 'FONTE: GARTNER · Predicts 2026'; em 'relatórios' o print do Copilot criando relatório ({IMG}03b_powerbi_copilot_criar_relatorio.png) desliza atrás. "
               "'59 mil dólares a mais': card PwC — 'PRÊMIO SALARIAL DE IA' com contador +0% → +56% e depois → 62% (2025 → 2026), barra verde sobe + selo 'FONTE: PwC · AI Jobs Barometer'. "
               "'parou de fazer gráfico e virou um híbrido': ícone de gráfico de barras se desfaz em partículas que se reorganizam num selo 'HÍBRIDO = DADOS + IA + NEGÓCIO'.",
     "sfx": [f"whoosh vidro @{K['forum']}", f"ding selo @{K['forum'] + 30}", f"down-sweep @{K['n50']}", f"whoosh vidro @{K['gartner']}", f"ticks contador @{K['n59']}", f"glitch → pop @{K['grafico']}"]},
    {"id": "S04", "section": "SOLUCAO", "tag": "impactful", "from": B[3], "to": B[4], "name": "A solução — checklist 3D em 3 pontos",
     "keyBeats": {k: K[k] for k in ("mudar", "tres", "primeiro", "arrastar", "powerbi", "modelagem", "governanca", "segundo", "sql", "python", "llms", "terceiro", "regra", "negocio", "resposta2", "codigo2", "humano", "pergunta", "lucro")},
     "visual": "PiP 'corner', a luz volta. 'você precisa mudar hoje o que você estuda': título 'MUDE O QUE VOCÊ ESTUDA' bate na tela. "
               "'em três pontos': CHECKLIST 3D de vidro com 3 linhas (01/02/03) desce do topo, em leve perspectiva. "
               "Linha 01 em 'arrastar caixinha no Power BI': ❌ vermelho 'DASHBOARD ARRASTA-E-SOLTA' (riscado); em 'modelagem e governança' a linha vira ✅ verde 'MODELAGEM + GOVERNANÇA' com mini diagrama estrela (star schema). "
               f"Linha 02 em 'SQL básico': ❌ 'SQL BÁSICO'; em 'Python e conexão com LLMs': ✅ 'PYTHON + LLMs', com a tela de código ({IMG}05_codigo_tela.jpg) desfocada atrás. "
               "Linha 03 em 'regra de negócio': ✅ 'REGRA DE NEGÓCIO'. 'A IA te dá a resposta em código, mas só o humano sabe qual pergunta dá lucro': a checklist sai; split — à esquerda bloco de código (IA), à direita '?' que vira '$ LUCRO' em 'lucro'.",
     "sfx": [f"whoosh checklist @{K['tres']}", f"ERRO @{K['arrastar']}", f"CHECK @{K['modelagem']}", f"ERRO @{K['sql']}", f"CHECK @{K['python']}", f"CHECK @{K['regra']}", f"cha-ching @{K['lucro']}"]},
    {"id": "S05", "section": "CTA", "tag": "conversational", "from": B[4], "to": B[5], "name": "CTA — comente DADOS",
     "keyBeats": {k: K[k] for k in ("analista3", "acabar2", "subiu", "nivel", "mapa", "transicao", "comenta", "dados_cta", "embaixo", "proximo", "segue", "tras")},
     "visual": "'não vai acabar, ele só subiu de nível': o crachá do gancho volta, carimbo 'TRADICIONAL ✕' cai e barra de XP enche → 'LEVEL UP: ANALISTA HÍBRIDO' (dourado). "
               "'o mapa exato… transição': roadmap (trilha de pontos acendendo) com 3 marcos. "
               "'comenta DADOS aqui embaixo': corte seco para mim em TELA CHEIA + flash; letreiro gigante 'COMENTE: DADOS' no topo (y 220–520), 'DADOS' com glow verde. "
               "O camaleão entra no canto inferior direito em 'comenta' na pose pointing (apontando pro letreiro) e troca pra HYPED em 'segue'. Hold de 1,4 s no último frame.",
     "sfx": [f"level-up @{K['subiu']}", f"blips roadmap @{K['mapa']}", f"whoosh corte @{K['comenta']}", f"DING @{K['dados_cta']}", f"pop mascote @{K['comenta']}", f"chime final @{K['segue']}"]},
]

tl = {
    "$comment": "Beat sheet for AnalistaDadosIA. Frames @ 60 fps. Words: whisper-small (pt) on the jump-cut take, onsets snapped to the first voiced 10 ms window, carried over to the lean cut (scripts/remap-words.py) and mapped to what was said (scripts/build-timeline.py).",
    "status": "approved",
    "composition": {"id": "AnalistaDadosIA", "width": 1080, "height": 1920, "fps": FPS, "durationInFrames": TOTAL, "durationSec": round(TOTAL / FPS, 3),
                    "durationNote": f"Lean cut {cut['duration']:.2f} s ({len(cut['segments'])} segments of the 5:58 raw, played {cut['speed']}x). Holds {HOLD / FPS:.1f} s on the last frame for the CTA sign."},
    "palette": {"bg": "#07080C", "ink": "#F2F4F7", "muted": "#9AA3B2", "cyan": "#3DD9FF", "blue": "#2F7BFF", "good": "#33D1A0",
                "alert": "#FF453A", "gold": "#F5C451"},
    "typography": {"display": "Inter Tight 800 (Keynote)", "body": "Inter 600", "mono": "JetBrains Mono"},
    "background3D": "Dark Tech (Three.js): piso de grade infinita em perspectiva com linhas cyan finas, 3 camadas de partículas de 'bits' (0/1 e pontos) com parallax, colunas de dados (barras 3D translúcidas) ao longe subindo/descendo devagar, drift contínuo de câmera, glow sprites no lugar de bloom (EffectComposer renderiza preto no Remotion). Luz cai no 'talvez você não queira ouvir' e em S03 (serious); acende em S04. Some no CTA (tela cheia).",
    "speaker": {"source": VIDEO, "face": {"x": [320, 770], "y": [620, 1340]},
                "pip": {"crop": {"x": 145, "y": 380, "w": 800, "h": 1422}, "radius": 44,
                        "states": {"full": {"note": "tela cheia, 0 → cruzei e no CTA a partir de 'comenta'"},
                                   "hook": {"x": 540, "y": 640, "w": 400}, "corner": {"x": 700, "y": 150, "w": 240},
                                   "mid": {"x": 700, "y": 150, "w": 240, "note": "S04: mesmo canto, a checklist ocupa o centro"}},
                        "keys": [{"f": K["cruzei"] - 6, "state": "hook"}, {"f": B[1], "state": "corner"}, {"f": K["comenta"] - 4, "state": "full"}]}},
    "sources": {
        "wefCover": {"src": IMG + "01a_wef_future_of_jobs_2025_capa.png", "in": K["forum"], "out": K["gartner"], "seal": "FONTE: WEF · Future of Jobs 2025", "pos": {"x": 90, "y": 330, "w": 560}},
        "wefData": {"in": K["queda"], "out": K["gartner"], "seal": "FONTE: WEF · Future of Jobs 2025, p.112", "rows": [
            {"label": "ENTRADA MANUAL DE DADOS", "value": -26, "color": "alert"},
            {"label": "ANALISTAS E CIENTISTAS DE DADOS", "value": 41, "color": "good"}], "note": "crescimento líquido global até 2030 (o áudio diz 'mais de 50%')"},
        "gartner": {"src": IMG + "02_gartner_logo.svg", "in": K["gartner"], "out": K["sobreviveu"], "seal": "FONTE: GARTNER · Predicts 2026", "text": ["ATÉ 2028:", "60% DO SELF-SERVICE", "USARÁ LLMs"]},
        "copilotPanel": {"src": IMG + "03a_powerbi_copilot_painel.png", "in": K["dashboard"], "out": B[2], "seal": "FONTE: MICROSOFT LEARN"},
        "copilotReport": {"src": IMG + "03b_powerbi_copilot_criar_relatorio.png", "in": K["relatorios"], "out": K["sobreviveu"], "seal": "FONTE: MICROSOFT LEARN"},
        "pwc": {"in": K["sobreviveu"], "out": K["parou"], "seal": "FONTE: PwC · AI Jobs Barometer 2025/2026", "label": "PRÊMIO SALARIAL DE IA", "values": [56, 62], "note": "o áudio diz 'US$ 59 mil'; a tela mostra o dado da PwC"},
        "codeScreen": {"src": IMG + "05_codigo_tela.jpg", "in": K["sql"], "out": K["terceiro"], "seal": None},
    },
    "checklist": {"pos": {"x": 90, "y": 420, "w": 900}, "rows": [
        {"n": "01", "x": {"label": "DASHBOARD ARRASTA-E-SOLTA", "f": K["arrastar"]}, "check": {"label": "MODELAGEM + GOVERNANÇA", "f": K["modelagem"]}},
        {"n": "02", "x": {"label": "SQL BÁSICO", "f": K["sql"]}, "check": {"label": "PYTHON + LLMs", "f": K["python"]}},
        {"n": "03", "x": {"label": "SÓ CÓDIGO", "f": K["terceiro"]}, "check": {"label": "REGRA DE NEGÓCIO", "f": K["regra"]}},
    ], "in": K["tres"], "out": B[4]},
    "hookTitle": {"text": ["EXTINTO", "OU SEGURO?"], "in": K["se"], "out": K["pula"] + 30, "pos": {"y": [300, 640]}},
    "ctaSign": {"text": ["COMENTE:", "DADOS"], "in": K["comenta"], "pos": {"y": [220, 520]}},
    "mascot": {"poses": "pointing → hyped", "keys": [{"f": K["comenta"], "pose": "pointing", "x": 860, "y": 1470}, {"f": K["segue"], "pose": "hyped", "x": 860, "y": 1480}], "heightPx": 300},
    "voice": {"source": VIDEO, "processing": "high-pass 80 Hz, EQ (-2.5 dB @250 Hz, +2 dB @3.5 kHz), compressor 3:1, loudnorm -14 LUFS (scripts/cut.py)", "words": words},
    "scenes": S,
    "audio": {"bgm": None, "duck": {"whoosh": -3, "boom": -8}, "target": {"lufs": -14, "dbtp": -1}},
    "layout": {"safeZone": {"x": [60, 1020], "y": [120, 1670]}, "actionBar": "x > 960 livre",
               "captions": {"y": [1400, 1550], "minPx": 72, "note": "sem caixa, só text-shadow; em tela cheia ficam abaixo do queixo (rosto termina em y≈1340)"},
               "hud": {"y": [150, 1300]}},
}
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=1)
for s in S:
    print(f"{s['id']} {s['from']:>5}–{s['to']:<5} {s['from'] / FPS:5.1f}–{s['to'] / FPS:5.1f}s {s['tag']:<14} {s['name']}")
print("TOTAL", TOTAL, f"({TOTAL / FPS:.2f} s)")
print(" ".join(f"{w['w']}@{w['f']}" for w in words))
