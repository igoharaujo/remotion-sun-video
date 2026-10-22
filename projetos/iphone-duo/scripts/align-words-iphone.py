"""Word-level cue frames for the iPhone Duo captions (audio-only voice track).

Same method as align-words.py: whisper word starts are snapped to the first 10 ms window
whose RMS is above the speech threshold. Writes scripts/data/iphone_words_aligned.json
(frames @ 60 fps).
Usage: python3 scripts/align-words-iphone.py
"""
import json
import re
import subprocess

FPS = 60
HOP = 0.01
THRESH_DB = -39.0
SRC = "public/audio/iphoneduo.mp3"

out = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", SRC, "-vn", "-ac", "1", "-ar", "16000",
     "-af", f"aresample=16000,asetnsamples=n={int(16000 * HOP)}:p=0,astats=metadata=1:reset=1,"
            "ametadata=print:key=lavfi.astats.Overall.RMS_level", "-f", "null", "-"],
    capture_output=True, text=True).stderr
rms = []
for line in out.splitlines():
    m = re.search(r"RMS_level=(-?[\d.]+|-inf)", line)
    if m:
        rms.append(-120.0 if m.group(1) == "-inf" else float(m.group(1)))

def voiced(t):
    i = int(t / HOP)
    return 0 <= i < len(rms) and rms[i] > THRESH_DB

words = json.load(open("scripts/data/iphone_whisper_words.json"))["transcription"]
cues = []
for w in words:
    text = w["text"].strip()
    if not text:
        continue
    a = w["offsets"]["from"] / 1000
    b = w["offsets"]["to"] / 1000
    t = a
    limit = a + 0.6 * (b - a)
    while t < limit and not voiced(t):
        t += HOP
    if t >= limit:
        t = a
    cues.append({"w": text, "f": round(t * FPS), "end": round(b * FPS)})

json.dump(cues, open("scripts/data/iphone_words_aligned.json", "w"), ensure_ascii=False, indent=1)
print(" ".join(f'{c["w"]}@{c["f"]}' for c in cues))
