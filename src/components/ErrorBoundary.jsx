import { Component } from "react";
import { nukeAndReload } from "../nuke.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetting: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Gym Forged crashed:", error, info?.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearAndReload = () => {
    try {
      const raw = localStorage.getItem("wt_last_backup");
      if (raw) {
        const blob = new Blob([raw], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `forged-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Backup export failed", e);
    }
    this.setState({ error: null });
  };

  handleFullReset = () => {
    const ok = window.confirm(
      "This deletes ALL data, cache, and offline storage on this device, then restarts the app fresh. This cannot be undone. Continue?"
    );
    if (!ok) return;
    this.setState({ resetting: true });
    nukeAndReload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const message = this.state.error?.message || String(this.state.error);
    return (
      <div style={{minHeight:"100vh",padding:"44px 22px",background:"linear-gradient(180deg,#f8fffb,#eef7ff)",color:"#172033",fontFamily:"system-ui,-apple-system,sans-serif"}}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:48,color:"#dc2626",letterSpacing:".05em",lineHeight:.9,marginBottom:14}}>
          SOMETHING<br/>BROKE
        </div>
        <div style={{fontSize:15,color:"#435166",lineHeight:1.6,marginBottom:20}}>
          Gym Forged hit an unexpected error. Your saved workouts are still on this device — reloading usually clears it up.
        </div>
        <pre style={{fontSize:12,padding:"12px 14px",background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.25)",borderRadius:10,color:"#7f1d1d",whiteSpace:"pre-wrap",wordBreak:"break-word",marginBottom:22}}>
          {message}
        </pre>
        <button onClick={this.handleReload}
          style={{width:"100%",padding:"18px",background:"#dc2626",border:"none",borderRadius:13,fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#fff",letterSpacing:".1em",marginBottom:10}}>
          RELOAD APP
        </button>
        <button onClick={this.handleClearAndReload}
          style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(103,122,150,.32)",borderRadius:11,fontSize:13,color:"#435166",letterSpacing:".08em",marginBottom:10}}>
          DOWNLOAD LAST BACKUP & DISMISS
        </button>
        <button onClick={this.handleFullReset} disabled={this.state.resetting}
          style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(220,38,38,.45)",borderRadius:11,fontSize:13,color:"#dc2626",letterSpacing:".06em",fontWeight:600,opacity:this.state.resetting?0.5:1}}>
          {this.state.resetting ? "Resetting…" : "Full reset — delete all data and restart"}
        </button>
        <div style={{fontSize:11,color:"#8896a8",lineHeight:1.5,marginTop:10,textAlign:"center"}}>
          Full reset wipes every saved workout, setting, and cached file on this device. Use only if reload doesn't help.
        </div>
      </div>
    );
  }
}
