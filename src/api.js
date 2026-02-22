const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

let TG_ID = null

export function initTgUser() {
  try {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user
    if (user?.id) TG_ID = user.id
  } catch {}
  return TG_ID
}

async function req(path, opts = {}) {
  const url = new URL(`${BASE}${path}`)
  if (TG_ID) url.searchParams.set("tg_id", TG_ID)
  const r = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
    ...opts,
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `HTTP ${r.status}`)
  }
  return r.json()
}

export const api = {
  // Users
  getMe:          ()             => req("/users/me"),
  updateSettings: (body)         => req("/users/settings", { method:"PATCH", body:JSON.stringify(body) }),
  listKeys:       ()             => req("/users/keys"),
  genKey:         ()             => req("/users/genkey", { method:"POST" }),

  // Arbitrage
  getArbitrage:   (minRoi = 0)   => req(`/arbitrage/list?min_roi=${minRoi}`),

  // Charts
  getHistory:     (name, period) => req(`/charts/history?name=${encodeURIComponent(name)}&period=${period}`),

  // Alerts
  listAlerts:     ()             => req("/alerts/"),
  createAlert:    (body)         => req("/alerts/", { method:"POST", body:JSON.stringify(body) }),
  toggleAlert:    (id)           => req(`/alerts/${id}/toggle`, { method:"PATCH" }),
  deleteAlert:    (id)           => req(`/alerts/${id}`, { method:"DELETE" }),

  // Portfolio
  getPortfolio:   ()             => req("/portfolio/"),
  addPosition:    (body)         => req("/portfolio/", { method:"POST", body:JSON.stringify(body) }),
  removePosition: (id)           => req(`/portfolio/${id}`, { method:"DELETE" }),

  // Trades
  listTrades:     ()             => req("/trades/"),
  addTrade:       (body)         => req("/trades/", { method:"POST", body:JSON.stringify(body) }),
  deleteTrade:    (id)           => req(`/trades/${id}`, { method:"DELETE" }),
}
