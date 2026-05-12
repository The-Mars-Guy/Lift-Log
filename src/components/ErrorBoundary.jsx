import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Lift Log crashed:", error, info?.componentStack);
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
        a.download = `lift-log-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn("Backup export failed", e);
    }
    this.setState({ error: null });
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
          Lift Log hit an unexpected error. Your saved workouts are still on this device — reloading usually clears it up.
        </div>
        <pre style={{fontSize:12,padding:"12px 14px",background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.25)",borderRadius:10,color:"#7f1d1d",whiteSpace:"pre-wrap",wordBreak:"break-word",marginBottom:22}}>
          {message}
        </pre>
        <button onClick={this.handleReload}
          style={{width:"100%",padding:"18px",background:"#dc2626",border:"none",borderRadius:13,fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#fff",letterSpacing:".1em",marginBottom:10}}>
          RELOAD APP
        </button>
        <button onClick={this.handleClearAndReload}
          style={{width:"100%",padding:"14px",background:"transparent",border:"1px solid rgba(103,122,150,.32)",borderRadius:11,fontSize:13,color:"#435166",letterSpacing:".08em"}}>
          DOWNLOAD LAST BACKUP & DISMISS
        </button>
      </div>
    );
  }
}
