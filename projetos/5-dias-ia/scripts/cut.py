"""Jump-cut the 7-minute raw take (public/eu_falando.mp4) down to the good takes of the script.

Speech regions come from silencedetect (-38 dB, >= 0.45 s, after an 80 Hz high-pass) and were each
transcribed on their own (scripts/data/region_text.txt); KEEP below lists the chosen take for every line
(cut "B": the script's lines only). Start overrides trim stumbles found inside a region (located on the
RMS envelope, 10-50 ms windows, and checked by transcribing the trimmed piece in isolation).
Everything else (stumbles, repeated takes, asides, silences) is dropped. Each kept region gets a little
padding so consonants are not clipped, and a 10 ms fade-out/fade-in at every join so it does not click
(fades, not crossfades: overlapping ~25 joins would slide the voice out of sync with the lips).
The cut audio is then cleaned (high-pass, gentle EQ, compressor) and loudness-normalised to -14 LUFS.

Writes public/eu_falando_cortado.mp4 and scripts/data/cutlist.json (source -> cut time map).
Usage: python3 scripts/cut.py [--dry]
"""
import json
import subprocess
import sys

SRC = "public/eu_falando.mp4"
OUT = "public/eu_falando_cortado.mp4"
REGIONS = json.load(open("scripts/data/speech_regions.json"))
PAD_IN, PAD_OUT = 0.08, 0.14

# (section, region index, optional [start, end] override in source seconds, note)
KEEP = [
    ("HOOK", 0, None, "Na segunda-feira, eu gastei 10 horas fazendo esse vídeo horrível aqui."),
    ("HOOK", 1, None, "Hoje, cinco dias depois, eu tô literalmente explodindo um planeta no meu fundo usando código e IA."),
    ("DICA1", 3, None, "O meu primeiro erro foi achar que volume ganha de técnica."),
    ("DICA1", 11, None, "No meu primeiro dia, eu escrevi um documento de 46 páginas de estratégia e automatizei 70 imagens de boneco palito de uma vez."),
    ("DICA1", 12, None, "O resultado?"),
    ("DICA1", 14, None, "Uma bomba sem intenção nenhuma."),
    ("DICA1", 15, None, "Lição 1:"),
    ("DICA1", 16, None, "inteligência artificial sem direção de arte só automatiza o que já é ruim."),
    ("DICA2", 22, None, "No dia 2, eu parei de tentar fazer tudo em um lugar só e comecei a empilhar ferramentas."),
    ("DICA2", 29, None, "Mas o jogo virou no dia 3,"),
    ("DICA2", 31, None, "quando eu parei de editar à mão"),
    ("DICA2", 32, None, "e usei minha base de programação"),
    ("DICA2", 33, None, "pra deixar um agente escrever"),
    ("DICA2", 35, None, "as animações direto em código."),
    # 303.33-303.68 is "pra isso" left over from the previous take, then a breath: speech starts at 304.10.
    ("DICA3", 40, [304.06, None], "E o segredo pra sair do zero a esse nível em uma semana não é criar promptzinho."),
    # 317.36-318.68 is the script being read under the breath (-50..-66 dB): full voice from 318.70.
    ("DICA3", 42, [318.68, None], "É criar um arquivo de regra visual"),
    ("DICA3", 43, None, "dentro do seu editor de código"),
    # "Eu deixei..." broken off at 384.41-385.0; the clean take starts at 385.42.
    ("CTA", 54, [385.38, None], "Eu deixei vazar na tela durante esse vídeo"),
    # "Todas as ferra..." at 390.80-391.45; the clean take starts at 391.90.
    ("CTA", 55, [391.84, None], "todas as ferramentas e estruturas de pastas que eu usei."),
    # A mumbled "comenta aqui" at 403.06-404.20; the clean take ("Comenta aqui qual delas...") starts at 404.33.
    ("CTA", 57, [404.27, None], "Comenta aqui qual delas você conseguiu identificar."),
    ("CTA", 58, None, "E se esse vídeo bater 500 comentários,"),
    ("CTA", 59, None, "eu abro a arquitetura desse agente do zero."),
]

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
    segs.append({"section": sec, "region": i, "src": [round(s, 3), round(e, 3)], "out": [round(t_out, 3), round(t_out + e - s, 3)], "text": note})
    t_out += e - s

drop = []
kept = {k[1] for k in KEEP}
for i, (a, b) in enumerate(REGIONS):
    if i not in kept:
        drop.append(i)

json.dump({"source": SRC, "output": OUT, "duration": round(t_out, 3), "segments": segs, "droppedRegions": drop}, open("scripts/data/cutlist.json", "w"), ensure_ascii=False, indent=1)
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
concat = "".join(f"[v{n}][a{n}]" for n in range(len(segs))) + f"concat=n={len(segs)}:v=1:a=1[v][a]"
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
