// Cover image: the speaker's PiP over the dark-tech world with the ECG badge flatlined, and the hook line.
// Registered as a full-length composition and rendered at THUMB_FRAME (the 3D world and the footage read the real frame).
import { AbsoluteFill } from "remotion";
import { World } from "./AnalistaDadosIA";
import { Vignette } from "./hud/Chrome";
import { Speaker } from "./hud/Speaker";
import { DISPLAY, MONO, SHADOW, glow } from "./style";
import { ALERT, BG, CYAN, GOOD, INK, K } from "./tl";

export const THUMB_FRAME = K("S01", "morreu") + 30;

export const Thumbnail: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <World />
    <Vignette />
    <Speaker />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 25%, rgba(0,0,0,0) 40%)" }} />
    <div style={{ position: "absolute", left: 60, width: 960, top: 150, textAlign: "center" }}>
      <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 40, letterSpacing: 8, color: CYAN, textShadow: SHADOW }}>ANALISTA DE DADOS</div>
      <div style={{ ...DISPLAY, fontSize: 150, lineHeight: 0.98, color: ALERT, marginTop: 12, textShadow: `${SHADOW}, ${glow(ALERT, 0.6, 1.4)}` }}>EXTINTO</div>
      <div style={{ ...DISPLAY, fontSize: 104, lineHeight: 1.05, color: INK, textShadow: SHADOW }}>
        OU <span style={{ color: GOOD, textShadow: `${SHADOW}, ${glow(GOOD, 0.6, 1.2)}` }}>SEGURO?</span>
      </div>
    </div>
  </AbsoluteFill>
);
