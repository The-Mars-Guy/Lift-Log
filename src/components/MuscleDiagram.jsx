// Anatomical muscle diagram — fills container width, fully responsive.

const C = { body: "#181818", bodyStroke: "#2c2c2c", inactive: "#222", inactiveStroke: "#2e2e2e" };

export default function MuscleDiagram({ primary = [], secondary = [], activation = null, accent = "#4ade80" }) {
  const activeValue = (m) => activation && Number.isFinite(Number(activation[m])) ? Math.max(0, Math.min(1, Number(activation[m]))) : null;
  const fill = (m) => {
    const value = activeValue(m);
    if (value != null) return value > 0 ? `${accent}${Math.round(45 + value * 165).toString(16).padStart(2, "0")}` : C.inactive;
    return primary.includes(m) ? accent : secondary.includes(m) ? accent + "60" : C.inactive;
  };
  const stroke = (m) => activeValue(m) > 0 || primary.includes(m) || secondary.includes(m) ? accent : C.inactiveStroke;
  const attr   = (m) => ({ fill: fill(m), stroke: stroke(m), strokeWidth: 0.4, style:{ transition:"fill .35s,stroke .35s" } });

  return (
    <div style={{ display:"flex", justifyContent:"center", gap:12, width:"100%" }}>
      <FrontBody attr={attr} accent={accent} />
      <BackBody  attr={attr} accent={accent} />
    </div>
  );
}

const BODY_PATH = `
  M 50 4
  C 58 4 62 10 62 18 C 62 22 60 26 58 28 L 58 32
  C 65 33 73 36 78 41 C 82 46 84 53 84 60 L 82 92
  C 82 96 80 100 78 102 L 76 102 C 75 100 74 96 74 92
  L 71 60 C 70 56 67 53 63 51 L 63 56
  C 65 64 67 76 67 86 C 67 92 65 96 63 99
  L 63 110 C 63 118 65 130 64 145 L 60 168
  C 60 176 58 184 56 190 L 53 190
  C 51 184 50 176 50 168 L 50 100
  L 50 168 C 50 176 49 184 47 190 L 44 190
  C 42 184 40 176 40 168 L 36 145
  C 35 130 37 118 37 110 L 37 99
  C 35 96 33 92 33 86 C 33 76 35 64 37 56
  L 37 51 C 33 53 30 56 29 60 L 26 92
  C 26 96 25 100 24 102 L 22 102
  C 20 100 18 96 18 92 L 16 60
  C 16 53 18 46 22 41 C 27 36 35 33 42 32
  L 42 28 C 40 26 38 22 38 18 C 38 10 42 4 50 4 Z`;

function FrontBody({ attr, accent }) {
  return (
    <svg viewBox="0 0 100 194" style={{ flex:1, maxWidth:180, height:"auto" }}>
      {/* Body silhouette */}
      <path d={BODY_PATH} fill={C.body} stroke={C.bodyStroke} strokeWidth="0.7"/>
      {/* Neck / SCM */}
      <path d="M 45 28 L 45 32 L 55 32 L 55 28 Z" fill="#1c1c1c" stroke={C.bodyStroke} strokeWidth="0.3"/>
      {/* Traps (upper) */}
      <path d="M 42 32 Q 50 33 58 32 L 61 38 Q 50 39.5 39 38 Z" {...attr("upperBack")}/>
      {/* Anterior delts */}
      <path d="M 39 38 C 35 39 31 43 30 48 C 33 50 37 49 40 47 C 41 43 41 40 39 38 Z" {...attr("frontDelts")}/>
      <path d="M 61 38 C 65 39 69 43 70 48 C 67 50 63 49 60 47 C 59 43 59 40 61 38 Z" {...attr("frontDelts")}/>
      {/* Lateral delts */}
      <path d="M 30 48 C 27 51 24 57 24 63 C 27 63 30 61 32 57 C 32 52 31 50 30 48 Z" {...attr("sideDelts")}/>
      <path d="M 70 48 C 73 51 76 57 76 63 C 73 63 70 61 68 57 C 68 52 69 50 70 48 Z" {...attr("sideDelts")}/>
      {/* Pec left */}
      <path d="M 48 41 C 43 41 37 44 33 49 C 31 55 33 61 36 63 C 41 63 46 61 48 58 L 48 41 Z" {...attr("chest")}/>
      {/* Pec right */}
      <path d="M 52 41 C 57 41 63 44 67 49 C 69 55 67 61 64 63 C 59 63 54 61 52 58 L 52 41 Z" {...attr("chest")}/>
      {/* Pec center shadow line */}
      <line x1="50" y1="41" x2="50" y2="58" stroke="#0a0a0a" strokeWidth="0.6" opacity="0.6"/>
      {/* Biceps */}
      <path d="M 27 57 C 25 64 24 72 25 80 C 27 80 31 77 32 73 C 32 65 30 60 29 57 Z" {...attr("biceps")}/>
      <path d="M 73 57 C 75 64 76 72 75 80 C 73 80 69 77 68 73 C 68 65 70 60 71 57 Z" {...attr("biceps")}/>
      {/* Forearms */}
      <path d="M 24 81 C 22 88 20 96 19 102 L 22 102 C 24 97 27 91 28 83 Z" {...attr("forearms")}/>
      <path d="M 76 81 C 78 88 80 96 81 102 L 78 102 C 76 97 73 91 72 83 Z" {...attr("forearms")}/>
      {/* Abs — 6-pack grid */}
      <rect x="43" y="60" width="6" height="7.5" rx="1.2" {...attr("core")}/>
      <rect x="51" y="60" width="6" height="7.5" rx="1.2" {...attr("core")}/>
      <rect x="43" y="68.5" width="6" height="7.5" rx="1.2" {...attr("core")}/>
      <rect x="51" y="68.5" width="6" height="7.5" rx="1.2" {...attr("core")}/>
      <rect x="43" y="77"   width="6" height="8"   rx="1.2" {...attr("core")}/>
      <rect x="51" y="77"   width="6" height="8"   rx="1.2" {...attr("core")}/>
      {/* Obliques */}
      <path d="M 36 64 C 33 71 32 79 34 87 L 41 89 L 42 71 Z" {...attr("core")}/>
      <path d="M 64 64 C 67 71 68 79 66 87 L 59 89 L 58 71 Z" {...attr("core")}/>
      {/* Quads — vastus lateralis */}
      <path d="M 35 101 C 32 111 31 124 32 136 C 34 139 38 139 40 136 C 40 123 40 110 38 101 Z" {...attr("quads")}/>
      <path d="M 65 101 C 68 111 69 124 68 136 C 66 139 62 139 60 136 C 60 123 60 110 62 101 Z" {...attr("quads")}/>
      {/* Rectus femoris (center quad) */}
      <path d="M 42 103 L 42 140 L 47 140 L 46 103 Z" {...attr("quads")}/>
      <path d="M 58 103 L 58 140 L 53 140 L 54 103 Z" {...attr("quads")}/>
      {/* Vastus medialis (teardrop near knee) */}
      <path d="M 47 130 C 46 135 46 140 47 144 L 50 144 L 49 130 Z" {...attr("quads")}/>
      <path d="M 53 130 C 54 135 54 140 53 144 L 50 144 L 51 130 Z" {...attr("quads")}/>
      {/* Tibialis anterior (shin) */}
      <path d="M 37 152 C 36 161 35 171 36 179 L 40 181 C 40 171 40 161 39 152 Z" {...attr("calves")}/>
      <path d="M 63 152 C 64 161 65 171 64 179 L 60 181 C 60 171 60 161 61 152 Z" {...attr("calves")}/>
      <text x="50" y="192" textAnchor="middle" fontSize="5" fill="#555" fontFamily="DM Mono,monospace" letterSpacing="0.5">FRONT</text>
    </svg>
  );
}

function BackBody({ attr, accent }) {
  return (
    <svg viewBox="0 0 100 194" style={{ flex:1, maxWidth:180, height:"auto" }}>
      <path d={BODY_PATH} fill={C.body} stroke={C.bodyStroke} strokeWidth="0.7"/>
      {/* Traps — upper and mid diamond */}
      <path d="M 42 32 Q 50 33 58 32 L 64 40 Q 50 44.5 36 40 Z" {...attr("upperBack")}/>
      <path d="M 38 42 L 62 42 L 60 57 L 50 62 L 40 57 Z" {...attr("upperBack")}/>
      {/* Rear delts */}
      <path d="M 36 40 C 31 41 27 45 27 51 C 30 52 35 50 38 47 C 38 44 37 41 36 40 Z" {...attr("rearDelts")}/>
      <path d="M 64 40 C 69 41 73 45 73 51 C 70 52 65 50 62 47 C 62 44 63 41 64 40 Z" {...attr("rearDelts")}/>
      {/* Lats */}
      <path d="M 38 49 C 33 57 31 69 32 81 L 41 85 L 42 65 L 41 51 Z" {...attr("lats")}/>
      <path d="M 62 49 C 67 57 69 69 68 81 L 59 85 L 58 65 L 59 51 Z" {...attr("lats")}/>
      {/* Rhomboids */}
      <path d="M 41 59 L 59 59 L 58 73 L 42 73 Z" {...attr("upperBack")}/>
      {/* Erector spinae columns */}
      <rect x="46" y="74" width="3" height="16" rx="1.3" {...attr("lowerBack")}/>
      <rect x="51" y="74" width="3" height="16" rx="1.3" {...attr("lowerBack")}/>
      {/* Triceps — lateral head */}
      <path d="M 24 57 C 22 64 21 73 22 81 C 24 81 28 79 29 75 C 29 67 28 61 26 57 Z" {...attr("triceps")}/>
      <path d="M 76 57 C 78 64 79 73 78 81 C 76 81 72 79 71 75 C 71 67 72 61 74 57 Z" {...attr("triceps")}/>
      {/* Triceps medial head */}
      <path d="M 28 67 L 31 67 L 31 77 L 28 77 Z" rx="1" {...attr("triceps")}/>
      <path d="M 72 67 L 69 67 L 69 77 L 72 77 Z" rx="1" {...attr("triceps")}/>
      {/* Forearms */}
      <path d="M 21 82 C 19 88 17 96 16 102 L 19 102 C 21 97 24 91 25 83 Z" {...attr("forearms")}/>
      <path d="M 79 82 C 81 88 83 96 84 102 L 81 102 C 79 97 76 91 75 83 Z" {...attr("forearms")}/>
      {/* Glutes */}
      <path d="M 36 91 C 34 97 33 104 36 108 C 41 109 47 107 48 100 L 48 93 Z" {...attr("glutes")}/>
      <path d="M 64 91 C 66 97 67 104 64 108 C 59 109 53 107 52 100 L 52 93 Z" {...attr("glutes")}/>
      {/* Glute medius (top corners) */}
      <path d="M 36 91 C 34 88 35 84 38 83 L 43 88 Z" {...attr("glutes")}/>
      <path d="M 64 91 C 66 88 65 84 62 83 L 57 88 Z" {...attr("glutes")}/>
      {/* Hamstrings — biceps femoris (outer) */}
      <path d="M 35 111 C 33 121 33 133 34 143 L 38 143 C 40 133 40 121 39 111 Z" {...attr("hamstrings")}/>
      <path d="M 65 111 C 67 121 67 133 66 143 L 62 143 C 60 133 60 121 61 111 Z" {...attr("hamstrings")}/>
      {/* Semi-T + semi-M (inner) */}
      <path d="M 41 111 L 41 142 L 46 142 L 45 111 Z" {...attr("hamstrings")}/>
      <path d="M 59 111 L 59 142 L 54 142 L 55 111 Z" {...attr("hamstrings")}/>
      {/* Gastroc — two heads per calf */}
      <path d="M 36 152 C 34 160 34 170 36 176 C 39 176 42 171 42 163 C 42 157 40 153 38 152 Z" {...attr("calves")}/>
      <path d="M 64 152 C 66 160 66 170 64 176 C 61 176 58 171 58 163 C 58 157 60 153 62 152 Z" {...attr("calves")}/>
      <path d="M 43 152 C 44 160 44 168 44 174 L 47 174 L 47 152 Z" {...attr("calves")}/>
      <path d="M 57 152 C 56 160 56 168 56 174 L 53 174 L 53 152 Z" {...attr("calves")}/>
      <text x="50" y="192" textAnchor="middle" fontSize="5" fill="#555" fontFamily="DM Mono,monospace" letterSpacing="0.5">BACK</text>
    </svg>
  );
}
