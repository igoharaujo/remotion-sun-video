// "O vício de deixar tudo pra amanhã" — vertical TikTok over the speaker's own footage (no PiP, no music).
// Apple Keynote / dark tech overlay. Layer order: footage + overlay -> HUD band -> captions -> mascot,
// all inside the impact shake; flash and fade sit outside it.
import { AbsoluteFill } from "remotion";
import { AudioMix } from "./AudioMix";
import { Background } from "./hud/Background";
import { Captions } from "./hud/Captions";
import { FadeOut, Flash, ShakeLayer } from "./hud/Chrome";
import { Mascot } from "./hud/Mascot";
import { S01, S02, S03, S04 } from "./hud/Scenes";

export const MeuTeste: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#000" }}>
    <ShakeLayer>
      <Background />
      <S01 />
      <S02 />
      <S03 />
      <S04 />
      <Captions />
      <Mascot />
    </ShakeLayer>
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
