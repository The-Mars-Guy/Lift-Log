import { useEffect, useRef } from "react";

export function Confetti({ active, accent, onDone }) {
  const ref = useRef();
  useEffect(() => {
    if (!active || !ref.current) return;
    const cv = ref.current;
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const ctx = cv.getContext("2d");
    const cols = [accent,"#fbbf24","#fb923c","#60a5fa","#f9fafb","#a78bfa","#f472b6"];
    const ps = Array.from({length:90},(_,i)=>({
      x:Math.random()*cv.width, y:cv.height*.6+Math.random()*cv.height*.2,
      vx:(Math.random()-.5)*9, vy:-(Math.random()*14+7),
      col:cols[i%cols.length], sz:Math.random()*9+4,
      rot:Math.random()*Math.PI*2, spin:(Math.random()-.5)*.22,
      alpha:1, shape:i%3,
    }));
    let fr;
    const draw=()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      let alive=false;
      for(const p of ps){
        p.x+=p.vx; p.y+=p.vy; p.vy+=.38; p.vx*=.99; p.rot+=p.spin; p.alpha-=.011;
        if(p.alpha<=0) continue; alive=true;
        ctx.save(); ctx.globalAlpha=Math.max(0,p.alpha); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col;
        if(p.shape===0) ctx.fillRect(-p.sz/2,-p.sz*.4,p.sz,p.sz*.8);
        else if(p.shape===1){ctx.beginPath();ctx.arc(0,0,p.sz*.45,0,Math.PI*2);ctx.fill();}
        else ctx.fillRect(-p.sz*.18,-p.sz*.6,p.sz*.36,p.sz*1.2);
        ctx.restore();
      }
      if(alive) fr=requestAnimationFrame(draw); else onDone?.();
    };
    fr=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(fr);
  },[active,accent,onDone]);
  if(!active) return null;
  return <canvas ref={ref} style={{position:"fixed",inset:0,zIndex:300,pointerEvents:"none"}}/>;
}

export function XpFloat({ amount, onDone }) {
  useEffect(()=>{ const id=setTimeout(onDone,900); return()=>clearTimeout(id); },[onDone]);
  return (
    <div style={{
      position:"fixed", right:24, top:"45%", zIndex:250,
      fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#fbbf24",
      letterSpacing:".08em", pointerEvents:"none",
      animation:"xpFloat .9s ease-out forwards",
      filter:"drop-shadow(0 0 8px #fbbf2499)",
    }}>+{amount} XP</div>
  );
}
