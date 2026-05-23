import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../../hooks.js";
import { normalizeActiveSession } from "../../session.js";

/**
 * Manages in-progress session state and localStorage persistence.
 *
 * Hydration is intentionally deferred — if a recoverable session is found on
 * mount or tab change, `pendingRecovery` is set and nothing is hydrated until
 * the user confirms via `continueRecovery()`. Call `discardRecovery()` to
 * clear it without restoring.
 *
 * The persistence effect lives in WorkoutView because it needs `doneSets` and
 * other derived values that depend on `substitutions` returned by this hook
 * (circular at the value level — fine in React, resolved on next render).
 */
export function useWorkoutSession({ sessionKey, isCompleted }) {
  const [sessionLogs,   setSessionLogs]   = useState({});
  const [xpAwards,      setXpAwards]      = useState({});
  const [workoutNote,   setWorkoutNote]   = useState("");
  const [focusMode,     setFocusMode]     = useState(false);
  const [substitutions, setSubstitutions] = useState({});
  const [exerciseOrder, setExerciseOrder] = useState([]);
  const [pendingRecovery, setPendingRecovery] = useState(null);
  const [activeSession, setActiveSession] = useLocalStorage("wt_active_session", null);

  // Refs consumed by the persistence effect in WorkoutView
  const sessionHydrated    = useRef(false);
  const skipSessionPersist = useRef(false);

  // On session key change: detect recoverable session, reset to clean state.
  // Does NOT immediately hydrate — banner must be confirmed first.
  useEffect(() => {
    sessionHydrated.current    = false;
    skipSessionPersist.current = true;

    const normalized  = normalizeActiveSession(activeSession);
    const hasMatch    = normalized?.sessionKey === sessionKey && !isCompleted;
    const hasProgress = hasMatch && Object.keys(normalized?.sessionLogs || {}).length > 0;

    // If stored session is malformed, clear it rather than silently ignoring it.
    if (activeSession && !normalized) setActiveSession(null);

    setPendingRecovery(hasProgress ? normalized : null);

    // Always start the new tab clean; continueRecovery() restores the snapshot.
    setSessionLogs({});
    setXpAwards({});
    setWorkoutNote("");
    setFocusMode(false);
    setSubstitutions({});
    setExerciseOrder([]);

    sessionHydrated.current = true;
  }, [sessionKey]); // eslint-disable-line

  /** Restore state from the pending snapshot and dismiss the banner. */
  const continueRecovery = () => {
    if (!pendingRecovery) return;
    skipSessionPersist.current = true;
    setSessionLogs(pendingRecovery.sessionLogs   || {});
    setXpAwards(pendingRecovery.xpAwards         || {});
    setWorkoutNote(pendingRecovery.workoutNote    || "");
    setFocusMode(pendingRecovery.focusMode       === true);
    setSubstitutions(pendingRecovery.substitutions || {});
    setExerciseOrder(pendingRecovery.exerciseOrder || []);
    setPendingRecovery(null);
  };

  /** Discard the saved session and dismiss the banner. */
  const discardRecovery = () => {
    setPendingRecovery(null);
    setActiveSession(null);
  };

  return {
    // Session state
    sessionLogs,    setSessionLogs,
    xpAwards,       setXpAwards,
    workoutNote,    setWorkoutNote,
    focusMode,      setFocusMode,
    substitutions,  setSubstitutions,
    exerciseOrder,  setExerciseOrder,
    // localStorage handle (needed by finishWorkout / persistence effect)
    activeSession,  setActiveSession,
    // Recovery
    pendingRecovery,
    continueRecovery,
    discardRecovery,
    // Refs for persistence effect (WorkoutView reads these)
    sessionHydrated,
    skipSessionPersist,
  };
}
