import { shared } from "../styles";

export default function SLabel({ children, style }) {
  return <div style={{ ...shared.label, ...style }}>{children}</div>;
}
