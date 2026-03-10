import { fonts, colors } from "../styles";
import SLabel from "./SLabel";
import ActivityFeed from "./ActivityFeed";

export default function GridView({ D, me, onOpen }) {
  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: fonts.heading, fontSize: 52, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
          SIP<span style={{ color: colors.accent }}>.</span>
        </h1>
        <SLabel>{D.members.length} MEMBER{D.members.length !== 1 ? "S" : ""}</SLabel>
      </div>

      {D.members.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 0", color: colors.textGhost, fontFamily: "monospace", fontSize: 11, letterSpacing: 2 }}>
          No members yet. Share the link with your squad.
        </div>
      )}

      <div className="sip-grid">
        {D.members.map(m => {
          const filled = m.sections.filter(s => s.content.trim()).length;
          const totalComments = m.sections.reduce((n, s) => n + s.comments.length, 0);
          const isMe = m.id === me;
          return (
            <div
              key={m.id}
              onClick={() => onOpen(m.id)}
              style={{
                background: colors.card, border: `1px solid ${isMe ? m.color + "30" : colors.cardBorder}`, borderRadius: 12,
                padding: "16px 20px", cursor: "pointer", transition: "all .2s",
                borderLeft: `3px solid ${m.color}`,
                display: "flex", alignItems: "center", gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + "60"; e.currentTarget.style.background = "#141420"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? m.color + "30" : colors.cardBorder; e.currentTarget.style.borderLeftColor = m.color; e.currentTarget.style.background = colors.card; }}
            >
              <div style={{
                fontSize: 32, background: colors.inputBg, borderRadius: 10,
                padding: "8px 10px", lineHeight: 1, flexShrink: 0,
              }}>{m.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                  {isMe && <span style={{ fontFamily: fonts.mono, fontSize: 8, color: colors.accent, letterSpacing: 1 }}>YOU</span>}
                </div>
                <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDimmer, letterSpacing: 1, marginTop: 3 }}>
                  {m.sections.length} SECTIONS
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fonts.heading, fontSize: 18, color: filled > 0 ? colors.success : colors.textGhost }}>{filled}/{m.sections.length}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 7, color: colors.textDimmest, letterSpacing: 1 }}>FILLED</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: fonts.heading, fontSize: 18, color: totalComments > 0 ? colors.accent : colors.textGhost }}>{totalComments}</div>
                  <div style={{ fontFamily: fonts.mono, fontSize: 7, color: colors.textDimmest, letterSpacing: 1 }}>COMMENTS</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 32 }}>
        <ActivityFeed D={D} onOpen={onOpen} />
      </div>
    </div>
  );
}
