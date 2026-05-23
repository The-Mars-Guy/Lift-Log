import { useState, useMemo, useRef } from "react";
import {
  MUSCLE_COVERAGE_GROUPS,
  FORGE_WORKOUT_NAMES, FORGE_WORKOUT_COLORS,
  normalizeCustomRoutine, DEFAULT_CUSTOM_ROUTINE,
  routineBalanceScore, routineCoverage,
  ROUTINE_TEMPLATES,
} from "../data.js";
import { FULL_EXERCISE_LIBRARY as EXERCISE_LIBRARY, getFullExerciseById as getExerciseById } from "../data/exerciseLibrary.js";
import { routineEditSuggestions, generateCoachProgram } from "../coach.js";
import { surface, text, status } from "../theme.js";
import { Icon } from "../components/Icons.jsx";
import { Card, Disp, Caps, Bar } from "../components/Primitives.jsx";

const CAT_COLORS = { push: "#dd6518", pull: "#60a5fa", legs: "#fbbf24", core: "#4ade80" };
const EQUIP_LABELS = { all: "All", dumbbells: "Dumbbells", bodyweight: "Bodyweight", machines: "Machines", bands: "Bands" };

function allRoutineExercises(routine = DEFAULT_CUSTOM_ROUTINE) {
  const ids = routine.enabled && Array.isArray(routine.programs) && routine.programs.length
    ? routine.programs.flatMap(day => day.exerciseIds || [])
    : routine.exerciseIds || [];
  return ids.map(id => getExerciseById(id)).filter(Boolean);
}

function catOf(ex) {
  const muscles = [...(ex.primary || []), ...(ex.secondary || [])];
  return MUSCLE_COVERAGE_GROUPS.find(([, , ms]) => ms.some(m => muscles.includes(m)))?.[0] || "push";
}

// Build a simple split plan for N days (used when user clicks "Build Full Split Plan" manually)
function buildSplitPlan(numDays, settings = {}) {
  const equip = settings.equipmentProfile || "fixed_dumbbells";
  const allowed = equip === "fixed_dumbbells" ? ["dumbbells","bodyweight"]
    : equip === "machines" ? ["machines","bodyweight"]
    : equip === "bands" ? ["bands","bodyweight"]
    : ["dumbbells","bodyweight","machines","bands"];

  const pool = EXERCISE_LIBRARY.filter(ex =>
    allowed.includes(ex.equipment) && ex.difficulty !== "intermediate"
  );

  const byCategory = { push: [], pull: [], legs: [], core: [] };
  pool.forEach(ex => { const c = catOf(ex); if (byCategory[c]) byCategory[c].push(ex); });
  const pick = (cat, n) => byCategory[cat].slice(0, n).map(e => e.id);

  const SPLITS = {
    1: [{ focus: ["push","pull","legs","core"], counts: [2,2,2,1] }],
    2: [
      { focus: ["push","pull"],    counts: [3,3] },
      { focus: ["legs","core"],    counts: [4,2] },
    ],
    3: [
      { focus: ["push"],           counts: [5] },
      { focus: ["pull"],           counts: [5] },
      { focus: ["legs","core"],    counts: [4,2] },
    ],
    4: [
      { focus: ["push"],           counts: [5] },
      { focus: ["pull"],           counts: [5] },
      { focus: ["legs"],           counts: [5] },
      { focus: ["push","pull","core"], counts: [2,2,2] },
    ],
    5: [
      { focus: ["push"],           counts: [5] },
      { focus: ["pull"],           counts: [5] },
      { focus: ["legs"],           counts: [5] },
      { focus: ["push","core"],    counts: [4,2] },
      { focus: ["pull","legs"],    counts: [3,2] },
    ],
  };

  const template = SPLITS[Math.min(numDays, 5)] || SPLITS[3];
  return template.map((t, i) => {
    const ids = [];
    t.focus.forEach((cat, fi) => ids.push(...pick(cat, t.counts[fi])));
    return { id: `day_${Date.now()}_${i}`, name: FORGE_WORKOUT_NAMES[i], exerciseIds: ids };
  });
}

function balanceDayExercises(dayExerciseIds, settings = {}) {
  const equip = settings.equipmentProfile || "fixed_dumbbells";
  const allowed = equip === "fixed_dumbbells" ? ["dumbbells","bodyweight"]
    : equip === "machines" ? ["machines","bodyweight"]
    : equip === "bands" ? ["bands","bodyweight"]
    : ["dumbbells","bodyweight","machines","bands"];

  const current = dayExerciseIds.map(id => getExerciseById(id)).filter(Boolean);
  const coverage = routineCoverage(current);
  const missing  = coverage.filter(g => !g.ok);
  if (!missing.length) return dayExerciseIds;

  const added = [...dayExerciseIds];
  missing.forEach(({ muscles }) => {
    const fill = EXERCISE_LIBRARY.find(ex =>
      allowed.includes(ex.equipment) &&
      !added.includes(ex.id) &&
      [...(ex.primary || []), ...(ex.secondary || [])].some(m => muscles.includes(m))
    );
    if (fill) added.push(fill.id);
  });
  return added;
}

// ─── INLINE NAME EDITOR ───────────────────────────────────────────────────────
function InlineEdit({ value, onSave, style = {} }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const inputRef = useRef(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        autoFocus
        style={{
          background: "transparent", border: "none", borderBottom: `1px solid ${FORGE_WORKOUT_COLORS[0]}`,
          color: text.primary, outline: "none", fontSize: "inherit", fontFamily: "inherit",
          fontWeight: "inherit", padding: "0 2px", width: "100%", ...style,
        }}
      />
    );
  }
  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      title="Click to rename"
      style={{ cursor: "text", ...style }}
    >
      {value}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function RoutineView({
  customRoutine, setCustomRoutine, accent,
  userProfile, settings = {}, history = [], checkIns = [], goals = [], exConfig = {},
}) {
  const routine = normalizeCustomRoutine(customRoutine, { exerciseLibrary: EXERCISE_LIBRARY, validateIds: true });

  const [activeDayId,    setActiveDayId]    = useState(null);
  const [pickerDayId,    setPickerDayId]    = useState(null);
  const [exCat,          setExCat]          = useState("all");
  const [query,          setQuery]          = useState("");
  const [equipment,      setEquipment]      = useState("all");
  const [coachOpen,      setCoachOpen]      = useState(false);
  const [templatesOpen,  setTemplatesOpen]  = useState(false);
  const [programsOpen,   setProgramsOpen]   = useState(false);
  const [coachBuilding,  setCoachBuilding]  = useState(false);
  const [coachRationale, setCoachRationale] = useState(null);

  const save = (patch) =>
    setCustomRoutine(prev => normalizeCustomRoutine({ ...prev, ...patch }, { exerciseLibrary: EXERCISE_LIBRARY, validateIds: true }));

  // ── Program name / day name rename ────────────────────────────────────────
  const renameProgramName = (name) => save({ name });
  const renameDayName = (dayId, name) =>
    save({ routines: routine.routines.map(d => d.id === dayId ? { ...d, name } : d) });

  // ── Day mutations ─────────────────────────────────────────────────────────
  const addDay = () => {
    const id   = `day_${Date.now()}`;
    const idx  = routine.routines.length;
    const name = FORGE_WORKOUT_NAMES[idx % FORGE_WORKOUT_NAMES.length];
    save({ routines: [...routine.routines, { id, name, exerciseIds: [] }] });
  };

  const removeDay = (id) => {
    if (routine.routines.length <= 1) return;
    save({ routines: routine.routines.filter(d => d.id !== id) });
  };

  const addExercise = (dayId, exId) => {
    save({
      routines: routine.routines.map(d =>
        d.id === dayId ? { ...d, exerciseIds: [...new Set([...d.exerciseIds, exId])] } : d
      ),
    });
    setPickerDayId(null);
    setQuery("");
  };

  const removeExercise = (dayId, exId) => {
    save({
      routines: routine.routines.map(d =>
        d.id === dayId ? { ...d, exerciseIds: d.exerciseIds.filter(i => i !== exId) } : d
      ),
    });
  };

  // ── Saved programs ────────────────────────────────────────────────────────
  const saveAsNewProgram = () => {
    const prog = {
      id:       `prog_${Date.now()}`,
      name:     routine.name,
      routines: routine.routines.map(r => ({ ...r, exerciseIds: [...r.exerciseIds] })),
      schedule: { ...routine.schedule },
      savedAt:  Date.now(),
    };
    save({ programs: [...(routine.programs || []), prog] });
  };

  const loadProgram = (prog) => {
    save({ name: prog.name, routines: prog.routines, schedule: prog.schedule });
  };

  const deleteProgram = (progId) => {
    save({ programs: (routine.programs || []).filter(p => p.id !== progId) });
  };

  // ── Template loading ──────────────────────────────────────────────────────
  const loadTemplate = (tpl) => {
    const routines = tpl.routines.map(r => ({ ...r, exerciseIds: [...r.exerciseIds] }));
    save({ name: tpl.name, routines, schedule: { ...tpl.defaultSchedule }, enabled: true });
    setTemplatesOpen(false);
  };

  // ── Coach actions ──────────────────────────────────────────────────────────
  const buildFullPlan = () => {
    const newRoutines = buildSplitPlan(routine.routines.length || 3, settings);
    save({ routines: newRoutines, enabled: true });
  };

  const buildCoachPlan = () => {
    setCoachBuilding(true);
    setCoachRationale(null);
    setTimeout(() => {
      try {
        const result = generateCoachProgram({
          userProfile, settings, history, checkIns, goals, exConfig,
          numDays: routine.routines.length || null,
          exerciseLibrary: EXERCISE_LIBRARY,
        });
        save({ name: result.name, routines: result.routines, schedule: result.schedule, enabled: true });
        setCoachRationale(result.rationale || []);
      } finally {
        setCoachBuilding(false);
      }
    }, 0);
  };

  const balanceDay = (dayId) => {
    const day = routine.routines.find(d => d.id === dayId);
    if (!day) return;
    const balanced = balanceDayExercises(day.exerciseIds, settings);
    save({
      routines: routine.routines.map(d =>
        d.id === dayId ? { ...d, exerciseIds: balanced } : d
      ),
    });
  };

  // ── Coach analysis ────────────────────────────────────────────────────────
  const weekExercises = useMemo(() => allRoutineExercises(routine), [routine]);
  const coverage      = useMemo(() => routineCoverage(weekExercises), [weekExercises]);
  const balance       = useMemo(() => routineBalanceScore(weekExercises), [weekExercises]);
  const suggestions   = useMemo(() =>
    routineEditSuggestions({ routine, exercises: weekExercises, allExercises: weekExercises, history, checkIns, userProfile, exerciseLibrary: EXERCISE_LIBRARY }),
    [routine, weekExercises, history, checkIns, userProfile]
  );

  // ── Filtered exercise list ─────────────────────────────────────────────────
  const filteredEx = useMemo(() => EXERCISE_LIBRARY.filter(ex => {
    const muscles = [...(ex.primary || []), ...(ex.secondary || [])];
    const inCat = exCat === "all" ||
      MUSCLE_COVERAGE_GROUPS.find(([key]) => key === exCat)?.[2].some(m => muscles.includes(m));
    const inEquip = equipment === "all" || ex.equipment === equipment;
    const inSearch = !query.trim() ||
      `${ex.name} ${ex.primary?.join(" ")} ${ex.secondary?.join(" ")} ${ex.equipment}`.toLowerCase()
        .includes(query.trim().toLowerCase());
    return inCat && inEquip && inSearch;
  }), [exCat, equipment, query]);

  const totalEx = routine.routines.reduce((s, d) => s + d.exerciseIds.length, 0);
  const fc = (idx) => FORGE_WORKOUT_COLORS[idx % FORGE_WORKOUT_COLORS.length];
  const balanceColor = balance >= 80 ? status.good : balance >= 50 ? "#fb923c" : status.caution;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 120 }}>

      {/* HEADER */}
      <div style={{ padding: "48px 16px 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <Caps color={text.muted} size={10} style={{ display: "block", marginBottom: 4 }}>TRAINING</Caps>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, letterSpacing: ".06em", lineHeight: 1, color: "#fafafa" }}>
            Routine
          </div>
        </div>
        {routine.enabled
          ? <div style={{ padding: "6px 13px", borderRadius: 20, background: `${accent}33`, color: accent, fontSize: 10, fontWeight: 700, letterSpacing: ".08em" }}>● ACTIVE</div>
          : <button onClick={() => save({ enabled: true })} style={{ padding: "8px 16px", borderRadius: 20, background: accent, color: "#050505", fontSize: 11, fontWeight: 800, letterSpacing: ".08em", border: "none", cursor: "pointer" }}>USE THIS</button>
        }
      </div>

      {/* OVERVIEW CARD */}
      <div style={{ padding: "0 16px 14px" }}>
        <Card level={1} style={{ padding: 0 }}>
          <div style={{ padding: 16 }}>
            <Disp size={22} style={{ display: "block" }}>
              <InlineEdit value={routine.name || "My Program"} onSave={renameProgramName} />
            </Disp>
            <div style={{ color: text.tertiary, fontSize: 12, marginTop: 3, marginBottom: 14 }}>
              {routine.routines.length} day{routine.routines.length !== 1 ? "s" : ""} · {totalEx} exercise{totalEx !== 1 ? "s" : ""}
            </div>
            {/* Day chips */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {routine.routines.map((d, idx) => (
                <div key={d.id} style={{ flex: 1, padding: "10px 4px", borderRadius: 8, textAlign: "center", background: `${fc(idx)}18`, border: `1px solid ${fc(idx)}33` }}>
                  <Caps size={9} color={fc(idx)} style={{ display: "block" }}>{d.name}</Caps>
                  <div style={{ marginTop: 3, color: text.tertiary, fontSize: 10 }}>{d.exerciseIds.length} exercises</div>
                </div>
              ))}
            </div>
            {/* Controls */}
            <div style={{ display: "flex", gap: 8 }}>
              {routine.routines.length < 7 && (
                <button onClick={addDay} style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: `${accent}18`, border: `1px solid ${accent}33`, color: accent, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer" }}>
                  + ADD DAY
                </button>
              )}
              <button onClick={() => save({ routines: DEFAULT_CUSTOM_ROUTINE.routines, name: DEFAULT_CUSTOM_ROUTINE.name, enabled: false })} style={{ flex: 1, padding: "11px 0", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,.1)", color: text.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Reset to Default
              </button>
            </div>
            {/* Save program */}
            <button onClick={saveAsNewProgram} style={{ marginTop: 8, width: "100%", padding: "9px 0", borderRadius: 9, background: "transparent", border: "1px solid rgba(255,255,255,.08)", color: text.ghost, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Save as New Program
            </button>
          </div>
        </Card>
      </div>

      {/* SAVED PROGRAMS */}
      {(routine.programs || []).length > 0 && (
        <div style={{ padding: "0 16px 14px" }}>
          <button onClick={() => setProgramsOpen(v => !v)} style={{ width: "100%", padding: "12px 16px", background: surface.bg0, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="clipboard" size={16} color={text.secondary} />
              <div>
                <div style={{ color: text.primary, fontWeight: 700, fontSize: 14 }}>Saved Programs</div>
                <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>{(routine.programs || []).length} saved</div>
              </div>
            </div>
            <span style={{ color: text.ghost, fontSize: 14, display: "inline-block", transform: programsOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
          </button>

          {programsOpen && (
            <div style={{ marginTop: 6, background: surface.bg0, borderRadius: 12, border: "1px solid rgba(255,255,255,.08)", overflow: "hidden" }}>
              {(routine.programs || []).map((prog, i) => (
                <div key={prog.id} style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < routine.programs.length - 1 ? "1px solid rgba(255,255,255,.05)" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: text.primary, fontWeight: 600, fontSize: 13 }}>{prog.name}</div>
                    <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>
                      {prog.routines?.length} day{prog.routines?.length !== 1 ? "s" : ""} · saved {new Date(prog.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                    </div>
                  </div>
                  <button onClick={() => loadProgram(prog)} style={{ padding: "5px 12px", borderRadius: 7, background: `${accent}22`, color: accent, border: `1px solid ${accent}44`, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer", marginRight: 6 }}>
                    LOAD
                  </button>
                  <button onClick={() => deleteProgram(prog.id)} style={{ color: text.ghost, fontSize: 16, background: "none", border: "none", padding: "0 4px", cursor: "pointer" }}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TEMPLATES */}
      <div style={{ padding: "0 16px 14px" }}>
        <button onClick={() => setTemplatesOpen(v => !v)} style={{ width: "100%", padding: "12px 16px", background: surface.bg0, border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="bolt" size={16} color={text.secondary} />
            <div>
              <div style={{ color: text.primary, fontWeight: 700, fontSize: 14 }}>Templates</div>
              <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>Start from a proven program</div>
            </div>
          </div>
          <span style={{ color: text.ghost, fontSize: 14, display: "inline-block", transform: templatesOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
        </button>

        {templatesOpen && (
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
            {ROUTINE_TEMPLATES.map((tpl, ti) => {
              const tplColor = FORGE_WORKOUT_COLORS[ti % FORGE_WORKOUT_COLORS.length];
              return (
                <div key={tpl.id} style={{ background: surface.bg0, borderRadius: 12, border: `1px solid ${tplColor}22`, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: text.primary, fontWeight: 700, fontSize: 14 }}>{tpl.name}</div>
                      <div style={{ color: text.tertiary, fontSize: 11, marginTop: 3, lineHeight: 1.4 }}>{tpl.description}</div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {tpl.routines.map((r, ri) => (
                          <div key={r.id} style={{ padding: "2px 8px", borderRadius: 20, background: `${FORGE_WORKOUT_COLORS[ri % FORGE_WORKOUT_COLORS.length]}18`, color: FORGE_WORKOUT_COLORS[ri % FORGE_WORKOUT_COLORS.length], fontSize: 9, fontWeight: 700, border: `1px solid ${FORGE_WORKOUT_COLORS[ri % FORGE_WORKOUT_COLORS.length]}33` }}>
                            {r.name} · {r.exerciseIds.length} ex
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => loadTemplate(tpl)} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 9, background: `${tplColor}20`, color: tplColor, border: `1px solid ${tplColor}44`, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer" }}>
                      USE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* COACH SECTION */}
      <div style={{ padding: "0 16px 14px" }}>
        <button onClick={() => setCoachOpen(v => !v)} style={{ width: "100%", padding: "14px 16px", background: surface.bg0, border: `1px solid ${accent}33`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="robot" size={18} color={accent} />
            <div>
              <div style={{ color: text.primary, fontWeight: 700, fontSize: 14 }}>Smith</div>
              <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>
                Balance {balance}% · {coverage.filter(c => !c.ok).length} gap{coverage.filter(c => !c.ok).length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 36, height: 6, borderRadius: 3, background: surface.bg3, overflow: "hidden" }}>
              <div style={{ width: `${balance}%`, height: "100%", background: balanceColor, borderRadius: 3 }} />
            </div>
            <span style={{ color: text.ghost, fontSize: 14, display: "inline-block", transform: coachOpen ? "rotate(90deg)" : "none", transition: "transform .15s" }}>›</span>
          </div>
        </button>

        {coachOpen && (
          <div style={{ marginTop: 6, background: surface.bg0, borderRadius: 12, border: `1px solid ${accent}22`, overflow: "hidden" }}>
            {/* Balance bar */}
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Caps color={text.muted}>Routine Balance</Caps>
                <span style={{ color: balanceColor, fontWeight: 700, fontSize: 13 }}>{balance}%</span>
              </div>
              <Bar value={balance} max={100} color={balanceColor} height={6} />
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {coverage.map(c => (
                  <div key={c.key} style={{ padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: c.ok ? `${status.good}18` : `${status.caution}18`, color: c.ok ? status.good : status.caution, border: `1px solid ${c.ok ? status.good : status.caution}33` }}>
                    {c.ok ? "✓" : "✗"} {c.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <Caps color={text.muted} style={{ display: "block", marginBottom: 8 }}>Suggestions</Caps>
                {suggestions.slice(0, 4).map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, padding: "10px 12px", background: surface.bg1, borderRadius: 8, border: "1px solid rgba(255,255,255,.05)" }}>
                    <div style={{ color: accent, fontSize: 16, flexShrink: 0 }}>{s.type === "add" ? "+" : "⇄"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: text.primary, fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                      <div style={{ color: text.tertiary, fontSize: 11, marginTop: 2, lineHeight: 1.4 }}>{s.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Per-day balance */}
            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <Caps color={text.muted} style={{ display: "block", marginBottom: 8 }}>Balance Individual Days</Caps>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {routine.routines.map((day, di) => {
                  const dayExs = day.exerciseIds.map(id => getExerciseById(id)).filter(Boolean);
                  const dayCov = routineCoverage(dayExs);
                  const dayMissing = dayCov.filter(c => !c.ok).length;
                  const dayCol = fc(di);
                  return (
                    <div key={day.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: surface.bg1, borderRadius: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${dayCol}22`, color: dayCol, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bebas Neue',sans-serif", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {String.fromCharCode(65 + di)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: text.primary, fontSize: 13, fontWeight: 600 }}>{day.name}</div>
                        <div style={{ color: text.tertiary, fontSize: 10, marginTop: 1 }}>
                          {dayMissing === 0 ? "Balanced" : `Missing: ${dayCov.filter(c => !c.ok).map(c => c.label).join(", ")}`}
                        </div>
                      </div>
                      {dayMissing > 0 && (
                        <button onClick={() => balanceDay(day.id)} style={{ padding: "5px 10px", borderRadius: 7, background: `${dayCol}22`, color: dayCol, border: `1px solid ${dayCol}44`, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", cursor: "pointer" }}>
                          BALANCE
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coach AI rationale */}
            {coachRationale && coachRationale.length > 0 && (
              <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <Caps color={text.muted} style={{ display: "block", marginBottom: 8 }}>Smith's Notes</Caps>
                {coachRationale.map((line, i) => (
                  <div key={i} style={{ color: text.tertiary, fontSize: 11, lineHeight: 1.5, marginBottom: 4 }}>{line}</div>
                ))}
              </div>
            )}

            {/* Build plan buttons */}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={buildCoachPlan} disabled={coachBuilding} style={{ padding: "13px 16px", background: `${accent}18`, border: `1.5px solid ${accent}44`, borderRadius: 10, color: accent, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: ".08em", cursor: "pointer", opacity: coachBuilding ? .6 : 1 }}>
                {coachBuilding ? "BUILDING..." : "BUILD WITH COACH AI"}
              </button>
              <div style={{ color: text.ghost, fontSize: 10, textAlign: "center", lineHeight: 1.4 }}>
                Uses your age, experience, goals, history, and equipment to build a personalized program
              </div>
              <button onClick={buildFullPlan} style={{ padding: "13px 16px", background: "transparent", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, color: text.secondary, fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: ".08em", cursor: "pointer" }}>
                BUILD FULL SPLIT PLAN
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DAYS ACCORDION */}
      {/* DAY LIST — collapsed rows */}
      <div style={{ padding: "0 16px" }}>
        <Caps color={text.secondary} style={{ paddingLeft: 2, display: "block", marginBottom: 10 }}>WORKOUT DAYS</Caps>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {routine.routines.map((day, di) => {
            const dayColor     = fc(di);
            const dayExercises = day.exerciseIds.map(id => getExerciseById(id)).filter(Boolean);
            return (
              <button key={day.id} onClick={() => setActiveDayId(day.id)}
                style={{ width: "100%", background: surface.bg0, borderRadius: 12, border: `1px solid ${dayColor}33`,
                  padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: dayColor, color: "#050505",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Bebas Neue',sans-serif", fontWeight: 700, fontSize: 15 }}>
                  {String.fromCharCode(65 + di)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: text.primary, fontWeight: 700, fontSize: 15 }}>{day.name}</div>
                  <div style={{ color: text.tertiary, fontSize: 11, marginTop: 2 }}>
                    {dayExercises.length === 0 ? "No exercises yet" : `${dayExercises.length} exercise${dayExercises.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                {routine.routines.length > 1 && (
                  <div onClick={e => { e.stopPropagation(); removeDay(day.id); }}
                    style={{ color: text.tertiary, fontSize: 13, background: "rgba(255,255,255,.07)",
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FULL-SCREEN DAY EDITOR */}
      {activeDayId && (() => {
        const di  = routine.routines.findIndex(d => d.id === activeDayId);
        const day = routine.routines[di];
        if (!day) return null;
        const dayColor     = fc(di);
        const dayExercises = day.exerciseIds.map(id => getExerciseById(id)).filter(Boolean);
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 180, background: "#0a0a0a", display: "flex", flexDirection: "column", overflowY: "auto" }}>
            {/* Header */}
            <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 12,
              borderBottom: "1px solid rgba(255,255,255,.07)", background: "#0e0e0e", flexShrink: 0,
              paddingTop: "max(16px, env(safe-area-inset-top))" }}>
              <button onClick={() => setActiveDayId(null)}
                style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.07)", border: "none",
                  color: text.secondary, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>←</button>
              <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: dayColor, color: "#050505",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Bebas Neue',sans-serif", fontWeight: 700, fontSize: 15 }}>
                {String.fromCharCode(65 + di)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Caps color={text.muted} size={9}>WORKOUT DAY</Caps>
                <div style={{ color: text.primary, fontWeight: 700, fontSize: 17, marginTop: 1 }}>
                  <InlineEdit value={day.name} onSave={(name) => renameDayName(day.id, name)} />
                </div>
              </div>
              {routine.routines.length > 1 && (
                <button onClick={() => { removeDay(day.id); setActiveDayId(null); }}
                  style={{ color: text.tertiary, fontSize: 13, background: "rgba(255,255,255,.07)", border: "none",
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>✕</button>
              )}
            </div>

            {/* Exercise list */}
            <div style={{ flex: 1, padding: "12px 16px 0" }}>
              {dayExercises.length === 0 && (
                <div style={{ padding: "32px 0", textAlign: "center", color: text.ghost, fontSize: 13 }}>
                  No exercises yet — add one below
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dayExercises.map((ex) => {
                  const cc = CAT_COLORS[catOf(ex)] || accent;
                  return (
                    <div key={ex.id} style={{ background: surface.bg0, borderRadius: 10, padding: "12px 14px",
                      display: "flex", alignItems: "center", gap: 12, border: "1px solid rgba(255,255,255,.06)" }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: `${cc}20`, color: cc,
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                        {catOf(ex).slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: text.primary, fontWeight: 600, fontSize: 14 }}>{ex.name}</div>
                        <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>{ex.primary?.slice(0, 2).join(" · ")}</div>
                      </div>
                      <button onClick={() => removeExercise(day.id, ex.id)}
                        style={{ color: text.ghost, fontSize: 20, background: "none", border: "none", padding: "4px 8px", cursor: "pointer", lineHeight: 1 }}>−</button>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => { setPickerDayId(day.id); setExCat("all"); setEquipment("all"); setQuery(""); }}
                style={{ width: "100%", marginTop: 12, padding: "16px", borderRadius: 12,
                  background: `${dayColor}18`, border: `1.5px dashed ${dayColor}55`,
                  color: dayColor, fontSize: 13, fontWeight: 700, letterSpacing: ".08em",
                  textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>+</span> ADD EXERCISE
              </button>
            </div>
          </div>
        );
      })()}

      {/* EXERCISE PICKER — full screen, stacks on top of day editor */}
      {pickerDayId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "#111", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: "1px solid rgba(255,255,255,.07)", background: "#0e0e0e", flexShrink: 0,
            paddingTop: "max(16px, env(safe-area-inset-top))" }}>
            <button onClick={() => { setPickerDayId(null); setQuery(""); }}
              style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.07)", border: "none",
                color: text.secondary, fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>←</button>
            <div style={{ flex: 1 }}>
              <Caps color={text.secondary} size={11}>ADD EXERCISE</Caps>
              <div style={{ color: text.primary, fontWeight: 700, fontSize: 15, marginTop: 1 }}>
                {routine.routines.find(d => d.id === pickerDayId)?.name || "Day"}
              </div>
            </div>
          </div>
          <div style={{ padding: "0 16px 8px" }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search exercises, muscles..."
              style={{ width: "100%", padding: "10px 12px", background: surface.bg2, border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, color: text.primary, fontSize: 14, outline: "none", boxSizing: "border-box" }}
              autoFocus
            />
          </div>
          <div style={{ padding: "0 16px 6px", display: "flex", gap: 6, overflowX: "auto" }}>
            {Object.entries(EQUIP_LABELS).map(([key, label]) => {
              const sel = equipment === key;
              return (
                <button key={key} onClick={() => setEquipment(key)} style={{ padding: "4px 10px", borderRadius: 999, flexShrink: 0, cursor: "pointer", border: `1px solid ${sel ? accent : "rgba(255,255,255,.1)"}`, background: sel ? `${accent}22` : "transparent", color: sel ? accent : text.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ padding: "0 16px 10px", display: "flex", gap: 6, overflowX: "auto" }}>
            {[["all", "All"], ...MUSCLE_COVERAGE_GROUPS.map(([key, label]) => [key, label])].map(([key, label]) => {
              const cc  = key === "all" ? accent : (CAT_COLORS[key] || accent);
              const sel = exCat === key;
              return (
                <button key={key} onClick={() => setExCat(key)} style={{ padding: "4px 10px", borderRadius: 999, flexShrink: 0, cursor: "pointer", border: `1px solid ${sel ? cc : "rgba(255,255,255,.1)"}`, background: sel ? `${cc}22` : "transparent", color: sel ? cc : text.tertiary, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>
                  {label}
                </button>
              );
            })}
          </div>
          <div style={{ padding: "0 16px 6px" }}>
            <Caps color={text.muted} size={9}>{filteredEx.length} exercises</Caps>
          </div>
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredEx.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", color: text.ghost, fontSize: 13 }}>No exercises match your filters</div>
            )}
            {filteredEx.map((ex, i) => {
              const cc = CAT_COLORS[catOf(ex)] || accent;
              const selectedDay  = routine.routines.find(d => d.id === pickerDayId);
              const alreadyAdded = selectedDay?.exerciseIds.includes(ex.id);
              return (
                <button key={ex.id} onClick={() => !alreadyAdded && addExercise(pickerDayId, ex.id)} style={{ width: "100%", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: i < filteredEx.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", textAlign: "left", background: "none", border: "none", cursor: alreadyAdded ? "default" : "pointer", opacity: alreadyAdded ? .35 : 1 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: `${cc}18`, color: cc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, textTransform: "uppercase" }}>
                    {catOf(ex)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: text.primary, fontWeight: 600, fontSize: 13 }}>{ex.name}</div>
                    <div style={{ color: text.tertiary, fontSize: 11, marginTop: 1 }}>
                      {ex.primary?.slice(0, 2).join(" · ")}
                      {ex.equipment !== "dumbbells" && (
                        <span style={{ marginLeft: 6, color: text.ghost, fontSize: 10 }}>· {ex.equipment}</span>
                      )}
                    </div>
                  </div>
                  {alreadyAdded
                    ? <span style={{ color: text.ghost, fontSize: 11 }}>added</span>
                    : <div style={{ width: 26, height: 26, borderRadius: 99, flexShrink: 0, background: `${accent}20`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700 }}>+</div>
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
