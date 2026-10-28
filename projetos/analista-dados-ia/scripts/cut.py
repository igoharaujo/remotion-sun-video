"""Jump-cut the 6-minute raw take (public/eu_falando.mp4) down to the spoken script.

Speech regions come from silencedetect (-38 dB, >= 0.45 s, after an 80 Hz high-pass) and were each
transcribed on their own by scripts/regions.py (scripts/data/region_text.txt). This take was read once,
line by line, with long pauses between lines: every region is a script line, so KEEP is all of them in order
and what goes is the silence between them (plus r39, a handling noise after the last line). The gaps were
re-transcribed with dynaudnorm to make sure no quiet speech hides in them (none does).
Lean cut (approved): six non-essential lines are left out (r06-07, r10, r15-16, r21-22, r26, r34-35), and the
breaths/pauses inside the kept lines (silencedetect -36 dB, >= 0.18 s) are shortened to 2 x 0.07 s, and the whole
take is played 1.07x (setpts + atempo: pitch kept, lips stay in sync), so it runs ~87 s. Each kept region gets a little
padding so consonants are not clipped, and a 10 ms fade-out/fade-in at every join so it does not click
(fades, not crossfades: overlapping ~25 joins would slide the voice out of sync with the lips).
The cut audio is then cleaned (high-pass, gentle EQ, compressor) and loudness-normalised to -14 LUFS.

Writes public/eu_falando_cortado.mp4 and scripts/data/cutlist.json (source -> cut time map).
Usage: python3 scripts/cut.py [--dry]
"""
import json
import re
import subprocess
import sys

SRC = "public/eu_falando.mp4"
OUT = "public/eu_falando_cortado.mp4"
REGIONS = json.load(open("scripts/data/speech_regions.json"))
PAD_IN, PAD_OUT = 0.05, 0.09
BREATH_KEEP = 0.07  # air kept on each side of an inner pause
SPEED = 1.07  # whole-take tempo

# (section, region index, optional [start, end] override in source seconds, text as spoken)
KEEP = [
    ("HOOK", 0, None, "Se você é ou conhece alguém que é analista de dados, não pula esse vídeo."),
    ("HOOK", 1, None, "Eu cruzei as mensagens de um grupo fechado com especialistas da área com os dados do mercado americano agora de 2026."),
    ("HOOK", 2, None, "E talvez você não queira ouvir isso, mas a resposta curta"),
    ("HOOK", 3, None, "é que o analista de dados tradicional já morreu lá fora."),
    ("GRUPO", 4, None, "Em um dos grupos que eu mapeei, um DBA com mais de 25 anos de mercado lembrou que em 97 já diziam que a profissão dele ia acabar."),
    ("GRUPO", 5, None, "Só que tem um detalhe: a inteligência artificial hoje já engoliu o código repetitivo, a query básica e o dashboard."),
    ("DADOS", 8, None, "O Fórum Econômico Mundial projeta queda de mais de 50%"),
    ("DADOS", 9, None, "no trabalho operacional de dados."),
    ("DADOS", 11, None, "a Gartner mostrou que qualquer gestor hoje gera relatórios utilizando"),
    ("DADOS", 12, None, "inteligência artificial."),
    ("DADOS", 13, None, "Lá fora, o analista que sobreviveu, e que hoje ganha 59 mil dólares a mais por ano,"),
    ("DADOS", 14, None, "parou de fazer gráfico e virou um híbrido."),
    ("SOLUCAO", 17, None, "você precisa mudar hoje"),
    ("SOLUCAO", 18, None, "o que você estuda, em três pontos."),
    ("SOLUCAO", 19, None, "Primeiro: pare de focar em arrastar caixinha no Power BI"),
    ("SOLUCAO", 20, None, "e aprenda modelagem e governança."),
    ("SOLUCAO", 23, None, "Segundo:"),
    ("SOLUCAO", 24, None, "saia do SQL básico e domine Python"),
    ("SOLUCAO", 25, None, "e conexão de dados com LLMs."),
    ("SOLUCAO", 27, None, "Terceiro: entenda de regra de negócio."),
    ("SOLUCAO", 28, None, "A IA te dá a resposta em código,"),
    ("SOLUCAO", 29, None, "mas só o humano sabe qual pergunta dá lucro à empresa."),
    ("CTA", 30, None, "O analista de dados não vai acabar,"),
    ("CTA", 31, None, "ele só subiu de nível."),
    ("CTA", 32, None, "E se você quiser o mapa exato"),
    ("CTA", 33, None, "do que estudar pra fazer essa transição"),
    ("CTA", 36, None, "comenta DADOS aqui embaixo"),
    ("CTA", 37, None, "que eu trago no próximo vídeo."),
    ("CTA", 38, None, "E já segue pra não ficar pra trás."),
]

def inner_pauses(a, b):
    """Pauses (>= 0.18 s under -40 dB) strictly inside [a, b], in source seconds."""
    o = subprocess.run(["ffmpeg", "-hide_banner", "-ss", str(a), "-to", str(b), "-i", "out/bruto16k.wav", "-af",
                        "highpass=f=80,silencedetect=n=-36dB:d=0.18", "-f", "null", "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([-\d.]+)", o)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", o)]
    return [(a + x, a + y) for x, y in zip(st, en) if x > 0.1 and y < (b - a) - 0.1 and y - x > 2 * BREATH_KEEP + 0.04]


segs = []
t_out = 0.0
for sec, i, ov, note in KEEP:
    a, b = REGIONS[i]
    if ov and ov[0] is not None:
        a = ov[0]
    if ov and ov[1] is not None:
        b = ov[1]
    prev_end = REGIONS[i - 1][1] if i > 0 else 0
    next_start = REGIONS[i + 1][0] if i + 1 < len(REGIONS) else 1e9
    s = max(prev_end, a - PAD_IN) if not (ov and ov[0] is not None) else a
    e = min(next_start, b + PAD_OUT)
    pieces = [[s, e]]
    for x, y in inner_pauses(s, e):
        pieces[-1][1] = x + BREATH_KEEP
        pieces.append([y - BREATH_KEEP, e])
    for ps, pe in pieces:
        segs.append({"section": sec, "region": i, "src": [round(ps, 3), round(pe, 3)], "out": [round(t_out, 3), round(t_out + pe - ps, 3)], "text": note})
        t_out += pe - ps

drop = []
kept = {k[1] for k in KEEP}
for i, (a, b) in enumerate(REGIONS):
    if i not in kept:
        drop.append(i)

for sg in segs:  # output times after the tempo change
    sg["out"] = [round(sg["out"][0] / SPEED, 3), round(sg["out"][1] / SPEED, 3)]
t_out /= SPEED
json.dump({"source": SRC, "output": OUT, "speed": SPEED, "duration": round(t_out, 3), "segments": segs, "droppedRegions": drop}, open("scripts/data/cutlist.json", "w"), ensure_ascii=False, indent=1)
for s in segs:
    print(f"{s['section']:<6} manter {s['src'][0]:7.2f}-{s['src'][1]:7.2f}  ->  {s['out'][0]:6.2f}-{s['out'][1]:6.2f}  {s['text']}")
print(f"duração final: {t_out:.2f} s  ({len(segs)} trechos; descartadas as regiões {drop})")
if "--dry" in sys.argv:
    sys.exit(0)

# 1) cut video + raw audio (exact trims, 8 ms fades at each join)
parts = []
for n, s in enumerate(segs):
    a, b = s["src"]
    d = b - a
    parts.append(f"[0:v]trim=start={a}:end={b},setpts=PTS-STARTPTS[v{n}];"
                 f"[0:a]atrim=start={a}:end={b},asetpts=PTS-STARTPTS,afade=t=in:d=0.010,afade=t=out:st={d - 0.010:.3f}:d=0.010[a{n}];")
concat = "".join(f"[v{n}][a{n}]" for n in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[vc][ac];[vc]setpts=PTS/{SPEED},fps=60[v];[ac]atempo={SPEED}[a]"
subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", SRC, "-filter_complex", "".join(parts) + concat,
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", "60",
                "-c:a", "pcm_s16le", "-ar", "48000", "out/cut_raw.mov"], check=True)

# 2) voice cleanup: high-pass, tame low-mids, a little presence, gentle compression; then 2-pass loudnorm to -14 LUFS
CLEAN = ("highpass=f=80,equalizer=f=250:t=q:w=1.2:g=-2.5,equalizer=f=3500:t=q:w=1.0:g=2,"
         "acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2")
meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", "out/cut_raw.mov", "-vn", "-af", CLEAN + ",loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                      capture_output=True, text=True).stderr
m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
LN = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-i", "out/cut_raw.mov", "-c:v", "copy", "-af", CLEAN + "," + LN + ",aresample=48000",
                "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", OUT], check=True)
print(f"wrote {OUT}")
