import { useState, useEffect } from "react"
import { api } from "../api"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"

const PERIODS = ["1д", "7д", "30д", "90д"]
const COLORS  = { buff:"#ffd60a", cgm:"#00ff87", skinport:"#00d4ff", steam:"#b0c4de" }
const LABELS  = { buff:"Buff.163 🇨🇳", cgm:"CSGOMarket 🇷🇺", skinport:"Skinport 🌍", steam:"Steam 💨" }

export default function ChartsTab({ user }) {
  const [search, setSearch]   = useState("")
  const [selected, setSelected] = useState(null)
  const [period, setPeriod]   = useState("7д")
  const [history, setHistory] = useState({})
  const [arbItems, setArbItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.getArbitrage(0).then(setArbItems).catch(()=>{}) }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    api.getHistory(selected, period)
      .then(d => { setHistory(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [selected, period])

  const filtered = search.length > 1
    ? arbItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : arbItems.slice(0, 8)

  // Объединяем точки по времени
  const chartData = (() => {
    const map = {}
    Object.entries(history).forEach(([platform, pts]) => {
      pts.forEach(p => {
        const t = p.ts.slice(0, 16).replace("T", " ")
        if (!map[t]) map[t] = { t }
        map[t][platform] = p.price
      })
    })
    return Object.values(map).sort((a, b) => a.t.localeCompare(b.t))
  })()

  const hasData   = chartData.length > 0
  const platforms = Object.keys(history)
  const selectedItem = arbItems.find(i => i.name === selected)
  const usdRub = user?.usd_rub || 90

  // Считаем изменение за период
  const pctChange = (() => {
    if (!hasData || !history.buff?.length) return null
    const pts = history.buff
    const chg = ((pts[pts.length-1].price - pts[0].price) / pts[0].price * 100).toFixed(1)
    return { val: chg, up: parseFloat(chg) >= 0 }
  })()

  return (
    <div className="fade-up" style={{ padding:"12px 16px" }}>
      {/* Search */}
      <input
        style={s.input}
        placeholder="🔍 Поиск скина..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Skin list */}
      <div style={{ marginBottom:12 }}>
        {filtered.map(item => (
          <div key={item.name} className="row-hover"
            onClick={() => setSelected(item.name)}
            style={{ ...s.skinRow, borderColor:selected===item.name?"#00ff87":"#ffffff10", background:selected===item.name?"#00ff8708":"#ffffff03" }}>
            {item.icon_url
              ? <img src={item.icon_url} alt="" style={{ width:32, height:32, borderRadius:5, objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} />
              : <div style={{ width:32, height:32, borderRadius:5, background:"#ffffff08", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>🔫</div>
            }
            <div style={{ flex:1, overflow:"hidden" }}>
              <div style={{ fontSize:10, fontWeight:600, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
              <div style={{ fontSize:9, color:"#555" }}>Buff ${(item.buff_price||0).toFixed(2)} · ROI {item.best_roi.toFixed(1)}%</div>
            </div>
            {selected===item.name && <span style={{ color:"#00ff87", fontSize:12, flexShrink:0 }}>✓</span>}
          </div>
        ))}
        {filtered.length===0 && search.length>1 && (
          <div style={{ fontSize:10, color:"#444", padding:"16px 0", textAlign:"center" }}>Не найдено</div>
        )}
      </div>

      {selected && (
        <>
          {/* Price header */}
          {selectedItem && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, color:"#555" }}>{selected}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:10, marginTop:4 }}>
                <span style={{ fontSize:22, fontWeight:700 }}>${(selectedItem.buff_price||0).toFixed(2)}</span>
                <span style={{ fontSize:11, color:"#555" }}>{Math.round((selectedItem.buff_price||0)*usdRub)}₽</span>
                {pctChange && (
                  <span style={{ fontSize:12, fontWeight:700, color:pctChange.up?"#00ff87":"#ff4757" }}>
                    {pctChange.up?"+":""}{pctChange.val}% за период
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Period toggle */}
          <div style={{ display:"flex", gap:4, marginBottom:10 }}>
            {PERIODS.map(p => (
              <button key={p} className="btn-press" onClick={() => setPeriod(p)}
                style={{ ...s.periodBtn, borderColor:period===p?"#00ff87":"#ffffff10", background:period===p?"#00ff8715":"transparent", color:period===p?"#00ff87":"#555" }}>
                {p}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={s.chartBox}>
            {loading ? (
              <div style={{ height:160, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:10 }}>
                Загрузка...
              </div>
            ) : hasData ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                  <XAxis dataKey="t" tick={{ fill:"#444", fontSize:8 }} tickFormatter={v=>v.slice(5,10)} />
                  <YAxis tick={{ fill:"#444", fontSize:8 }} />
                  <Tooltip
                    contentStyle={{ background:"#111118", border:"1px solid #ffffff15", borderRadius:6, fontSize:10 }}
                    labelStyle={{ color:"#888" }} itemStyle={{ color:"#fff" }}
                  />
                  {platforms.map(p => (
                    <Line key={p} type="monotone" dataKey={p} name={LABELS[p]||p}
                      stroke={COLORS[p]||"#888"} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:"#333", fontSize:10, gap:6 }}>
                <span style={{ fontSize:20 }}>📊</span>
                История пустая за этот период.<br/>
                <span style={{ fontSize:9 }}>Данные копятся с момента запуска бота.</span>
              </div>
            )}
          </div>

          {/* Platform prices */}
          {selectedItem && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:9, color:"#444", letterSpacing:1, marginBottom:8 }}>ЦЕНЫ НА ПЛОЩАДКАХ</div>
              {[
                { key:"buff",     label:"Buff.163 🇨🇳",   price:selectedItem.buff_price,                         note:"← покупаем здесь",   color:"#ffd60a" },
                { key:"cgm",      label:"CSGOMarket 🇷🇺",  price:selectedItem.platforms?.cgm?.sell_price,         note:`→ нетто $${selectedItem.platforms?.cgm?.net_usd?.toFixed(2)||"—"}`, color:"#00ff87" },
                { key:"skinport", label:"Skinport 🌍",     price:selectedItem.platforms?.skinport?.sell_price,    note:`→ нетто $${selectedItem.platforms?.skinport?.net_usd?.toFixed(2)||"—"}`, color:"#00d4ff" },
              ].filter(r => r.price).map((r, i) => (
                <div key={i} style={s.priceRow}>
                  <span style={{ fontSize:11, color:"#888" }}>{r.label}</span>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:r.color }}>${r.price?.toFixed(2)}</div>
                    <div style={{ fontSize:9, color:"#444" }}>{r.note}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!selected && (
        <div style={{ textAlign:"center", color:"#333", padding:"40px 0", fontSize:10 }}>
          Выбери скин выше чтобы открыть график
        </div>
      )}
      <div style={{ height:16 }} />
    </div>
  )
}

const s = {
  input:     { width:"100%", background:"#ffffff08", border:"1px solid #ffffff10", borderRadius:8, padding:"9px 12px", fontSize:11, color:"#fff", fontFamily:"inherit", marginBottom:10 },
  skinRow:   { display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, border:"1px solid", marginBottom:5, transition:"all 0.15s", cursor:"pointer" },
  periodBtn: { padding:"4px 14px", borderRadius:4, border:"1px solid", fontSize:10, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" },
  chartBox:  { background:"#ffffff03", border:"1px solid #ffffff06", borderRadius:10, padding:"12px 8px" },
  priceRow:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid #ffffff05" },
}
