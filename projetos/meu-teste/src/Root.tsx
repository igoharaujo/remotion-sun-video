import { Composition, Still } from "remotion";
import { ContactSheet, SHEET_H, SHEET_W } from "./teste/ContactSheet";
import { MeuTeste } from "./teste/MeuTeste";
import { Thumbnail } from "./teste/Thumbnail";
import { TL } from "./teste/tl";

const C = TL.composition;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={C.id} component={MeuTeste} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Composition id="MeuTesteThumbnail" component={Thumbnail} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
  </>
);
