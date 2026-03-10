import { useState } from "react";
import { timeAgo } from "../utils";
import { fonts, colors, shared } from "../styles";

export default function ActivityFeed({ D, onOpen }) {
  const [expanded, setExpanded] = useState(false);

  const events = [];
  D.members.forEach(m => {
    if (m.joinedAt) {
      events.push({ type: "join", date: m.joinedAt, member: m });
    }
    m.sections.forEach(s => {
      if (s.lastUpdated && s.content) {
        events.push({ type: "edit", date: s.lastUpdated, member: m, section: s });
      }
      s.comments.forEach(c => {
        const author = D.members.find(x => x.id === c.authorId);
        events.push({ type: "comment", date: c.date, member: m, section: s, comment: c, author });
      });
    });
  });

  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  const recent = events.slice(0, 20);
  const visible = expanded ? recent : recent.slice(0, 5);
  const hasMore = recent.length > 5;

  const renderEvent = (ev, i) => (
    <div
      key={i}
      onClick={() => onOpen(ev.member.id)}
      style={{ padding: "10px 10px", borderRadius: 8, cursor: "pointer", transition: "background .15s" }}
      onMouseEnter={e => { e.currentTarget.style.background = colors.inputBg; }}
      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 14, flexShrink: 0 }}>
          {ev.type === "comment" ? (ev.author?.avatar || "?") : ev.member.avatar}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 600,
          color: ev.type === "comment" ? (ev.author?.color || colors.textDim) : ev.member.color,
        }}>
          {ev.type === "comment" ? (ev.author?.name || "Unknown") : ev.member.name}
        </span>
        <span style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmest, marginLeft: "auto", flexShrink: 0 }}>
          {timeAgo(ev.date)}
        </span>
      </div>
      <div style={{
        fontFamily: fonts.mono, fontSize: 10, color: colors.textDimmer,
        paddingLeft: 22, lineHeight: 1.5,
      }}>
        {ev.type === "join" && "joined SIP"}
        {ev.type === "edit" && (
          <>updated <span style={{ color: colors.textDim }}>{ev.section.title.length > 30 ? ev.section.title.slice(0, 30) + "..." : ev.section.title}</span></>
        )}
        {ev.type === "comment" && (
          <>commented on <span style={{ color: ev.member.color }}>{ev.member.name}</span>'s <span style={{ color: colors.textDim }}>{ev.section.title.length > 25 ? ev.section.title.slice(0, 25) + "..." : ev.section.title}</span></>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ ...shared.card, padding: "18px 20px", height: "fit-content" }}>
      <div style={{ ...shared.sectionLabel, marginBottom: 16 }}>ACTIVITY</div>

      {recent.length === 0 && (
        <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textGhost, letterSpacing: 1 }}>
          No activity yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {visible.map(renderEvent)}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            width: "100%", marginTop: 10, padding: "10px 0",
            background: "none", border: `1px solid ${colors.cardBorder}`,
            borderRadius: 8, color: colors.textDimmer, cursor: "pointer",
            fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1,
            transition: "all .15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = colors.textDimmer; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = colors.cardBorder; }}
        >
          {expanded ? "SHOW LESS \u25B4" : `SHOW ${recent.length - 5} MORE \u25BE`}
        </button>
      )}
    </div>
  );
}
