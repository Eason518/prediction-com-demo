import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'
import { api } from '../api'
import type { EventsResponse } from '../api'

export default function EventsPage() {
  const [eventType, setEventType] = useState('')
  const [status, setStatus]       = useState('')
  const [q, setQ]                 = useState('')
  const [limit, setLimit]         = useState('20')
  const [includeGroups, setIncludeGroups] = useState(true)

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<EventsResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()
  const [openIdx, setOpenIdx] = useState<Record<number, boolean>>({})

  const qs = new URLSearchParams()
  if (eventType)     qs.set('event_type', eventType)
  if (status)        qs.set('status', status)
  if (q)             qs.set('q', q)
  qs.set('include_groups', String(includeGroups))
  qs.set('limit', limit)

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.events({ event_type: eventType || undefined, status: status || undefined, q: q || undefined, include_groups: includeGroups, limit: Number(limit) })
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/events"
      desc="回傳事件列表與跨平台 market groups。計入 matched-markets 獨立配額（Free tier 10/月）。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/events</span>
            {qs.toString() && <><span className="url-scheme">?</span><span className="url-qs">{qs.toString()}</span></>}
          </div>

          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">event_type</span></div>
              <input className="param-input" placeholder="election · sports · crypto…" value={eventType} onChange={e => setEventType(e.target.value)} />
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">status</span></div>
              <select className="param-input" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">— (all)</option>
                <option value="active">active</option>
                <option value="resolved">resolved</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">q</span></div>
              <input className="param-input" placeholder="關鍵字…" value={q} onChange={e => setQ(e.target.value)} />
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">include_groups</span></div>
              <select className="param-input" value={String(includeGroups)} onChange={e => setIncludeGroups(e.target.value === 'true')}>
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–100</span>
            </div>
          </div>

          <div className="header-section">
            <div style={{ padding: '6px 0 8px', fontSize: 11 }}>
              <span style={{ background:'var(--orange-bg)',color:'var(--orange)',border:'1px solid #f0883e44',borderRadius:4,padding:'2px 8px',fontSize:10 }}>
                ⚠ 計入 matched-markets quota（Free = 10/月）
              </span>
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Xs0</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            {data.events.length} events {data.next_cursor ? '· 有下一頁' : ''}
          </div>
          {data.events.map((ev, i) => (
            <div key={i} className="event-card">
              <div className="event-card-header" onClick={() => setOpenIdx(o => ({ ...o, [i]: !o[i] }))}>
                <div style={{ flex: 1 }}>
                  <div className="event-name">{ev.event_name}</div>
                  <div className="event-meta">
                    <span className="event-tag">{ev.event_type}</span>
                    {ev.event_date && <span className="event-tag">{ev.event_date}</span>}
                    <span className="event-tag">{ev.groups.length} groups</span>
                  </div>
                </div>
                <span className="event-chevron">{openIdx[i] ? '▲' : '▼'}</span>
              </div>
              {openIdx[i] && (
                <div className="event-groups">
                  {ev.groups.map(g => (
                    <div key={g.group_id} className="event-group">
                      <span className="event-group-title">{g.title}</span>
                      <span className="platform-count">{g.platform_count} platforms</span>
                      <div className="pb-list">
                        {g.platforms.map(p => <PlatformBadge key={p} p={p} />)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    />
  )
}
