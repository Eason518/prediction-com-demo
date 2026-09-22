import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { PredictionEvent } from '../api'
import { Spinner, ErrorBox, PlatformBadge, PriceCell } from '../components'

function EventCard({ event }: { event: PredictionEvent }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card" style={{ marginBottom: 8 }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{event.event_name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            <span className="tag">{event.event_type}</span>
            {event.event_date && <span style={{ marginLeft: 8 }}>{event.event_date}</span>}
            <span style={{ marginLeft: 8 }}>{event.groups.length} groups</span>
          </div>
        </div>
        <span style={{ color: 'var(--text-dim)' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '6px 0' }}>
          {event.groups.map(g => (
            <div key={g.group_id} style={{ padding: '6px 14px', borderBottom: '1px solid var(--border)22' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: g.markets?.length ? 6 : 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{g.title}</span>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{g.platform_count} platforms</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {g.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                </div>
              </div>

              {g.markets && g.markets.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ fontSize: 10, color: 'var(--text-dim)', padding: '3px 0', textAlign: 'left' }}>Platform</th>
                      <th style={{ fontSize: 10, color: 'var(--text-dim)', padding: '3px 0', textAlign: 'right' }}>Bid</th>
                      <th style={{ fontSize: 10, color: 'var(--text-dim)', padding: '3px 0', textAlign: 'right' }}>Ask</th>
                      <th style={{ fontSize: 10, color: 'var(--text-dim)', padding: '3px 0', textAlign: 'right' }}>Last</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.markets.map(m => (
                      <tr key={`${m.platform}-${m.market_id}`}>
                        <td style={{ padding: '3px 0' }}><PlatformBadge platform={m.platform} /></td>
                        <td style={{ textAlign: 'right', padding: '3px 0' }}><PriceCell value={m.yes_bid} /></td>
                        <td style={{ textAlign: 'right', padding: '3px 0' }}>
                          <span className="price-ask">{m.yes_ask != null ? `${m.yes_ask.toFixed(1)}¢` : '—'}</span>
                        </td>
                        <td style={{ textAlign: 'right', padding: '3px 0' }}><PriceCell value={m.last_price} /></td>
                        <td style={{ textAlign: 'right', padding: '3px 0' }}>
                          <a href={m.source_url} target="_blank" rel="noreferrer"
                            style={{ color: 'var(--blue)', fontSize: 11, textDecoration: 'none' }}>↗</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', q],
    queryFn: () => api.search(q, 10),
    enabled: q.length > 0,
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title">Search</div>
        <span className="page-tag">GET /search</span>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input className="search-input" style={{ flex: 1, padding: '8px 14px', fontSize: 13 }}
          placeholder="輸入關鍵字（bitcoin、election、NBA…）"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setQ(input)}
        />
        <button className="pill active" style={{ padding: '0 20px' }} onClick={() => setQ(input)}>搜尋</button>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox message={String(error)} />}

      {data && (
        <>
          <div className="section-title">{data.count} 筆結果 · 展開 group 可看各平台比價</div>
          {data.events.map((ev, i) => <EventCard key={i} event={ev} />)}
          {data.count === 0 && <div className="empty-state">找不到符合的市場</div>}
        </>
      )}

      {!q && !isLoading && (
        <div className="empty-state">輸入關鍵字開始搜尋跨平台市場</div>
      )}
    </>
  )
}
