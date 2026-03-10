import { useState, useEffect, useCallback, useRef } from "react";
import { db, ref, onValue, set } from "./firebase";

// ─── Utils ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 9);
const HUES = ["#F0B429","#34D399","#F87171","#60A5FA","#A78BFA","#FB923C","#2DD4BF","#E879F9","#FBBF24","#F472B6","#818CF8","#FB7185","#4ADE80","#FACC15","#22D3EE"];

const DEFAULT_SECTIONS = [
  { title: "What am I currently working on?", mandatory: true },
  { title: "What ideas do I have?", mandatory: true },
  { title: "What are my goals?", mandatory: true },
];

const EMOJI_OPTIONS = [
  "🦁","🐺","🦊","🐯","🦅","🐍","🦈","🦏","⚡","🐲",
  "🐻","🦇","🐬","🦉","🐘","🦎","🐙","🦬","🐝","🦩",
  "🐨","🦖","🐳","🦚","🦍","🐆","🦂","🐊","🦜","🐧",
];

const WEEKLY_PROMPTS = [
  { key: "actions", label: "What did I do this week?" },
  { key: "learned", label: "What did I learn?" },
  { key: "tools", label: "What tools/resources did I use?" },
  { key: "wentWell", label: "What went well?" },
  { key: "wentWrong", label: "What didn't go well?" },
  { key: "nextFocus", label: "What's my focus next week?" },
];

function getWeekKey(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(weekKey) {
  const mon = new Date(weekKey + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const fmt = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(mon)} — ${fmt(sun)}`;
}

const INIT_DATA = { members: [], groupName: "SIP", weeklies: {} };
const DB_PATH = "sip_data";

// Per-device identity
function loadMyId() {
  try { return localStorage.getItem("sip_my_id") || null; } catch { return null; }
}
function persistMyId(id) {
  try {
    if (id) localStorage.setItem("sip_my_id", id);
    else localStorage.removeItem("sip_my_id");
  } catch {}
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [D, setD] = useState(null);
  const [myId] = useState(loadMyId);
  const [viewing, setViewing] = useState(null);   // member doc id
  const [view, setView] = useState("home");       // "home" | "weekly"
  const [connected, setConnected] = useState(true);
  const initialLoadDone = useRef(false);

  // Load fonts
  useEffect(() => {
    const id = "squad-google-fonts";
    if (!document.getElementById(id)) {
      const el = document.createElement("link");
      el.id = id;
      el.rel = "stylesheet";
      el.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Sora:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap";
      document.head.appendChild(el);
    }
  }, []);

  // Subscribe to Firebase
  useEffect(() => {
    const dataRef = ref(db, DB_PATH);
    const unsub = onValue(dataRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        // Ensure members is an array and comments arrays exist
        const data = { ...INIT_DATA, ...val };
        if (!Array.isArray(data.members)) data.members = Object.values(data.members || {});
        data.members.forEach(m => {
          if (!Array.isArray(m.sections)) m.sections = Object.values(m.sections || {});
          m.sections.forEach(s => {
            if (!s.comments) s.comments = [];
            else if (!Array.isArray(s.comments)) s.comments = Object.values(s.comments);
          });
        });
        if (!data.weeklies) data.weeklies = {};
        Object.values(data.weeklies).forEach(week => {
          if (!week.checkins) week.checkins = {};
          Object.values(week.checkins).forEach(ci => {
            if (ci.comments && !Array.isArray(ci.comments)) ci.comments = Object.values(ci.comments);
          });
        });
        setD(data);
      } else {
        set(dataRef, INIT_DATA);
        setD(INIT_DATA);
      }
      initialLoadDone.current = true;
      setConnected(true);
    }, () => {
      setConnected(false);
      if (!initialLoadDone.current) {
        setD(INIT_DATA);
        initialLoadDone.current = true;
      }
    });
    return () => unsub();
  }, []);

  // Write to Firebase
  const save = useCallback((data) => {
    set(ref(db, DB_PATH), data).catch(() => {});
  }, []);

  const update = useCallback((fn) => {
    setD(prev => {
      const next = fn(JSON.parse(JSON.stringify(prev)));
      save(next);
      return next;
    });
  }, [save]);

  if (!D) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#09090D", color: "#333", fontFamily: "monospace", fontSize: 11, letterSpacing: 4 }}>
      LOADING SIP...
    </div>
  );

  const me = myId;
  const myMember = me ? D.members.find(m => m.id === me) : null;

  // If no account yet, show join screen
  if (!myMember) {
    return <JoinScreen D={D} onJoin={(name, avatar) => {
      const newId = uid() + uid();
      const color = HUES[D.members.length % HUES.length];
      const newMember = {
        id: newId,
        name,
        avatar,
        color,
        joinedAt: new Date().toISOString(),
        sections: DEFAULT_SECTIONS.map(s => ({
          id: uid(), title: s.title, content: "", mandatory: true, comments: [],
        })),
      };
      persistMyId(newId);
      update(d => {
        d.members.push(newMember);
        return d;
      });
      window.location.reload();
    }} onRejoin={(memberId) => {
      persistMyId(memberId);
      window.location.reload();
    }} />;
  }

  const updateSection = (memberId, sectionId, content) => update(d => {
    const m = d.members.find(x => x.id === memberId);
    if (!m) return d;
    const s = m.sections.find(x => x.id === sectionId);
    if (s) { s.content = content; s.lastUpdated = new Date().toISOString(); }
    return d;
  });

  const addComment = (memberId, sectionId, text) => update(d => {
    const m = d.members.find(x => x.id === memberId);
    if (!m || !me) return d;
    const s = m.sections.find(x => x.id === sectionId);
    if (s) {
      s.comments.push({ id: uid(), authorId: me, text, date: new Date().toISOString() });
    }
    return d;
  });

  const addSection = (memberId, title) => update(d => {
    const m = d.members.find(x => x.id === memberId);
    if (!m) return d;
    m.sections.push({ id: uid(), title, content: "", mandatory: false, comments: [] });
    return d;
  });

  const updateMemberProfile = (memberId, fields) => update(d => {
    const m = d.members.find(x => x.id === memberId);
    if (m) Object.assign(m, fields);
    return d;
  });

  const updateCheckin = (weekKey, memberId, fields) => update(d => {
    if (!d.weeklies) d.weeklies = {};
    if (!d.weeklies[weekKey]) d.weeklies[weekKey] = { checkins: {} };
    if (!d.weeklies[weekKey].checkins) d.weeklies[weekKey].checkins = {};
    const existing = d.weeklies[weekKey].checkins[memberId] || {};
    d.weeklies[weekKey].checkins[memberId] = { ...existing, ...fields, filledAt: new Date().toISOString() };
    return d;
  });

  const addCheckinComment = (weekKey, memberId, text) => update(d => {
    if (!d.weeklies?.[weekKey]?.checkins?.[memberId]) return d;
    const ci = d.weeklies[weekKey].checkins[memberId];
    if (!ci.comments) ci.comments = [];
    ci.comments.push({ id: uid(), authorId: me, text, date: new Date().toISOString() });
    return d;
  });

  const member = viewing ? D.members.find(m => m.id === viewing) : null;

  const goHome = () => { setViewing(null); setView("home"); };

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#09090D", minHeight: "100vh", color: "#EEE8E0" }}>
      <Hdr
        D={D}
        myMember={myMember}
        viewing={viewing}
        view={view}
        onBack={goHome}
        onWeekly={() => { setViewing(null); setView("weekly"); }}
        memberName={member?.name}
        connected={connected}
        onUpdateProfile={updateMemberProfile}
        me={me}
      />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        {view === "weekly" ? (
          <WeeklyView
            D={D}
            me={me}
            onUpdateCheckin={updateCheckin}
            onAddCheckinComment={addCheckinComment}
            onOpenDoc={id => { setViewing(id); setView("home"); }}
          />
        ) : !viewing ? (
          <GridView D={D} me={me} onOpen={id => setViewing(id)} onWeekly={() => { setViewing(null); setView("weekly"); }} />
        ) : (
          <DocView
            member={member}
            me={me}
            allMembers={D.members}
            onUpdateSection={updateSection}
            onAddComment={addComment}
            onAddSection={addSection}
          />
        )}
      </div>
    </div>
  );
}

// ─── Join Screen ──────────────────────────────────────────────────────────────
const INVITE_CODE = "$ip2026";

function JoinScreen({ D, onJoin, onRejoin }) {
  const [mode, setMode] = useState("new"); // "new" or "rejoin"
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🦁");
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

  return (
    <div style={{
      fontFamily: "'Sora', sans-serif", background: "#09090D", minHeight: "100vh",
      color: "#EEE8E0", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ width: "90%", maxWidth: 440, textAlign: "center" }}>
        <h1 style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 64, margin: "0 0 8px",
          letterSpacing: 6, lineHeight: 1, color: "#F0B429",
        }}>SIP</h1>
        <SLabel style={{ marginBottom: 40 }}>
          {D.members.length > 0 ? `${D.members.length} MEMBER${D.members.length !== 1 ? "S" : ""} ALREADY HERE` : "BE THE FIRST TO JOIN"}
        </SLabel>

        {/* Toggle between new / rejoin */}
        {D.members.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 20 }}>
            <button onClick={() => setMode("new")} style={{
              background: mode === "new" ? "#1A1A26" : "transparent",
              border: `1px solid ${mode === "new" ? "#F0B429" : "#2A2A38"}`,
              color: mode === "new" ? "#F0B429" : "#555",
              borderRadius: 8, padding: "8px 18px", fontSize: 11, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, fontWeight: 600,
            }}>NEW ACCOUNT</button>
            <button onClick={() => setMode("rejoin")} style={{
              background: mode === "rejoin" ? "#1A1A26" : "transparent",
              border: `1px solid ${mode === "rejoin" ? "#F0B429" : "#2A2A38"}`,
              color: mode === "rejoin" ? "#F0B429" : "#555",
              borderRadius: 8, padding: "8px 18px", fontSize: 11, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, fontWeight: 600,
            }}>REJOIN</button>
          </div>
        )}

        {mode === "new" ? (
          <div style={{
            background: "#111118", border: "1px solid #1A1A22", borderRadius: 18,
            padding: "30px 28px", textAlign: "left",
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
              letterSpacing: 2, fontWeight: 600, marginBottom: 20, textAlign: "center",
            }}>CREATE YOUR ACCOUNT</div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>YOUR NAME</div>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                placeholder="Enter your name..."
                autoFocus
                style={{
                  width: "100%", background: "#1A1A26", border: "1px solid #252535", borderRadius: 8,
                  padding: "12px 14px", color: "#EEE8E0", fontSize: 15,
                  fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: codeError ? "#F87171" : "#555", letterSpacing: 2, marginBottom: 6 }}>
                {codeError ? "WRONG CODE — TRY AGAIN" : "INVITE CODE"}
              </div>
              <input
                value={code}
                onChange={e => { setCode(e.target.value); setCodeError(false); }}
                onKeyDown={e => { if (e.key === "Enter") handleJoin(); }}
                placeholder="Enter invite code..."
                style={{
                  width: "100%", background: "#1A1A26",
                  border: `1px solid ${codeError ? "#F87171" : "#252535"}`, borderRadius: 8,
                  padding: "12px 14px", color: "#EEE8E0", fontSize: 15,
                  fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>PICK YOUR AVATAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => setAvatar(em)}
                    style={{
                      fontSize: 26, padding: "7px 9px", borderRadius: 10, cursor: "pointer",
                      border: avatar === em ? "2px solid #F0B429" : "2px solid transparent",
                      background: avatar === em ? "#1A1A26" : "transparent",
                      lineHeight: 1, transition: "all .1s",
                    }}
                  >{em}</button>
                ))}
              </div>
            </div>

            <button
              onClick={handleJoin}
              disabled={!name.trim()}
              style={{
                width: "100%", background: name.trim() ? "#F0B429" : "#2A2A38",
                color: name.trim() ? "#09090D" : "#555",
                border: "none", borderRadius: 10, padding: "14px 0",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                fontWeight: 700, letterSpacing: 3, cursor: name.trim() ? "pointer" : "default",
                transition: "all .2s",
              }}
            >JOIN SIP</button>
          </div>
        ) : (
          <div style={{
            background: "#111118", border: "1px solid #1A1A22", borderRadius: 18,
            padding: "30px 28px", textAlign: "left",
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
              letterSpacing: 2, fontWeight: 600, marginBottom: 20, textAlign: "center",
            }}>RECLAIM YOUR ACCOUNT</div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 10 }}>TAP YOUR NAME</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {D.members.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setRejoinId(m.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      background: rejoinId === m.id ? "#1A1A26" : "transparent",
                      border: `1px solid ${rejoinId === m.id ? m.color : "#1A1A22"}`,
                      borderRadius: 10, padding: "12px 14px", cursor: "pointer",
                      transition: "all .15s",
                    }}
                  >
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{m.avatar}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: rejoinId === m.id ? m.color : "#888" }}>{m.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {rejoinId && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: rejoinCodeError ? "#F87171" : "#555", letterSpacing: 2, marginBottom: 6 }}>
                  {rejoinCodeError ? "WRONG CODE — TRY AGAIN" : "INVITE CODE"}
                </div>
                <input
                  value={rejoinCode}
                  onChange={e => { setRejoinCode(e.target.value); setRejoinCodeError(false); }}
                  onKeyDown={e => { if (e.key === "Enter") handleRejoin(); }}
                  placeholder="Enter invite code to confirm..."
                  autoFocus
                  style={{
                    width: "100%", background: "#1A1A26",
                    border: `1px solid ${rejoinCodeError ? "#F87171" : "#252535"}`, borderRadius: 8,
                    padding: "12px 14px", color: "#EEE8E0", fontSize: 15,
                    fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            )}

            <button
              onClick={handleRejoin}
              disabled={!rejoinId}
              style={{
                width: "100%", background: rejoinId ? "#F0B429" : "#2A2A38",
                color: rejoinId ? "#09090D" : "#555",
                border: "none", borderRadius: 10, padding: "14px 0",
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 13,
                fontWeight: 700, letterSpacing: 3, cursor: rejoinId ? "pointer" : "default",
                transition: "all .2s",
              }}
            >REJOIN SIP</button>
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

// ─── Header ───────────────────────────────────────────────────────────────────
function Hdr({ D, myMember, viewing, view, onBack, onWeekly, memberName, connected, onUpdateProfile, me }) {
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
      <header style={{ borderBottom: "1px solid #1A1A22", background: "#09090D", position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", gap: 20, height: 58 }}>
          {(viewing || view === "weekly") ? (
            <button onClick={onBack} style={{
              background: "none", border: "none", color: "#555", cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1,
              display: "flex", alignItems: "center", gap: 6, padding: 0,
            }}>
              <span style={{ fontSize: 16 }}>&larr;</span> BACK
            </button>
          ) : null}
          <span style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: 24, color: "#F0B429",
            letterSpacing: 4, flexShrink: 0,
          }}>
            {view === "weekly" ? "WEEKLY" : viewing ? memberName?.toUpperCase() : D.groupName}
          </span>
          {!connected && (
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#F87171", letterSpacing: 1 }}>OFFLINE</span>
          )}
          <div style={{ flex: 1 }} />
          {myMember && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>{myMember.avatar}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: myMember.color }}>{myMember.name}</span>
              <button onClick={openEdit} style={{
                background: "none", border: "1px solid #2A2A38", color: "#555",
                borderRadius: 4, padding: "3px 8px", fontSize: 9, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1, marginLeft: 4,
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
            background: "#111118", border: "1px solid #1A1A22", borderRadius: 18,
            padding: "28px 28px", width: "90%", maxWidth: 420,
          }}>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
              letterSpacing: 2, fontWeight: 600, marginBottom: 20, textAlign: "center",
            }}>EDIT PROFILE</div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>NAME</div>
              <input
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveProfile(); }}
                autoFocus
                style={{
                  width: "100%", background: "#1A1A26", border: "1px solid #252535", borderRadius: 8,
                  padding: "10px 12px", color: "#EEE8E0", fontSize: 14,
                  fontFamily: "'Sora', sans-serif", outline: "none", boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 6 }}>AVATAR</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {EMOJI_OPTIONS.map(em => (
                  <button
                    key={em}
                    onClick={() => setProfileAvatar(em)}
                    style={{
                      fontSize: 24, padding: "6px 8px", borderRadius: 8, cursor: "pointer",
                      border: profileAvatar === em ? "2px solid #F0B429" : "2px solid transparent",
                      background: profileAvatar === em ? "#1A1A26" : "transparent",
                      lineHeight: 1, transition: "all .1s",
                    }}
                  >{em}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <ABtn onClick={saveProfile}>SAVE</ABtn>
              <button onClick={() => setEditing(false)} style={{
                background: "none", border: "1px solid #2A2A38", color: "#555",
                borderRadius: 6, padding: "7px 14px", fontSize: 11, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
              }}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function ActivityFeed({ D, onOpen }) {
  // Collect all events
  const events = [];
  D.members.forEach(m => {
    // Member join events
    if (m.joinedAt) {
      events.push({ type: "join", date: m.joinedAt, member: m });
    }
    m.sections.forEach(s => {
      // Section edit events
      if (s.lastUpdated && s.content) {
        events.push({ type: "edit", date: s.lastUpdated, member: m, section: s });
      }
      // Comment events
      s.comments.forEach(c => {
        const author = D.members.find(x => x.id === c.authorId);
        events.push({ type: "comment", date: c.date, member: m, section: s, comment: c, author });
      });
    });
  });

  // Sort newest first
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Take recent 20
  const recent = events.slice(0, 20);

  return (
    <div style={{
      background: "#111118", border: "1px solid #1A1A22", borderRadius: 14,
      padding: "18px 20px", height: "fit-content",
    }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
        letterSpacing: 2, fontWeight: 600, marginBottom: 16,
      }}>ACTIVITY</div>

      {recent.length === 0 && (
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#333", letterSpacing: 1 }}>
          No activity yet.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {recent.map((ev, i) => (
          <div
            key={i}
            onClick={() => onOpen(ev.member.id)}
            style={{
              padding: "10px 10px", borderRadius: 8, cursor: "pointer",
              transition: "background .15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "#1A1A26"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>
                {ev.type === "comment" ? (ev.author?.avatar || "?") : ev.member.avatar}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600,
                color: ev.type === "comment" ? (ev.author?.color || "#888") : ev.member.color,
              }}>
                {ev.type === "comment" ? (ev.author?.name || "Unknown") : ev.member.name}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#444", marginLeft: "auto", flexShrink: 0 }}>
                {timeAgo(ev.date)}
              </span>
            </div>
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555",
              paddingLeft: 22, lineHeight: 1.5,
            }}>
              {ev.type === "join" && "joined SIP"}
              {ev.type === "edit" && (
                <>updated <span style={{ color: "#888" }}>{ev.section.title.length > 30 ? ev.section.title.slice(0, 30) + "..." : ev.section.title}</span></>
              )}
              {ev.type === "comment" && (
                <>commented on <span style={{ color: ev.member.color }}>{ev.member.name}</span>'s <span style={{ color: "#888" }}>{ev.section.title.length > 25 ? ev.section.title.slice(0, 25) + "..." : ev.section.title}</span></>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly View ──────────────────────────────────────────────────────────────
function WeeklyView({ D, me, onUpdateCheckin, onAddCheckinComment, onOpenDoc }) {
  const [selectedWeek, setSelectedWeek] = useState(getWeekKey());
  const [viewingMember, setViewingMember] = useState(null);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [commentText, setCommentText] = useState("");

  // Get available weeks (current + any past weeks with data)
  const allWeeks = new Set([selectedWeek]);
  if (D.weeklies) Object.keys(D.weeklies).forEach(k => allWeeks.add(k));
  const weeks = [...allWeeks].sort().reverse();

  const weekData = D.weeklies?.[selectedWeek] || { checkins: {} };
  const checkins = weekData.checkins || {};
  const checkedIn = D.members.filter(m => checkins[m.id]?.filledAt);
  const currentWeek = getWeekKey();

  // Start editing your check-in
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
        <button onClick={() => setViewingMember(null)} style={{
          background: "none", border: "none", color: "#555", cursor: "pointer",
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 1,
          display: "flex", alignItems: "center", gap: 6, padding: 0, marginBottom: 24,
        }}>
          <span style={{ fontSize: 16 }}>&larr;</span> ALL CHECK-INS
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <span style={{ fontSize: 36 }}>{m.avatar}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 2 }}>{m.name}</span>
              {isMe && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#F0B429", letterSpacing: 1 }}>YOU</span>}
            </div>
            <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={() => onOpenDoc(m.id)} style={{
            background: "none", border: "1px solid #2A2A38", color: "#555",
            borderRadius: 4, padding: "4px 10px", fontSize: 9, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
          }}>VIEW DOC</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
          {WEEKLY_PROMPTS.map(p => (
            <div key={p.key} style={{
              background: "#111118", border: "1px solid #1A1A22", borderRadius: 14,
              padding: "18px 22px", borderLeft: "3px solid #F0B429",
            }}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
                letterSpacing: 2, fontWeight: 600, marginBottom: 10,
              }}>{p.label.toUpperCase()}</div>
              <div style={{
                fontSize: 14, color: ci[p.key] ? "#CCC" : "#333",
                lineHeight: 1.75, whiteSpace: "pre-wrap", minHeight: 24,
              }}>
                {ci[p.key] || "—"}
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
                    <span style={{ fontSize: 12, fontWeight: 600, color: author?.color || "#888" }}>{author?.name || "Unknown"}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#444" }}>
                      {timeAgo(c.date)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: "#AAA", lineHeight: 1.6, borderLeft: `2px solid ${author?.color || "#444"}`, paddingLeft: 10 }}>{c.text}</div>
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
                style={{
                  flex: 1, background: "#1A1A26", border: "1px solid #252535", borderRadius: 8,
                  padding: "8px 12px", color: "#EEE8E0", fontSize: 12,
                  fontFamily: "'Sora', sans-serif", outline: "none",
                }}
              />
              {commentText.trim() && (
                <button onClick={() => { onAddCheckinComment(selectedWeek, viewingMember, commentText.trim()); setCommentText(""); }} style={{
                  background: "#F0B429", color: "#09090D", border: "none", borderRadius: 6,
                  padding: "7px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
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
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 40, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
            CHECK IN<span style={{ color: "#F0B429" }}>.</span>
          </h1>
          <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {WEEKLY_PROMPTS.map(p => (
            <div key={p.key}>
              <div style={{
                fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#888",
                letterSpacing: 2, fontWeight: 600, marginBottom: 8,
              }}>{p.label.toUpperCase()}</div>
              <textarea
                value={drafts[p.key] || ""}
                onChange={e => setDrafts(prev => ({ ...prev, [p.key]: e.target.value }))}
                rows={3}
                placeholder="Write here..."
                style={{
                  width: "100%", background: "#1A1A26", border: "1px solid #252535",
                  borderRadius: 8, padding: 14, color: "#EEE8E0", fontSize: 14,
                  fontFamily: "'Sora', sans-serif", resize: "vertical", boxSizing: "border-box",
                  outline: "none", lineHeight: 1.7,
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
          <ABtn onClick={saveCheckin}>SUBMIT CHECK-IN</ABtn>
          <button onClick={() => setEditing(false)} style={{
            background: "none", border: "1px solid #2A2A38", color: "#555",
            borderRadius: 6, padding: "7px 14px", fontSize: 11, cursor: "pointer",
            fontFamily: "'IBM Plex Mono', monospace",
          }}>CANCEL</button>
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
          <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
            WEEKLY<span style={{ color: "#F0B429" }}>.</span>
          </h1>
          <SLabel>{formatWeekLabel(selectedWeek)}</SLabel>
        </div>
        <div style={{
          fontFamily: "'Bebas Neue', cursive", fontSize: 28,
          color: checkedIn.length === D.members.length ? "#34D399" : "#F0B429",
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
                background: selectedWeek === w ? "#1A1A26" : "transparent",
                border: `1px solid ${selectedWeek === w ? "#F0B429" : "#1A1A22"}`,
                color: selectedWeek === w ? "#F0B429" : "#555",
                borderRadius: 6, padding: "6px 12px", fontSize: 10, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
              }}
            >{w === currentWeek ? "THIS WEEK" : formatWeekLabel(w)}</button>
          ))}
        </div>
      )}

      {/* Your check-in CTA */}
      {selectedWeek === currentWeek && (
        <div style={{
          background: "#111118", border: `1px solid ${myCheckin ? "#1A1A22" : "#F0B429" + "40"}`,
          borderRadius: 14, padding: "18px 22px", marginBottom: 24,
          borderLeft: "3px solid #F0B429",
        }}>
          {myCheckin ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#34D399", letterSpacing: 2, fontWeight: 600 }}>
                  YOU'VE CHECKED IN
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#444", marginTop: 4 }}>
                  {timeAgo(myCheckin.filledAt)}
                </div>
              </div>
              <button onClick={startEdit} style={{
                background: "none", border: "1px solid #2A2A38", color: "#555",
                borderRadius: 6, padding: "6px 14px", fontSize: 10, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
              }}>UPDATE</button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888", letterSpacing: 2, fontWeight: 600 }}>
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
                background: "#111118", border: `1px solid ${isMe ? m.color + "30" : "#1A1A22"}`, borderRadius: 12,
                padding: "14px 20px", cursor: ci ? "pointer" : "default", transition: "all .2s",
                borderLeft: `3px solid ${m.color}`,
                display: "flex", alignItems: "center", gap: 14,
                opacity: ci ? 1 : 0.5,
              }}
              onMouseEnter={e => { if (ci) { e.currentTarget.style.borderColor = m.color + "60"; e.currentTarget.style.background = "#141420"; } }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? m.color + "30" : "#1A1A22"; e.currentTarget.style.borderLeftColor = m.color; e.currentTarget.style.background = "#111118"; }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{m.avatar}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                  {isMe && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#F0B429", letterSpacing: 1 }}>YOU</span>}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 2 }}>
                  {ci ? `checked in ${timeAgo(ci.filledAt)}` : "not yet"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                {commentCount > 0 && (
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#F0B429" }}>
                    {commentCount} {commentCount === 1 ? "COMMENT" : "COMMENTS"}
                  </span>
                )}
                {ci ? (
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "#34D399" }}>&#10003;</span>
                ) : (
                  <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "#333" }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Grid View (Home) ─────────────────────────────────────────────────────────
function GridView({ D, me, onOpen, onWeekly }) {
  const currentWeek = getWeekKey();
  const weekData = D.weeklies?.[currentWeek] || { checkins: {} };
  const checkins = weekData.checkins || {};
  const checkedIn = D.members.filter(m => checkins[m.id]?.filledAt).length;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, margin: "0 0 4px", letterSpacing: 3, lineHeight: 1 }}>
          SIP<span style={{ color: "#F0B429" }}>.</span>
        </h1>
        <SLabel>{D.members.length} MEMBER{D.members.length !== 1 ? "S" : ""}</SLabel>
      </div>

      <button onClick={onWeekly} style={{
        width: "100%", background: "#111118", border: "1px solid #1A1A22", borderRadius: 12,
        padding: "16px 22px", cursor: "pointer", marginBottom: 24,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "all .2s", borderLeft: "3px solid #F0B429",
      }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#F0B429" + "60"; e.currentTarget.style.background = "#141420"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "#1A1A22"; e.currentTarget.style.borderLeftColor = "#F0B429"; e.currentTarget.style.background = "#111118"; }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: "#F0B429", letterSpacing: 3 }}>
            WEEKLY CHECK-IN
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 2 }}>
            {formatWeekLabel(currentWeek)}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, color: checkedIn === D.members.length ? "#34D399" : "#F0B429" }}>
              {checkedIn}/{D.members.length}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: "#444", letterSpacing: 1 }}>CHECKED IN</div>
          </div>
          <span style={{ color: "#555", fontSize: 18 }}>&rarr;</span>
        </div>
      </button>

      {D.members.length === 0 && (
        <div style={{ textAlign: "center", padding: "56px 0", color: "#333", fontFamily: "monospace", fontSize: 11, letterSpacing: 2 }}>
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
                background: "#111118", border: `1px solid ${isMe ? m.color + "30" : "#1A1A22"}`, borderRadius: 12,
                padding: "16px 20px", cursor: "pointer", transition: "all .2s",
                borderLeft: `3px solid ${m.color}`,
                display: "flex", alignItems: "center", gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + "60"; e.currentTarget.style.background = "#141420"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = isMe ? m.color + "30" : "#1A1A22"; e.currentTarget.style.borderLeftColor = m.color; e.currentTarget.style.background = "#111118"; }}
            >
              <div style={{
                fontSize: 32, background: "#1A1A26", borderRadius: 10,
                padding: "8px 10px", lineHeight: 1, flexShrink: 0,
              }}>{m.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{m.name}</span>
                  {isMe && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#F0B429", letterSpacing: 1 }}>YOU</span>}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 1, marginTop: 3 }}>
                  {m.sections.length} SECTIONS
                </div>
              </div>
              <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: filled > 0 ? "#34D399" : "#333" }}>{filled}/{m.sections.length}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: "#444", letterSpacing: 1 }}>FILLED</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, color: totalComments > 0 ? "#F0B429" : "#333" }}>{totalComments}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: "#444", letterSpacing: 1 }}>COMMENTS</div>
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

// ─── Doc View ─────────────────────────────────────────────────────────────────
function DocView({ member, me, allMembers, onUpdateSection, onAddComment, onAddSection }) {
  const [addingSection, setAddingSection] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const isOwner = me === member.id;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 36 }}>
        <div style={{
          fontSize: 48, background: "#1A1A26", borderRadius: 14,
          padding: "10px 14px", lineHeight: 1,
        }}>{member.avatar}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontFamily: "'Bebas Neue', cursive", fontSize: 40, margin: 0,
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
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1A1A22" }}>
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
                  flex: 1, background: "#1A1A26", border: "1px solid #252535", borderRadius: 8,
                  padding: "10px 12px", color: "#EEE8E0", fontSize: 13,
                  fontFamily: "'Sora', sans-serif", outline: "none",
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
                background: "none", border: "1px solid #2A2A38", color: "#555",
                borderRadius: 6, padding: "8px 14px", fontSize: 11, cursor: "pointer",
              }}>CANCEL</button>
            </div>
          ) : (
            <button onClick={() => setAddingSection(true)} style={{
              background: "none", border: "1px dashed #2A2A38", color: "#555",
              borderRadius: 10, padding: "14px 0", width: "100%", cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: 2,
              transition: "all .15s",
            }}>+ ADD A SECTION</button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
function Section({ section, memberId, isOwner, me, allMembers, onUpdate, onComment }) {
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
      background: "#111118", border: "1px solid #1A1A22", borderRadius: 14,
      padding: "22px 24px", borderLeft: `3px solid ${section.mandatory ? "#F0B429" : "#A78BFA"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{
          fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "#888",
          letterSpacing: 2, fontWeight: 600,
        }}>{section.title.toUpperCase()}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {section.comments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} style={{
              background: "none", border: "none", color: "#F0B429", cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: 1,
              padding: 0,
            }}>
              {section.comments.length} COMMENT{section.comments.length !== 1 ? "S" : ""}
              {showComments ? " ▴" : " ▾"}
            </button>
          )}
          {isOwner && !editing && (
            <button onClick={startEdit} style={{
              background: "none", border: "1px solid #2A2A38", color: "#555",
              borderRadius: 4, padding: "3px 8px", fontSize: 10, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
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
              width: "100%", background: "#1A1A26", border: "1px solid #252535",
              borderRadius: 8, padding: 14, color: "#EEE8E0", fontSize: 14,
              fontFamily: "'Sora', sans-serif", resize: "vertical", boxSizing: "border-box",
              outline: "none", lineHeight: 1.7,
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <ABtn onClick={saveEdit}>SAVE</ABtn>
            <button onClick={cancelEdit} style={{
              background: "none", border: "1px solid #2A2A38", color: "#555",
              borderRadius: 6, padding: "7px 14px", fontSize: 11, cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
            }}>CANCEL</button>
          </div>
        </div>
      ) : (
        <div
          onClick={startEdit}
          style={{
            fontSize: 14, color: section.content ? "#CCC" : "#333",
            lineHeight: 1.75, whiteSpace: "pre-wrap", cursor: isOwner ? "text" : "default",
            minHeight: 40, padding: "4px 0",
          }}
        >
          {section.content || (isOwner ? "Click to write..." : "Nothing here yet.")}
        </div>
      )}

      {showComments && section.comments.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #1A1A22" }}>
          {section.comments.map(c => {
            const author = allMembers.find(m => m.id === c.authorId);
            return (
              <div key={c.id} style={{
                display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{author?.avatar || "?"}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: author?.color || "#888" }}>{author?.name || "Unknown"}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#444" }}>
                      {new Date(c.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{
                    fontSize: 13, color: "#AAA", lineHeight: 1.6,
                    borderLeft: `2px solid ${author?.color || "#444"}`,
                    paddingLeft: 10,
                  }}>{c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {me && me !== memberId && (
        <div style={{ marginTop: showComments ? 10 : 16, paddingTop: showComments ? 0 : 14, borderTop: showComments ? "none" : "1px solid #1A1A22" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{allMembers.find(m => m.id === me)?.avatar}</span>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") submitComment(); }}
              placeholder="Leave a comment..."
              style={{
                flex: 1, background: "#1A1A26", border: "1px solid #252535", borderRadius: 8,
                padding: "8px 12px", color: "#EEE8E0", fontSize: 12,
                fontFamily: "'Sora', sans-serif", outline: "none",
              }}
            />
            {commentText.trim() && (
              <button onClick={submitComment} style={{
                background: "#F0B429", color: "#09090D", border: "none", borderRadius: 6,
                padding: "7px 12px", fontSize: 10, fontWeight: 700, cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1,
              }}>POST</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Micro-components ─────────────────────────────────────────────────────────
function SLabel({ children, style }) {
  return <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#555", letterSpacing: 3, ...style }}>{children}</div>;
}

function ABtn({ children, onClick, style }) {
  return (
    <button onClick={onClick} style={{
      background: "#F0B429", color: "#09090D", border: "none", borderRadius: 8,
      padding: "9px 18px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 11,
      fontWeight: 700, letterSpacing: 2, cursor: "pointer", ...style,
    }}>{children}</button>
  );
}
