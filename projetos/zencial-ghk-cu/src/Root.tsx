import { Composition, Still } from "remotion";
import { ContactSheet, SHEET_H, SHEET_W } from "./zencial/ContactSheet";
import { Thumbnail } from "./zencial/Thumbnail";
import { TL } from "./zencial/tl";
import { ZencialGhkCu } from "./zencial/ZencialGhkCu";

const C = TL.composition;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={C.id} component={ZencialGhkCu} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Composition id="ZencialThumbnail" component={Thumbnail} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
  </>
);
