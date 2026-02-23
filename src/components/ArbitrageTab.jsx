import { useState, useEffect, useCallback } from "react"
import { api, getImgUrl } from "../api"

const LIQ_MAP = { high: ["#00ff87", "HIGH"], med: ["#ffd60a", "MED"], low: ["#ff4757", "LOW"] }
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const PERIODS = ["1д","7д","30д","90д"]
const PERIOD_LABELS = { "1д":"1 день", "7д":"7 дней", "30д":"30 дней", "90д":"90 дней" }

function openBuff(name, buffUrl) {
  const url = buffUrl || `https://buff.163.com/market/csgo#tab=selling&game=csgo&search=${encodeURIComponent(name)}`
  if (isMobile) {
    const app = `buffmarket://search?keyword=${encodeURIComponent(name)}`
    const t = setTimeout(() => window.open(url, "_blank"), 1200)
    window.location.href = app
    window.addEventListener("blur", () => clearTimeout(t), { once: true })
  } else {
    window.open(url, "_blank")
  }
}

// Полноэкранная детальная страница товара
function ItemDetail({ item, onClose, cnyUsd, usdRub }) {
  const [period, setPeriod]       = useState("7д")
  const [hist, setHist]           = useState(null)
  const [histLoading, setHistLoading] = useState(false)
  const [addedPortfolio, setAddedPortfolio] = useState(false)

  const loadHist = useCallback(async () => {
    setHistLoading(true)
    try {
      const data = await api.getHistory(item.name, period)
      setHist(data)
    } catch {}
    setHistLoading(false)
  }, [item.name, period])

  useEffect(() => { loadHist() }, [loadHist])

  const cnyRub = cnyUsd * usdRub
  const buffCny = (item.buff_price || 0) / cnyUsd

  // SVG chart с двумя линиями (Buff + CGM)
  const renderChart = () => {
    const buffData = hist?.buff || []
    const cgmData  = hist?.cgm  || []
    if (buffData.length < 2 && cgmData.length < 2) {
      return <div style={{ color:"#333", fontSize:10, textAlign:"center", padding:"24px 0" }}>Недостаточно данных за этот период</div>
    }
    const W = 280, H = 80
    const allPrices = [...buffData.map(d=>d.price), ...cgmData.map(d=>d.price)]
    const min = Math.min(...allPrices)
    const max = Math.max(...allPrices)
    const range = max - min || 1

    const toSvg = (data) => data.map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * W
      const y = H - ((d.price - min) / range) * (H - 8) - 4
      return `${x.toFixed(1)},${y.toFixed(1)}`
    }).join(" ")

    const buffPts = toSvg(buffData)
    const cgmPts  = toSvg(cgmData)
    const lastBuffY = buffData.length > 1 ? buffPts.split(" ").at(-1).split(",")[1] : null
    const lastCgmY  = cgmData.length  > 1 ? cgmPts.split(" ").at(-1).split(",")[1]  : null

    return (
      <svg width="100%" viewBox={`0 0 ${W} ${H+4}`} style={{ overflow:"visible" }}>
        {/* Grid lines */}
        {[0, 0.5, 1].map(t => (
          <line key={t} x1={0} y1={H - t*(H-8) - 4} x2={W} y2={H - t*(H-8) - 4}
            stroke="#ffffff08" strokeWidth="1" />
        ))}
        {/* Buff line */}
        {buffData.length > 1 && (
          <>
            <polyline points={buffPts} fill="none" stroke="#00ff87" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
            <circle cx={buffPts.split(" ").at(-1).split(",")[0]}
                    cy={lastBuffY} r="3" fill="#00ff87" />
          </>
        )}
        {/* CGM line */}
        {cgmData.length > 1 && (
          <>
            <polyline points={cgmPts} fill="none" stroke="#00d4ff" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" opacity="0.7" strokeDasharray="4,3" />
            <circle cx={cgmPts.split(" ").at(-1).split(",")[0]}
                    cy={lastCgmY} r="2.5" fill="#00d4ff" />
          </>
        )}
        {/* Y labels */}
        <text x={W+4} y={H-4} fill="#333" fontSize="8">¥{(max/cnyUsd).toFixed(0)}</text>
        <text x={W+4} y={H} fill="#333" fontSize="8">¥{(min/cnyUsd).toFixed(0)}</text>
      </svg>
    )
  }

  return (
    <div style={d.overlay} className="fade-up">
      {/* Header */}
      <div style={d.header}>
        <button onClick={onClose} style={d.backBtn}>← Назад</button>
        <div style={d.headerTitle}>Детали</div>
        <div style={{ width:60 }} />
      </div>

      <div style={d.scroll}>
        {/* Skin hero */}
        <div style={d.hero}>
          <div style={d.heroImg}>
            {item.icon_url
              ? <img src={getImgUrl(item.icon_url)} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"contain" }}
                  onError={e => { e.target.style.display="none"; e.target.nextSibling.style.display="flex" }} />
              : null
            }
            <div style={{ display: item.icon_url ? "none" : "flex", width:"100%", height:"100%", alignItems:"center", justifyContent:"center", fontSize:40 }}>🔫</div>
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={d.heroName}>{item.name}</div>
            <div style={{ display:"flex", gap:6, marginTop:6, flexWrap:"wrap" }}>
              {item.is_unstable
                ? <span style={d.pumpBadgeLg}>🔥 PUMP — нестабильная цена</span>
                : LIQ_MAP[item.liquidity] && (
                  <span style={{ fontSize:10, color:LIQ_MAP[item.liquidity][0], border:`1px solid ${LIQ_MAP[item.liquidity][0]}30`, background:`${LIQ_MAP[item.liquidity][0]}12`, borderRadius:4, padding:"2px 8px" }}>
                    {LIQ_MAP[item.liquidity][1]} ликвидность
                  </span>
                )
              }
              {item.price_change_24h !== null && (
                <span style={{ fontSize:10, color: item.price_change_24h > 15 ? "#ff4757" : item.price_change_24h < -10 ? "#00ff87" : "#888" }}>
                  24ч: {item.price_change_24h > 0 ? "+" : ""}{item.price_change_24h}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Price cards */}
        <div style={d.priceGrid}>
          <div style={d.priceCard}>
            <div style={d.priceLabel}>Купить на Buff</div>
            <div style={d.priceMain}>¥{buffCny.toFixed(0)}</div>
            <div style={d.priceSub}>${(item.buff_price||0).toFixed(2)} · {Math.round((item.buff_price||0)*usdRub)}₽</div>
          </div>
          <div style={d.priceCard}>
            <div style={d.priceLabel}>Лучший ROI</div>
            <div style={{ ...d.priceMain, color: item.is_unstable?"#ff4757":"#00ff87" }}>{item.best_roi.toFixed(1)}%</div>
            <div style={d.priceSub}>{item.sell_num} продавцов · {item.buy_num} покупателей</div>
          </div>
        </div>

        {/* Platform breakdown */}
        {Object.keys(item.platforms||{}).length > 0 && (
          <div style={d.section}>
            <div style={d.sectionTitle}>КУДА ПРОДАТЬ</div>
            {Object.entries(item.platforms).sort((a,b)=>b[1].roi-a[1].roi).map(([p,pl])=>(
              <div key={p} style={d.platformCard}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>{pl.label}</div>
                  <div style={{ fontSize:14, fontWeight:700, color:pl.roi>0?"#00ff87":"#ff4757" }}>
                    {pl.roi>0?"+":""}{pl.roi}%
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:"#666" }}>
                  <span>Цена продажи: ¥{(pl.sell_price/cnyUsd).toFixed(0)}</span>
                  <span>Получишь: ¥{pl.net_cny}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:4, fontSize:11 }}>
                  <span style={{ color:"#555" }}>Прибыль:</span>
                  <span style={{ fontWeight:700, color:pl.profit_usd>0?"#00ff87":"#ff4757" }}>
                    {pl.profit_usd>0?"+":""}¥{pl.profit_cny?.toFixed(0)||"—"} · {pl.profit_usd>0?"+":""}{pl.profit_usd.toFixed(2)}$
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart */}
        <div style={d.section}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={d.sectionTitle}>ИСТОРИЯ ЦЕН</div>
            <div style={{ display:"flex", gap:4 }}>
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  style={{ ...d.periodBtn, borderColor:period===p?"#00ff87":"#ffffff15", color:period===p?"#00ff87":"#555", background:period===p?"#00ff8710":"transparent" }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display:"flex", gap:12, marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:16, height:2, background:"#00ff87", borderRadius:1 }}/>
              <span style={{ fontSize:9, color:"#555" }}>Buff.163</span>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:4 }}>
              <div style={{ width:16, height:2, background:"#00d4ff", borderRadius:1, borderTop:"1px dashed #00d4ff" }}/>
              <span style={{ fontSize:9, color:"#555" }}>CSGOMarket</span>
            </div>
          </div>

          {histLoading
            ? <div style={{ height:80, background:"#ffffff06", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#444" }}>Загрузка...</div>
            : <div style={{ padding:"8px 0" }}>{renderChart()}</div>
          }
        </div>

        {/* PUMP warning */}
        {item.is_unstable && (
          <div style={d.pumpWarning}>
            <div style={{ fontSize:11, fontWeight:700, marginBottom:4 }}>⚠️ Нестабильная позиция</div>
            <div style={{ fontSize:10, color:"#ff9999", lineHeight:1.6 }}>
              {item.unstable_reason === "low_supply_high_roi" &&
                `Только ${item.sell_num} продавец на Buff при ROI ${item.best_roi.toFixed(0)}% — кто-то один выставил по нереальной цене. Реальный арбитраж маловероятен.`}
              {item.unstable_reason === "abnormal_roi" &&
                `ROI ${item.best_roi.toFixed(0)}% при ${item.sell_num} продавцах — аномально высокий показатель. Вероятно единичная завышенная сделка на площадке.`}
              {item.unstable_reason === "no_demand" &&
                `Покупателей: ${item.buy_num}. Мало спроса — продать по рыночной цене будет сложно.`}
              {item.unstable_reason === "pump_24h" &&
                `Цена выросла на ${item.price_change_24h}% за 24ч — классический pump. Высокий риск.`}
              {!item.unstable_reason && "Нестабильные рыночные условия. Рекомендуем пропустить."}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding:"0 16px 12px", display:"flex", gap:8 }}>
          <button onClick={() => openBuff(item.name, item.buff_url)} style={d.buffBtn} className="btn-press">
            {isMobile ? "📱 Открыть Buff App" : "🌐 Buff.163.com"} →
          </button>
          <button onClick={async () => {
            if (addedPortfolio) return
            try {
              await api.addPosition({
                skin_name: item.name, quantity: 1,
                buy_price_usd: item.buff_price,
                buy_platform: "buff", sell_platform: item.best_sell || "cgm",
                icon_url: item.icon_url,
              })
              setAddedPortfolio(true)
            } catch(e) { alert("Ошибка: " + e.message) }
          }} style={{ ...d.portfolioBtn, background: addedPortfolio ? "#00ff8715" : "#ffffff08", color: addedPortfolio ? "#00ff87" : "#888" }} className="btn-press">
            {addedPortfolio ? "✓ В портфеле" : "+ Портфель"}
          </button>
        </div>
        <div style={{ height:16 }} />
      </div>
    </div>
  )
}

function SkeletonRow() {
  return <div style={{ height:58, background:"linear-gradient(90deg,#ffffff06 25%,#ffffff0f 50%,#ffffff06 75%)", backgroundSize:"400px 100%", borderRadius:6, margin:"0 16px 5px", animation:"shimmer 1.2s infinite linear" }} />
}

export default function ArbitrageTab({ user }) {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [minRoi, setMinRoi]       = useState(0)
  const [lastUpd, setLastUpd]     = useState(null)
  const [selected, setSelected]   = useState(null)  // детальная страница

  const load = useCallback(async () => {
    try {
      const data = await api.getArbitrage(minRoi)
      // Сортируем: стабильные по убыванию ROI, потом PUMP в конце
      const stable   = data.filter(x => !x.is_unstable).sort((a,b) => b.best_roi - a.best_roi)
      const unstable = data.filter(x => x.is_unstable).sort((a,b) => b.best_roi - a.best_roi)
      setItems([...stable, ...unstable])
      setLastUpd(new Date())
    } catch {}
    setLoading(false)
  }, [minRoi])

  useEffect(() => { setLoading(true); load() }, [load])
  useEffect(() => {
    const t = setInterval(load, 60000)
    return () => clearInterval(t)
  }, [load])

  const cnyUsd = user?.cny_usd || 0.138
  const usdRub = user?.usd_rub || 90
  const cnyRub = cnyUsd * usdRub

  const stableItems = items.filter(x => !x.is_unstable)
  const best = stableItems[0] || null
  const avgRoi = stableItems.length
    ? (stableItems.reduce((a,b) => a + b.best_roi, 0) / stableItems.length).toFixed(1)
    : "—"

  if (selected) {
    return <ItemDetail item={selected} onClose={() => setSelected(null)} cnyUsd={cnyUsd} usdRub={usdRub} />
  }

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
          { label:"НАЙДЕНО",     value:items.length,       color:"#fff" },
          { label:"СТАБИЛЬНЫХ",  value:stableItems.length, color:"#00d4ff" },
          { label:"СРЕДНИЙ ROI", value:`${avgRoi}%`,        color:"#ffd60a" },
          { label:"ЛУЧШИЙ ROI",  value:best?`${best.best_roi.toFixed(1)}%`:"—", color:"#00ff87" },
        ].map((x,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:14, fontWeight:700, color:x.color }}>{x.value}</div>
            <div style={{ fontSize:7.5, color:"#444", marginTop:2, letterSpacing:0.5 }}>{x.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={s.filterBar}>
        <span style={{ fontSize:9, color:"#444" }}>МИН ROI</span>
        {[0,10,15,20].map(v => (
          <button key={v} className="btn-press" onClick={() => setMinRoi(v)}
            style={{ ...s.chip, borderColor:minRoi===v?"#00ff87":"#ffffff12", background:minRoi===v?"#00ff8715":"transparent", color:minRoi===v?"#00ff87":"#555" }}>
            {v===0?"ВСЕ":`${v}%`}
          </button>
        ))}
        {lastUpd && <span style={{ fontSize:8, color:"#2a2a2a", marginLeft:"auto" }}>{lastUpd.toLocaleTimeString("ru",{hour:"2-digit",minute:"2-digit"})}</span>}
      </div>

      {/* PUMP divider hint */}
      {!loading && items.some(x=>x.is_unstable) && (
        <div style={{ fontSize:8, color:"#333", padding:"4px 16px", letterSpacing:0.5 }}>
          ▼ {stableItems.length} стабильных · {items.length - stableItems.length} нестабильных внизу
        </div>
      )}

      {/* Table header */}
      <div style={s.thead}>
        {["СКИН","BUFF (¥)","ПРИБЫЛЬ","ROI"].map(h=>(
          <div key={h} style={{ fontSize:8, color:"#2a2a2a", letterSpacing:0.5 }}>{h}</div>
        ))}
      </div>

      {/* Rows */}
      {loading
        ? [...Array(8)].map((_,i)=><SkeletonRow key={i}/>)
        : items.map((item, i) => {
          const isFirst = i > 0 && !items[i-1].is_unstable && item.is_unstable
          return (
            <div key={item.name}>
              {/* Separator перед PUMP зоной */}
              {isFirst && (
                <div style={s.pumpSeparator}>
                  <div style={s.pumpSepLine}/>
                  <span>🔥 PUMP — нестабильные (скип)</span>
                  <div style={s.pumpSepLine}/>
                </div>
              )}
              <div className="row-hover" onClick={() => setSelected(item)}
                style={{ ...s.row, opacity:item.is_unstable?0.5:1 }}>

                {/* Skin */}
                <div style={{ display:"flex", alignItems:"center", gap:8, overflow:"hidden", minWidth:0 }}>
                  <div style={s.imgWrap}>
                    {item.icon_url && (
                      <img src={getImgUrl(item.icon_url)} alt="" style={{ width:"100%", height:"100%", objectFit:"contain" }}
                        onError={e=>e.target.remove()} />
                    )}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={s.skinName}>{item.name.length>20?item.name.slice(0,20)+"…":item.name}</div>
                    <div style={{ display:"flex", gap:3, marginTop:2, alignItems:"center" }}>
                      {item.is_unstable
                        ? <span style={s.pumpBadge}>{
                            item.unstable_reason === "low_supply_high_roi" ? "⚠ 1 прод." :
                            item.unstable_reason === "abnormal_roi"        ? "⚠ ROI↑↑" :
                            item.unstable_reason === "no_demand"           ? "⚠ нет спроса" :
                            "⚠ PUMP"
                          }</span>
                        : LIQ_MAP[item.liquidity] && (
                          <span style={{ fontSize:8, color:LIQ_MAP[item.liquidity][0], border:`1px solid ${LIQ_MAP[item.liquidity][0]}22`, background:`${LIQ_MAP[item.liquidity][0]}11`, borderRadius:3, padding:"1px 4px" }}>
                            {LIQ_MAP[item.liquidity][1]}
                          </span>
                        )
                      }
                      {item.price_change_24h !== null && Math.abs(item.price_change_24h) > 3 && (
                        <span style={{ fontSize:8, color:item.price_change_24h>0?"#ff6b6b":"#00ff87" }}>
                          {item.price_change_24h>0?"↑":"↓"}{Math.abs(item.price_change_24h)}%
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

                {/* Profit CNY */}
                <div>
                  {item.platforms?.[item.best_sell]
                    ? <><div style={{ fontSize:11, fontWeight:600, color:"#00ff87" }}>+¥{item.platforms[item.best_sell].profit_cny?.toFixed(0)||"—"}</div>
                        <div style={{ fontSize:9, color:"#444" }}>{item.platforms[item.best_sell].net_rub ? Math.round(item.platforms[item.best_sell].net_rub)+"₽" : "—"}</div></>
                    : <div style={{ fontSize:10, color:"#333" }}>—</div>
                  }
                </div>

                {/* ROI */}
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:item.is_unstable?"#ff4757":item.best_roi>18?"#00ff87":item.best_roi>12?"#ffd60a":"#666" }}>
                    {item.best_roi.toFixed(1)}%
                  </div>
                  <div style={{ fontSize:9, color:"#333" }}>→</div>
                </div>
              </div>
            </div>
          )
        })
      }

      {!loading && items.length===0 && (
        <div style={{ textAlign:"center", color:"#444", padding:"48px 16px", fontSize:11 }}>
          <div style={{ fontSize:24, marginBottom:8 }}>📊</div>
          Нет позиций с ROI ≥ {minRoi}%
        </div>
      )}

      {/* Best stable deal card */}
      {best && best.best_roi > 0 && (
        <div style={s.bestCard} onClick={() => setSelected(best)}>
          <div style={{ fontSize:9, color:"#00ff87", letterSpacing:1, marginBottom:6 }}>🏆 ЛУЧШАЯ СТАБИЛЬНАЯ ПОЗИЦИЯ →</div>
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
  thead:        { display:"grid", gridTemplateColumns:"1fr 52px 64px 42px", padding:"4px 16px", gap:8 },
  row:          { display:"grid", gridTemplateColumns:"1fr 52px 64px 42px", padding:"8px 16px", gap:8, alignItems:"center", borderBottom:"1px solid #ffffff05", cursor:"pointer" },
  imgWrap:      { width:36, height:36, borderRadius:6, background:"#ffffff08", flexShrink:0, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" },
  skinName:     { fontSize:10, fontWeight:600, color:"#ddd", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  pumpBadge:    { fontSize:8, color:"#ff4757", border:"1px solid #ff475730", background:"#ff475710", borderRadius:3, padding:"1px 4px" },
  pumpSeparator:{ display:"flex", alignItems:"center", gap:8, padding:"8px 16px", fontSize:8, color:"#ff475750" },
  pumpSepLine:  { flex:1, height:1, background:"#ff475720" },
  bestCard:     { margin:"12px 16px", background:"#00ff870a", border:"1px solid #00ff8722", borderRadius:10, padding:14, animation:"glow 3s infinite", cursor:"pointer" },
}

const d = {
  overlay:      { position:"fixed", inset:0, background:"#0a0a0f", zIndex:100, display:"flex", flexDirection:"column", fontFamily:"JetBrains Mono,monospace" },
  header:       { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:"1px solid #ffffff08", flexShrink:0 },
  backBtn:      { background:"none", border:"none", color:"#00ff87", fontSize:12, cursor:"pointer", fontFamily:"inherit", padding:0 },
  headerTitle:  { fontSize:11, color:"#555", letterSpacing:1 },
  scroll:       { flex:1, overflowY:"auto", overflowX:"hidden" },
  hero:         { display:"flex", gap:14, padding:"16px 16px 12px", borderBottom:"1px solid #ffffff06" },
  heroImg:      { width:80, height:80, borderRadius:12, background:"#ffffff08", overflow:"hidden", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" },
  heroName:     { fontSize:13, fontWeight:700, lineHeight:1.4, color:"#fff" },
  priceGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:1, padding:"1px", background:"#ffffff06", margin:"12px 16px", borderRadius:10, overflow:"hidden" },
  priceCard:    { background:"#0a0a0f", padding:"12px 14px" },
  priceLabel:   { fontSize:9, color:"#444", letterSpacing:0.5, marginBottom:4 },
  priceMain:    { fontSize:22, fontWeight:700, marginBottom:2 },
  priceSub:     { fontSize:9, color:"#333" },
  section:      { padding:"12px 16px", borderTop:"1px solid #ffffff06" },
  sectionTitle: { fontSize:9, color:"#444", letterSpacing:1, marginBottom:10 },
  platformCard: { background:"#ffffff05", border:"1px solid #ffffff0a", borderRadius:8, padding:"10px 12px", marginBottom:8 },
  periodBtn:    { padding:"3px 7px", borderRadius:4, border:"1px solid", fontSize:8, cursor:"pointer", fontFamily:"inherit", background:"transparent", transition:"all 0.15s" },
  pumpBadgeLg: { fontSize:10, color:"#ff4757", border:"1px solid #ff475730", background:"#ff475710", borderRadius:4, padding:"2px 8px" },
  pumpWarning:  { margin:"0 16px 12px", background:"#ff475710", border:"1px solid #ff475730", borderRadius:8, padding:"12px 14px", color:"#ff6b6b" },
  buffBtn:      { flex:2, padding:"10px 0", background:"#00ff8712", border:"1px solid #00ff8830", borderRadius:8, color:"#00ff87", fontSize:10, textAlign:"center", cursor:"pointer", fontFamily:"inherit" },
  portfolioBtn: { flex:1, padding:"10px 0", background:"#ffffff08", border:"1px solid #ffffff15", borderRadius:8, color:"#888", fontSize:10, textAlign:"center", cursor:"pointer", fontFamily:"inherit" },
}