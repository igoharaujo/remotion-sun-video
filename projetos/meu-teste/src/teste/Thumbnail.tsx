// Cover image: the speaker's frame under the dark overlay, the mascot in its corner and the hook line.
// Registered as a full-length composition and rendered at THUMB_FRAME (the footage and the mascot read
// the real timeline frame). Text stays in the wall band above the head, inside the safe zone.
import { AbsoluteFill } from "remotion";
import { Background } from "./hud/Background";
import { Mascot } from "./hud/Mascot";
import { DISPLAY, MONO, SHADOW, glow } from "./style";
import { ALERT, BLUE_GLOW, HUD_Y, INK, K } from "./tl";

export const THUMB_FRAME = K("S01", "dopamina") + 30;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <Background />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 45%)" }} />
    <div style={{ position: "absolute", left: 60, width: 960, top: HUD_Y[0] + 20, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 10, color: INK, textShadow: SHADOW }}>VOCÊ NÃO É</div>
      <div style={{ position: "relative", display: "inline-block", marginTop: 6 }}>
        <div style={{ ...DISPLAY, fontSize: 140, lineHeight: 1, color: INK, textShadow: `${SHADOW}, ${glow("#FFFFFF", 0.25, 1.2)}` }}>PREGUIÇOSO</div>
        <div style={{ position: "absolute", left: -20, right: -20, top: "52%", height: 16, borderRadius: 8, background: ALERT, transform: "rotate(-4deg)", boxShadow: `0 0 18px ${ALERT}aa` }} />
      </div>
      <div style={{ ...DISPLAY, fontSize: 92, lineHeight: 1.05, color: BLUE_GLOW, marginTop: 34, textShadow: `${SHADOW}, ${glow(BLUE_GLOW, 0.5)}` }}>
        você é viciado
        <br />
        em amanhã.
      </div>
    </div>
    <Mascot />
  </AbsoluteFill>
);
