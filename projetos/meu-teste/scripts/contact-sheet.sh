#!/usr/bin/env bash
# Contact sheet of key frames with the TikTok safe-zone overlay (drawn by the ContactSheet still).
# Usage: scripts/contact-sheet.sh [video.mp4] [out.png] [sheet.tsx] [stillId]
#   default: scripts/contact-sheet.sh out/final_meu_teste.mp4 out/contact_sheet.png
set -euo pipefail
IN=${1:-out/final_meu_teste.mp4}
OUT=${2:-out/contact_sheet.png}
SHEET=${3:-src/teste/ContactSheet.tsx}
STILL=${4:-ContactSheet}
FRAMES=$(grep -o "SHEET_FRAMES = \[[^]]*\]" "$SHEET" | tr -dc "0-9," | tr "," " ")
mkdir -p public/contact
rm -f public/contact/*.png
for f in $FRAMES; do
  # Exact frame by index (the render is constant 60 fps).
  ffmpeg -hide_banner -v error -y -i "$IN" -vf "select=eq(n\,$f)" -fps_mode passthrough -frames:v 1 "public/contact/f$(printf %04d "$f").png"
done
npx remotion still "$STILL" "$OUT" --log=error
echo "wrote $OUT"
