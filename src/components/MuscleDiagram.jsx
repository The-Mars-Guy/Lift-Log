import { useEffect, useMemo, useRef } from "react";
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
  }, [label, view]);

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
