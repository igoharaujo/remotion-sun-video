// Cover image: the exploded display stack (glass, OLED, titanium) just after the titanium plate lands,
// with a short title. Registered as a full-length composition and rendered at THUMB_FRAME, because the
// 3D canvas reads the real timeline frame (a <Freeze> does not reach inside it).
// Text stays inside the TikTok safe zone.
import { AbsoluteFill } from "remotion";
import { INTER, MONO, ORBITRON, glow } from "../hud/style";
import { Vignette } from "./hud/Chrome";
import { Scene3D } from "./three/Scene3D";
import { CONCEPT, K, OLED_BLUE, TITANIUM } from "./tl";

export const THUMB_FRAME = K("s05_glass_titanium", "titânio") + 40;
const SHADOW = "4px 4px 10px rgba(0,0,0,0.9)";

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050510" }}>
    <Scene3D />
    <Vignette />
    <div style={{ position: "absolute", left: 60, width: 960, top: 170, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 34, letterSpacing: 6, color: TITANIUM, textShadow: SHADOW }}>
      10 CAMADAS · 100+ PEÇAS
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 230, textAlign: "center", fontFamily: ORBITRON, fontWeight: 900, fontSize: 168, lineHeight: 1, color: "#fff", textShadow: `${SHADOW}, ${glow(OLED_BLUE, 0.6, 1.4)}` }}>
      iPHONE
      <br />
      <span style={{ color: OLED_BLUE }}>DUO</span>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1360, textAlign: "center", fontFamily: INTER, fontWeight: 900, fontSize: 84, lineHeight: 1.05, color: "#fff", textShadow: SHADOW, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.8))" }}>
      a engenharia
      <br />
      <span style={{ color: OLED_BLUE, textShadow: `${SHADOW}, ${glow(OLED_BLUE, 0.5)}` }}>da dobra</span>
    </div>
    <div style={{ position: "absolute", left: 60, width: 960, top: 1580, textAlign: "center", fontFamily: MONO, fontWeight: 700, fontSize: 26, letterSpacing: 3, color: TITANIUM, textShadow: SHADOW }}>
      {CONCEPT.text.toUpperCase()}
    </div>
  </AbsoluteFill>
);
