// The speaker's own footage, full frame, with a slow Ken Burns push (heavier on the serious line), the
// 20% dark overlay (38% on the serious line) and a soft top shade so white type reads on the light wall.
// The shade stops above the hairline: the face is never darkened beyond the base overlay.
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { DURATION, FACE, TL, easeInOut, mix, prog, seriousAt } from "../tl";

const OVERLAY = TL.background.overlay;

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const s = seriousAt(frame);
  // 1.00 -> 1.04 over the whole video, plus up to +0.04 while serious. Anchored on the face so it stays put.
  const zoom = 1 + 0.04 * prog(frame, 0, DURATION, easeInOut) + 0.04 * s;
  const faceCy = (FACE.y[0] + 1500) / 2;
  return (
    <>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `50% ${(faceCy / 1920) * 100}%` }}>
        <OffthreadVideo src={staticFile("eu.mp4")} volume={1} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${mix(OVERLAY.base, OVERLAY.serious, s)})` }} />
      <AbsoluteFill
        style={{ background: `linear-gradient(180deg, rgba(0,0,0,${0.42 + 0.1 * s}) 0%, rgba(0,0,0,${0.3 + 0.1 * s}) 30%, rgba(0,0,0,0) ${(FACE.y[0] / 1920) * 100}%)` }}
      />
    </>
  );
};
