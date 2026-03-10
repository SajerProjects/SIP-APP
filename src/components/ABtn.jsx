import { fonts, colors } from "../styles";

export default function ABtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: colors.accent, color: colors.bg, border: "none", borderRadius: 8,
      padding: "9px 18px", fontFamily: fonts.mono, fontSize: 11,
      fontWeight: 700, letterSpacing: 2, cursor: "pointer", ...style,
    }}>{children}</button>
  );
}
