import { Composition, Still } from "remotion";
import { ContactSheet, SHEET_H, SHEET_W } from "./lingua/ContactSheet";
import { IphoneLingua } from "./lingua/IphoneLingua";
import { Thumbnail } from "./lingua/Thumbnail";
import { TL } from "./lingua/tl";

const C = TL.composition;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={C.id} component={IphoneLingua} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Composition id="IphoneLinguaThumbnail" component={Thumbnail} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
  </>
);
