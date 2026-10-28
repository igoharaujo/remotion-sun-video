"""Speech regions of the raw take + a Whisper transcript of each one on its own.

silencedetect (-38 dB, >= 0.45 s, after an 80 Hz high-pass) on out/bruto16k.wav gives the pauses
(scripts/data/silences.txt); the gaps between them are the speech regions. Each region is cut out
with 0.15 s of air and transcribed separately (Whisper's timestamps drift over long silences).
Writes scripts/data/speech_regions.json and scripts/data/region_text.txt.
Usage: python3 scripts/regions.py
"""
import json
import os
import re
import subprocess

MODEL = os.environ.get("WHISPER_MODEL", "/private/tmp/claude-501/-Users-igoh-Documents-remotion-sun-video/d1ab362f-bfb8-4542-b53b-329d33ca6237/scratchpad/w/ggml-small.bin")
WAV = "out/bruto16k.wav"
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", WAV], capture_output=True, text=True).stdout)
starts, ends = [], []
for line in open("scripts/data/silences.txt"):
    m = re.search(r"silence_start: ([\d.]+)", line)
    if m:
        starts.append(float(m.group(1)))
    m = re.search(r"silence_end: ([\d.]+)", line)
    if m:
        ends.append(float(m.group(1)))
regions = []
t = 0.0
for s, e in zip(starts, ends + [dur]):
    if s - t > 0.12:
        regions.append([round(t, 3), round(s, 3)])
    t = e
if dur - t > 0.12:
    regions.append([round(t, 3), round(dur, 3)])
json.dump(regions, open("scripts/data/speech_regions.json", "w"))

lines = []
for i, (a, b) in enumerate(regions):
    seg = "out/_seg.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-y", "-ss", str(max(0, a - 0.15)), "-to", str(b + 0.15), "-i", WAV, seg], check=True)
    txt = subprocess.run(["whisper-cli", "-m", MODEL, "-l", "pt", "-nt", "-np", "-f", seg], capture_output=True, text=True).stdout
    txt = " ".join(txt.split())
    lines.append(f"r{i:02d} {a:7.2f}-{b:7.2f} ({b - a:5.2f}s)  {txt}")
    print(lines[-1], flush=True)
os.remove("out/_seg.wav")
open("scripts/data/region_text.txt", "w").write("\n".join(lines) + "\n")
