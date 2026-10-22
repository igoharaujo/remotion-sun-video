// "iPhone Duo — a engenharia por trás" (audio-only voice, no PiP).
// Layer order: 3D world -> reference photos -> scene HUDs -> captions, all inside the impact shake;
// the voice visualizer, concept tag, flash and fade sit outside it.
import { AbsoluteFill } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { AudioViz, ConceptTag, FadeOut, Flash, ShakeLayer, Vignette } from "./hud/Chrome";
import { S01, S01Backplate, S02, S03, S04, S05, S05aBackplate, S06 } from "./hud/ScenesA";
import { S07, S08S09, S09Crease, S10, S11Shine, S12 } from "./hud/ScenesB";
import { Scene3D } from "./three/Scene3D";

export const IphoneDuo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#050510" }}>
    <ShakeLayer>
      <Scene3D />
      <S01Backplate />
      <S05aBackplate />
      <Vignette />
      <S01 />
      <S02 />
      <S03 />
      <S04 />
      <S05 />
      <S06 />
      <S07 />
      <S08S09 />
      <S09Crease />
      <S10 />
      <S11Shine />
      <S12 />
      <Captions />
    </ShakeLayer>
    <ConceptTag />
    <AudioViz />
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
