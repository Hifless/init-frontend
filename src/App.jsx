import { useState, useEffect, useCallback } from "react"
import { api, initTgUser } from "./api"
import { SplashScreen, AuthScreen } from "./components/Screens"
import ArbitrageTab from "./components/ArbitrageTab"
import ChartsTab from "./components/ChartsTab"
import { AlertsTab, PortfolioTab, TradesTab, SettingsModal } from "./components/OtherTabs"

export default function App() {
  const [phase, setPhase]             = useState("splash")
  const [user, setUser]               = useState(null)
  const [tab, setTab]                 = useState("arb")
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready()
      window.Telegram.WebApp.expand()
    }
    initTgUser()
    const t = setTimeout(async () => {
      try {
        const me = await api.getMe()
        if (me.has_access) { setUser(me); setPhase("app") }
        else setPhase("auth")
      } catch { setPhase("auth") }
    }, 2300)
    return () => clearTimeout(t)
  }, [])

  const onActivated = useCallback(async () => {
    try { const me = await api.getMe(); setUser(me); setPhase("app") } catch {}
  }, [])

  const refreshUser = useCallback(async () => {
    try { setUser(await api.getMe()) } catch {}
  }, [])

  if (phase === "splash") return <SplashScreen />
  if (phase === "auth")   return <AuthScreen onActivated={onActivated} />

  const TABS = [
    { id:"arb",       icon:"⚡", label:"Арбитраж" },
    { id:"charts",    icon:"📈", label:"Графики"  },
    { id:"alerts",    icon:"🔔", label:"Алерты"   },
    { id:"portfolio", icon:"💼", label:"Портфель" },
    { id:"trades",    icon:"📋", label:"История"  },
  ]

  return (
    <div style={s.root}>
      <style>{CSS}</style>
      <header style={s.header}>
        <div>
          <div style={s.logoRow}>
            <div style={s.logoIco}>⚔</div>
            <span style={s.logoTxt}>SKINTEL</span>
          </div>
          <div style={s.logoSub}>CS2 ARBITRAGE TERMINAL</div>
        </div>
        <div style={s.hRight}>
          <div style={s.live}>
            <div style={s.liveDot} />
            <span style={{ fontSize:9, color:"#00ff87", letterSpacing:1 }}>LIVE</span>
          </div>
          {user?.buff_expiring && (
            <button style={s.warnBtn} onClick={()=>setShowSettings(true)}>⚠️ Buff</button>
          )}
          <button style={s.settBtn} onClick={()=>setShowSettings(true)}>⚙</button>
        </div>
      </header>
      <main style={s.content}>
        {tab==="arb"       && <ArbitrageTab  user={user} />}
        {tab==="charts"    && <ChartsTab     user={user} />}
        {tab==="alerts"    && <AlertsTab     user={user} />}
        {tab==="portfolio" && <PortfolioTab  user={user} />}
        {tab==="trades"    && <TradesTab     user={user} />}
      </main>
      <nav style={s.nav}>
        {TABS.map(t => (
          <button key={t.id} style={{ ...s.navBtn, color:tab===t.id?"#fff":"#444" }}
            onClick={()=>setTab(t.id)}>
            <span style={{ fontSize:16 }}>{t.icon}</span>
            <span style={{ fontSize:8, letterSpacing:0.4 }}>{t.label}</span>
            {tab===t.id && <div style={s.navDot} />}
          </button>
        ))}
      </nav>
      {showSettings && <SettingsModal user={user} onClose={()=>{ setShowSettings(false); refreshUser() }} />}
    </div>
  )
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Syne:wght@700;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
  body{background:#0a0a0f;color:#e0e0e0;font-family:'JetBrains Mono',monospace;overflow:hidden}
  ::-webkit-scrollbar{width:2px}::-webkit-scrollbar-thumb{background:#ffffff20;border-radius:2px}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes glow{0%,100%{box-shadow:0 0 8px #00ff8722}50%{box-shadow:0 0 20px #00ff8744}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .fade-up{animation:fadeUp 0.25s ease both}
  .row-hover:hover{background:#ffffff06!important;cursor:pointer}
  .btn-press:active{transform:scale(0.97)}
`
const s = {
  root:    { display:"flex", flexDirection:"column", height:"100dvh", maxWidth:420, margin:"0 auto", background:"#0a0a0f" },
  header:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px 10px", borderBottom:"1px solid #ffffff0a", flexShrink:0 },
  logoRow: { display:"flex", alignItems:"center", gap:8 },
  logoIco: { width:26, height:26, borderRadius:7, background:"linear-gradient(135deg,#00ff87,#00d4ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 },
  logoTxt: { fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:17, letterSpacing:-0.5 },
  logoSub: { fontSize:9, color:"#3a3a3a", marginTop:2, letterSpacing:1 },
  hRight:  { display:"flex", alignItems:"center", gap:8 },
  live:    { display:"flex", alignItems:"center", gap:5 },
  liveDot: { width:6, height:6, borderRadius:"50%", background:"#00ff87", animation:"pulse 2s infinite" },
  warnBtn: { background:"none", border:"none", fontSize:10, color:"#ffd60a", cursor:"pointer", fontFamily:"inherit" },
  settBtn: { background:"none", border:"none", color:"#555", fontSize:18, cursor:"pointer", padding:"0 2px" },
  content: { flex:1, overflowY:"auto", overflowX:"hidden" },
  nav:     { display:"flex", borderTop:"1px solid #ffffff08", background:"#0a0a0f", flexShrink:0, paddingBottom:"env(safe-area-inset-bottom)" },
  navBtn:  { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 2px 6px", background:"none", border:"none", cursor:"pointer", position:"relative", gap:2, fontFamily:"inherit" },
  navDot:  { position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:18, height:2, background:"#00ff87", borderRadius:"0 0 2px 2px" },
}
