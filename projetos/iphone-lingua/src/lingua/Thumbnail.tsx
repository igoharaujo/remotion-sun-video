// Cover image: the face mesh with the tongue out and the phone feed scrolling, plus a short title.
// Registered as a full-length composition and rendered at THUMB_FRAME, because the 3D canvas reads the
// real timeline frame (a <Freeze> does not reach inside it). Text stays inside the TikTok safe zone.
import { AbsoluteFill } from "remotion";
import { Vignette } from "./hud/Chrome";
import { S01 } from "./hud/Scenes";
import { DROP, INTER, MONO, SHADOW, glow } from "./style";
import { Scene3D } from "./three/Scene3D";
import { BG, BLUE, GREEN, K, WHITE } from "./tl";

export const THUMB_FRAME = K("S01", "língua") + 22;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <Scene3D />
    <Vignette />
    <S01 />
    <div style={{ position: "absolute", left: 60, width: 960, top: 1370, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 104, lineHeight: 1.0, letterSpacing: -2, color: WHITE, textShadow: SHADOW, filter: DROP }}>
      role a tela
      <br />
      <span style={{ color: GREEN, textShadow: `${SHADOW}, ${glow(GREEN, 0.6, 1.2)}` }}>com a língua</span>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1610, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 30, letterSpacing: 4, color: BLUE, textShadow: `${SHADOW}, ${glow(BLUE, 0.3, 0.6)}` }}>
      iOS 26 · RASTREAMENTO DE CABEÇA
    </div>
  </AbsoluteFill>
);
