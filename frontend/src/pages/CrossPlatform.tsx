import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { GroupMarket } from '../api'
import { Spinner, ErrorBox, PlatformBadge } from '../components'

function CompareGroup({ title, markets }: { title: string; markets: GroupMarket[] }) {
  const withPrice = markets.filter(m => m.last_price != null)
  const base = withPrice.length > 0 ? withPrice.reduce((a, b) => (a.last_price! < b.last_price! ? a : b)) : null

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="compare-event">{title}</div>
          <div className="compare-group-label">{markets.length} platforms</div>
        </div>
      </div>
      <div style={{ padding: '6px 0' }}>
        {markets.map(m => {
          const price = m.last_price
          const delta = price != null && base?.last_price != null ? price - base.last_price : null
          const barPct = price != null ? Math.min(price, 100) : 0
          return (
            <div key={`${m.platform}-${m.market_id}`} className="compare-row">
              <div className="compare-platform"><PlatformBadge platform={m.platform} /></div>
              <div className="spread-track">
                <div className="spread-fill" style={{ width: `${barPct}%` }} />
              </div>
              <div className="compare-price">{price != null ? `${price.toFixed(1)}¢` : '—'}</div>
              {delta != null && Math.abs(delta) > 0.01 ? (
                <span className={`delta ${delta > 0 ? 'delta-pos' : 'delta-neg'}`}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(1)}¢
                </span>
              ) : (
                <span className="delta" style={{ color: 'var(--text-dim)', background: 'var(--surface2)' }}>BASE</span>
              )}
              <a href={m.source_url} target="_blank" rel="noreferrer"
                style={{ color: 'var(--blue)', fontSize: 11, textDecoration: 'none' }}>↗</a>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CrossPlatform() {
  const [input, setInput] = useState('bitcoin')
  const [q, setQ] = useState('bitcoin')

  const { data, isLoading, error } = useQuery({
    queryKey: ['cross', q],
    queryFn: () => api.search(q, 5),
    enabled: q.length > 0,
  })

  // flatten: only groups that have ≥2 markets with prices
  const compareGroups = data?.events.flatMap(ev =>
    ev.groups
      .filter(g => g.markets && g.markets.filter(m => m.last_price != null).length >= 2)
      .map(g => ({ eventName: ev.event_name, group: g }))
  ) ?? []

  return (
    <>
      <div className="page-header">
        <div className="page-title">Cross-Platform Compare</div>
        <span className="page-tag">GET /search + price comparison</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input className="search-input" style={{ flex: 1, padding: '8px 14px', fontSize: 13 }}
          placeholder="搜尋事件（bitcoin、election、NBA…）"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setQ(input)}
        />
        <button className="pill active" style={{ padding: '0 20px' }} onClick={() => setQ(input)}>搜尋</button>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox message={String(error)} />}

      {compareGroups.length > 0 && (
        <>
          <div className="section-title">
            {compareGroups.length} 組跨平台比價 · 同 group 內各平台 last price 對比
          </div>
          <div className="compare-grid">
            {compareGroups.map(({ eventName, group }) => (
              <div key={group.group_id}>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginBottom: 4 }}>{eventName}</div>
                <CompareGroup title={group.title} markets={group.markets!} />
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && q && compareGroups.length === 0 && (
        <div className="empty-state">找不到有跨平台價格可比較的 group（部分平台資料可能為空）</div>
      )}

      {!q && <div className="empty-state">輸入關鍵字找跨平台比價機會</div>}
    </>
  )
}
