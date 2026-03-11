import { getWeekKey, formatWeekLabel, timeAgo } from "../utils";
import { fonts, colors, shared } from "../styles";
import SLabel from "./SLabel";
import ActivityFeed from "./ActivityFeed";

export default function GridView({ D, me, onOpen, onWeekly }) {

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <SLabel>{D.members.length} MEMBER{D.members.length !== 1 ? "S" : ""}</SLabel>
      </div>

      {/* Weekly Check-in Banner */}
      {D.members.length > 0 && (() => {
        const weekKey = getWeekKey();
        const weekData = D.weeklies?.[weekKey] || { checkins: {} };
        const checkins = weekData.checkins || {};
        const checkedIn = D.members.filter(m => checkins[m.id]?.filledAt);
        const allDone = checkedIn.length === D.members.length;

        return (
          <div
            onClick={onWeekly}
            style={{
              ...shared.card,
              borderRadius: 14,
              padding: "20px 24px",
              marginBottom: 28,
              borderLeft: "none",
              cursor: "pointer",
              transition: "all .2s",
              background: colors.card,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = colors.hoverCard; e.currentTarget.style.borderColor = colors.accent + "80"; }}
            onMouseLeave={e => { e.currentTarget.style.background = colors.card; e.currentTarget.style.borderColor = colors.cardBorder; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 6 }}>
                  <span style={{ fontFamily: fonts.heading, fontSize: 22, letterSpacing: 2, color: colors.text }}>WEEKLY CHECK-IN</span>
                </div>
                <SLabel>{formatWeekLabel(getWeekKey())}</SLabel>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                {/* Avatar stack of who's checked in */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  {D.members.map((m, i) => {
                    const done = !!checkins[m.id]?.filledAt;
                    return (
                      <div key={m.id} style={{
                        width: 30, height: 30, borderRadius: "50%",
                        background: done ? colors.inputBg : colors.bg,
                        border: `2px solid ${done ? m.color : colors.textGhost}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14, marginLeft: i > 0 ? -8 : 0, zIndex: D.members.length - i,
                        opacity: done ? 1 : 0.4,
                      }}>
                        {m.avatar}
                      </div>
                    );
                  })}
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontFamily: fonts.heading, fontSize: 28,
                    color: allDone ? colors.success : "#FFFFFF",
                  }}>
                    {checkedIn.length}/{D.members.length}
                  </div>
                </div>

                <span style={{ fontFamily: fonts.mono, fontSize: 16, color: colors.textDimmer }}>&rsaquo;</span>
              </div>
            </div>
          </div>
        );
      })()}

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
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + "60"; e.currentTarget.style.background = colors.hoverCard; }}
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
