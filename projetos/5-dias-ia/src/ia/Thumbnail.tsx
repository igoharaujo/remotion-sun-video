// Cover image: the planet blowing apart behind the speaker's PiP, with the hook line. Registered as a
// full-length composition and rendered at THUMB_FRAME (the 3D world and the footage read the real frame).
import { AbsoluteFill } from "remotion";
import { World } from "./CincoDiasIA";
import { Vignette } from "./hud/Chrome";
import { Speaker } from "./hud/Speaker";
import { DISPLAY, MONO, SHADOW, glow } from "./style";
import { FIRE, GOLD, INK, K, SPACE } from "./tl";

export const THUMB_FRAME = K("S01", "explodindo") + 14;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SPACE }}>
    <World />
    <Vignette />
    <Speaker />
    {/* the title sits on the explosion: a dark band keeps it legible */}
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.7) 22%, rgba(0,0,0,0) 40%)" }} />
    <div style={{ position: "absolute", left: 60, width: 960, top: 150, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: GOLD, textShadow: SHADOW }}>5 DIAS COM IA</div>
      <div style={{ ...DISPLAY, fontSize: 112, lineHeight: 1.02, color: INK, marginTop: 10, textShadow: `${SHADOW}, ${glow(FIRE, 0.6, 1.4)}` }}>
        do boneco palito
        <br />a <span style={{ color: FIRE, textShadow: `0 0 2px #000, ${SHADOW}` }}>explodir planetas</span>
      </div>
    </div>
  </AbsoluteFill>
);
