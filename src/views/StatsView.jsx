import { useState, useMemo } from "react";
import { WORKOUTS, computeStats, isoWeek, epley1RM, getExerciseHistory, allRoutineExercises } from "../data.js";
import { FULL_EXERCISE_LIBRARY } from "../data/exerciseLibrary.js";
import { exerciseVolume } from "../session.js";
import { computePersonalRecords } from "../coach.js";
import { surface, text, status } from "../theme.js";
import { Card, Disp, Caps, Bar, TabRow, Sparkline } from "../components/Primitives.jsx";
import { Icon } from "../components/Icons.jsx";

function IconBadge({ name, color }) {
  return <Icon name={name} size={14} color={color} />;
}

export default function StatsView({
  history, progression, settings, accent,
  customRoutine,
  // eslint-disable-next-line no-unused-vars -- kept in signature for caller compat
  exConfig, xp, level, achievements, checkIns, bodyMetrics, setBodyMetrics, userProfile, goals,
}) {
  const [range, setRange] = useState("12w");

  const stats   = computeStats({ history, progression, settings });
  const records = computePersonalRecords({ history });

  const customWeekExercises = useMemo(
    () => customRoutine?.enabled ? allRoutineExercises(customRoutine, { exerciseLibrary: FULL_EXERCISE_LIBRARY }) : [],
    [customRoutine]
  );
  const allExercises = useMemo(
    () => [...WORKOUTS.A.exercises, ...WORKOUTS.B.exercises, ...customWeekExercises],
    [customWeekExercises]
  );

  // ── Week boundaries ──────────────────────────────────────────
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  mon.setHours(0, 0, 0, 0);
  const prevMon = new Date(mon);
  prevMon.setDate(mon.getDate() - 7);

  const weekSessions     = useMemo(() => history.filter(h => (h.timestamp || 0) >= mon.getTime()), [history]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevWeekSessions = useMemo(() => history.filter(h => {
    const t = h.timestamp || 0;
    return t >= prevMon.getTime() && t < mon.getTime();
  }), [history]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Volume helpers ───────────────────────────────────────────
  function sessionVol(h) {
    if (h.exercises) return h.exercises.reduce((s, ex) => s + exerciseVolume(ex, settings.dumbbellWeight), 0);
    const wk = WORKOUTS[h.workout];
    if (!wk) return 0;
    return wk.exercises.reduce((s, ex) => {
      const reps = ex.baseReps + (progression[ex.name]?.repBonus || 0);
      return s + reps * ex.sets * settings.dumbbellWeight * (ex.name === "Goblet Squat" ? 1 : 2);
    }, 0);
  }

  const weekVolume     = useMemo(() => weekSessions.reduce((s, h) => s + sessionVol(h), 0), [weekSessions]); // eslint-disable-line react-hooks/exhaustive-deps
  const prevWeekVolume = useMemo(() => prevWeekSessions.reduce((s, h) => s + sessionVol(h), 0), [prevWeekSessions]); // eslint-disable-line react-hooks/exhaustive-deps
  const totalVolume    = useMemo(() => history.reduce((s, h) => s + sessionVol(h), 0), [history]); // eslint-disable-line react-hooks/exhaustive-deps

  const weekVolumeDelta = prevWeekVolume > 0
    ? Math.round(((weekVolume - prevWeekVolume) / prevWeekVolume) * 100)
    : null;

  // 12-week volume trend (sparkline)
  const volTrend = useMemo(() => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      weeks.push(isoWeek(d));
    }
    return weeks.map(w => {
      const ws = history.filter(h => isoWeek(new Date(h.timestamp)) === w);
      return ws.reduce((s, h) => s + sessionVol(h), 0);
    });
  }, [history, progression, settings.dumbbellWeight]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Week sets + reps ─────────────────────────────────────────
  const { weekSets, weekReps } = useMemo(() => weekSessions.reduce((acc, h) => {
    if (h.exercises) {
      for (const ex of h.exercises) {
        const logs = ex.setLog || [];
        acc.weekSets += logs.length || ex.sets || 0;
        acc.weekReps += logs.reduce((s, l) => s + (l.reps || 0), 0) || (ex.reps || 0) * (ex.sets || 0);
      }
    } else {
      const wk = WORKOUTS[h.workout];
      if (wk) for (const ex of wk.exercises) {
        const reps = ex.baseReps + (progression[ex.name]?.repBonus || 0);
        acc.weekSets += ex.sets;
        acc.weekReps += reps * ex.sets;
      }
    }
    return acc;
  }, { weekSets: 0, weekReps: 0 }), [weekSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hero values by range ─────────────────────────────────────
  const twelveWeekStart = new Date(now);
  twelveWeekStart.setDate(now.getDate() - 84);
  const twelveWeekSessions = history.filter(h => (h.timestamp || 0) >= twelveWeekStart.getTime());

  const heroVolume = range === "week" ? weekVolume
    : range === "life" ? totalVolume
    : volTrend.reduce((a, b) => a + b, 0);
  const heroLabel = range === "week" ? "TOTAL VOLUME · THIS WEEK"
    : range === "life" ? "TOTAL VOLUME · LIFETIME"
    : "TOTAL VOLUME · 12 WEEKS";
  const heroSessions = range === "week" ? weekSessions.length
    : range === "life" ? stats.totalSessions
    : twelveWeekSessions.length;

  // ── Top lifts ─────────────────────────────────────────────────
  const topLifts = useMemo(() => {
    const seen = new Set();
    const lifts = [];
    for (const ex of allExercises) {
      if (seen.has(ex.name)) continue;
      seen.add(ex.name);
      const rec = records.exerciseRecords?.[ex.name];
      if (!rec?.maxWeight) continue;
      const { value: maxW, reps: maxR } = rec.maxWeight;
      const e1rm = epley1RM(maxW, maxR);
      const data  = getExerciseHistory(ex.name, history);
      const trend = data.slice(-8).map(d => d.totalReps);
      const targetReps = (ex.baseReps + (settings.maxRepBonus || 10)) * (ex.sets || 3);
      const latestReps = data.length ? data[data.length - 1].totalReps : 0;
      const pct = Math.min(1, latestReps / Math.max(targetReps, 1));
      lifts.push({ name: ex.name, e1rm, trend, pct });
    }
    return lifts.sort((a, b) => b.e1rm - a.e1rm).slice(0, 6);
  }, [allExercises, records, history, settings.maxRepBonus]);

  // ── Recent PRs ───────────────────────────────────────────────
  const recentPRs = useMemo(() => {
    const prs = [];
    for (const [name, rec] of Object.entries(records.exerciseRecords || {})) {
      if (!rec?.maxWeight?.value) continue;
      const { value: maxW, reps, date } = rec.maxWeight;
      const baseW = settings.dumbbellWeight || 20;
      const delta = maxW > baseW ? maxW - baseW : null;
      prs.push({ lift: name, date: date || "recent", value: `${maxW}lb × ${reps}`, delta });
    }
    return prs.filter(p => p.delta != null).slice(0, 4);
  }, [records, settings.dumbbellWeight]);

  // ── Helpers ──────────────────────────────────────────────────
  const fmtVol = v => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v).toString();

  const RANGE_TABS = [
    { id: "week",  label: "Week"     },
    { id: "12w",   label: "12 Weeks" },
    { id: "life",  label: "Lifetime" },
  ];

  // ─────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 120 }}>

      {/* HEADER */}
      <div style={{ padding: "48px 16px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <Caps color={text.muted} size={10} style={{ display: "block", marginBottom: 4 }}>DATA</Caps>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, letterSpacing: ".06em", lineHeight: 1, color: "#fafafa" }}>
            The Record
          </div>
        </div>
        {level && (
          <div style={{
            padding: "6px 14px", borderRadius: 20,
            background: `${accent}33`, color: accent,
            fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <IconBadge name={level.badge} color={accent} /> {level.name}
          </div>
        )}
      </div>

      {/* RANGE TABS */}
      <div style={{ padding: "4px 16px 12px" }}>
        <TabRow items={RANGE_TABS} active={range} onChange={setRange} />
      </div>

      {/* HERO VOLUME CARD */}
      <div style={{ padding: "0 16px 12px" }}>
        <Card level={1} style={{ padding: 0 }}>
          <div style={{ padding: "16px 16px 8px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <Caps color={text.muted}>{heroLabel}</Caps>
              <div style={{ marginTop: 4, display: "flex", alignItems: "baseline", gap: 6 }}>
                <Disp size={40} color={accent}>{fmtVol(heroVolume)}</Disp>
                <Caps color={text.tertiary} size={11}>LB</Caps>
              </div>
              {range === "week" && weekVolumeDelta !== null && (
                <div style={{ marginTop: 4, color: weekVolumeDelta >= 0 ? status.good : status.caution, fontSize: 12, fontWeight: 600 }}>
                  {weekVolumeDelta >= 0 ? "↑" : "↓"} {Math.abs(weekVolumeDelta)}% vs last week
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <Caps color={text.muted}>SESSIONS</Caps>
              <div style={{ marginTop: 4 }}>
                <Disp size={24}>
                  {heroSessions}
                  <span style={{ color: text.tertiary, fontSize: 15 }}>/{settings.workoutsPerWeek || 3}</span>
                </Disp>
              </div>
              <div style={{ marginTop: 4, color: text.tertiary, fontSize: 11 }}>
                {range === "week" ? "this week" : range === "12w" ? "last 12w" : "all time"}
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div style={{ padding: "0 16px 16px" }}>
            <Caps color={text.muted} style={{ marginBottom: 8, display: "inline-block" }}>12-WEEK VOLUME TREND</Caps>
            <div style={{ position: "relative", height: 90 }}>
              <Sparkline
                fluid data={volTrend} w={370} h={90}
                color={accent} areaColor={`${accent}1f`}
                thick area
              />
              {volTrend.some(v => v > 0) && <>
                <div style={{ position: "absolute", right: 0, top: 0, color: text.tertiary, fontSize: 10 }}>
                  {fmtVol(Math.max(...volTrend))}
                </div>
                <div style={{ position: "absolute", right: 0, bottom: 0, color: text.tertiary, fontSize: 10 }}>
                  {fmtVol(Math.min(...volTrend.filter(v => v > 0)))}
                </div>
              </>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <Caps color={text.muted} size={9}>12 weeks ago</Caps>
              <Caps color={text.muted} size={9}>now</Caps>
            </div>
          </div>
        </Card>
      </div>

      {/* THREE STAT TILES */}
      <div style={{ padding: "0 16px 12px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "WEEK SETS",  value: weekSets,      sub: "logged" },
          { label: "WEEK REPS",  value: weekReps,      sub: "reps"   },
          { label: "STREAK",     value: stats.streak,  sub: `day${stats.streak !== 1 ? "s" : ""}` },
        ].map((s, i) => (
          <div key={i} style={{
            background: surface.bg0, borderRadius: 12,
            border: "1px solid rgba(255,140,50,.09)",
            padding: "12px 13px",
            boxShadow: "0 8px 24px rgba(0,0,0,.28)",
          }}>
            <Caps color={text.muted} size={10}>{s.label}</Caps>
            <Disp size={26} style={{ display: "block", marginTop: 4 }}>{s.value}</Disp>
            <div style={{ color: text.tertiary, fontSize: 11, marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* TOP LIFTS */}
      {topLifts.length > 0 && (
        <div style={{ padding: "4px 16px 12px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <Caps color={text.secondary}>TOP LIFTS</Caps>
            <span style={{ color: text.tertiary, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase" }}>
              est 1rm
            </span>
          </div>
          <Card level={1} style={{ padding: 0 }}>
            {topLifts.map((lift, i) => (
              <div key={lift.name} style={{
                padding: "14px 16px",
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                alignItems: "center",
                borderBottom: i < topLifts.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none",
              }}>
                <div>
                  <div style={{ color: text.primary, fontWeight: 600, fontSize: 14 }}>{lift.name}</div>
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, maxWidth: 100 }}>
                      <Bar value={lift.pct} max={1} color={accent} height={3} />
                    </div>
                    <Caps color={text.tertiary} size={9}>{Math.round(lift.pct * 100)}% goal</Caps>
                  </div>
                </div>
                {lift.trend.length >= 2
                  ? <Sparkline data={lift.trend} w={64} h={28} color={accent} thick={false} />
                  : <div style={{ width: 64 }} />
                }
                <div style={{ textAlign: "right" }}>
                  <Disp size={24} color={accent}>{lift.e1rm}</Disp>
                  <Caps color={text.tertiary} size={9} style={{ display: "block" }}>LB 1RM</Caps>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* RECENT PRs */}
      {recentPRs.length > 0 && (
        <div style={{ padding: "4px 16px 12px" }}>
          <Caps color={text.secondary} style={{ marginBottom: 10, display: "block" }}>RECENT PRs</Caps>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentPRs.map((pr, i) => (
              <div key={i} style={{
                background: surface.bg0, borderRadius: 12,
                border: "1px solid rgba(255,255,255,.06)",
                padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: `${accent}33`, color: accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, fontWeight: 700,
                }}>
                  PR
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: text.primary, fontWeight: 600, fontSize: 14 }}>{pr.lift}</div>
                  <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>{pr.date} · {pr.value}</div>
                </div>
                <div style={{
                  padding: "3px 10px", borderRadius: 10,
                  background: `${status.good}22`, color: status.good,
                  fontSize: 10, fontWeight: 700,
                }}>
                  +{pr.delta}lb
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIFETIME CARD */}
      <div style={{ padding: "4px 16px 16px" }}>
        <Card level={1} style={{ padding: 0 }}>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <Caps color={text.muted}>LIFETIME SESSIONS</Caps>
              <Disp size={32} style={{ display: "block", marginTop: 6 }}>{stats.totalSessions}</Disp>
            </div>
            <div>
              <Caps color={text.muted}>LIFETIME LIFTED</Caps>
              <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 4 }}>
                <Disp size={28}>{fmtVol(totalVolume)}</Disp>
                <Caps color={text.tertiary} size={10}>LB</Caps>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* EMPTY STATE */}
      {history.length === 0 && (
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ padding: "20px 18px", background: `${accent}10`, border: `1.5px solid ${accent}33`, borderRadius: 14 }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: accent, letterSpacing: ".06em", lineHeight: 1 }}>
              The forge is cold
            </div>
            <div style={{ fontSize: 14, color: text.secondary, lineHeight: 1.55, marginTop: 8 }}>
              Complete your first session — volume, lifts, peaks, and streaks fill in automatically.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
