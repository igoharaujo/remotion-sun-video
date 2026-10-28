// Cover image: the bottle under the studio spotlight with a short title. Registered as a full-length
// composition and rendered at THUMB_FRAME, because the 3D canvas reads the real timeline frame
// (a <Freeze> does not reach inside it). Text stays inside the TikTok safe zone.
import { AbsoluteFill } from "remotion";
import { Disclosure, Vignette } from "./hud/Chrome";
import { StudioBottle } from "./hud/Scenes";
import { DISPLAY, MONO, SHADOW, glow } from "./style";
import { Scene3D } from "./three/Scene3D";
import { GOLD, GOLD_DEEP, INK, K, MUTED, RED, STAGE } from "./tl";

export const THUMB_FRAME = K("S02", "cem") + 40;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: STAGE }}>
    <Scene3D />
    <Vignette />
    <StudioBottle />
    <div style={{ position: "absolute", left: 60, width: 960, top: 210, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 8, color: MUTED, textShadow: SHADOW }}>O SEGREDO DA</div>
      <div style={{ ...DISPLAY, fontSize: 150, lineHeight: 1.02, color: INK, textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.25, 1.2)}` }}>pele de vidro.</div>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1180, textAlign: "center", ...DISPLAY, fontSize: 84, lineHeight: 1.05, color: INK, textShadow: SHADOW }}>
      menos de <span style={{ color: RED }}>R$ 200</span>
      <br />
      <span style={{ color: GOLD_DEEP, textShadow: `${SHADOW}, ${glow(GOLD, 0.3)}` }}>100% brasileiro</span>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1430, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: MUTED, textShadow: SHADOW }}>
      SÉRUM GHK-Cu · ZENCIAL
    </div>
    <Disclosure />
  </AbsoluteFill>
);
