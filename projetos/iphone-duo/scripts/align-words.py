"""Word-level cue frames for the kinetic captions.

Whisper's word starts often sit at the beginning of the silence before a word, so each
start is moved to the first frame where the voice's RMS envelope is above the speech
threshold. Writes voice.words (frames @ 60 fps) into timeline.json.
Usage: python3 scripts/align-words.py
"""
import json
import re
import subprocess

FPS = 60
HOP = 0.01  # 10 ms analysis windows
THRESH_DB = -39.0

out = subprocess.run(
    ["ffmpeg", "-hide_banner", "-i", "public/eu.mp4", "-vn", "-ac", "1", "-ar", "16000",
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

words = json.load(open("scripts/data/whisper_words.json"))["transcription"]
cues = []
for w in words:
    text = w["text"].strip()
    if not text:
        continue
    a = w["offsets"]["from"] / 1000
    b = w["offsets"]["to"] / 1000
    # Only search the first 60% of the word; if no onset is found keep whisper's start.
    t = a
    limit = a + 0.6 * (b - a)
    while t < limit and not voiced(t):
        t += HOP
    if t >= limit:
        t = a
    cues.append({"w": text, "f": round(t * FPS), "end": round(b * FPS)})

tl = json.load(open("timeline.json"))
tl["voice"]["words"] = cues
tl["voice"]["wordsNote"] = "whisper-small word timestamps; starts snapped to the first voiced 10 ms window (RMS > -39 dB) by scripts/align-words.py"
json.dump(tl, open("timeline.json", "w"), ensure_ascii=False, indent=2)
print(" ".join(f'{c["w"]}@{c["f"]}' for c in cues))
