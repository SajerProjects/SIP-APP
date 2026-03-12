import { useState, useEffect } from "react";
import { fonts, colors, shared } from "../styles";
import { timeAgo } from "../utils";

export default function SipGoals({ goals, lastEditedBy, lastEditedAt, allMembers, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(goals || "");

  useEffect(() => {
    if (!editing) setDraft(goals || "");
  }, [goals, editing]);

  const save = () => {
    onUpdate(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(goals || "");
    setEditing(false);
  };

  const editor = lastEditedBy ? allMembers.find(m => m.id === lastEditedBy) : null;

  return (
    <div style={{
      ...shared.card,
      padding: "18px 20px",
      width: 260,
      flexShrink: 0,
    }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 22, letterSpacing: 2, color: colors.text, marginBottom: 14 }}>SIP GOALS</div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            rows={8}
            placeholder="Set goals for the group..."
            style={{
              ...shared.input,
              padding: 12,
              fontSize: 13,
              resize: "vertical",
              lineHeight: 1.7,
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <button onClick={save} style={{
              background: colors.accent, color: colors.bg, border: "none", borderRadius: 6,
              padding: "7px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer",
              fontFamily: fonts.mono, letterSpacing: 1, flex: 1,
            }}>SAVE</button>
            <button onClick={cancel} style={{ ...shared.cancelBtn, padding: "7px 12px", flex: 1 }}>CANCEL</button>
          </div>
        </div>
      ) : (
        <div>
          <div
            onClick={() => setEditing(true)}
            style={{
              fontSize: 13,
              color: goals ? colors.textMuted : colors.textGhost,
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
              cursor: "text",
              minHeight: 60,
              padding: "4px 0",
            }}
          >
            {goals || "Click to set group goals..."}
          </div>

          {editor && lastEditedAt && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginTop: 12, paddingTop: 10,
              borderTop: `1px solid ${colors.cardBorder}`,
            }}>
              <span style={{ fontSize: 12 }}>{editor.avatar}</span>
              <span style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmest }}>
                {editor.name} &middot; {timeAgo(lastEditedAt)}
              </span>
            </div>
          )}

          <button
            onClick={() => setEditing(true)}
            style={{
              width: "100%", marginTop: 12, padding: "8px 0",
              background: "none", border: `1px dashed ${colors.subtleBorder}`,
              borderRadius: 6, color: colors.textDimmer, cursor: "pointer",
              fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1,
              transition: "all .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.color = colors.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.subtleBorder; e.currentTarget.style.color = colors.textDimmer; }}
          >
            EDIT
          </button>
        </div>
      )}
    </div>
  );
}
