import { getWeekKey, formatWeekLabel } from "../utils";
import { fonts, colors, shared } from "../styles";
import ABtn from "./ABtn";

export default function WeeklyReminder({ D, me, onCheckIn, onDismiss }) {
  const weekKey = getWeekKey();
  const weekData = D.weeklies?.[weekKey] || { checkins: {} };
  const checkins = weekData.checkins || {};

  const checkedIn = D.members.filter(m => checkins[m.id]?.filledAt);
  const notCheckedIn = D.members.filter(m => !checkins[m.id]?.filledAt);

  const day = new Date().getDay(); // 0=Sun, 1=Mon, ...

  let heading, message;
  if (day === 0) {
    heading = "LAST CHANCE";
    message = notCheckedIn.length === 1
      ? "You're the only one who hasn't checked in this week."
      : `You're one of ${notCheckedIn.length} who haven't checked in. Today's the last day.`;
  } else if (day === 6) {
    heading = "DON'T FORGET";
    message = notCheckedIn.length === 1
      ? "You're the last one — everyone else has checked in."
      : `${checkedIn.length}/${D.members.length} have checked in. Tomorrow's the last day.`;
  } else {
    heading = "WEEKLY CHECK-IN";
    message = `${checkedIn.length}/${D.members.length} have checked in this week. Don't fall behind.`;
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onDismiss(); }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "var(--sip-overlay)", zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div style={{
        ...shared.card, borderRadius: 18, padding: "32px 28px",
        width: "90%", maxWidth: 400, textAlign: "center",
      }}>
        <div style={{
          fontFamily: fonts.heading, fontSize: 36, letterSpacing: 3,
          color: day === 0 ? colors.error : colors.accent,
          marginBottom: 6, lineHeight: 1,
        }}>
          {heading}<span style={{ color: day === 0 ? colors.error : colors.accent }}>.</span>
        </div>

        <div style={{
          fontFamily: fonts.mono, fontSize: 9, color: colors.textDimmer,
          letterSpacing: 2, marginBottom: 24,
        }}>
          {formatWeekLabel(weekKey)}
        </div>

        <div style={{
          fontSize: 13, color: colors.textMuted, lineHeight: 1.7,
          marginBottom: 24,
        }}>
          {message}
        </div>

        {/* Avatar row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {D.members.map(m => {
            const done = !!checkins[m.id]?.filledAt;
            return (
              <div key={m.id} style={{ textAlign: "center" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: done ? colors.inputBg : colors.bg,
                  border: `2px solid ${done ? m.color : colors.textGhost}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, opacity: done ? 1 : 0.35,
                  transition: "all .2s",
                }}>
                  {m.avatar}
                </div>
                <div style={{
                  fontFamily: fonts.mono, fontSize: 8, marginTop: 4,
                  color: done ? colors.success : colors.textGhost,
                  letterSpacing: 1,
                }}>
                  {done ? "✓" : "—"}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <ABtn onClick={onCheckIn} style={{ width: "100%", padding: "14px 0", fontSize: 13, letterSpacing: 3 }}>
            CHECK IN NOW
          </ABtn>
          <button onClick={onDismiss} style={{
            background: "none", border: "none", color: colors.textDimmest,
            cursor: "pointer", fontFamily: fonts.mono, fontSize: 10,
            letterSpacing: 1, padding: "8px 0",
          }}>
            LATER
          </button>
        </div>
      </div>
    </div>
  );
}
