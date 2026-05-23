import { useCallback, useEffect, useMemo, useRef } from "react";
import { BodyChart, ViewSide, filterMuscles } from "body-muscles";

const MUSCLE_REGION_IDS = {
  chest: ["chest-upper-left", "chest-lower-left", "chest-upper-right", "chest-lower-right"],
  frontDelts: ["shoulder-front-left", "shoulder-front-right"],
  sideDelts: ["shoulder-side-left", "shoulder-side-right"],
  rearDelts: ["deltoid-rear-left", "deltoid-rear-right"],
  biceps: ["biceps-left", "biceps-right"],
  triceps: ["triceps-long-left", "triceps-lateral-left", "triceps-long-right", "triceps-lateral-right"],
  forearms: [
    "forearm-left",
    "forearm-right",
    "forearm-flexors-left",
    "forearm-extensors-left",
    "forearm-flexors-right",
    "forearm-extensors-right",
  ],
  core: [
    "abs-upper-left",
    "abs-upper-right",
    "abs-lower-left",
    "abs-lower-right",
    "obliques-left",
    "obliques-right",
    "serratus-anterior-left",
    "serratus-anterior-right",
  ],
  upperBack: [
    "traps-upper-left",
    "traps-mid-left",
    "traps-upper-right",
    "traps-mid-right",
  ],
  lats: [
    "lats-upper-left",
    "lats-mid-left",
    "lats-lower-left",
    "lats-upper-right",
    "lats-mid-right",
    "lats-lower-right",
  ],
  lowerBack: ["spine", "lower-back-erectors-left", "lower-back-ql-left", "lower-back-erectors-right", "lower-back-ql-right"],
  glutes: ["gluteus-medius-left", "gluteus-maximus-left", "gluteus-medius-right", "gluteus-maximus-right"],
  quads: ["quads-left", "quads-right", "adductors-left", "adductors-right", "hip-flexor-left", "hip-flexor-right"],
  hamstrings: ["hamstrings-medial-left", "hamstrings-lateral-left", "hamstrings-medial-right", "hamstrings-lateral-right"],
  calves: [
    "calves-gastroc-medial-left",
    "calves-gastroc-lateral-left",
    "calves-soleus-left",
    "calves-gastroc-medial-right",
    "calves-gastroc-lateral-right",
    "calves-soleus-right",
    "tibialis-anterior-left",
    "tibialis-anterior-right",
  ],
};

const MUSCLE_ID_TO_GROUP = {};
Object.entries(MUSCLE_REGION_IDS).forEach(([group, ids]) => {
  ids.forEach(id => { MUSCLE_ID_TO_GROUP[id] = group; });
});

function toBodyState({ primary, secondary, activation }) {
  const state = {};

  Object.entries(MUSCLE_REGION_IDS).forEach(([muscle, regionIds]) => {
    const rawActivation = activation && Number.isFinite(Number(activation[muscle]))
      ? Math.max(0, Math.min(1, Number(activation[muscle])))
      : null;
    const fallbackActivation = primary.includes(muscle) ? 0.85 : secondary.includes(muscle) ? 0.5 : 0;
    const value = rawActivation ?? fallbackActivation;
    const intensity = value > 0 ? Math.max(1, Math.round(value * 10)) : 0;

    regionIds.forEach((id) => {
      state[id] = { intensity, selected: intensity > 0 };
    });
  });

  return state;
}

function applyLevelColors(svgEl, view, levelColors) {
  if (!svgEl || !levelColors) return;
  const paths = svgEl.querySelectorAll("path.body-chart-muscle");
  const muscles = filterMuscles(view);
  paths.forEach((path, i) => {
    const muscle = muscles[i];
    if (!muscle) return;
    const group = MUSCLE_ID_TO_GROUP[muscle.id];
    const color = group ? levelColors[group] : null;
    if (color) {
      path.style.fill = color;
      path.style.fillOpacity = "1";
    } else {
      path.style.fill = "";
      path.style.fillOpacity = "";
    }
  });
}

function BodyChartPanel({ view, bodyState, label, levelColors }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    chartRef.current = new BodyChart(containerRef.current, {
      view,
      bodyState,
      ariaLabel: `${label} muscle activation map`,
      enableTransitions: true,
    });
    svgRef.current = containerRef.current.querySelector("svg.body-chart-svg");
    applyLevelColors(svgRef.current, view, levelColors);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      svgRef.current = null;
    };
  }, [label, view]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    chartRef.current?.update({ bodyState });
    applyLevelColors(svgRef.current, view, levelColors);
  }, [bodyState, levelColors, view]);

  return (
    <div style={{minWidth:0,display:"grid",gap:6,justifyItems:"center"}}>
      <div ref={containerRef} style={{width:"100%",height:330}} />
      <span style={{fontSize:11,letterSpacing:0,textTransform:"uppercase",color:"#64748b",fontWeight:800}}>{label}</span>
    </div>
  );
}

function ClickableBodyPanel({ view, selectedMuscle, onSelect, accent, label }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const svgRef = useRef(null);

  // Build a neutral bodyState (no activation)
  const bodyState = useMemo(() => {
    const state = {};
    Object.values(MUSCLE_REGION_IDS).flat().forEach(id => {
      state[id] = { intensity: 0, selected: false };
    });
    return state;
  }, []);

  // Highlight selected muscle group
  const applyHighlight = useCallback((svgEl, selected, accentColor) => {
    if (!svgEl) return;
    const paths = svgEl.querySelectorAll("path.body-chart-muscle");
    const muscles = filterMuscles(view);
    paths.forEach((path, i) => {
      const muscle = muscles[i];
      if (!muscle) return;
      const group = MUSCLE_ID_TO_GROUP[muscle.id];
      if (selected && group === selected) {
        path.style.fill = accentColor;
        path.style.fillOpacity = "0.85";
      } else if (group) {
        path.style.fill = "#374151";
        path.style.fillOpacity = "0.7";
      } else {
        path.style.fill = "";
        path.style.fillOpacity = "";
      }
    });
  }, [view]);

  useEffect(() => {
    if (!containerRef.current) return undefined;
    chartRef.current = new BodyChart(containerRef.current, {
      view,
      bodyState,
      ariaLabel: `${label} muscle picker`,
      enableTransitions: false,
    });
    svgRef.current = containerRef.current.querySelector("svg.body-chart-svg");

    // Add click handlers
    const svgEl = svgRef.current;
    if (svgEl) {
      const handler = (e) => {
        const path = e.target.closest("path.body-chart-muscle");
        if (!path) return;
        const paths = svgEl.querySelectorAll("path.body-chart-muscle");
        const muscles = filterMuscles(view);
        const idx = Array.from(paths).indexOf(path);
        const muscle = muscles[idx];
        if (!muscle) return;
        const group = MUSCLE_ID_TO_GROUP[muscle.id];
        if (!group) return;
        onSelect(group);
      };
      svgEl.addEventListener("click", handler);
      svgEl.style.cursor = "pointer";
      return () => {
        svgEl.removeEventListener("click", handler);
        chartRef.current?.destroy();
        chartRef.current = null;
        svgRef.current = null;
      };
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
      svgRef.current = null;
    };
  }, [view, label]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    applyHighlight(svgRef.current, selectedMuscle, accent);
  }, [selectedMuscle, accent, applyHighlight]);

  return (
    <div style={{ minWidth: 0, display: "grid", gap: 4, justifyItems: "center" }}>
      <div ref={containerRef} style={{ width: "100%", height: 265 }} />
      <span style={{ fontSize: 10, letterSpacing: 0, textTransform: "uppercase", color: "#64748b", fontWeight: 800 }}>{label}</span>
    </div>
  );
}

export function MusclePickerDiagram({ selectedMuscle, onSelect, accent = "#4ade80" }) {
  return (
    <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: 12, overflow: "hidden", background: "#0d0d0d", border: "1px solid #1f1f1f", padding: "10px 6px 6px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 4, alignItems: "end" }}>
        <ClickableBodyPanel view={ViewSide.FRONT} selectedMuscle={selectedMuscle} onSelect={g => onSelect(g === selectedMuscle ? null : g)} accent={accent} label="Front" />
        <ClickableBodyPanel view={ViewSide.BACK}  selectedMuscle={selectedMuscle} onSelect={g => onSelect(g === selectedMuscle ? null : g)} accent={accent} label="Back" />
      </div>
      {selectedMuscle && (
        <button onClick={() => onSelect(null)}
          style={{ display: "block", margin: "6px auto 0", padding: "5px 14px", background: "transparent", border: `1px solid ${accent}66`, borderRadius: 8, color: accent, fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: ".08em" }}>
          CLEAR ✕
        </button>
      )}
    </div>
  );
}

export default function MuscleDiagram({ primary = [], secondary = [], activation = null, levelColors = null }) {
  const bodyState = useMemo(
    () => toBodyState({ primary, secondary, activation }),
    [activation, primary, secondary]
  );

  return (
    <div style={{width:"100%",maxWidth:560,margin:"0 auto",borderRadius:12,overflow:"hidden",background:"#f8fafc",border:"1px solid rgba(15,23,42,.08)",padding:"12px 8px"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2, minmax(0, 1fr))",gap:8,alignItems:"end"}}>
        <BodyChartPanel view={ViewSide.FRONT} bodyState={bodyState} label="Front" levelColors={levelColors} />
        <BodyChartPanel view={ViewSide.BACK} bodyState={bodyState} label="Back" levelColors={levelColors} />
      </div>
    </div>
  );
}
