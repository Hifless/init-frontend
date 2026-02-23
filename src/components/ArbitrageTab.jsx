import { useState, useEffect, useCallback } from "react"
import { api } from "../api"

const LIQ_MAP = { high: ["#00ff87", "HIGH"], med: ["#ffd60a", "MED"], low: ["#ff4757", "LOW"] }
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

function openBuff(name) {
  const url = `https://buff.163.com/market/csgo#tab=selling&game=csgo&search=${encodeURIComponent(name)}`
  if (isMobile) {
    const appUrl = `buffmarket://search?keyword=${encodeURIComponent(name)}`
    const t = setTimeout(() => window.open(url, "_blank"), 1200)
    window.location.href = appUrl
    window.addEventListener("blur", () => clearTimeout(t), { once: true })
  } else {
    window.open(url, "_blank")
  }
}

function Sparkline({ data, color = "#00ff87", width = 160, height = 40 }) {
  if (!data || data.length < 2) return null
  const prices = data.map(d => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1
  const pts = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(" ")
  const last = pts.split(" ").at(-1).split(",")
  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}

function SkeletonRow() {
  return <div style={{ height: 60, background: "linear-gradient(90deg,#ffffff06 25%,#ffffff0f 50%,#ffffff06 75%)", backgroundSize: "400px 100%", borderRadius: 6, margin: "0 16px 5px", animation: "shimmer 1.2s infinite linear" }} />
}

export default function ArbitrageTab({ user }) {
  const [items, setItems]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [minRoi, setMinRoi]     = useState(0)
  const [expanded, setExpanded] = useState(null)
  const [lastUpd, setLastUpd]   = useState(null)
  const [charts, setCharts]     = useState({})
  const [chartLoading, setChartLoading] = useState({})

  const load = useCallback(async () => {
    try {
      const data = await api.getArbitrage(minRoi)
      setItems(data)
      setLastUpd(new Date())
    } catch {}
    setLoading(false)
  }, [minRoi])

  useEffect(() => { setLoading(true); load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  const toggleExpand = async (i, name) => {
    const next = expanded === i ? null : i
    setExpanded(next)
    if (next !== null && !charts[name]) {
      setChartLoading(c => ({ ...c, [name]: true }))
      try {
        const hist = await api.getHistory(name, "7д")
        setCharts(c => ({ ...c, [name]: hist }))
      } catch {}
      setChartLoading(c => ({ ...c, [name]: false }))
    }
  }

  const cnyUsd = user?.cny_usd || 0.138
  const usdRub = user?.usd_rub || 90
  const cnyRub = cnyUsd * usdRub

  const stableItems = items.filter(x => !x.is_unstable)
  const best = stableItems.length ? stableItems.reduce((a, b) => a.best_roi > b.best_roi ? a : b) : (items.length ? items[0] : null)
  const avgRoi = stableItems.length ? (stableItems.reduce((a, b) => a + b.best_roi, 0) / stableItems.length).toFixed(1) : "—"

  return (
    <div className="fade-up">
      {/* Rates */}
      <div style={s.ratesBar}>
        <div style={s.rateItem}><span style={s.rateVal}>¥1 = {cnyRub.toFixed(1)}₽</span><span style={s.rateLbl}>CNY/RUB</span></div>
        <div style={s.rateDivider} />
        <div style={s.rateItem}><span style={s.rateVal}>$1 = {usdRub.toFixed(0)}₽</span><span style={s.rateLbl}>USD/RUB</span></div>
        <div style={s.rateDivider} />
        <div style={s.rateItem}><span style={s.rateVal}>¥1 = ${cnyUsd.toFixed(3)}</span><span style={s.rateLbl}>CNY/USD</span></div>
      </div>

      {/* Stats */}
      <div style={s.statsBar}>
        {[
          { label: "НАЙДЕНО",     value: items.length,       color: "#fff" },
          { label: "СТАБИЛЬНЫХ",  value: stableItems.length, color: "#00d4ff" },
          { label: "СРЕДНИЙ ROI", value: `${avgRoi}%`,       color: "#ffd60a" },
          { label: "ЛУЧШИЙ ROI",  value: best ? `${best.best_roi.toFixed(1)}%` : "—", color: "#00ff87" },
        ].map((x, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: x.color }}>{x.value}</div>
            <div style={{ fontSize: 7.5, color: "#444", marginTop: 2, letterSpacing: 0.5 }}>{x.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={s.filterBar}>
        <span style={{ fontSize: 9, color: "#444" }}>МИН ROI</span>
        {[0, 10, 15, 20].map(v => (
          <button key={v} className="btn-press" onClick={() => { setMinRoi(v); setExpanded(null) }}
            style={{ ...s.chip, borderColor: minRoi===v?"#00ff87":"#ffffff12", background: minRoi===v?"#00ff8715":"transparent", color: minRoi===v?"#00ff87":"#555" }}>
            {v === 0 ? "ВСЕ" : `${v}%`}
          </button>
        ))}
        {lastUpd && <span style={{ fontSize: 8, color: "#2a2a2a", marginLeft: "auto" }}>{lastUpd.toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"})}</span>}
      </div>

      {/* Table header */}
      <div style={s.thead}>
        {["СКИН","BUFF (¥)","ПОЛУЧИШЬ","ROI"].map(h=>(
          <div key={h} style={{ fontSize: 8, color: "#2a2a2a", letterSpacing: 0.5 }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {loading
        ? [...Array(7)].map((_,i)=><SkeletonRow key={i}/>)
        : items.map((item, i) => (
          <div key={item.name}>
            <div className="row-hover" onClick={() => toggleExpand(i, item.name)}
              style={{ ...s.row, opacity: item.is_unstable ? 0.6 : 1 }}>

              {/* Skin */}
              <div style={{ display:"flex", alignItems:"center", gap:8, overflow:"hidden", minWidth:0 }}>
                {item.icon_url
                  ? <img src={item.icon_url} alt="" style={s.skinImg} onError={e=>e.target.style.display="none"} />
                  : <div style={s.skinPlaceholder}>🔫</div>
                }
                <div style={{ minWidth:0 }}>
                  <div style={s.skinName}>{item.name.length>20 ? item.name.slice(0,20)+"…" : item.name}</div>
                  <div style={{ display:"flex", gap:3, marginTop:2, alignItems:"center" }}>
                    {item.is_unstable
                      ? <span style={s.pumpBadge}>🔥 PUMP</span>
                      : LIQ_MAP[item.liquidity] && (
                        <span style={{ fontSize:8, color:LIQ_MAP[item.liquidity][0], border:`1px solid ${LIQ_MAP[item.liquidity][0]}22`, background:`${LIQ_MAP[item.liquidity][0]}11`, borderRadius:3, padding:"1px 4px", letterSpacing:0.5 }}>
                          {LIQ_MAP[item.liquidity][1]}
                        </span>
                      )
                    }
                    {item.price_change_24h !== null && (
                      <span style={{ fontSize:8, color: item.price_change_24h > 15 ? "#ff4757" : item.price_change_24h < -10 ? "#00ff87" : "#555" }}>
                        {item.price_change_24h > 0 ? "↑" : "↓"}{Math.abs(item.price_change_24h)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Buff CNY */}
              <div>
                <div style={{ fontSize:12, color:"#fff", fontWeight:600 }}>¥{(item.buff_price_cny||0).toFixed(0)}</div>
                <div style={{ fontSize:9, color:"#333" }}>{Math.round(item.buff_price_rub||0)}₽</div>
              </div>

              {/* Best net CNY */}
              <div>
                {item.platforms?.[item.best_sell] ? (
                  <>
                    <div style={{ fontSize:11, fontWeight:600, color:"#00ff87" }}>+¥{item.platforms[item.best_sell].profit_cny?.toFixed(0)||"—"}</div>
                    <div style={{ fontSize:9, color:"#444" }}>{Math.round(item.platforms[item.best_sell].net_rub)}₽</div>
                  </>
                ) : <div style={{ fontSize:10, color:"#333" }}>—</div>}
              </div>

              {/* ROI */}
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:13, fontWeight:700, color: item.is_unstable?"#ff4757":item.best_roi>18?"#00ff87":item.best_roi>12?"#ffd60a":"#666" }}>
                  {item.best_roi.toFixed(1)}%
                </div>
                <div style={{ fontSize:9, color:"#333" }}>{expanded===i?"▲":"▼"}</div>
              </div>
            </div>

            {/* Expanded panel */}
            {expanded===i && (
              <div style={s.expandBox} className="fade-up">

                {/* Sparkline chart */}
                {chartLoading[item.name] ? (
                  <div style={{ fontSize:9, color:"#444", padding:"8px 0" }}>Загрузка графика...</div>
                ) : charts[item.name]?.buff?.length > 1 ? (
                  <div style={{ marginBottom:14 }}>
                    <div style={{ fontSize:9, color:"#444", letterSpacing:1, marginBottom:8 }}>ЦЕНА BUFF — 7 ДНЕЙ</div>
                    <div style={{ display:"flex", alignItems:"flex-end", gap:16 }}>
                      <Sparkline
                        data={charts[item.name].buff}
                        color={item.is_unstable ? "#ff4757" : "#00ff87"}
                      />
                      <div>
                        <div style={{ fontSize:9, color:"#555", marginBottom:2 }}>Сейчас</div>
                        <div style={{ fontSize:16, fontWeight:700 }}>¥{(item.buff_price_cny||0).toFixed(0)}</div>
                        <div style={{ fontSize:10, color:"#666" }}>${(item.buff_price||0).toFixed(2)}</div>
                        {item.price_change_24h !== null && (
                          <div style={{ fontSize:9, color: item.price_change_24h > 0 ? "#ff4757" : "#00ff87", marginTop:2 }}>
                            24ч: {item.price_change_24h > 0 ? "+" : ""}{item.price_change_24h}%
                          </div>
                        )}
                      </div>
                    </div>
                    {item.is_unstable && (
                      <div style={s.pumpWarning}>⚠️ Нестабильная цена — рост &gt;50% за 24ч. Высокий риск. Скип.</div>
                    )}
                  </div>
                ) : null}

                {/* Platforms */}
                <div style={{ fontSize:9, color:"#444", letterSpacing:1, marginBottom:8 }}>КУДА ПРОДАТЬ (после комиссии):</div>
                {Object.entries(item.platforms||{}).sort((a,b)=>b[1].roi-a[1].roi).map(([p,d])=>(
                  <div key={p} style={s.platformRow}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:600 }}>{d.label}</div>
                      <div style={{ fontSize:9, color:"#555" }}>
                        ¥{d.net_cny} (~{Math.round(d.net_rub)}₽)
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:d.profit_usd>0?"#00ff87":"#ff4757" }}>
                        {d.profit_usd>0?"+":""}¥{d.profit_cny?.toFixed(0)||"—"}
                      </div>
                      <div style={{ fontSize:9, color:d.roi>0?"#00ff87":"#555" }}>{d.roi>0?"+":""}{d.roi}%</div>
                    </div>
                  </div>
                ))}

                {/* Actions */}
                <div style={{ display:"flex", gap:8, marginTop:12 }}>
                  <button onClick={() => openBuff(item.name)} style={s.buffBtn} className="btn-press">
                    {isMobile ? "📱 Buff App" : "🌐 Buff.163.com"} →
                  </button>
                  <button onClick={async () => {
                    try {
                      await api.addPosition({
                        skin_name: item.name, quantity: 1,
                        buy_price_usd: item.buff_price,
                        buy_platform: "buff", sell_platform: item.best_sell || "cgm",
                        icon_url: item.icon_url,
                      })
                      alert("✅ Добавлено в портфель")
                    } catch(e) { alert("Ошибка: " + e.message) }
                  }} style={s.portfolioBtn} className="btn-press">
                    + Портфель
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      }

      {!loading && items.length===0 && (
        <div style={{ textAlign:"center", color:"#444", padding:"48px 16px", fontSize:11 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>📊</div>
          Нет позиций с ROI ≥ {minRoi}%
        </div>
      )}

      {/* Best deal */}
      {best && best.best_roi > 0 && !best.is_unstable && (
        <div style={s.bestCard}>
          <div style={{ fontSize:9, color:"#00ff87", letterSpacing:1, marginBottom:6 }}>🏆 ЛУЧШАЯ ПОЗИЦИЯ</div>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:8 }}>{best.name}</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div><div style={{ fontSize:9, color:"#555" }}>Купить</div><div style={{ fontSize:17, fontWeight:700 }}>¥{(best.buff_price_cny||0).toFixed(0)}</div></div>
            <div style={{ color:"#333" }}>→</div>
            <div><div style={{ fontSize:9, color:"#555" }}>ROI</div><div style={{ fontSize:17, fontWeight:700, color:"#00ff87" }}>+{best.best_roi.toFixed(1)}%</div></div>
            {best.platforms?.[best.best_sell] && (
              <><div style={{ color:"#333" }}>→</div>
              <div><div style={{ fontSize:9, color:"#555" }}>Прибыль</div><div style={{ fontSize:17, fontWeight:700, color:"#00d4ff" }}>+¥{best.platforms[best.best_sell].profit_cny?.toFixed(0)||"—"}</div></div></>
            )}
          </div>
        </div>
      )}
      <div style={{ height:16 }} />
    </div>
  )
}

const s = {
  ratesBar:     { display:"flex", alignItems:"center", justifyContent:"space-around", padding:"7px 16px", background:"#ffffff03", borderBottom:"1px solid #ffffff06" },
  rateItem:     { display:"flex", flexDirection:"column", alignItems:"center", gap:1 },
  rateVal:      { fontSize:10, fontWeight:600, color:"#ccc" },
  rateLbl:      { fontSize:7.5, color:"#333", letterSpacing:0.5 },
  rateDivider:  { width:1, height:24, background:"#ffffff08" },
  statsBar:     { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", padding:"10px 16px", borderBottom:"1px solid #ffffff06" },
  filterBar:    { display:"flex", alignItems:"center", gap:6, padding:"8px 16px 6px", flexWrap:"wrap" },
  chip:         { padding:"3px 9px", borderRadius:4, border:"1px solid", fontSize:9, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" },
  thead:        { display:"grid", gridTemplateColumns:"1fr 52px 68px 42px", padding:"4px 16px", gap:8 },
  row:          { display:"grid", gridTemplateColumns:"1fr 52px 68px 42px", padding:"8px 16px", gap:8, alignItems:"center", borderBottom:"1px solid #ffffff05", transition:"opacity 0.2s" },
  skinImg:      { width:36, height:36, borderRadius:6, objectFit:"contain", background:"#ffffff08", flexShrink:0 },
  skinPlaceholder: { width:36, height:36, borderRadius:6, background:"#ffffff08", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
  skinName:     { fontSize:10, fontWeight:600, color:"#ddd", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  pumpBadge:    { fontSize:8, color:"#ff4757", border:"1px solid #ff475730", background:"#ff475710", borderRadius:3, padding:"1px 4px", letterSpacing:0.5 },
  pumpWarning:  { background:"#ff475710", border:"1px solid #ff475730", borderRadius:6, padding:"8px 10px", fontSize:9, color:"#ff6b6b", marginTop:8 },
  expandBox:    { background:"#ffffff04", padding:"12px 16px", borderBottom:"1px solid #ffffff08" },
  platformRow:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #ffffff06" },
  buffBtn:      { flex:1, padding:"9px 0", background:"#00ff8712", border:"1px solid #00ff8830", borderRadius:6, color:"#00ff87", fontSize:10, textAlign:"center", cursor:"pointer", fontFamily:"inherit", letterSpacing:0.5 },
  portfolioBtn: { padding:"9px 12px", background:"#ffffff06", border:"1px solid #ffffff12", borderRadius:6, color:"#888", fontSize:10, cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap" },
  bestCard:     { margin:"12px 16px", background:"#00ff870a", border:"1px solid #00ff8722", borderRadius:10, padding:14, animation:"glow 3s infinite" },
}