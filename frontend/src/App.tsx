import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import SearchPage from './pages/SearchPage'
import EventsPage from './pages/EventsPage'
import CrossPlatform from './pages/CrossPlatform'
import PriceBulk from './pages/PriceBulk'
import LockedPage from './pages/LockedPage'

function Topbar() {
  const { data } = useQuery({ queryKey: ['rate-limit'], queryFn: api.rateLimit, refetchInterval: 60_000 })
  return (
    <div className="topbar">
      <div className="topbar-logo">
        <div className="topbar-logo-dot" />
        Prediction.com Demo
      </div>
      <div className="topbar-spacer" />
      {data && (
        <>
          <div className="topbar-badge">
            Tier: <strong>{data.tier}</strong>
          </div>
          <div className="topbar-badge">
            月配額 <strong style={{ color: 'var(--green)' }}>{data.month.remaining.toLocaleString()}</strong>
            {' '}/ {data.month.limit.toLocaleString()} 剩餘
          </div>
        </>
      )}
    </div>
  )
}

const NAV = [
  { section: '概覽' },
  { to: '/', icon: '🏠', label: 'Dashboard' },
  { section: '市場資料' },
  { to: '/markets', icon: '📋', label: 'Markets' },
  { to: '/search', icon: '🔍', label: 'Search' },
  { to: '/events', icon: '📅', label: 'Events' },
  { section: '比價工具' },
  { to: '/cross-platform', icon: '⚖️', label: 'Cross-Platform' },
  { to: '/price-bulk', icon: '⚡', label: 'Price Bulk' },
  { section: '進階（需升級）' },
  { to: '/live', icon: '📶', label: 'Live Feed', lock: 'Dev+' },
  { to: '/smart-money', icon: '🐳', label: 'Smart Money', lock: 'Dev+' },
  { to: '/arb', icon: '🎯', label: 'Arb Signals', lock: 'Pro+' },
]

function Sidebar() {
  return (
    <div className="sidebar">
      {NAV.map((item, i) => {
        if ('section' in item) {
          return <div key={i} className="nav-section-label">{item.section}</div>
        }
        return (
          <NavLink
            key={item.to}
            to={item.to!}
            end={item.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
            {item.lock && <span className="nav-item-lock">{item.lock}</span>}
          </NavLink>
        )
      })}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Topbar />
        <Sidebar />
        <div className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/cross-platform" element={<CrossPlatform />} />
            <Route path="/price-bulk" element={<PriceBulk />} />
            <Route path="/live" element={<LockedPage icon="📶" title="Live WebSocket Feed" sub="即時 price_update · smart_money · fade_finder" tier="Dev $49/mo" />} />
            <Route path="/smart-money" element={<LockedPage icon="🐳" title="Smart Money Alerts" sub="鯨魚大單 · insider · captain_hook 信號" tier="Dev $49/mo" />} />
            <Route path="/arb" element={<LockedPage icon="🎯" title="Arbitrage Signals" sub="跨平台套利機會 · +EV 信號" tier="Pro $249/mo" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
