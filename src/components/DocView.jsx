import { useState } from "react";
import { uid } from "../utils";
import { fonts, colors, shared } from "../styles";
import SLabel from "./SLabel";
import ABtn from "./ABtn";
import Section from "./Section";

export default function DocView({ member, me, allMembers, onUpdateSection, onAddComment, onAddSection }) {
  const [addingSection, setAddingSection] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const isOwner = me === member.id;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
        <div style={{
          fontSize: 48, background: colors.inputBg, borderRadius: 14,
          padding: "10px 14px", lineHeight: 1,
        }}>{member.avatar}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: fonts.heading, fontSize: 40, margin: 0,
            letterSpacing: 3, lineHeight: 1,
          }}>
            {member.name}<span style={{ color: member.color }}>.</span>
          </h1>
          <SLabel style={{ marginTop: 6 }}>
            {isOwner ? "YOUR DOCUMENT" : `${member.name.toUpperCase()}'S DOCUMENT`}
          </SLabel>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {member.sections.map(section => (
          <Section
            key={section.id}
            section={section}
            memberId={member.id}
            isOwner={isOwner}
            me={me}
            allMembers={allMembers}
            onUpdate={onUpdateSection}
            onComment={onAddComment}
          />
        ))}
      </div>

      {isOwner && (
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${colors.cardBorder}` }}>
          {addingSection ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Section title..."
                autoFocus
                onKeyDown={e => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    onAddSection(member.id, newTitle.trim());
                    setNewTitle("");
                    setAddingSection(false);
                  }
                  if (e.key === "Escape") { setNewTitle(""); setAddingSection(false); }
                }}
                style={{
                  ...shared.input, flex: 1, width: "auto", padding: "10px 12px", fontSize: 13,
                }}
              />
              <ABtn onClick={() => {
                if (newTitle.trim()) {
                  onAddSection(member.id, newTitle.trim());
                  setNewTitle("");
                  setAddingSection(false);
                }
              }}>ADD</ABtn>
              <button onClick={() => { setNewTitle(""); setAddingSection(false); }} style={{
                ...shared.cancelBtn, padding: "8px 14px",
              }}>CANCEL</button>
            </div>
          ) : (
            <button onClick={() => setAddingSection(true)} style={{
              background: "none", border: `1px dashed ${colors.subtleBorder}`, color: colors.textDimmer,
              borderRadius: 10, padding: "14px 0", width: "100%", cursor: "pointer",
              fontFamily: fonts.mono, fontSize: 11, letterSpacing: 2,
              transition: "all .15s",
            }}>+ ADD A SECTION</button>
          )}
        </div>
      )}
    </div>
  );
}
