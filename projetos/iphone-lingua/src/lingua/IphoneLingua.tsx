// "O truque secreto do iPhone: rolar a tela com a língua" (audio-only voice, no PiP).
// Layer order: 3D world -> vignette -> scene HUDs -> captions, all inside the impact shake;
// the voice visualizer, simulated badge, flash and fade sit outside it.
import { AbsoluteFill } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { AudioViz, FadeOut, Flash, ShakeLayer, SimBadge, Vignette } from "./hud/Chrome";
import { S01, S02, S03, S04, S05, S06S07, S08, S09 } from "./hud/Scenes";
import { Scene3D } from "./three/Scene3D";
import { BG } from "./tl";

export const IphoneLingua: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ShakeLayer>
      <Scene3D />
      <Vignette />
      <S01 />
      <S02 />
      <S03 />
      <S04 />
      <S05 />
      <S06S07 />
      <S08 />
      <S09 />
      <Captions />
    </ShakeLayer>
    <SimBadge />
    <AudioViz />
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
