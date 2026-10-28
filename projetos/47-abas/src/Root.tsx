import { Composition, Still } from "remotion";
import { Abas47 } from "./abas/Abas47";
import { ContactSheet, SHEET_H, SHEET_W } from "./abas/ContactSheet";
import { Thumbnail } from "./abas/Thumbnail";
import { TL } from "./abas/tl";

const C = TL.composition;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={C.id} component={Abas47} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Composition id="Abas47Thumbnail" component={Thumbnail} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
  </>
);
