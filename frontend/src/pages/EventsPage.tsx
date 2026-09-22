import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Spinner, ErrorBox, PlatformBadge } from '../components'

export default function EventsPage() {
  const [eventType, setEventType] = useState('')
  const [q, setQ] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['events', eventType, q],
    queryFn: () => api.events({ event_type: eventType || undefined, q: q || undefined, include_groups: true, limit: 20 }),
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title">Events</div>
        <span className="page-tag">GET /events</span>
        <span className="tag" style={{ color: 'var(--orange)' }}>⚠️ 計入 matched-markets quota（Free 10/月）</span>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['', 'election', 'sports', 'crypto', 'politics'].map(t => (
          <button key={t} className={`pill ${eventType === t ? 'active' : ''}`} onClick={() => setEventType(t)}>
            {t || 'all'}
          </button>
        ))}
        <input className="search-input" placeholder="關鍵字…" value={q}
          onChange={e => setQ(e.target.value)} />
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox message={String(error)} />}

      {data?.events.map((ev, i) => (
        <div key={i} className="card">
          <div className="card-header">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.event_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="tag">{ev.event_type}</span>
                {ev.event_date && <span>{ev.event_date}</span>}
                <span>{ev.groups.length} cross-platform groups</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ev.groups.map(g => (
              <div key={g.group_id} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 6, padding: '5px 10px', fontSize: 11
              }}>
                <div style={{ fontWeight: 600, marginBottom: 3 }}>{g.title}</div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {g.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!isLoading && data?.events.length === 0 && <div className="empty-state">無符合事件</div>}
    </>
  )
}
