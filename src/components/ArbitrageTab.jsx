import { useState, useEffect } from "react"
import { api } from "../api"

const LIQ_MAP = { high: ["#00ff87", "HIGH"], med: ["#ffd60a", "MED"], low: ["#ff4757", "LOW"] }

function SkeletonRow() {
  return (
    <div style={{ height: 58, background: "linear-gradient(90deg,#ffffff06 25%,#ffffff0f 50%,#ffffff06 75%)", backgroundSize: "400px 100%", borderRadius: 6, margin: "0 16px 5px", animation: "shimmer 1.2s infinite linear" }} />
  )
}

export default function ArbitrageTab({ user }) {
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [minRoi, setMinRoi]   = useState(0)
  const [expanded, setExpanded] = useState(null)
  const [lastUpd, setLastUpd] = useState(null)

  const load = async () => {
    try {
      const data = await api.getArbitrage(minRoi)
      setItems(data)
      setLastUpd(new Date())
    } catch {}
    setLoading(false)
  }

  useEffect(() => { setLoading(true); load() }, [minRoi])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [minRoi])

  const usdRub = user?.usd_rub || 90
  const best   = items.length ? items.reduce((a, b) => a.best_roi > b.best_roi ? a : b) : null
  const avgRoi = items.length ? (items.reduce((a, b) => a + b.best_roi, 0) / items.length).toFixed(1) : "—"

  return (
    <div className="fade-up">
      {/* Stats */}
      <div style={s.statsBar}>
        {[
          { label: "НАЙДЕНО",     value: items.length,          color: "#fff" },
          { label: "СРЕДНИЙ ROI", value: `${avgRoi}%`,           color: "#ffd60a" },
          { label: "ЛУЧШИЙ ROI",  value: best ? `${best.best_roi.toFixed(1)}%` : "—", color: "#00ff87" },
        ].map((x, i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: x.color }}>{x.value}</div>
            <div style={{ fontSize: 8, color: "#444", marginTop: 2, letterSpacing: 0.5 }}>{x.label}</div>
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
        {["СКИН","BUFF","ЧТО ПОЛУЧИШЬ","ROI"].map(h=>(
          <div key={h} style={{ fontSize: 8, color: "#2a2a2a", letterSpacing: 0.5 }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {loading
        ? [...Array(7)].map((_,i)=><SkeletonRow key={i}/>)
        : items.map((item, i) => (
          <div key={item.name}>
            <div className="row-hover" onClick={() => setExpanded(expanded===i ? null : i)}
              style={{ ...s.row, background: i%2===0 ? "#ffffff02" : "transparent" }}>

              {/* Skin */}
              <div style={{ display:"flex", alignItems:"center", gap:8, overflow:"hidden", minWidth:0 }}>
                {item.icon_url
                  ? <img src={item.icon_url} alt="" style={s.skinImg} onError={e=>e.target.style.display="none"} />
                  : <div style={s.skinPlaceholder}>🔫</div>
                }
                <div style={{ minWidth:0 }}>
                  <div style={s.skinName}>{item.name.length>22 ? item.name.slice(0,22)+"…" : item.name}</div>
                  <div style={{ display:"flex", gap:4, marginTop:2, alignItems:"center" }}>
                    {LIQ_MAP[item.liquidity] && (
                      <span style={{ fontSize:8, color:LIQ_MAP[item.liquidity][0], border:`1px solid ${LIQ_MAP[item.liquidity][0]}22`, background:`${LIQ_MAP[item.liquidity][0]}11`, borderRadius:3, padding:"1px 4px", letterSpacing:0.5 }}>
                        {LIQ_MAP[item.liquidity][1]}
                      </span>
                    )}
                    <span style={{ fontSize:8, color:"#333" }}>{item.sell_num} продавцов</span>
                  </div>
                </div>
              </div>

              {/* Buff price */}
              <div>
                <div style={{ fontSize:11, color:"#888" }}>${(item.buff_price||0).toFixed(0)}</div>
                <div style={{ fontSize:9, color:"#333" }}>{Math.round(item.buff_price_rub||0)}₽</div>
              </div>

              {/* Best profit */}
              <div>
                {item.platforms?.[item.best_sell] ? (
                  <>
                    <div style={{ fontSize:11, fontWeight:600, color:"#00ff87" }}>
                      +${item.platforms[item.best_sell].net_usd.toFixed(0)}
                    </div>
                    <div style={{ fontSize:9, color:"#444" }}>
                      {Math.round(item.platforms[item.best_sell].net_rub)}₽
                    </div>
                  </>
                ) : <div style={{ fontSize:10, color:"#333" }}>—</div>}
              </div>

              {/* ROI */}
              <div style={{ fontSize:13, fontWeight:700, color: item.best_roi>18?"#00ff87":item.best_roi>12?"#ffd60a":"#666" }}>
                {item.best_roi.toFixed(1)}%
              </div>
            </div>

            {/* Expanded */}
            {expanded===i && (
              <div style={s.expandBox} className="fade-up">
                <div style={{ fontSize:9, color:"#444", letterSpacing:1, marginBottom:8 }}>КУДА ПРОДАТЬ (после комиссии):</div>
                {Object.entries(item.platforms||{}).sort((a,b)=>b[1].roi-a[1].roi).map(([p,d])=>(
                  <div key={p} style={s.platformRow}>
                    <div>
                      <div style={{ fontSize:10, fontWeight:600 }}>{d.label}</div>
                      <div style={{ fontSize:9, color:"#555" }}>цена ${d.sell_price} → получишь ${d.net_usd} (~{Math.round(d.net_rub)}₽)</div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontSize:12, fontWeight:700, color:d.profit_usd>0?"#00ff87":"#ff4757" }}>
                        {d.profit_usd>0?"+":""}{d.profit_usd.toFixed(2)}$
                      </div>
                      <div style={{ fontSize:9, color:d.roi>0?"#00ff87":"#555" }}>{d.roi>0?"+":""}{d.roi}%</div>
                    </div>
                  </div>
                ))}
                <a href={`https://buff.163.com/market/csgo#tab=selling&game=csgo&search=${encodeURIComponent(item.name)}`}
                  target="_blank" rel="noreferrer" style={s.buffLink}>
                  Открыть на Buff →
                </a>
              </div>
            )}
          </div>
        ))
      }

      {!loading && items.length===0 && (
        <div style={{ textAlign:"center", color:"#444", padding:"48px 16px", fontSize:11 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>📊</div>
          Нет позиций с ROI ≥ {minRoi}%<br/>
          <span style={{ fontSize:9, color:"#333", marginTop:4, display:"block" }}>
            Данные обновляются каждые 5 минут.<br/>Убедись что Buff сессия добавлена через /buff в боте.
          </span>
        </div>
      )}

      {/* Best deal card */}
      {best && best.best_roi > 0 && (
        <div style={s.bestCard}>
          <div style={{ fontSize:9, color:"#00ff87", letterSpacing:1, marginBottom:6 }}>🏆 ЛУЧШАЯ ПОЗИЦИЯ</div>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>{best.name}</div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:9, color:"#555" }}>Купить на Buff</div>
              <div style={{ fontSize:18, fontWeight:700 }}>${(best.buff_price||0).toFixed(0)}</div>
            </div>
            <div style={{ fontSize:20, color:"#333" }}>→</div>
            <div>
              <div style={{ fontSize:9, color:"#555" }}>ROI</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#00ff87" }}>+{best.best_roi.toFixed(1)}%</div>
            </div>
            {best.platforms?.[best.best_sell] && (
              <>
                <div style={{ fontSize:20, color:"#333" }}>→</div>
                <div>
                  <div style={{ fontSize:9, color:"#555" }}>Получишь</div>
                  <div style={{ fontSize:18, fontWeight:700, color:"#00d4ff" }}>
                    ${best.platforms[best.best_sell].net_usd.toFixed(0)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div style={{ height:16 }} />
    </div>
  )
}

const s = {
  statsBar:     { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", padding:"10px 16px", borderBottom:"1px solid #ffffff06", gap:8 },
  filterBar:    { display:"flex", alignItems:"center", gap:6, padding:"8px 16px 6px", flexWrap:"wrap" },
  chip:         { padding:"3px 9px", borderRadius:4, border:"1px solid", fontSize:9, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" },
  thead:        { display:"grid", gridTemplateColumns:"1fr 50px 72px 38px", padding:"4px 16px", gap:8 },
  row:          { display:"grid", gridTemplateColumns:"1fr 50px 72px 38px", padding:"8px 16px", gap:8, alignItems:"center", borderBottom:"1px solid #ffffff05" },
  skinImg:      { width:36, height:36, borderRadius:6, objectFit:"contain", background:"#ffffff08", flexShrink:0 },
  skinPlaceholder: { width:36, height:36, borderRadius:6, background:"#ffffff08", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
  skinName:     { fontSize:10, fontWeight:600, color:"#ddd", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  expandBox:    { background:"#ffffff04", padding:"10px 16px", borderBottom:"1px solid #ffffff08" },
  platformRow:  { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid #ffffff06" },
  buffLink:     { display:"block", marginTop:10, padding:"8px 0", background:"#00ff8712", border:"1px solid #00ff8730", borderRadius:6, color:"#00ff87", fontSize:10, textAlign:"center", textDecoration:"none", letterSpacing:0.5 },
  bestCard:     { margin:"12px 16px", background:"#00ff870a", border:"1px solid #00ff8722", borderRadius:10, padding:14, animation:"glow 3s infinite" },
}
