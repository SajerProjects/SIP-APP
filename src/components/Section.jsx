import { useState } from "react";
import { timeAgo } from "../utils";
import { fonts, colors, shared } from "../styles";
import ABtn from "./ABtn";

export default function Section({ section, memberId, isOwner, me, allMembers, onUpdate, onComment }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(section.content);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);

  const startEdit = () => {
    if (!isOwner) return;
    setDraft(section.content);
    setEditing(true);
  };

  const saveEdit = () => {
    onUpdate(memberId, section.id, draft);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(section.content);
    setEditing(false);
  };

  const submitComment = () => {
    if (!commentText.trim() || !me) return;
    onComment(memberId, section.id, commentText.trim());
    setCommentText("");
  };

  return (
    <div style={{
      ...shared.card, padding: "22px 24px",
      borderLeft: `3px solid ${section.mandatory ? colors.accent : "#A78BFA"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={shared.sectionLabel}>{section.title.toUpperCase()}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {section.comments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} style={{
              background: "none", border: "none", color: colors.accent, cursor: "pointer",
              fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1, padding: 0,
            }}>
              {section.comments.length} COMMENT{section.comments.length !== 1 ? "S" : ""}
              {showComments ? " \u25B4" : " \u25BE"}
            </button>
          )}
          {isOwner && !editing && (
            <button onClick={startEdit} style={{
              background: "none", border: `1px solid ${colors.subtleBorder}`, color: colors.textDimmer,
              borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer",
              fontFamily: fonts.mono, letterSpacing: 1,
            }}>EDIT</button>
          )}
        </div>
      </div>

      {editing ? (
        <div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
            rows={6}
            placeholder="Write your thoughts..."
            style={{
              ...shared.input, padding: 14, fontSize: 14,
              resize: "vertical", lineHeight: 1.7,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <ABtn onClick={saveEdit}>SAVE</ABtn>
            <button onClick={cancelEdit} style={shared.cancelBtn}>CANCEL</button>
          </div>
        </div>
      ) : (
        <div
          onClick={startEdit}
          style={{
            fontSize: 14, color: section.content ? colors.textMuted : colors.textGhost,
            lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: isOwner ? "text" : "default",
            minHeight: 40, padding: "4px 0",
          }}
        >
          {section.content || (isOwner ? "Click to write..." : "Nothing here yet.")}
        </div>
      )}

      {showComments && section.comments.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${colors.cardBorder}` }}>
          {section.comments.map(c => {
            const author = allMembers.find(m => m.id === c.authorId);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{author?.avatar || "?"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: author?.color || colors.textDim }}>{author?.name || "Unknown"}</span>
                    <span style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmest }}>
                      {new Date(c.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: "#AAA", lineHeight: 1.6,
                    borderLeft: `2px solid ${author?.color || colors.textDimmest}`,
                    paddingLeft: 10,
                  }}>{c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {me && me !== memberId && (
        <div style={{ marginTop: showComments ? 10 : 16, paddingTop: showComments ? 0 : 14, borderTop: showComments ? "none" : `1px solid ${colors.cardBorder}` }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{allMembers.find(m => m.id === me)?.avatar}</span>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitComment(); }}
              placeholder="Leave a comment..."
              style={{
                ...shared.input, flex: 1, width: "auto", padding: "8px 12px", fontSize: 12,
              }}
            />
            {commentText.trim() && (
              <button onClick={submitComment} style={{
                background: colors.accent, color: colors.bg, border: "none", borderRadius: 6,
                padding: "7px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: fonts.mono, letterSpacing: 1,
              }}>POST</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
