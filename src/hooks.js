import { useState, useEffect, useRef } from "react";

function reportStorageError(key, action, err) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("lift-log-storage-error", {
    detail: { key, action, message: err?.message || String(err) },
  }));
}

function preserveCorruptStorageValue(key, raw) {
  if (typeof window === "undefined" || raw == null) return;
  try {
    const backupKey = `wt_corrupt_${key}_${Date.now()}`;
    localStorage.setItem(backupKey, raw);
  } catch (err) {
    console.warn(`useLocalStorage: failed to preserve corrupt value for "${key}"`, err);
  }
}

export function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (err) {
      console.warn(`useLocalStorage: failed to read "${key}"`, err);
      preserveCorruptStorageValue(key, raw);
      reportStorageError(key, "read", err);
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (err) {
      console.warn(`useLocalStorage: failed to write "${key}"`, err);
      reportStorageError(key, "write", err);
    }
  }, [key, value]);
  return [value, setValue];
}

// Live-updating session timer (only ticks when running)
export function useSessionTimer(running) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);

  useEffect(() => {
    if (!running) {
      startRef.current = null;
      setElapsed(0);
      return;
    }
    if (!startRef.current) startRef.current = Date.now();
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return elapsed;
}

export const fmtDuration = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};
