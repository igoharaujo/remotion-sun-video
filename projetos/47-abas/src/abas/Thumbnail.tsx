// Cover image: the mural of windows with one highlighted hero, the mascot and the "47 ABAS" title. Registered as a
// full-length composition and rendered at THUMB_FRAME, because the 3D canvas reads the real timeline
// frame (a <Freeze> does not reach inside it). Text stays inside the TikTok safe zone.
import { AbsoluteFill } from "remotion";
import { World } from "./Abas47";
import { Vignette } from "./hud/Chrome";
import { DISPLAY, MONO, SHADOW, glow } from "./style";
import { BLUE, INK, K, MUTED, STAGE } from "./tl";

export const THUMB_FRAME = K("S02", "pesquisa") + 30;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: STAGE }}>
    <World />
    <Vignette />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 62%, rgba(0,0,0,0.8) 100%)" }} />
    <div style={{ position: "absolute", left: 60, width: 960, top: 140, textAlign: "center" }}>
      <div style={{ ...DISPLAY, fontSize: 250, lineHeight: 0.92, letterSpacing: -12, color: INK, textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.3, 1.4)}` }}>47</div>
      <div style={{ ...DISPLAY, fontSize: 80, letterSpacing: 10, fontWeight: 700, color: BLUE, textShadow: `${SHADOW}, ${glow(BLUE, 0.6)}` }}>ABAS ABERTAS</div>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1420, textAlign: "center", ...DISPLAY, fontSize: 96, lineHeight: 1.04, color: INK, textShadow: SHADOW }}>
      Isso não é
      <br />
      organização.
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1626, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 6, color: MUTED, textShadow: SHADOW }}>
      O PROBLEMA DO ACÚMULO DIGITAL
    </div>
  </AbsoluteFill>
);
