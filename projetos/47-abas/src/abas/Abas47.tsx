// "A pessoa das 47 abas" — vertical TikTok (audio-only voice, no PiP, no music). Apple Keynote / premium
// tech UI stage, with the chameleon mascot as a 2.5D sprite. Layer order: 3D window field + mascot -> vignette -> scene HUDs -> captions, all inside the impact
// shake; the visualizer, stutter glitch, flash, blackout and fade sit outside it.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { AudioViz, Blackout, FadeOut, Flash, ShakeLayer, StutterFX, Vignette } from "./hud/Chrome";
import { S01, S02, S03, S04, S05, S06, S07, S08, S09, TabStrip } from "./hud/Scenes";
import { MascotSprite } from "./mascot/Sprite";
import { dofAt } from "./mascot/track";
import { FOCUS_NAME, Scene3D } from "./three/Scene3D";
import { STAGE } from "./tl";

/** The 3D world with the mascot as the in-focus subject (the field defocuses when it nears the lens). */
export const World: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Scene3D dof={{ amount: dofAt(frame) }}>
      <group name={FOCUS_NAME}>
        <MascotSprite />
      </group>
    </Scene3D>
  );
};

export const Abas47: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: STAGE }}>
    <ShakeLayer>
      <World />
      <Vignette />
      <S01 />
      <S02 />
      <S03 />
      <TabStrip />
      <S04 />
      <S05 />
      <S06 />
      <S07 />
      <S08 />
      <S09 />
      <Captions />
    </ShakeLayer>
    <StutterFX />
    <AudioViz />
    <AudioMix />
    <Flash />
    <Blackout />
    <FadeOut />
  </AbsoluteFill>
);
