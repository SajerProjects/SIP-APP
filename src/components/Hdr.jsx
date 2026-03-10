import { useState } from "react";
import { EMOJI_OPTIONS } from "../constants";
import { fonts, colors, shared } from "../styles";
import ABtn from "./ABtn";

export default function Hdr({ D, myMember, viewing, view, onBack, onWeekly, memberName, connected, onUpdateProfile, me }) {
  const [editing, setEditing] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAvatar, setProfileAvatar] = useState("");

  const openEdit = () => {
    if (!myMember) return;
    setProfileName(myMember.name);
    setProfileAvatar(myMember.avatar);
    setEditing(true);
  };

  const saveProfile = () => {
    if (profileName.trim() && me) {
      onUpdateProfile(me, { name: profileName.trim(), avatar: profileAvatar });
      setEditing(false);
    }
  };

  return (
    <>
      <header style={{ borderBottom: `1px solid ${colors.cardBorder}`, background: colors.bg, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", gap: 20, height: 58 }}>
          {(viewing || view === "weekly") ? (
            <button onClick={onBack} style={shared.backBtn}>
              <span style={{ fontSize: 16 }}>&larr;</span> BACK
            </button>
          ) : null}
          <span style={{
            fontFamily: fonts.heading, fontSize: 24, color: colors.accent,
            letterSpacing: 4, flexShrink: 0,
          }}>
            {view === "weekly" ? "WEEKLY" : viewing ? memberName?.toUpperCase() : "STRICTLY IN PROFIT"}
          </span>
          {!connected && (
            <span style={{ fontFamily: fonts.mono, fontSize: 9, color: colors.error, letterSpacing: 1 }}>OFFLINE</span>
          )}
          <div style={{ flex: 1 }} />
          {myMember && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{myMember.avatar}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: myMember.color }}>{myMember.name}</span>
              <button onClick={openEdit} style={{
                background: "none", border: `1px solid ${colors.subtleBorder}`, color: colors.textDimmer,
                borderRadius: 4, padding: "3px 8px", fontSize: 9, cursor: "pointer",
                fontFamily: fonts.mono, letterSpacing: 1, marginLeft: 4,
              }}>EDIT</button>
            </div>
          )}
        </div>
      </header>

      {editing && myMember && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.7)", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={(e) => { if (e.target === e.currentTarget) setEditing(false); }}>
          <div style={{
            ...shared.card, borderRadius: 18, padding: "28px 28px",
            width: "90%", maxWidth: 420,
          }}>
            <div style={{ ...shared.sectionLabel, marginBottom: 20, textAlign: "center" }}>EDIT PROFILE</div>

            <div style={{ marginBottom: 16 }}>
              <div style={shared.tinyLabel}>NAME</div>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveProfile(); }}
                autoFocus
                style={{ ...shared.input, padding: "10px 12px", fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={shared.tinyLabel}>AVATAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => setProfileAvatar(em)}
                    style={{
                      fontSize: 24, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                      border: profileAvatar === em ? `2px solid ${colors.accent}` : "2px solid transparent",
                      background: profileAvatar === em ? colors.inputBg : "transparent",
                      lineHeight: 1, transition: "all .1s",
                    }}
                  >{em}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <ABtn onClick={saveProfile}>SAVE</ABtn>
              <button onClick={() => setEditing(false)} style={shared.cancelBtn}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
