// "A IA vai acabar com o analista de dados?" — vertical TikTok. The lean jump-cut take: full screen under the
// "EXTINTO OU SEGURO?" slam, then a glass PiP over a 3D dark-tech world (grid floor, data columns, 0/1 bits, the US
// dot map, the AI core) with the checked sources (WEF, Gartner, PwC, Microsoft Learn) in glass windows, a 3D
// checklist for the three points, and back to the speaker full screen for the CTA with the chameleon.
// Layer order inside the shake: world -> vignette -> speaker -> scene HUD -> captions -> mascot.
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { FadeOut, Flash, ShakeLayer, Vignette } from "./hud/Chrome";
import { Mascot } from "./hud/Mascot";
import { S01 } from "./hud/S01";
import { S02 } from "./hud/S02";
import { S03 } from "./hud/S03";
import { S04 } from "./hud/S04";
import { S05 } from "./hud/S05";
import { Speaker } from "./hud/Speaker";
import { DarkTech } from "./three/DarkTech";
import { BG, worldAt } from "./tl";

export const World: React.FC = () => {
  const frame = useCurrentFrame();
  const o = worldAt(frame);
  return o > 0.001 ? (
    <AbsoluteFill style={{ opacity: o }}>
      <DarkTech />
    </AbsoluteFill>
  ) : null;
};

export const AnalistaDadosIA: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ShakeLayer>
      <World />
      <Vignette />
      <Speaker />
      <S01 />
      <S02 />
      <S03 />
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
