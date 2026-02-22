// ═══════════════════════════════════════════════════════════════
// SPLASH SCREEN
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from "react"

export function SplashScreen() {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 350)
    const t2 = setTimeout(() => setStep(2), 800)
    const t3 = setTimeout(() => setStep(3), 1400)
    return () => [t1,t2,t3].forEach(clearTimeout)
  }, [])

  return (
    <div style={sp.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=JetBrains+Mono:wght@400;700&display=swap');
        @keyframes logoIn  { 0%{transform:scale(0.5) rotate(-15deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes glow    { 0%,100%{box-shadow:0 0 24px #00ff8755} 50%{box-shadow:0 0 48px #00ff87bb} }
        @keyframes barFill { from{width:0%} to{width:100%} }
        @keyframes textIn  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <div style={sp.ambient} />

      <div style={{ opacity: step>=1 ? 1 : 0, transition:"opacity 0.5s", display:"flex", justifyContent:"center" }}>
        <div style={sp.logoBox}>⚔</div>
      </div>

      <div style={{ opacity: step>=2 ? 1 : 0, transform: step>=2?"translateY(0)":"translateY(10px)", transition:"all 0.4s 0.1s", textAlign:"center" }}>
        <div style={sp.title}>SKINTEL</div>
        <div style={sp.sub}>CS2 ARBITRAGE TERMINAL</div>
      </div>

      <div style={{ opacity: step>=3 ? 1 : 0, transition:"opacity 0.3s", width:160 }}>
        <div style={sp.barTrack}>
          <div style={{ ...sp.barFill, animation: step>=3 ? "barFill 1.6s cubic-bezier(0.4,0,0.2,1) forwards" : "none" }} />
        </div>
        <div style={{ fontSize:9, color:"#333", textAlign:"center", marginTop:6, letterSpacing:1 }}>ЗАГРУЗКА...</div>
      </div>

      <div style={sp.ver}>v1.0.0</div>
    </div>
  )
}

const sp = {
  root:     { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", background:"#0a0a0f", gap:20, fontFamily:"JetBrains Mono,monospace", position:"relative", overflow:"hidden" },
  ambient:  { position:"absolute", top:"25%", left:"50%", transform:"translateX(-50%)", width:320, height:320, borderRadius:"50%", background:"radial-gradient(circle,#00ff8712 0%,transparent 70%)", pointerEvents:"none" },
  logoBox:  { width:80, height:80, borderRadius:22, background:"linear-gradient(135deg,#00ff87,#00d4ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, animation:"logoIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards, glow 2.5s ease 0.7s infinite" },
  title:    { fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:32, letterSpacing:-1 },
  sub:      { fontSize:10, color:"#444", letterSpacing:2, marginTop:4 },
  barTrack: { height:2, background:"#ffffff10", borderRadius:2, overflow:"hidden" },
  barFill:  { height:"100%", background:"linear-gradient(90deg,#00ff87,#00d4ff)", borderRadius:2, width:"0%" },
  ver:      { position:"absolute", bottom:20, fontSize:9, color:"#2a2a2a", letterSpacing:1 },
}


// ═══════════════════════════════════════════════════════════════
// AUTH SCREEN
// ═══════════════════════════════════════════════════════════════
const BASE = typeof import.meta !== "undefined" ? (import.meta.env?.VITE_API_URL || "http://localhost:8000/api") : "http://localhost:8000/api"

export function AuthScreen({ onActivated }) {
  const [key, setKey]         = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const activate = async () => {
    const k = key.trim().toUpperCase()
    if (!k) { setError("Введи ключ доступа"); return }
    setLoading(true); setError("")
    try {
      const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
      if (!tgId) {
        setError("Открой приложение через Telegram бота")
        setLoading(false); return
      }

      // Сначала проверяем — может уже активирован через бота
      const meR = await fetch(`${BASE}/users/me?tg_id=${tgId}`)
      if (meR.ok) {
        const me = await meR.json()
        if (me.has_access) { onActivated(); return }
      }

      // Активируем ключ через API
      const r = await fetch(`${BASE}/users/activate?tg_id=${tgId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: k }),
      })
      const data = await r.json()
      if (r.ok && data.ok) {
        onActivated()
      } else {
        setError(data.detail || "Ключ не подошёл")
      }
    } catch {
      setError("Ошибка сети")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={au.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&family=JetBrains+Mono:wght@400;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 20px #00ff8740} 50%{box-shadow:0 0 40px #00ff8780} }
        .auth-inp:focus { border-color:#00ff87!important; outline:none; box-shadow:0 0 0 3px #00ff8715; }
      `}</style>

      <div style={au.ambient} />

      {/* Logo */}
      <div style={{ textAlign:"center", animation:"fadeUp 0.5s ease" }}>
        <div style={au.icon}>⚔</div>
        <div style={au.title}>SKINTEL</div>
        <div style={au.sub}>CS2 ARBITRAGE TERMINAL</div>
      </div>

      {/* Card */}
      <div style={au.card}>
        <div style={au.cardTitle}>🔑 Доступ закрыт</div>
        <div style={au.hint}>
          Для доступа нужен ключ активации.<br/>
          Активируй через бота одной командой:
        </div>
        <div style={au.codePill}>/activate ТВОЙ-КЛЮЧ</div>

        <div style={au.divider}>или введи ключ здесь</div>

        <input className="auth-inp" style={au.input}
          placeholder="SK-XXXX-XXXX-XXXX"
          value={key}
          onChange={e => setKey(e.target.value.toUpperCase())}
          onKeyDown={e => e.key==="Enter" && activate()}
        />

        {error && <div style={au.error}>{error}</div>}

        <button className="btn-press" style={{ ...au.btn, opacity:loading?0.6:1 }}
          onClick={activate} disabled={loading}>
          {loading ? "Проверяем..." : "Активировать →"}
        </button>
      </div>

      <div style={au.footer}>Нет ключа? Пиши администратору</div>
    </div>
  )
}

const au = {
  root:     { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100dvh", background:"#0a0a0f", padding:24, gap:20, fontFamily:"JetBrains Mono,monospace", position:"relative" },
  ambient:  { position:"absolute", top:"20%", left:"50%", transform:"translateX(-50%)", width:280, height:280, borderRadius:"50%", background:"radial-gradient(circle,#00ff8710 0%,transparent 70%)", pointerEvents:"none" },
  icon:     { width:68, height:68, borderRadius:20, background:"linear-gradient(135deg,#00ff87,#00d4ff)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, margin:"0 auto 12px", animation:"glow 3s ease infinite" },
  title:    { fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:28, letterSpacing:-0.5 },
  sub:      { fontSize:9, color:"#444", letterSpacing:2, marginTop:3 },
  card:     { width:"100%", background:"#ffffff05", border:"1px solid #ffffff0e", borderRadius:14, padding:20, animation:"fadeUp 0.5s 0.15s ease both" },
  cardTitle:{ fontSize:13, fontWeight:700, marginBottom:10 },
  hint:     { fontSize:10, color:"#666", lineHeight:1.7, marginBottom:10 },
  codePill: { background:"#00ff8710", border:"1px solid #00ff8830", borderRadius:6, padding:"8px 12px", fontSize:12, color:"#00ff87", fontWeight:700, textAlign:"center", letterSpacing:1, marginBottom:12 },
  divider:  { fontSize:9, color:"#2a2a2a", textAlign:"center", marginBottom:10, letterSpacing:1 },
  input:    { width:"100%", background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#fff", fontFamily:"JetBrains Mono,monospace", letterSpacing:2, marginBottom:10, transition:"border-color 0.2s,box-shadow 0.2s" },
  error:    { fontSize:10, color:"#ff4757", marginBottom:8, lineHeight:1.4 },
  btn:      { width:"100%", padding:"11px 0", background:"linear-gradient(135deg,#00ff87,#00d4ff)", color:"#000", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"JetBrains Mono,monospace", letterSpacing:1 },
  footer:   { fontSize:10, color:"#2a2a2a", letterSpacing:0.5 },
}

export default SplashScreen