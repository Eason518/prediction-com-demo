import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

import StatusPage     from './pages/StatusPage'
import RateLimitPage  from './pages/RateLimitPage'
import MarketsPage    from './pages/MarketsPage'
import SearchPage     from './pages/SearchPage'
import EventsPage     from './pages/EventsPage'
import PricesBulkPage from './pages/PricesBulkPage'
import KalshiMarketsPage from './pages/KalshiMarketsPage'
import KalshiMarketPage  from './pages/KalshiMarketPage'
import TradesPage        from './pages/TradesPage'
import LockedPage     from './pages/LockedPage'

// ── Sidebar nav definition ────────────────────────────────────────────────────
const NAV = [
  { group: 'Status & Account' },
  { to: '/status',     method: 'GET', label: '/status' },
  { to: '/rate-limit', method: 'GET', label: '/rate-limit' },

  { group: 'Markets' },
  { to: '/markets',    method: 'GET', label: '/markets' },

  { group: 'Events & Search' },
  { to: '/events',     method: 'GET', label: '/events' },
  { to: '/search',     method: 'GET', label: '/search' },

  { group: 'Prices' },
  { to: '/prices-bulk',   method: 'GET', label: '/prices/bulk' },

  { group: 'Kalshi' },
  { to: '/kalshi/markets',        method: 'GET', label: '/kalshi/markets' },
  { to: '/kalshi/markets/ticker', method: 'GET', label: '/kalshi/markets/{ticker}' },

  { group: 'Trades' },
  { to: '/trades', method: 'GET', label: '/trades' },

  { group: 'WebSocket', lock: 'Dev+' },
  { to: '/ws/prices',      method: 'WS', label: 'prices', lock: 'Dev+' },
  { to: '/ws/smart-money', method: 'WS', label: 'smart_money', lock: 'Dev+' },
  { to: '/ws/fade-finder', method: 'WS', label: 'fade_finder', lock: 'Dev+' },

  { group: 'Alerts', lock: 'Dev+' },
  { to: '/alerts/smart-money', method: 'GET', label: '/alerts/smart-money', lock: 'Dev+' },
  { to: '/alerts/fade-finder', method: 'GET', label: '/alerts/fade-finder', lock: 'Dev+' },

  { group: 'Signals', lock: 'Pro+' },
  { to: '/signals/arb', method: 'GET', label: '/signals/arb', lock: 'Pro+' },
  { to: '/signals/ev',  method: 'GET', label: '/signals/ev',  lock: 'Pro+' },
] as const

// ── Topbar ────────────────────────────────────────────────────────────────────
function Topbar() {
  const { data } = useQuery({ queryKey: ['rate-limit-bar'], queryFn: api.rateLimit, staleTime: 60_000 })
  return (
    <div className="topbar">
      <div className="topbar-logo">
        <div className="topbar-dot" />
        Prediction.com Demo
      </div>
      <div className="topbar-space" />
      {data && (
        <>
          <div className="topbar-chip">
            Tier: <strong>{data.tier}</strong>
          </div>
          <div className="topbar-chip">
            配額 <strong>{data.month.remaining.toLocaleString()}</strong> / {data.month.limit.toLocaleString()} 剩餘
          </div>
        </>
      )}
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar() {
  const loc = useLocation()
  return (
    <div className="sidebar">
      {NAV.map((item, i) => {
        if ('group' in item) {
          return (
            <div key={i} className="nav-group">
              {item.group}
              {'lock' in item && item.lock && (
                <span className="nav-group-lock">{item.lock}</span>
              )}
            </div>
          )
        }
        const active = loc.pathname === item.to
        const mClass = item.method === 'WS' ? 'm-ws' : 'm-get'
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`nav-item${active ? ' active' : ''}`}
          >
            <span className={`method-badge ${mClass}`}>{item.method}</span>
            {item.label}
          </NavLink>
        )
      })}
    </div>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"            element={<StatusPage />} />
      <Route path="/status"      element={<StatusPage />} />
      <Route path="/rate-limit"  element={<RateLimitPage />} />
      <Route path="/markets"     element={<MarketsPage />} />
      <Route path="/events"      element={<EventsPage />} />
      <Route path="/search"      element={<SearchPage />} />
      <Route path="/prices-bulk" element={<PricesBulkPage />} />
      <Route path="/kalshi/markets"        element={<KalshiMarketsPage />} />
      <Route path="/kalshi/markets/ticker" element={<KalshiMarketPage />} />
      <Route path="/trades"                element={<TradesPage />} />

      {/* WebSocket — locked */}
      <Route path="/ws/prices"      element={<LockedPage method="WS" path="/prices"      desc="即時 bid/ask/last 更新，每次市場價格變動推送。"                 tier="Dev $49/mo" what="WebSocket prices channel — 即時報價串流" />} />
      <Route path="/ws/smart-money" element={<LockedPage method="WS" path="/smart_money" desc="Polymarket 鯨魚大單 alert stream，追蹤聰明錢流向。"           tier="Dev $49/mo" what="WebSocket smart_money channel" />} />
      <Route path="/ws/fade-finder" element={<LockedPage method="WS" path="/fade_finder" desc="反鯨信號 stream，大錢歷史上往錯誤方向移動的市場。"             tier="Dev $49/mo" what="WebSocket fade_finder channel" />} />

      {/* Alerts — locked */}
      <Route path="/alerts/smart-money" element={<LockedPage path="/alerts/smart-money" desc="大單鯨魚買賣信號 REST feed（smart_money / insider / captain_hook）。" tier="Dev $49/mo" what="GET /alerts/smart-money" />} />
      <Route path="/alerts/fade-finder" element={<LockedPage path="/alerts/fade-finder" desc="Fade-the-whale 信號 REST feed。"                                    tier="Dev $49/mo" what="GET /alerts/fade-finder" />} />

      {/* Signals — locked */}
      <Route path="/signals/arb" element={<LockedPage path="/signals/arb" desc="跨平台套利機會，同一事件不同平台出現價差時觸發。" tier="Pro $249/mo" what="GET /signals/arb" />} />
      <Route path="/signals/ev"  element={<LockedPage path="/signals/ev"  desc="+EV (Expected Value) 信號，針對訂閱的 match group。"  tier="Pro $249/mo" what="GET /signals/ev" />} />
    </Routes>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Topbar />
        <Sidebar />
        <div className="main">
          <AppRoutes />
        </div>
      </div>
    </BrowserRouter>
  )
}
