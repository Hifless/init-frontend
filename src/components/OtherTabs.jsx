import { useState, useEffect } from "react"
import { api } from "../api"

// ═══════════════════════════════════════════════════════════════
// ALERTS TAB
// ═══════════════════════════════════════════════════════════════
export function AlertsTab({ user }) {
  const [alerts, setAlerts]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [form, setForm]         = useState({ skin_name: "", condition: "roi_gt", value: "", platform: "buff" })

  const load = () => api.listAlerts().then(setAlerts).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.skin_name) return
    await api.createAlert({ ...form, value: form.value ? parseFloat(form.value) : null })
    setShowAdd(false); setForm({ skin_name: "", condition: "roi_gt", value: "", platform: "buff" }); load()
  }

  const toggle = async (id) => { await api.toggleAlert(id); load() }
  const del    = async (id) => { await api.deleteAlert(id); load() }

  const condLabel = { roi_gt: "ROI >", price_lt: "Цена <", appeared: "Появился" }

  return (
    <div className="fade-up" style={{ padding: "12px 16px" }}>
      {/* Triggered alerts */}
      {alerts.filter(a => a.triggered_at && a.active).map(a => (
        <div key={a.id} style={as.triggeredCard}>
          <div style={{ fontSize: 9, color: "#ffd60a", letterSpacing: 1, marginBottom: 4 }}>🔔 СРАБОТАЛ</div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2 }}>{a.skin_name}</div>
          <div style={{ fontSize: 10, color: "#888" }}>{condLabel[a.condition]} {a.value || ""}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <a href={`https://buff.163.com/market/csgo#tab=selling&game=csgo&search=${encodeURIComponent(a.skin_name)}`}
              target="_blank" rel="noreferrer" style={as.buffBtn}>Открыть на Buff</a>
            <button style={as.closeBtn} onClick={() => del(a.id)}>✕</button>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button className="btn-press" style={as.addBtn} onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? "✕ Отмена" : "+ СОЗДАТЬ АЛЕРТ"}
      </button>

      {/* Add form */}
      {showAdd && (
        <div style={as.form} className="fade-up">
          <div style={as.formTitle}>Новый алерт</div>
          <input style={as.input} placeholder="Название скина (точное)" value={form.skin_name}
            onChange={e => setForm(f => ({...f, skin_name: e.target.value}))} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <select style={as.select} value={form.condition}
              onChange={e => setForm(f => ({...f, condition: e.target.value}))}>
              <option value="roi_gt">ROI больше чем</option>
              <option value="price_lt">Цена меньше чем</option>
              <option value="appeared">Появился на Buff</option>
            </select>
            {form.condition !== "appeared" && (
              <input style={{...as.input, flex: 1, marginBottom: 0}} type="number"
                placeholder={form.condition === "roi_gt" ? "12" : "100"}
                value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} />
            )}
          </div>
          <button className="btn-press" style={as.saveBtn} onClick={save}>Сохранить</button>
        </div>
      )}

      {/* List */}
      <div style={{ fontSize: 9, color: "#444", letterSpacing: 1, margin: "12px 0 8px" }}>
        МОИ АЛЕРТЫ — {alerts.length}
      </div>

      {loading ? <div style={{ color: "#444", fontSize: 10 }}>Загрузка...</div> : (
        alerts.length === 0
          ? <div style={{ color: "#444", fontSize: 10, padding: "24px 0", textAlign: "center" }}>Нет алертов. Создай первый!</div>
          : alerts.map(a => (
            <div key={a.id} style={as.alertRow}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{a.skin_name.length > 28 ? a.skin_name.slice(0,28)+"…" : a.skin_name}</div>
                <div style={{ fontSize: 9, color: "#555" }}>{condLabel[a.condition]} {a.value || ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button className="btn-press" onClick={() => toggle(a.id)}
                  style={{ ...as.toggleBtn, background: a.active ? "#00ff8715" : "#ffffff08", color: a.active ? "#00ff87" : "#444", borderColor: a.active ? "#00ff8830" : "#ffffff10" }}>
                  {a.active ? "ВКЛ" : "ПАУЗА"}
                </button>
                <button className="btn-press" onClick={() => del(a.id)} style={as.delBtn}>✕</button>
              </div>
            </div>
          ))
      )}

      {/* Notification settings */}
      <div style={{ marginTop: 16, padding: 12, background: "#ffffff03", borderRadius: 8, border: "1px solid #ffffff06" }}>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: 1, marginBottom: 10 }}>УВЕДОМЛЕНИЯ</div>
        {[
          { label: "В Telegram", key: "notify_tg", val: user?.notify_tg },
          { label: "В приложении", key: "notify_app", val: user?.notify_app },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i===0 ? "1px solid #ffffff06" : "none" }}>
            <span style={{ fontSize: 10, color: "#888" }}>{s.label}</span>
            <div style={{ width: 32, height: 16, borderRadius: 8, background: s.val ? "#00ff87" : "#333", position: "relative", cursor: "pointer" }}
              onClick={() => api.updateSettings({ [s.key]: !s.val })}>
              <div style={{ position: "absolute", top: 2, left: s.val ? 18 : 2, width: 12, height: 12, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
    </div>
  )
}

const as = {
  triggeredCard: { background: "#ffd60a0a", border: "1px solid #ffd60a33", borderRadius: 8, padding: 12, marginBottom: 12 },
  buffBtn: { flex: 1, padding: "6px 0", borderRadius: 5, background: "#ffd60a", color: "#000", border: "none", fontSize: 9, fontWeight: 700, cursor: "pointer", textAlign: "center", textDecoration: "none", fontFamily: "inherit", letterSpacing: 0.5, display: "flex", alignItems: "center", justifyContent: "center" },
  closeBtn: { padding: "6px 10px", borderRadius: 5, background: "transparent", color: "#555", border: "1px solid #ffffff10", fontSize: 10, cursor: "pointer", fontFamily: "inherit" },
  addBtn: { width: "100%", padding: 10, borderRadius: 8, border: "1px dashed #00ff8733", background: "#00ff8708", color: "#00ff87", fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5, marginBottom: 10 },
  form: { background: "#ffffff04", border: "1px solid #ffffff0a", borderRadius: 8, padding: 12, marginBottom: 10 },
  formTitle: { fontSize: 10, color: "#666", marginBottom: 10, letterSpacing: 0.5 },
  input: { width: "100%", background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#fff", fontFamily: "inherit", marginBottom: 8 },
  select: { flex: 1, background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#fff", fontFamily: "inherit" },
  saveBtn: { width: "100%", padding: "9px 0", background: "linear-gradient(135deg,#00ff87,#00d4ff)", color: "#000", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  alertRow: { display: "flex", alignItems: "center", padding: "10px 12px", borderRadius: 8, background: "#ffffff03", border: "1px solid #ffffff06", marginBottom: 6 },
  toggleBtn: { fontSize: 9, padding: "2px 8px", borderRadius: 3, border: "1px solid", cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 },
  delBtn: { fontSize: 11, color: "#444", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" },
}


// ═══════════════════════════════════════════════════════════════
// PORTFOLIO TAB
// ═══════════════════════════════════════════════════════════════
export function PortfolioTab({ user }) {
  const [data, setData]       = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ skin_name: "", quantity: 1, buy_price_usd: "", buy_platform: "buff", sell_platform: "cgm" })

  const load = () => api.getPortfolio().then(setData).catch(() => {})
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.skin_name || !form.buy_price_usd) return
    await api.addPosition({ ...form, buy_price_usd: parseFloat(form.buy_price_usd), quantity: parseInt(form.quantity) || 1 })
    setShowAdd(false); setForm({ skin_name: "", quantity: 1, buy_price_usd: "", buy_platform: "buff", sell_platform: "cgm" }); load()
  }

  const del = async (id) => { await api.removePosition(id); load() }
  const usdRub = user?.usd_rub || 90

  return (
    <div className="fade-up" style={{ padding: "12px 16px" }}>
      {/* Summary */}
      {data && (
        <div style={ps.summaryCard}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: 1, marginBottom: 8 }}>ПОРТФЕЛЬ</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "заморожено", value: `$${data.total_frozen_usd?.toFixed(0)}`, sub: `${Math.round(data.total_frozen_rub)}₽`, color: "#888" },
              { label: "позиций", value: data.positions?.length || 0, color: "#fff" },
              { label: "готово к продаже", value: data.positions?.filter(p=>p.status==="ready").length || 0, color: "#00ff87" },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 9, color: "#555" }}>{s.sub}</div>}
                <div style={{ fontSize: 8, color: "#333", marginTop: 2 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add */}
      <button className="btn-press" style={as.addBtn} onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? "✕ Отмена" : "+ ДОБАВИТЬ ПОЗИЦИЮ"}
      </button>

      {showAdd && (
        <div style={as.form} className="fade-up">
          <input style={as.input} placeholder="Название скина" value={form.skin_name} onChange={e => setForm(f=>({...f,skin_name:e.target.value}))} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{...as.input, flex:1, marginBottom:0}} type="number" placeholder="Цена $ (Buff)" value={form.buy_price_usd} onChange={e => setForm(f=>({...f,buy_price_usd:e.target.value}))} />
            <input style={{...as.input, width:60, marginBottom:0}} type="number" placeholder="Кол-во" min={1} value={form.quantity} onChange={e => setForm(f=>({...f,quantity:e.target.value}))} />
          </div>
          <button className="btn-press" style={as.saveBtn} onClick={add}>Добавить позицию</button>
        </div>
      )}

      {/* Positions */}
      {data?.positions?.map(p => {
        const cgmData = { roi: 0 }  // расчёт на клиенте
        return (
          <div key={p.id} style={ps.posCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                {p.icon_url && <img src={p.icon_url} alt="" style={{ width: 32, height: 32, borderRadius: 5, float: "left", marginRight: 8, objectFit: "contain" }} onError={e=>e.target.style.display="none"} />}
                <div style={{ fontSize: 11, fontWeight: 600 }}>{p.skin_name.length > 26 ? p.skin_name.slice(0,26)+"…" : p.skin_name}</div>
                <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{p.quantity > 1 ? `${p.quantity}x ` : ""}Куплено: ${p.buy_price_usd?.toFixed(2)} ({Math.round(p.buy_price_rub)}₽)</div>
              </div>
              <span style={{ ...ps.statusBadge, background: p.status==="ready" ? "#00ff8715" : "#ffd60a10", color: p.status==="ready" ? "#00ff87" : "#ffd60a", borderColor: p.status==="ready" ? "#00ff8830" : "#ffd60a25" }}>
                {p.status==="ready" ? "✓ ГОТОВО" : `🔒 ${p.days_left}д`}
              </span>
            </div>

            {p.status === "locked" && p.days_left !== null && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 3, background: "#ffffff08", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${((14-(p.days_left||0))/14)*100}%`, background: "linear-gradient(90deg,#ffd60a,#ff8c00)", borderRadius: 2, transition: "width 0.5s" }} />
                </div>
                <div style={{ fontSize: 8, color: "#444", marginTop: 2 }}>{14-(p.days_left||0)}/14 дней</div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 9, color: "#444" }}>
                {new Date(p.bought_at).toLocaleDateString("ru")} → {p.unlock_at ? new Date(p.unlock_at).toLocaleDateString("ru") : "—"}
              </div>
              <button className="btn-press" onClick={() => del(p.id)} style={{ fontSize: 9, color: "#444", background: "none", border: "1px solid #ffffff10", borderRadius: 4, padding: "3px 8px", cursor: "pointer", fontFamily: "inherit" }}>Удалить</button>
            </div>
          </div>
        )
      })}

      {data?.positions?.length === 0 && (
        <div style={{ color: "#444", fontSize: 10, textAlign: "center", padding: "32px 0" }}>Нет открытых позиций</div>
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}

const ps = {
  summaryCard: { background: "linear-gradient(135deg,#00ff8710,#00d4ff08)", border: "1px solid #00ff8720", borderRadius: 10, padding: 14, marginBottom: 12 },
  posCard: { background: "#ffffff03", border: "1px solid #ffffff06", borderRadius: 8, padding: 12, marginBottom: 8 },
  statusBadge: { fontSize: 9, padding: "2px 7px", borderRadius: 3, border: "1px solid", letterSpacing: 0.5, whiteSpace: "nowrap", flexShrink: 0 },
}


// ═══════════════════════════════════════════════════════════════
// TRADES TAB (История сделок)
// ═══════════════════════════════════════════════════════════════
export function TradesTab({ user }) {
  const [data, setData]       = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm]       = useState({ skin_name: "", buy_price_usd: "", sell_price_usd: "", buy_platform: "buff", sell_platform: "cgm", quantity: 1 })

  const load = () => api.listTrades().then(setData).catch(() => {})
  useEffect(() => { load() }, [])

  const add = async () => {
    if (!form.skin_name || !form.buy_price_usd) return
    await api.addTrade({ ...form, buy_price_usd: parseFloat(form.buy_price_usd), sell_price_usd: form.sell_price_usd ? parseFloat(form.sell_price_usd) : null, quantity: parseInt(form.quantity)||1 })
    setShowAdd(false); setForm({ skin_name:"",buy_price_usd:"",sell_price_usd:"",buy_platform:"buff",sell_platform:"cgm",quantity:1 }); load()
  }

  const usdRub = user?.usd_rub || 90
  const summary = data?.summary

  return (
    <div className="fade-up" style={{ padding: "12px 16px" }}>
      {/* Stats */}
      {summary && (
        <div style={ps.summaryCard}>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: 1, marginBottom: 8 }}>СТАТИСТИКА</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Всего сделок", value: summary.total_trades },
              { label: "Потрачено", value: `$${summary.total_spent_usd?.toFixed(0)}` },
              { label: "Общий профит", value: `+$${summary.total_profit_usd?.toFixed(2)}`, sub: `+${Math.round(summary.total_profit_rub)}₽`, color: "#00ff87" },
              { label: "Средний ROI", value: `${summary.avg_roi?.toFixed(1)}%`, color: "#ffd60a" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 8, color: "#444", letterSpacing: 0.5 }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color || "#fff" }}>{s.value}</div>
                {s.sub && <div style={{ fontSize: 9, color: "#555" }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn-press" style={as.addBtn} onClick={() => setShowAdd(!showAdd)}>
        {showAdd ? "✕ Отмена" : "+ ЗАПИСАТЬ СДЕЛКУ"}
      </button>

      {showAdd && (
        <div style={as.form} className="fade-up">
          <input style={as.input} placeholder="Название скина" value={form.skin_name} onChange={e => setForm(f=>({...f,skin_name:e.target.value}))} />
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input style={{...as.input,flex:1,marginBottom:0}} type="number" placeholder="Куплено $" value={form.buy_price_usd} onChange={e => setForm(f=>({...f,buy_price_usd:e.target.value}))} />
            <input style={{...as.input,flex:1,marginBottom:0}} type="number" placeholder="Продано $ (если продал)" value={form.sell_price_usd} onChange={e => setForm(f=>({...f,sell_price_usd:e.target.value}))} />
          </div>
          <button className="btn-press" style={as.saveBtn} onClick={add}>Сохранить</button>
        </div>
      )}

      {/* Trades list */}
      <div style={{ fontSize: 9, color: "#444", letterSpacing: 1, margin: "12px 0 8px" }}>ИСТОРИЯ</div>
      {data?.trades?.map(t => (
        <div key={t.id} style={{ background: "#ffffff03", border: "1px solid #ffffff06", borderRadius: 8, padding: 12, marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>{t.skin_name.length > 26 ? t.skin_name.slice(0,26)+"…" : t.skin_name}</div>
              <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>{t.buy_platform} → {t.sell_platform || "?"}</div>
            </div>
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 3, background: t.sold_at ? "#00ff8715" : "#ffffff08", color: t.sold_at ? "#00ff87" : "#666", border: `1px solid ${t.sold_at ? "#00ff8830" : "#ffffff10"}` }}>
              {t.sold_at ? "ПРОДАНО" : "ОТКРЫТО"}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
            <div><div style={{ fontSize: 8, color: "#444" }}>КУПЛЕНО</div><div style={{ fontSize: 11, fontWeight: 600 }}>${t.buy_price?.toFixed(2)}</div></div>
            <div><div style={{ fontSize: 8, color: "#444" }}>ПРОДАНО</div><div style={{ fontSize: 11, color: "#bbb" }}>{t.sell_price ? `$${t.sell_price.toFixed(2)}` : "—"}</div></div>
            <div><div style={{ fontSize: 8, color: "#444" }}>ПРОФИТ</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.profit_usd > 0 ? "#00ff87" : t.profit_usd < 0 ? "#ff4757" : "#666" }}>
                {t.profit_usd != null ? `${t.profit_usd > 0 ? "+" : ""}$${t.profit_usd.toFixed(2)}` : "—"}
              </div>
              {t.profit_rub != null && t.profit_rub !== 0 && <div style={{ fontSize: 9, color: "#555" }}>{t.profit_rub > 0 ? "+" : ""}{Math.round(t.profit_rub)}₽</div>}
            </div>
          </div>
          <div style={{ fontSize: 8, color: "#333", marginTop: 6 }}>
            {new Date(t.bought_at).toLocaleDateString("ru")} {t.sold_at ? `→ ${new Date(t.sold_at).toLocaleDateString("ru")}` : ""}
          </div>
        </div>
      ))}
      {data?.trades?.length === 0 && <div style={{ color: "#444", fontSize: 10, textAlign: "center", padding: "32px 0" }}>Нет записанных сделок</div>}
      <div style={{ height: 16 }} />
    </div>
  )
}


// ═══════════════════════════════════════════════════════════════
// SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════
export function SettingsModal({ user, onClose }) {
  const [usdRub, setUsdRub] = useState(user?.usd_rub?.toString() || "90")
  const [minRoi, setMinRoi] = useState(user?.min_roi_notify?.toString() || "10")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await api.updateSettings({ usd_rub: parseFloat(usdRub), min_roi_notify: parseFloat(minRoi) })
    setSaving(false); onClose()
  }

  return (
    <div style={ss.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={ss.modal} className="fade-up">
        <div style={ss.header}>
          <span style={ss.title}>⚙️ Настройки</span>
          <button style={ss.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={ss.section}>Курс валют</div>
        <div style={ss.row}>
          <span style={ss.label}>USD/RUB курс</span>
          <input style={ss.input} type="number" value={usdRub} onChange={e => setUsdRub(e.target.value)} />
        </div>

        <div style={ss.section}>Уведомления</div>
        <div style={ss.row}>
          <span style={ss.label}>Мин. ROI для алерта</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input style={{...ss.input, width: 60}} type="number" value={minRoi} onChange={e => setMinRoi(e.target.value)} />
            <span style={{ fontSize: 11, color: "#555" }}>%</span>
          </div>
        </div>

        {user?.has_buff && (
          <div style={ss.buffInfo}>
            <div style={{ fontSize: 10, color: user.buff_expiring ? "#ffd60a" : "#00ff87" }}>
              {user.buff_expiring ? "⚠️ Buff сессия скоро истечёт!" : "✅ Buff сессия активна"}
            </div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>
              Возраст: {user.buff_age_days} дней · Обнови через бота: /buff
            </div>
          </div>
        )}

        {!user?.has_buff && (
          <div style={ss.buffInfo}>
            <div style={{ fontSize: 10, color: "#ff4757" }}>❌ Buff сессия не настроена</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 4 }}>Отправь /buff в бот чтобы добавить куку</div>
          </div>
        )}

        <button className="btn-press" style={ss.saveBtn} onClick={save} disabled={saving}>
          {saving ? "Сохраняем..." : "Сохранить"}
        </button>
      </div>
    </div>
  )
}

const ss = {
  overlay: { position: "fixed", inset: 0, background: "#00000088", zIndex: 100, display: "flex", alignItems: "flex-end" },
  modal:   { width: "100%", maxWidth: 420, margin: "0 auto", background: "#111118", border: "1px solid #ffffff0e", borderRadius: "16px 16px 0 0", padding: 20, fontFamily: "JetBrains Mono, monospace" },
  header:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title:   { fontSize: 14, fontWeight: 700 },
  closeBtn:{ background: "none", border: "none", color: "#555", fontSize: 18, cursor: "pointer" },
  section: { fontSize: 9, color: "#444", letterSpacing: 1, marginBottom: 8, marginTop: 12 },
  row:     { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  label:   { fontSize: 11, color: "#888" },
  input:   { background: "#ffffff08", border: "1px solid #ffffff15", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#fff", fontFamily: "inherit", width: 100, textAlign: "right" },
  buffInfo:{ background: "#ffffff04", border: "1px solid #ffffff08", borderRadius: 8, padding: 10, marginTop: 12 },
  saveBtn: { width: "100%", padding: "11px 0", background: "linear-gradient(135deg,#00ff87,#00d4ff)", color: "#000", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginTop: 16 },
}
