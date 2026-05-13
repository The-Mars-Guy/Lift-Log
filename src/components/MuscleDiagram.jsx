const C = { inactive:"#0f1720", stroke:"#d9e4ef" };

const ZONES = {
  chest: [{ x:380,y:330,w:165,h:88,rx:42 }],
  frontDelts: [{ x:270,y:295,w:82,h:72,rx:36 }, { x:520,y:295,w:82,h:72,rx:36 }],
  sideDelts: [{ x:235,y:330,w:72,h:98,rx:32 }, { x:565,y:330,w:72,h:98,rx:32 }],
  biceps: [{ x:210,y:420,w:58,h:150,rx:27 }, { x:615,y:420,w:58,h:150,rx:27 }],
  forearms: [{ x:174,y:560,w:62,h:180,rx:24 }, { x:652,y:560,w:62,h:180,rx:24 }, { x:764,y:558,w:62,h:180,rx:24 }, { x:1244,y:558,w:62,h:180,rx:24 }],
  core: [{ x:372,y:430,w:150,h:235,rx:42 }],
  quads: [{ x:300,y:720,w:96,h:290,rx:42 }, { x:475,y:720,w:96,h:290,rx:42 }],
  calves: [{ x:290,y:1002,w:82,h:190,rx:32 }, { x:500,y:1002,w:82,h:190,rx:32 }, { x:955,y:1010,w:82,h:178,rx:32 }, { x:1162,y:1010,w:82,h:178,rx:32 }],
  upperBack: [{ x:928,y:300,w:210,h:170,rx:50 }],
  rearDelts: [{ x:815,y:316,w:78,h:82,rx:34 }, { x:1174,y:316,w:78,h:82,rx:34 }],
  lats: [{ x:842,y:432,w:118,h:210,rx:46 }, { x:1104,y:432,w:118,h:210,rx:46 }],
  lowerBack: [{ x:977,y:545,w:116,h:160,rx:38 }],
  triceps: [{ x:780,y:420,w:58,h:155,rx:27 }, { x:1230,y:420,w:58,h:155,rx:27 }],
  glutes: [{ x:915,y:690,w:118,h:120,rx:46 }, { x:1040,y:690,w:118,h:120,rx:46 }],
  hamstrings: [{ x:884,y:805,w:95,h:230,rx:40 }, { x:1100,y:805,w:95,h:230,rx:40 }],
};

export default function MuscleDiagram({ primary = [], secondary = [], activation = null, accent = "#4ade80" }) {
  const asset = `${import.meta.env.BASE_URL}anatomy/muscles-front-back.svg`;
  const activeValue = (m) => activation && Number.isFinite(Number(activation[m])) ? Math.max(0, Math.min(1, Number(activation[m]))) : null;
  const opacity = (m) => {
    const value = activeValue(m);
    if (value != null) return value > 0 ? 0.18 + value * 0.42 : 0;
    if (primary.includes(m)) return 0.5;
    if (secondary.includes(m)) return 0.28;
    return 0;
  };

  return (
    <div style={{position:"relative",width:"100%",maxWidth:520,margin:"0 auto",borderRadius:12,overflow:"hidden",background:"#f8fafc"}}>
      <img src={asset} alt="Human muscular anatomy front and back" style={{display:"block",width:"100%",height:"auto"}}/>
      <svg viewBox="0 0 1442 1256" aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",mixBlendMode:"multiply",pointerEvents:"none"}}>
        {Object.entries(ZONES).flatMap(([muscle, zones]) => zones.map((zone, index) => (
          <rect
            key={`${muscle}-${index}`}
            x={zone.x}
            y={zone.y}
            width={zone.w}
            height={zone.h}
            rx={zone.rx}
            fill={accent}
            stroke={C.stroke}
            strokeWidth="2"
            opacity={opacity(muscle)}
          />
        )))}
      </svg>
    </div>
  );
}
