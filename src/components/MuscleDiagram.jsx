// Anatomically-styled muscle diagram with curved muscle definitions.
// Front view + back view, scalable, colored by primary/secondary highlight.

const C = {
  body: "#181818",
  bodyStroke: "#2c2c2c",
  inactive: "#222",
  inactiveStroke: "#333",
};

export default function MuscleDiagram({ primary = [], secondary = [], accent = "#4ade80", size = 130 }) {
  const fill = (m) => primary.includes(m) ? accent : secondary.includes(m) ? accent + "70" : C.inactive;
  const stroke = (m) => primary.includes(m) || secondary.includes(m) ? accent : C.inactiveStroke;
  const opacityFor = (m) => primary.includes(m) ? 1 : secondary.includes(m) ? 0.85 : 1;
  const m = (musc) => ({
    fill: fill(musc),
    stroke: stroke(musc),
    strokeWidth: 0.4,
    fillOpacity: opacityFor(musc),
    style: { transition: "fill 0.4s ease, stroke 0.4s ease" },
  });

  const w = size, h = size * 1.92;

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 8 }}>
      <FrontBody m={m} accent={accent} w={w} h={h} />
      <BackBody m={m} accent={accent} w={w} h={h} />
    </div>
  );
}

function FrontBody({ m, accent, w, h }) {
  return (
    <svg viewBox="0 0 100 192" style={{ width: w, height: h }}>
      {/* BASE SILHOUETTE — single body outline */}
      <path
        d="
          M 50 4
          C 58 4 62 10 62 18
          C 62 22 60 26 58 28
          L 58 32
          C 65 33 73 36 78 41
          C 82 46 84 53 84 60
          L 82 92
          C 82 96 80 100 78 102
          L 76 102
          C 75 100 74 96 74 92
          L 71 60
          C 70 56 67 53 63 51
          L 63 56
          C 65 64 67 76 67 86
          C 67 92 65 96 63 99
          L 63 110
          C 63 118 65 130 64 145
          L 60 168
          C 60 176 58 184 56 190
          L 53 190
          C 51 184 50 176 50 168
          L 50 100

          L 50 168
          C 50 176 49 184 47 190
          L 44 190
          C 42 184 40 176 40 168
          L 36 145
          C 35 130 37 118 37 110
          L 37 99
          C 35 96 33 92 33 86
          C 33 76 35 64 37 56
          L 37 51
          C 33 53 30 56 29 60
          L 26 92
          C 26 96 25 100 24 102
          L 22 102
          C 20 100 18 96 18 92
          L 16 60
          C 16 53 18 46 22 41
          C 27 36 35 33 42 32
          L 42 28
          C 40 26 38 22 38 18
          C 38 10 42 4 50 4
          Z"
        fill={C.body} stroke={C.bodyStroke} strokeWidth="0.6"
      />

      {/* TRAPEZIUS (visible at neck) */}
      <path d="M 42 32 Q 50 33 58 32 L 60 38 Q 50 39 40 38 Z" {...m("upperBack")} />

      {/* DELTOIDS - Anterior */}
      <path d="M 39 38 C 35 39 31 42 30 47 C 32 49 36 49 40 47 C 41 43 41 40 39 38 Z" {...m("frontDelts")} />
      <path d="M 61 38 C 65 39 69 42 70 47 C 68 49 64 49 60 47 C 59 43 59 40 61 38 Z" {...m("frontDelts")} />

      {/* DELTOIDS - Lateral (side caps) */}
      <path d="M 30 47 C 27 50 24 56 24 62 C 27 62 30 60 32 56 C 32 52 31 49 30 47 Z" {...m("sideDelts")} />
      <path d="M 70 47 C 73 50 76 56 76 62 C 73 62 70 60 68 56 C 68 52 69 49 70 47 Z" {...m("sideDelts")} />

      {/* PECTORALIS - chest split into two halves */}
      <path d="M 49 41 C 44 41 38 44 34 49 C 32 54 33 60 36 63 C 41 63 46 61 49 58 L 49 41 Z" {...m("chest")} />
      <path d="M 51 41 C 56 41 62 44 66 49 C 68 54 67 60 64 63 C 59 63 54 61 51 58 L 51 41 Z" {...m("chest")} />

      {/* BICEPS - two heads each */}
      <path d="M 28 56 C 26 62 25 70 26 78 C 28 78 31 76 32 72 C 32 65 31 60 30 56 Z" {...m("biceps")} />
      <path d="M 72 56 C 74 62 75 70 74 78 C 72 78 69 76 68 72 C 68 65 69 60 70 56 Z" {...m("biceps")} />

      {/* FOREARMS */}
      <path d="M 25 80 C 23 86 21 94 20 100 L 23 100 C 25 96 27 90 28 82 Z" {...m("forearms")} />
      <path d="M 75 80 C 77 86 79 94 80 100 L 77 100 C 75 96 73 90 72 82 Z" {...m("forearms")} />

      {/* RECTUS ABDOMINIS - 6-pack with intersections */}
      <g>
        {/* Upper pair */}
        <path d="M 43 60 L 49 60 L 49 68 L 43 68 Z" {...m("core")} />
        <path d="M 51 60 L 57 60 L 57 68 L 51 68 Z" {...m("core")} />
        {/* Middle pair */}
        <path d="M 43 69 L 49 69 L 49 77 L 43 77 Z" {...m("core")} />
        <path d="M 51 69 L 57 69 L 57 77 L 51 77 Z" {...m("core")} />
        {/* Lower pair */}
        <path d="M 43 78 L 49 78 L 49 88 L 44 88 Z" {...m("core")} />
        <path d="M 51 78 L 57 78 L 56 88 L 51 88 Z" {...m("core")} />
      </g>

      {/* OBLIQUES - V-taper */}
      <path d="M 36 64 C 34 70 33 78 35 86 L 41 88 L 42 70 Z" {...m("core")} />
      <path d="M 64 64 C 66 70 67 78 65 86 L 59 88 L 58 70 Z" {...m("core")} />

      {/* QUADS - 4 distinct heads visible */}
      {/* Outer (vastus lateralis) */}
      <path d="M 35 100 C 32 110 32 122 33 134 C 35 138 38 138 39 134 C 40 122 40 110 38 100 Z" {...m("quads")} />
      <path d="M 65 100 C 68 110 68 122 67 134 C 65 138 62 138 61 134 C 60 122 60 110 62 100 Z" {...m("quads")} />
      {/* Center (rectus femoris) */}
      <path d="M 41 102 C 41 114 42 128 43 140 L 47 140 C 47 128 46 114 45 102 Z" {...m("quads")} />
      <path d="M 59 102 C 59 114 58 128 57 140 L 53 140 C 53 128 54 114 55 102 Z" {...m("quads")} />
      {/* Inner (vastus medialis - teardrop near knee) */}
      <path d="M 47 130 C 47 134 46 139 45 142 L 49 142 L 49 130 Z" {...m("quads")} />
      <path d="M 53 130 C 53 134 54 139 55 142 L 51 142 L 51 130 Z" {...m("quads")} />

      {/* TIBIALIS / shin area (calves on front) */}
      <path d="M 37 150 C 36 158 35 168 36 178 L 40 180 L 40 150 Z" {...m("calves")} />
      <path d="M 63 150 C 64 158 65 168 64 178 L 60 180 L 60 150 Z" {...m("calves")} />

      <text x="50" y="190" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="DM Mono, monospace" letterSpacing="0.5">FRONT</text>
    </svg>
  );
}

function BackBody({ m, accent, w, h }) {
  return (
    <svg viewBox="0 0 100 192" style={{ width: w, height: h }}>
      {/* Same base silhouette */}
      <path
        d="
          M 50 4
          C 58 4 62 10 62 18
          C 62 22 60 26 58 28
          L 58 32
          C 65 33 73 36 78 41
          C 82 46 84 53 84 60
          L 82 92
          C 82 96 80 100 78 102
          L 76 102
          C 75 100 74 96 74 92
          L 71 60
          C 70 56 67 53 63 51
          L 63 56
          C 65 64 67 76 67 86
          C 67 92 65 96 63 99
          L 63 110
          C 63 118 65 130 64 145
          L 60 168
          C 60 176 58 184 56 190
          L 53 190
          C 51 184 50 176 50 168
          L 50 100
          L 50 168
          C 50 176 49 184 47 190
          L 44 190
          C 42 184 40 176 40 168
          L 36 145
          C 35 130 37 118 37 110
          L 37 99
          C 35 96 33 92 33 86
          C 33 76 35 64 37 56
          L 37 51
          C 33 53 30 56 29 60
          L 26 92
          C 26 96 25 100 24 102
          L 22 102
          C 20 100 18 96 18 92
          L 16 60
          C 16 53 18 46 22 41
          C 27 36 35 33 42 32
          L 42 28
          C 40 26 38 22 38 18
          C 38 10 42 4 50 4
          Z"
        fill={C.body} stroke={C.bodyStroke} strokeWidth="0.6"
      />

      {/* TRAPEZIUS - diamond shape */}
      <path d="M 42 32 Q 50 33 58 32 L 64 40 Q 50 44 36 40 Z" {...m("upperBack")} />
      <path d="M 38 42 L 62 42 L 60 56 L 50 60 L 40 56 Z" {...m("upperBack")} />

      {/* REAR DELTOIDS */}
      <path d="M 36 40 C 32 41 28 44 28 50 C 31 51 35 50 38 47 C 38 44 37 41 36 40 Z" {...m("rearDelts")} />
      <path d="M 64 40 C 68 41 72 44 72 50 C 69 51 65 50 62 47 C 62 44 63 41 64 40 Z" {...m("rearDelts")} />

      {/* LATS - V-taper */}
      <path d="M 38 48 C 34 56 32 68 33 80 L 41 84 L 42 64 L 41 50 Z" {...m("lats")} />
      <path d="M 62 48 C 66 56 68 68 67 80 L 59 84 L 58 64 L 59 50 Z" {...m("lats")} />

      {/* MID-BACK / RHOMBOIDS area (slightly lower than traps) */}
      <path d="M 41 58 L 59 58 L 58 72 L 42 72 Z" {...m("upperBack")} />

      {/* ERECTOR SPINAE - two parallel ridges in lower back */}
      <path d="M 45 74 L 48 74 L 48 90 L 45 88 Z" {...m("lowerBack")} />
      <path d="M 52 74 L 55 74 L 55 88 L 52 90 Z" {...m("lowerBack")} />

      {/* TRICEPS - 3 heads */}
      <path d="M 25 56 C 23 62 22 72 23 80 C 25 80 28 78 29 74 C 29 66 28 60 27 56 Z" {...m("triceps")} />
      <path d="M 75 56 C 77 62 78 72 77 80 C 75 80 72 78 71 74 C 71 66 72 60 73 56 Z" {...m("triceps")} />
      {/* Triceps medial head detail */}
      <path d="M 28 65 L 31 65 L 30 76 L 28 76 Z" {...m("triceps")} />
      <path d="M 72 65 L 69 65 L 70 76 L 72 76 Z" {...m("triceps")} />

      {/* FOREARMS (back) */}
      <path d="M 22 80 C 20 86 18 94 17 100 L 20 100 C 22 96 24 90 25 82 Z" {...m("forearms")} />
      <path d="M 78 80 C 80 86 82 94 83 100 L 80 100 C 78 96 76 90 75 82 Z" {...m("forearms")} />

      {/* GLUTES - rounded butt cheeks */}
      <path d="M 36 90 C 34 96 33 102 36 106 C 41 108 47 106 48 100 L 48 92 Z" {...m("glutes")} />
      <path d="M 64 90 C 66 96 67 102 64 106 C 59 108 53 106 52 100 L 52 92 Z" {...m("glutes")} />

      {/* HAMSTRINGS - 3 heads visible */}
      {/* Outer (biceps femoris) */}
      <path d="M 35 110 C 33 120 33 132 34 142 L 38 142 C 39 132 40 120 39 110 Z" {...m("hamstrings")} />
      <path d="M 65 110 C 67 120 67 132 66 142 L 62 142 C 61 132 60 120 61 110 Z" {...m("hamstrings")} />
      {/* Inner (semitendinosus + semimembranosus) */}
      <path d="M 41 110 C 41 122 42 134 43 142 L 47 142 C 47 134 46 122 45 110 Z" {...m("hamstrings")} />
      <path d="M 59 110 C 59 122 58 134 57 142 L 53 142 C 53 134 54 122 55 110 Z" {...m("hamstrings")} />

      {/* CALVES - gastrocnemius two heads */}
      <path d="M 36 150 C 34 158 34 168 36 174 C 39 174 41 170 42 162 C 42 156 40 152 38 150 Z" {...m("calves")} />
      <path d="M 64 150 C 66 158 66 168 64 174 C 61 174 59 170 58 162 C 58 156 60 152 62 150 Z" {...m("calves")} />
      {/* Inner head (medial gastroc) */}
      <path d="M 43 150 C 44 158 45 166 45 172 L 47 172 L 47 150 Z" {...m("calves")} />
      <path d="M 57 150 C 56 158 55 166 55 172 L 53 172 L 53 150 Z" {...m("calves")} />

      <text x="50" y="190" textAnchor="middle" fontSize="4.5" fill="#888" fontFamily="DM Mono, monospace" letterSpacing="0.5">BACK</text>
    </svg>
  );
}
