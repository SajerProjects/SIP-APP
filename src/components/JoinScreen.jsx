import { useState } from "react";
import { EMOJI_OPTIONS, INVITE_CODE } from "../constants";
import { fonts, colors, shared } from "../styles";
import SLabel from "./SLabel";

export default function JoinScreen({ D, onJoin, onRejoin }) {
  const [mode, setMode] = useState("new");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("\u{1F981}");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [rejoinId, setRejoinId] = useState(null);
  const [rejoinCode, setRejoinCode] = useState("");
  const [rejoinCodeError, setRejoinCodeError] = useState(false);

  const handleJoin = () => {
    if (!name.trim()) return;
    if (code !== INVITE_CODE) { setCodeError(true); return; }
    setCodeError(false);
    onJoin(name.trim(), avatar);
  };

  const handleRejoin = () => {
    if (!rejoinId) return;
    if (rejoinCode !== INVITE_CODE) { setRejoinCodeError(true); return; }
    setRejoinCodeError(false);
    onRejoin(rejoinId);
  };

  const toggleStyle = (active) => ({
    background: active ? colors.inputBg : "transparent",
    border: `1px solid ${active ? colors.accent : colors.subtleBorder}`,
    color: active ? colors.accent : colors.textDimmer,
    borderRadius: 8, padding: "8px 18px", fontSize: 11, cursor: "pointer",
    fontFamily: fonts.mono, letterSpacing: 1, fontWeight: 600,
  });

  const avatarBtnStyle = (selected) => ({
    fontSize: 26, padding: "7px 9px", borderRadius: 10, cursor: "pointer",
    border: selected ? `2px solid ${colors.accent}` : "2px solid transparent",
    background: selected ? colors.inputBg : "transparent",
    lineHeight: 1, transition: "all .1s",
  });

  const submitBtnStyle = (enabled) => ({
    width: "100%", background: enabled ? colors.accent : colors.subtleBorder,
    color: enabled ? colors.bg : colors.textDimmer,
    border: "none", borderRadius: 10, padding: "14px 0",
    fontFamily: fonts.mono, fontSize: 13,
    fontWeight: 700, letterSpacing: 3, cursor: enabled ? "pointer" : "default",
    transition: "all .2s",
  });

  return (
    <div style={{
      fontFamily: fonts.body, background: colors.bg, minHeight: "100vh",
      color: colors.text, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "90%", maxWidth: 440, textAlign: "center" }}>
        <h1 style={{
          fontFamily: fonts.heading, fontSize: 64, margin: "0 0 8px",
          letterSpacing: 6, lineHeight: 1, color: colors.accent,
        }}>SIP</h1>
        <SLabel style={{ marginBottom: 40 }}>
          {D.members.length > 0 ? `${D.members.length} MEMBER${D.members.length !== 1 ? "S" : ""} ALREADY HERE` : "BE THE FIRST TO JOIN"}
        </SLabel>

        {D.members.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
            <button onClick={() => setMode("new")} style={toggleStyle(mode === "new")}>NEW ACCOUNT</button>
            <button onClick={() => setMode("rejoin")} style={toggleStyle(mode === "rejoin")}>REJOIN</button>
          </div>
        )}

        {mode === "new" ? (
          <div style={{ ...shared.card, borderRadius: 18, padding: "30px 28px", textAlign: "left" }}>
            <div style={{ ...shared.sectionLabel, marginBottom: 20, textAlign: "center" }}>CREATE YOUR ACCOUNT</div>

            <div style={{ marginBottom: 18 }}>
              <div style={shared.tinyLabel}>YOUR NAME</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                placeholder="Enter your name..."
                autoFocus
                style={shared.input}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ ...shared.tinyLabel, color: codeError ? colors.error : colors.textDimmer }}>
                {codeError ? "WRONG CODE \u2014 TRY AGAIN" : "INVITE CODE"}
              </div>
              <input
                value={code}
                onChange={e => { setCode(e.target.value); setCodeError(false); }}
                onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                placeholder="Enter invite code..."
                style={{ ...shared.input, border: `1px solid ${codeError ? colors.error : colors.inputBorder}` }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={shared.tinyLabel}>PICK YOUR AVATAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {EMOJI_OPTIONS.map(em => (
                  <button key={em} onClick={() => setAvatar(em)} style={avatarBtnStyle(avatar === em)}>{em}</button>
                ))}
              </div>
            </div>

            <button onClick={handleJoin} disabled={!name.trim()} style={submitBtnStyle(!!name.trim())}>
              JOIN SIP
            </button>
          </div>
        ) : (
          <div style={{ ...shared.card, borderRadius: 18, padding: "30px 28px", textAlign: "left" }}>
            <div style={{ ...shared.sectionLabel, marginBottom: 20, textAlign: "center" }}>RECLAIM YOUR ACCOUNT</div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ ...shared.tinyLabel, marginBottom: 10 }}>TAP YOUR NAME</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {D.members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setRejoinId(m.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: rejoinId === m.id ? colors.inputBg : "transparent",
                      border: `1px solid ${rejoinId === m.id ? m.color : colors.cardBorder}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{m.avatar}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: rejoinId === m.id ? m.color : colors.textDim }}>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {rejoinId && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ ...shared.tinyLabel, color: rejoinCodeError ? colors.error : colors.textDimmer }}>
                  {rejoinCodeError ? "WRONG CODE \u2014 TRY AGAIN" : "INVITE CODE"}
                </div>
                <input
                  value={rejoinCode}
                  onChange={e => { setRejoinCode(e.target.value); setRejoinCodeError(false); }}
                  onKeyDown={e => { if (e.key === "Enter") handleRejoin(); }}
                  placeholder="Enter invite code to confirm..."
                  autoFocus
                  style={{ ...shared.input, border: `1px solid ${rejoinCodeError ? colors.error : colors.inputBorder}` }}
                />
              </div>
            )}

            <button onClick={handleRejoin} disabled={!rejoinId} style={submitBtnStyle(!!rejoinId)}>
              REJOIN SIP
            </button>
          </div>
        )}

        {D.members.length > 0 && mode === "new" && (
          <div style={{ marginTop: 28 }}>
            <SLabel style={{ marginBottom: 10 }}>ALREADY IN THE GROUP</SLabel>
            <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              {D.members.map(m => (
                <div key={m.id} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 28 }}>{m.avatar}</div>
                  <div style={{ fontSize: 10, color: m.color, fontWeight: 600, marginTop: 2 }}>{m.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
