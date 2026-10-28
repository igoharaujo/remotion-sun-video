#!/usr/bin/env bash
# Bring the Remotion render's mix to -14 LUFS integrated / -1 dBTP and remux for streaming.
# One global gain (+ a peak limiter only if the gain would clip); the video stream is copied untouched.
# Usage: scripts/finalize.sh [in.mp4] [out.mp4]
set -euo pipefail
IN=${1:-out/render_raw.mp4}
OUT=${2:-out/final_iphone_lingua.mp4}
TARGET=-14
TP=-1.0

measure() {
  ffmpeg -hide_banner -nostats -i "$1" -vn -af "loudnorm=I=$TARGET:TP=$TP:LRA=11:print_format=json" -f null - 2>&1 \
    | sed -n '/^{/,/^}/p'
}

M=$(measure "$IN")
I=$(echo "$M" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_i"])')
PEAK=$(echo "$M" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_tp"])')
GAIN=$(python3 -c "print(round($TARGET - ($I), 2))")
echo "input: ${I} LUFS, true peak ${PEAK} dBTP -> gain ${GAIN} dB"

# The limiter shaves a little loudness off, so correct the gain until the result lands on target.
LIMIT="aresample=192000,alimiter=limit=0.84:attack=1:release=60:level=disabled,aresample=48000"
for pass in 1 2 3; do
  FILTER="volume=${GAIN}dB"
  if python3 -c "import sys; sys.exit(0 if ($PEAK) + ($GAIN) > $TP else 1)"; then
    FILTER="$FILTER,$LIMIT"
  fi
  ffmpeg -hide_banner -v error -y -i "$IN" -map 0:v -map 0:a -c:v copy \
    -af "$FILTER" -c:a aac -b:a 320k -ar 48000 -movflags +faststart "$OUT"
  R=$(measure "$OUT")
  OI=$(echo "$R" | python3 -c 'import json,sys; print(json.load(sys.stdin)["input_i"])')
  echo "pass $pass: gain ${GAIN} dB -> $(echo "$R" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["input_i"], "LUFS,", d["input_tp"], "dBTP, LRA", d["input_lra"])')"
  python3 -c "import sys; sys.exit(0 if abs($TARGET - ($OI)) <= 0.2 else 1)" && break
  GAIN=$(python3 -c "print(round($GAIN + ($TARGET - ($OI)), 2))")
done
