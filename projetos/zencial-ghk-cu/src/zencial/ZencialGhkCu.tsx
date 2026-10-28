// "O segredo brasileiro para uma pele de vidro" — TikTok Shop ad for the Zencial GHK-Cu serum
// (audio-only voice, no PiP). Apple Keynote-style stage. Layer order: 3D world -> vignette -> scene HUDs -> CTA bottle -> captions,
// all inside the impact shake; the disclosure, visualizer, cart CTA, flash and fade sit outside it.
import { AbsoluteFill } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { AudioViz, CartCTA, Disclosure, FadeOut, Flash, ShakeLayer, Vignette } from "./hud/Chrome";
import { S01, S02, S03, S04, S05, S06, S07, S08, S09, StudioBottle } from "./hud/Scenes";
import { Scene3D } from "./three/Scene3D";
import { STAGE } from "./tl";

export const ZencialGhkCu: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: STAGE }}>
    <ShakeLayer>
      <Scene3D />
      <Vignette />
      <StudioBottle />
      <S01 />
      <S02 />
      <S03 />
      <S04 />
      <S05 />
      <S06 />
      <S07 />
      <S08 />
      <S09 />
      <Captions />
    </ShakeLayer>
    <Disclosure />
    <AudioViz />
    <CartCTA />
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
