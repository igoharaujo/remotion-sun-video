import { AbsoluteFill } from "remotion";
import { AudioMix } from "./AudioMix";
import { Captions } from "./hud/Captions";
import { FlightPath } from "./hud/FlightPath";
import { Flash, ShakeLayer } from "./hud/Impacts";
import { LensFlare } from "./hud/LensFlare";
import { SpeedLines, Speedometer } from "./hud/Speedometer";
import { HookTimer, TimerHud } from "./hud/Timers";
import { FadeOut, PiP } from "./Overlay";
import { Space3D } from "./three/Space3D";

export const SunVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#02030a" }}>
    <ShakeLayer>
      <Space3D />
      <SpeedLines />
      <LensFlare />
      <FlightPath />
      <Speedometer />
      <HookTimer />
      <TimerHud />
      <Captions />
    </ShakeLayer>
    <PiP />
    <AudioMix />
    <Flash />
    <FadeOut />
  </AbsoluteFill>
);
