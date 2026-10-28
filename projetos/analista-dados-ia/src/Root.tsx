import { Composition, Still } from "remotion";
import { AnalistaDadosIA } from "./ia/AnalistaDadosIA";
import { ContactSheet, SHEET_H, SHEET_W } from "./ia/ContactSheet";
import { Thumbnail } from "./ia/Thumbnail";
import { TL } from "./ia/tl";

const C = TL.composition;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id={C.id} component={AnalistaDadosIA} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Composition id="AnalistaDadosIAThumbnail" component={Thumbnail} width={C.width} height={C.height} fps={C.fps} durationInFrames={C.durationInFrames} />
    <Still id="ContactSheet" component={ContactSheet} width={SHEET_W} height={Math.ceil(SHEET_H)} />
  </>
);
