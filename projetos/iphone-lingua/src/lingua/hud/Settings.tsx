// S05: a simulated settings flow, drawn in code (dark mode, generic look; not a screen capture).
// Ajustes -> Acessibilidade -> Rastreamento de Cabeça, then the toggle, the tongue gesture and its action.
import { interpolate, useCurrentFrame } from "remotion";
import { BLUE, GREEN, K, backOut, easeInOut, prog, win } from "../tl";
import { INTER } from "../style";

export const SETTINGS_BEATS = {
  tapA: K("S05", "Acessibilidade"),
  tapB: K("S05", "Rastreamento"),
  toggle: K("S05", "ativa"),
  gesture: K("S05", "mostrar a língua"),
  action: K("S05", "rolar para baixo"),
};
const PUSH = 18;

type Row = { label: string; icon?: string; value?: string; chevron?: boolean; tap?: number; hl?: number; toggle?: number; badge?: React.ReactNode };

const Ripple: React.FC<{ t: number }> = ({ t }) =>
  t > 0 && t < 1 ? (
    <div style={{ position: "absolute", left: "62%", top: "50%", width: 120, height: 120, margin: -60, borderRadius: "50%", border: `3px solid ${BLUE}`, background: "rgba(0,122,255,0.18)", transform: `scale(${0.2 + 1.2 * t})`, opacity: 1 - t }} />
  ) : null;

const Toggle: React.FC<{ on: number }> = ({ on }) => (
  <div style={{ width: 54, height: 32, borderRadius: 16, background: `rgba(${Math.round(120 - 104 * on)}, ${Math.round(120 + 65 * on)}, ${Math.round(128 + 1 * on)}, 1)`, position: "relative", boxShadow: on > 0.5 ? `0 0 ${16 * on}px ${GREEN}` : undefined }}>
    <div style={{ position: "absolute", top: 2, left: 2 + 22 * on, width: 28, height: 28, borderRadius: 14, background: "#fff", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
  </div>
);

const Group: React.FC<{ title?: string; rows: Row[] }> = ({ title, rows }) => (
  <div style={{ margin: "0 16px 22px" }}>
    {title ? <div style={{ fontSize: 14, fontWeight: 500, color: "#8e8e93", margin: "0 0 7px 14px", letterSpacing: 0.4 }}>{title}</div> : null}
    <div style={{ background: "#1c1c1e", borderRadius: 14, overflow: "hidden" }}>
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            height: 52,
            padding: "0 14px",
            gap: 12,
            background: r.hl ? `rgba(0,122,255,${0.35 * r.hl})` : undefined,
            boxShadow: r.hl ? `inset 0 0 0 ${2 * r.hl}px ${BLUE}` : undefined,
            borderTop: i ? "1px solid #2c2c2e" : undefined,
          }}
        >
          {r.icon ? <div style={{ width: 30, height: 30, borderRadius: 8, background: r.icon, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{r.badge}</div> : null}
          <div style={{ flex: 1, fontSize: 19, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
          {r.value ? <div style={{ fontSize: 17, color: "#8e8e93", whiteSpace: "nowrap" }}>{r.value}</div> : null}
          {r.toggle !== undefined ? <Toggle on={r.toggle} /> : null}
          {r.chevron ? <div style={{ fontSize: 22, color: "#5a5a5e", marginLeft: 2 }}>›</div> : null}
          <Ripple t={r.tap ?? 0} />
        </div>
      ))}
    </div>
  </div>
);

const Header: React.FC<{ title: string; back?: string; glow?: number }> = ({ title, back, glow = 0 }) => (
  <div style={{ padding: "50px 20px 12px" }}>
    <div style={{ height: 26, fontSize: 18, color: BLUE }}>{back ? `‹ ${back}` : ""}</div>
    <div style={{ fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: -0.5, textShadow: glow ? `0 0 ${20 * glow}px ${BLUE}` : undefined }}>{title}</div>
  </div>
);

/** Icon glyphs as white marks inside the square row icons. */
const Glyph: React.FC<{ d: string }> = ({ d }) => (
  <svg width={20} height={20} viewBox="0 0 20 20">
    <path d={d} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const ACCESS = "M10 3.5a1.3 1.3 0 1 0 0.01 0M4 7.5h12M10 7.5v4.5M10 12l-3 5M10 12l3 5";
const HEAD = "M10 4a5 5 0 1 0 0.01 0M3 10h2M15 10h2";
const TONGUE = "M4 8a6 6 0 0 0 12 0M8 11v3a2 2 0 0 0 4 0v-3";

const tap = (frame: number, at: number) => prog(frame, at, at + 22);

export const SettingsFlow: React.FC<{ w: number; h: number }> = ({ w, h }) => {
  const frame = useCurrentFrame();
  const B = SETTINGS_BEATS;
  const push1 = prog(frame, B.tapA + 8, B.tapA + 8 + PUSH, easeInOut);
  const push2 = prog(frame, B.tapB + 8, B.tapB + 8 + PUSH, easeInOut);
  const toggle = prog(frame, B.toggle, B.toggle + 10, backOut);
  const gestureHl = win(frame, B.gesture, B.action + 50, 6, 20);
  const actionSet = frame >= B.action + 6;
  const check = prog(frame, B.action + 6, B.action + 18, backOut);
  const page = (k: number, children: React.ReactNode) => {
    // iOS push: the incoming page slides in from the right, the outgoing one shifts left and dims.
    const inP = k === 0 ? 1 : k === 1 ? push1 : push2;
    const outP = k === 0 ? push1 : k === 1 ? push2 : 0;
    if (inP <= 0 || outP >= 1) return null;
    const x = (1 - inP) * w - outP * w * 0.3;
    return (
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${x}px)`, background: "#000", filter: outP > 0 ? `brightness(${1 - 0.5 * outP})` : undefined, boxShadow: inP < 1 ? "-10px 0 30px rgba(0,0,0,0.6)" : undefined }}>
        {children}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", width: w, height: h, fontFamily: INTER, overflow: "hidden" }}>
      {page(
        0,
        <>
          <Header title="Ajustes" glow={win(frame, K("S05", "Ajustes"), B.tapA, 6, 10)} />
          <div style={{ margin: "0 16px 22px", height: 38, borderRadius: 10, background: "#1c1c1e", color: "#8e8e93", fontSize: 17, display: "flex", alignItems: "center", padding: "0 12px" }}>⌕ Buscar</div>
          <Group rows={[{ label: "Modo Avião", icon: "#ff9500", toggle: 0 }, { label: "Wi-Fi", icon: BLUE, value: "Casa", chevron: true }, { label: "Bluetooth", icon: BLUE, value: "Sim", chevron: true }]} />
          <Group
            rows={[
              { label: "Geral", icon: "#8e8e93", chevron: true },
              { label: "Acessibilidade", icon: BLUE, chevron: true, badge: <Glyph d={ACCESS} />, tap: tap(frame, B.tapA), hl: win(frame, B.tapA - 4, B.tapA + 26, 4, 8) },
              { label: "Tela e Brilho", icon: BLUE, chevron: true },
              { label: "Câmera", icon: "#8e8e93", chevron: true },
            ]}
          />
        </>,
      )}
      {page(
        1,
        <>
          <Header title="Acessibilidade" back="Ajustes" />
          <Group title="VISÃO" rows={[{ label: "VoiceOver", icon: "#8e8e93", value: "Não", chevron: true }, { label: "Zoom", icon: "#8e8e93", value: "Não", chevron: true }, { label: "Tela e Tamanho do Texto", icon: BLUE, chevron: true }]} />
          <Group
            title="FÍSICO E MOTOR"
            rows={[
              { label: "Toque", icon: BLUE, chevron: true },
              { label: "Rastreamento Ocular", icon: BLUE, value: "Não", chevron: true },
              { label: "Rastreamento de Cabeça", icon: BLUE, badge: <Glyph d={HEAD} />, value: "Não", chevron: true, tap: tap(frame, B.tapB), hl: win(frame, B.tapB - 4, B.tapB + 26, 4, 8) },
            ]}
          />
        </>,
      )}
      {page(
        2,
        <>
          <Header title="Rastreamento de Cabeça" back="Acessib." />
          <Group rows={[{ label: "Rastreamento de Cabeça", toggle, hl: win(frame, B.toggle - 4, B.toggle + 30, 4, 12) }]} />
          <div style={{ margin: "-12px 30px 22px", fontSize: 14, lineHeight: 1.35, color: "#8e8e93" }}>Use a câmera frontal para controlar o iPhone com movimentos da cabeça e expressões faciais.</div>
          <Group
            title="AÇÕES"
            rows={[
              {
                label: "Mostrar a língua",
                icon: GREEN,
                badge: <Glyph d={TONGUE} />,
                value: actionSet ? "Rolar para baixo" : "Nenhuma",
                chevron: true,
                tap: tap(frame, B.gesture),
                hl: gestureHl,
              },
              { label: "Sorrir", icon: "#8e8e93", value: "Nenhuma", chevron: true },
              { label: "Levantar sobrancelhas", icon: "#8e8e93", value: "Nenhuma", chevron: true },
              { label: "Abrir a boca", icon: "#8e8e93", value: "Nenhuma", chevron: true },
            ]}
          />
          {check > 0 ? (
            <div style={{ margin: "0 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, height: 64, borderRadius: 14, background: "rgba(16,185,129,0.16)", border: `2px solid ${GREEN}`, color: GREEN, fontSize: 22, fontWeight: 800, opacity: Math.min(1, check), transform: `scale(${interpolate(check, [0, 1], [0.8, 1])})` }}>
              ✓ Rolar para baixo
              <span style={{ display: "inline-block", transform: `translateY(${8 * Math.sin(frame / 6)}px)` }}>↓</span>
            </div>
          ) : null}
        </>,
      )}
    </div>
  );
};
