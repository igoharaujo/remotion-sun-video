// "5 dias criando vídeos com IA" — vertical TikTok. The jump-cut take in a glass PiP over a 3D space world
// (a meteor blows up a planet on "explodindo"), the bad day-1 video under VHS + a red X, floating B-roll
// from the TikToks, two easter eggs (terminal, SKILL.md), then back to the speaker full screen for the CTA
// with the chameleon. Layer order inside the shake: space -> vignette -> B-roll -> speaker -> HUD -> captions -> mascot.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AudioMix } from "./AudioMix";
import { BadFlash, BadProof, FloatingBroll, TerminalEgg } from "./hud/Broll";
import { Captions } from "./hud/Captions";
import { FadeOut, Flash, ShakeLayer, Vignette } from "./hud/Chrome";
import { Mascot } from "./hud/Mascot";
import { S01, S02, S03, S04, S05 } from "./hud/Scenes";
import { Speaker } from "./hud/Speaker";
import { Space } from "./three/Space";
import { SPACE, spaceAt } from "./tl";

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const o = spaceAt(frame);
  return o > 0.001 ? (
    <AbsoluteFill style={{ opacity: o }}>
      <Space />
    </AbsoluteFill>
  ) : null;
};

export const CincoDiasIA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: SPACE }}>
    <ShakeLayer>
      <World />
      <Vignette />
      <FloatingBroll />
      <BadProof />
      <Speaker />
      <BadFlash />
      <S01 />
      <S02 />
      <S03 />
      <TerminalEgg />
      <S04 />
      <S05 />
      <Captions />
      <Mascot />
    </ShakeLayer>
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
