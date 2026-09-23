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
import ArbPage           from './pages/ArbPage'
import EvPage            from './pages/EvPage'
import AlertsPage        from './pages/AlertsPage'
import LiveFeedPage      from './pages/LiveFeedPage'

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

  { group: 'WebSocket' },
  { to: '/live', method: 'WS', label: 'Live Feed (all channels)' },

  { group: 'Alerts' },
  { to: '/alerts/smart-money', method: 'GET', label: '/alerts/smart-money' },
  { to: '/alerts/fade-finder', method: 'GET', label: '/alerts/fade-finder' },

  { group: 'Signals' },
  { to: '/arb', method: 'GET', label: '/arb' },
  { to: '/ev',  method: 'GET', label: '/ev' },
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
      <Route path="/live"                  element={<LiveFeedPage />} />
      <Route path="/alerts/smart-money"    element={<AlertsPage endpoint="smart-money" />} />
      <Route path="/alerts/fade-finder"    element={<AlertsPage endpoint="fade-finder" />} />
      <Route path="/arb"                   element={<ArbPage />} />
      <Route path="/ev"                    element={<EvPage />} />
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
