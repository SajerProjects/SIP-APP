import { useState } from "react";
import { timeAgo, getWeekKey, formatWeekLabel } from "../utils";
import { WEEKLY_PROMPTS } from "../constants";
import { fonts, colors, shared } from "../styles";
import SLabel from "./SLabel";
import ABtn from "./ABtn";

export default function WeeklyView({ D, me, onUpdateCheckin, onAddCheckinComment, onOpenDoc }) {
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const [viewingMember, setViewingMember] = useState(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [commentText, setCommentText] = useState("");

  const allWeeks = new Set([selectedWeek]);
  if (D.weeklies) Object.keys(D.weeklies).forEach(k => allWeeks.add(k));
  const weeks = [...allWeeks].sort().reverse();

  const weekData = D.weeklies?.[selectedWeek] || { checkins: {} };
  const checkins = weekData.checkins || {};
  const checkedIn = D.members.filter(m => checkins[m.id]?.filledAt);
  const currentWeek = getWeekKey();

  const startEdit = () => {
    const mine = checkins[me] || {};
    const d = {};
    WEEKLY_PROMPTS.forEach(p => { d[p.key] = mine[p.key] || ""; });
    setDrafts(d);
    setEditing(true);
  };

  const saveCheckin = () => {
    onUpdateCheckin(selectedWeek, me, drafts);
    setEditing(false);
  };

  // Viewing a specific member's check-in
  if (viewingMember) {
    const m = D.members.find(x => x.id === viewingMember);
    const ci = checkins[viewingMember];
    if (!m || !ci) { setViewingMember(null); return null; }
    const comments = ci.comments || [];
    const isMe = viewingMember === me;

    return (
      <div>
        <button onClick={() => setViewingMember(null)} style={{ ...shared.backBtn, marginBottom: 24 }}>
          <span style={{ fontSize: 16 }}>&larr;</span> ALL CHECK-INS
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{m.avatar}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: fonts.heading, fontSize: 32, letterSpacing: 2 }}>{m.name}</span>
              {isMe && <span style={{ fontFamily: fonts.mono, fontSize: 8, color: colors.accent, letterSpacing: 1 }}>YOU</span>}
            </div>
            <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => onOpenDoc(m.id)} style={{
            background: "none", border: `1px solid ${colors.subtleBorder}`, color: colors.textDimmer,
            borderRadius: 4, padding: "4px 10px", fontSize: 9, cursor: "pointer",
            fontFamily: fonts.mono, letterSpacing: 1,
          }}>VIEW DOC</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {WEEKLY_PROMPTS.map(p => (
            <div key={p.key} style={{
              ...shared.card, padding: "18px 22px", borderLeft: `3px solid ${colors.accent}`,
            }}>
              <div style={{ ...shared.sectionLabel, marginBottom: 10 }}>{p.label.toUpperCase()}</div>
              <div style={{
                fontSize: 14, color: ci[p.key] ? colors.textMuted : colors.textGhost,
                lineHeight: 1.75, whiteSpace: "pre-wrap", minHeight: 24,
              }}>
                {ci[p.key] || "\u2014"}
              </div>
            </div>
          ))}
        </div>

        {/* Comments on this check-in */}
        <div style={{ marginTop: 24 }}>
          <SLabel style={{ marginBottom: 12 }}>{comments.length} COMMENT{comments.length !== 1 ? "S" : ""}</SLabel>
          {comments.map(c => {
            const author = D.members.find(x => x.id === c.authorId);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{author?.avatar || "?"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: author?.color || colors.textDim }}>{author?.name || "Unknown"}</span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmest }}>
                      {timeAgo(c.date)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: colors.textMuted, lineHeight: 1.6, borderLeft: `2px solid ${author?.color || colors.textDimmest}`, paddingLeft: 10 }}>{c.text}</div>
                </div>
              </div>
            );
          })}

          {me && me !== viewingMember && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 12 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{D.members.find(x => x.id === me)?.avatar}</span>
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) { onAddCheckinComment(selectedWeek, viewingMember, commentText.trim()); setCommentText(""); } }}
                placeholder="Leave a comment on this check-in..."
                style={{ ...shared.input, flex: 1, width: "auto", padding: "8px 12px", fontSize: 12 }}
              />
              {commentText.trim() && (
                <button onClick={() => { onAddCheckinComment(selectedWeek, viewingMember, commentText.trim()); setCommentText(""); }} style={{
                  background: colors.accent, color: colors.bg, border: "none", borderRadius: 6,
                  padding: "7px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                  fontFamily: fonts.mono, letterSpacing: 1,
                }}>POST</button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Editing your own check-in
  if (editing) {
    return (
      <div>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: fonts.heading, fontSize: 40, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
            CHECK IN<span style={{ color: colors.accent }}>.</span>
          </h1>
          <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {WEEKLY_PROMPTS.map(p => (
            <div key={p.key}>
              <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDim, letterSpacing: 2, fontWeight: 600, marginBottom: 8 }}>
                {p.label.toUpperCase()}
              </div>
              <textarea
                value={drafts[p.key] || ""}
                onChange={e => setDrafts(prev => ({ ...prev, [p.key]: e.target.value }))}
                rows={3}
                placeholder="Write here..."
                style={{
                  ...shared.input, padding: 14, fontSize: 14,
                  resize: "vertical", lineHeight: 1.7,
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <ABtn onClick={saveCheckin}>SUBMIT CHECK-IN</ABtn>
          <button onClick={() => setEditing(false)} style={shared.cancelBtn}>CANCEL</button>
        </div>
      </div>
    );
  }

  // Overview
  const myCheckin = checkins[me];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: fonts.heading, fontSize: 52, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
            WEEKLY<span style={{ color: colors.accent }}>.</span>
          </h1>
          <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
        </div>
        <div style={{
          fontFamily: fonts.heading, fontSize: 28,
          color: checkedIn.length === D.members.length ? colors.success : colors.accent,
        }}>
          {checkedIn.length}/{D.members.length}
        </div>
      </div>

      {/* Week selector */}
      {weeks.length > 1 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {weeks.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              style={{
                background: selectedWeek === w ? colors.inputBg : "transparent",
                border: `1px solid ${selectedWeek === w ? colors.accent : colors.cardBorder}`,
                color: selectedWeek === w ? colors.accent : colors.textDimmer,
                borderRadius: 6, padding: "6px 12px", fontSize: 10, cursor: "pointer",
                fontFamily: fonts.mono, letterSpacing: 1,
              }}
            >{w === currentWeek ? "THIS WEEK" : formatWeekLabel(w)}</button>
          ))}
        </div>
      )}

      {/* Your check-in CTA */}
      {selectedWeek === currentWeek && (
        <div style={{
          ...shared.card,
          border: `1px solid ${myCheckin ? colors.cardBorder : colors.accent + "40"}`,
          padding: "18px 22px", marginBottom: 24, borderLeft: `3px solid ${colors.accent}`,
        }}>
          {myCheckin ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.success, letterSpacing: 2, fontWeight: 600 }}>
                  YOU'VE CHECKED IN
                </div>
                <div style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmest, marginTop: 4 }}>
                  {timeAgo(myCheckin.filledAt)}
                </div>
              </div>
              <button onClick={startEdit} style={{
                background: colors.accent, color: colors.bg, border: "none",
                borderRadius: 8, padding: "9px 18px", fontSize: 11, cursor: "pointer",
                fontFamily: fonts.mono, fontWeight: 700, letterSpacing: 2,
              }}>UPDATE</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.textDim, letterSpacing: 2, fontWeight: 600 }}>
                YOU HAVEN'T CHECKED IN YET
              </div>
              <ABtn onClick={startEdit}>CHECK IN</ABtn>
            </div>
          )}
        </div>
      )}

      {/* Member list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {D.members.map(m => {
          const ci = checkins[m.id];
          const isMe = m.id === me;
          const commentCount = ci?.comments ? (Array.isArray(ci.comments) ? ci.comments.length : Object.values(ci.comments).length) : 0;
          return (
            <div
              key={m.id}
              onClick={() => ci ? setViewingMember(m.id) : null}
              style={{
                background: colors.card, border: `1px solid ${isMe ? m.color + "30" : colors.cardBorder}`, borderRadius: 12,
                padding: "14px 20px", cursor: ci ? "pointer" : "default", transition: "all .2s",
                borderLeft: `3px solid ${m.color}`,
                display: "flex", alignItems: "center", gap: 14,
                opacity: ci ? 1 : 0.5,
              }}
              onMouseEnter={e => { if (ci) { e.currentTarget.style.borderColor = m.color + "60"; e.currentTarget.style.background = colors.hoverCard; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? m.color + "30" : colors.cardBorder; e.currentTarget.style.borderLeftColor = m.color; e.currentTarget.style.background = colors.card; }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{m.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                  {isMe && <span style={{ fontFamily: fonts.mono, fontSize: 8, color: colors.accent, letterSpacing: 1 }}>YOU</span>}
                </div>
                <div style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.textDimmer, letterSpacing: 1, marginTop: 2 }}>
                  {ci ? `checked in ${timeAgo(ci.filledAt)}` : "not yet"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {commentCount > 0 && (
                  <span style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.accent }}>
                    {commentCount} {commentCount === 1 ? "COMMENT" : "COMMENTS"}
                  </span>
                )}
                {ci ? (
                  <span style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.success }}>&#10003;</span>
                ) : (
                  <span style={{ fontFamily: fonts.heading, fontSize: 20, color: colors.textGhost }}>&mdash;</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
