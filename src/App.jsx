import { useState, useEffect, useCallback, useRef } from "react";
import { db, ref, onValue, set } from "./firebase";
import { uid, loadMyId, persistMyId } from "./utils";
import { HUES, DEFAULT_SECTIONS, INIT_DATA, DB_PATH } from "./constants";
import { fonts, colors } from "./styles";
import Hdr from "./components/Hdr";
import JoinScreen from "./components/JoinScreen";
import GridView from "./components/GridView";
import WeeklyView from "./components/WeeklyView";
import DocView from "./components/DocView";

export default function App() {
  const [D, setD] = useState(null);
  const [myId] = useState(loadMyId);
  const [viewing, setViewing] = useState(null);
  const [view, setView] = useState("home");
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: colors.bg, color: colors.textGhost, fontFamily: "monospace", fontSize: 11, letterSpacing: 4 }}>
      LOADING SIP...
    </div>
  );

  const me = myId;
  const myMember = me ? D.members.find(m => m.id === me) : null;

  if (!myMember) {
    return <JoinScreen D={D} onJoin={(name, avatar) => {
      const newId = uid() + uid();
      const color = HUES[D.members.length % HUES.length];
      const newMember = {
        id: newId, name, avatar, color,
        joinedAt: new Date().toISOString(),
        sections: DEFAULT_SECTIONS.map(s => ({
          id: uid(), title: s.title, content: "", mandatory: true, comments: [],
        })),
      };
      persistMyId(newId);
      update(d => { d.members.push(newMember); return d; });
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
    <div style={{ fontFamily: fonts.body, background: colors.bg, minHeight: "100vh", color: colors.text }}>
      <Hdr
        D={D} myMember={myMember} viewing={viewing} view={view}
        onBack={goHome} onWeekly={() => { setViewing(null); setView("weekly"); }}
        memberName={member?.name} connected={connected}
        onUpdateProfile={updateMemberProfile} me={me}
      />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "28px 20px" }}>
        {view === "weekly" ? (
          <WeeklyView D={D} me={me} onUpdateCheckin={updateCheckin} onAddCheckinComment={addCheckinComment} onOpenDoc={id => { setViewing(id); setView("home"); }} />
        ) : !viewing ? (
          <GridView D={D} me={me} onOpen={id => setViewing(id)} onWeekly={() => { setViewing(null); setView("weekly"); }} />
        ) : (
          <DocView member={member} me={me} allMembers={D.members} onUpdateSection={updateSection} onAddComment={addComment} onAddSection={addSection} />
        )}
      </div>
    </div>
  );
}
