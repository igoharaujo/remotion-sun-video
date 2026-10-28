// The talking-head PiP window and the closing fade.
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { BEAT, FPS, PIP, easeIn, easeOut, ev, mix, prog } from "./timeline";

/** The talking head: untouched pixels and audio, framed as a floating 9:16 window. */
export const PiP: React.FC = () => {
  const frame = useCurrentFrame();
  const scaleUp = ev("payoff", "PiP scales");
  const scale = mix(1, PIP.payoffScale, prog(frame, scaleUp.f, scaleUp.until ?? scaleUp.f, easeOut));
  const bob = 6 * Math.sin((frame / FPS / 4) * Math.PI * 2);
  const { x, y, w, h } = PIP.rect;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        transformOrigin: "100% 100%",
        transform: `translateY(${bob * (1 - prog(frame, BEAT.end.from, BEAT.end.to, easeOut))}px) scale(${scale})`,
        borderRadius: PIP.style.borderRadius,
        border: PIP.style.border,
        boxShadow: PIP.style.shadow,
        overflow: "hidden",
        backgroundColor: "#000",
      }}
    >
      <OffthreadVideo
        src={staticFile("eu.mp4")}
        style={{ width: "100%", height: "100%", objectFit: PIP.style.objectFit as "cover" }}
      />
    </div>
  );
};

export const FadeOut: React.FC = () => {
  const frame = useCurrentFrame();
  const fade = ev("end", "Picture fades");
  const o = prog(frame, fade.f, fade.until ?? BEAT.end.to, easeIn);
  return o > 0 ? <AbsoluteFill style={{ backgroundColor: "#000", opacity: o }} /> : null;
};
