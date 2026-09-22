import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge, PriceYes } from '../components/ui'
import { api } from '../api'
import type { SearchResponse, PredictionEvent } from '../api'

function EventTree({ events }: { events: PredictionEvent[] }) {
  const [open, setOpen] = useState<Record<number, boolean>>({})
  const toggle = (id: number) => setOpen(o => ({ ...o, [id]: !o[id] }))

  return (
    <>
      {events.map((ev, ei) => (
        <div key={ei} className="search-event">
          <div className="search-event-title">{ev.event_name}
            <span className="text-muted" style={{ fontWeight: 400, fontSize: 11, marginLeft: 8 }}>
              {ev.event_type} · {ev.group_count ?? ev.groups.length} groups
            </span>
          </div>

          {ev.groups.map(g => (
            <div key={g.group_id} className="search-group">
              <div
                className="search-group-header"
                style={{ cursor: g.markets?.length ? 'pointer' : 'default' }}
                onClick={() => g.markets?.length && toggle(g.group_id)}
              >
                <span className="search-group-title">{g.title}</span>
                <span style={{ fontSize: 10, color: 'var(--dim)' }}>{g.platform_count} platforms</span>
                <div className="pb-list">
                  {g.platforms.map(p => <PlatformBadge key={p} p={p} />)}
                </div>
                {g.markets?.length ? (
                  <span style={{ color: 'var(--dim)', fontSize: 11 }}>{open[g.group_id] ? '▲' : '▼'}</span>
                ) : null}
              </div>

              {open[g.group_id] && g.markets && (
                <div className="group-markets">
                  {g.markets.map(m => (
                    <div key={`${m.platform}-${m.market_id}`} className="gm-row">
                      <div className="gm-platform"><PlatformBadge p={m.platform} /></div>
                      <span className="text-muted mono" style={{ fontSize: 10, flex: 1 }}>{m.market_id}</span>
                      <span className="gm-price"><PriceYes v={m.last_price} /></span>
                      <span className="gm-ask">{m.yes_bid != null ? `${m.yes_bid.toFixed(1)} / ${m.yes_ask?.toFixed(1)}` : '—'}</span>
                      <a href={m.source_url} target="_blank" rel="noreferrer" className="gm-link">↗</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default function SearchPage() {
  const [q, setQ] = useState('bitcoin')
  const [limit, setLimit] = useState('5')

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<SearchResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  const qs = new URLSearchParams({ q, limit })

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.search(q, Number(limit))
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/search"
      desc="關鍵字搜尋，回傳 events → groups → markets 巢狀結構。同一 group 代表跨平台相同事件，可直接比較各平台價格。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/search</span>
            <span className="url-scheme">?</span>
            <span className="url-qs">{qs.toString()}</span>
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col">
                <span className="param-key">q</span>
                <span className="param-req">required</span>
              </div>
              <input className="param-input" value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="bitcoin · election · NBA…" />
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–50</span>
            </div>
          </div>
          <div className="header-section">
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Xs0</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
            找到 <strong style={{ color: 'var(--text)' }}>{data.count}</strong> 個 event · 展開 group 可看各平台 market 價格
          </div>
          <EventTree events={data.events} />
        </>
      )}
    />
  )
}
