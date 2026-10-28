"""Carry the aligned, hand-corrected word cues of the full cut over to the lean cut (scripts/cut.py), through
source time: old cut time -> raw take time -> new cut time (incl. the tempo change). Words in dropped lines go;
which segment a word belongs to is decided by its midpoint (whisper onsets can sit a few ms across an old join);
a word edge that falls in a trimmed breath, or up to 0.15 s outside its segment's padding, snaps to the edge.
Reads scripts/data/cutlist_full.json + cut_words_aligned_full.json, writes scripts/data/cut_words_aligned.json.
Usage: python3 scripts/remap-words.py
"""
import json

FPS = 60
TOL = 0.15
old = json.load(open("scripts/data/cutlist_full.json"))["segments"]
new = json.load(open("scripts/data/cutlist.json"))
SP = new["speed"]
segs = new["segments"]
words = json.load(open("scripts/data/cut_words_aligned_full.json"))


def to_src(t):
    for s in old:
        if s["out"][0] - 1e-3 <= t <= s["out"][1] + 1e-3:
            return s["src"][0] + t - s["out"][0]
    return None


def to_new(src):
    best = None
    for s in segs:
        a, b = s["src"]
        d = 0 if a <= src <= b else min(abs(src - a), abs(src - b))
        if best is None or d < best[0]:
            best = (d, s)
    d, s = best
    gap_inside = any(x["region"] == y["region"] and x["src"][1] < src < y["src"][0] for x, y in zip(segs, segs[1:]))
    if d > TOL and not gap_inside:
        return None
    c = min(max(src, s["src"][0]), s["src"][1])
    return s["out"][0] + (c - s["src"][0]) / SP


out, drop = [], []
for w in words:
    fm = to_src((w["f"] + w["end"]) / 2 / FPS)
    if fm is None or to_new(fm) is None:
        drop.append(w["w"])
        continue
    fs, fe = to_src(w["f"] / FPS), to_src(w["end"] / FPS)
    # the midpoint's raw-take position anchors the word: edges that land in another old segment are pulled back
    fs = fs if fs is not None and abs(fs - fm) < 2 else fm - (w["end"] - w["f"]) / 2 / FPS
    fe = fe if fe is not None and abs(fe - fm) < 2 else fm + (w["end"] - w["f"]) / 2 / FPS
    a = to_new(fs)
    if a is None:
        drop.append(w["w"])
        continue
    b = to_new(fe) if fe is not None else None
    if b is None or b <= a:
        b = a + (w["end"] - w["f"]) / FPS / SP
    out.append({**w, "f": round(a * FPS), "end": round(b * FPS)})
for p, w in zip(out, out[1:]):  # keep onsets strictly increasing
    if w["f"] <= p["f"]:
        w["f"] = p["f"] + 1
json.dump(out, open("scripts/data/cut_words_aligned.json", "w"), ensure_ascii=False, indent=1)
print(len(words), "->", len(out), "| dropped:", " ".join(drop))
