import { Composition, Still } from "remotion";
import { ContactSheet, SHEET_H, SHEET_W } from "./ContactSheet";
import { ContactSheetIphone, SHEET_H as IPH_SHEET_H, SHEET_W as IPH_SHEET_W } from "./iphone/ContactSheetIphone";
import { IphoneDuo } from "./iphone/IphoneDuo";
import { Thumbnail as IphoneThumbnail } from "./iphone/Thumbnail";
import { TL as IPH } from "./iphone/tl";
import { SunVideo } from "./SunVideo";
import { DURATION, FPS, H, T, W } from "./timeline";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id={T.composition.id}
      component={SunVideo}
      width={W}
      height={H}
      fps={FPS}
      durationInFrames={DURATION}
    />
    <Composition
      id={IPH.composition.id}
      component={IphoneDuo}
      width={IPH.composition.width}
      height={IPH.composition.height}
      fps={IPH.composition.fps}
      durationInFrames={IPH.composition.durationInFrames}
    />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
    <Composition
      id="IphoneThumbnail"
      component={IphoneThumbnail}
      width={IPH.composition.width}
      height={IPH.composition.height}
      fps={IPH.composition.fps}
      durationInFrames={IPH.composition.durationInFrames}
    />
    <Still id="ContactSheetIphone" component={ContactSheetIphone} width={IPH_SHEET_W} height={Math.ceil(IPH_SHEET_H)} />
  </>
);
