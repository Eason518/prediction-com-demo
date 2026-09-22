import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge, PriceYes, PriceAsk, formatDate } from '../components/ui'
import { api } from '../api'
import type { MarketsResponse } from '../api'

const PLATFORMS = ['', 'polymarket', 'kalshi', 'polymarket_us', 'predictit', 'prophetx', 'opinion', 'predictfun', 'novig']
const STATUSES  = ['active', 'closed', 'all']

export default function MarketsPage() {
  const [platform, setPlatform] = useState('')
  const [status, setStatus]     = useState('active')
  const [category, setCategory] = useState('')
  const [q, setQ]               = useState('')
  const [limit, setLimit]       = useState('50')

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<MarketsResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  // build query string for URL preview
  const qs = new URLSearchParams()
  if (platform) qs.set('platform', platform)
  if (status !== 'active') qs.set('status', status)
  if (category) qs.set('category', category)
  if (q) qs.set('q', q)
  qs.set('limit', limit)
  const qsStr = qs.toString()

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.markets({ platform: platform || undefined, status, category: category || undefined, q: q || undefined, limit: Number(limit) })
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/markets"
      desc="回傳分頁市場列表，含各平台即時價格。支援 platform、category、關鍵字過濾。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/markets</span>
            {qsStr && <><span className="url-scheme">?</span><span className="url-qs">{qsStr}</span></>}
          </div>

          <div className="param-section">
            <div className="param-section-label">Query Params</div>

            <div className="param-row">
              <div className="param-key-col"><span className="param-key">platform</span></div>
              <select className="param-input" value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p || '— (all)'}</option>)}
              </select>
            </div>

            <div className="param-row">
              <div className="param-key-col"><span className="param-key">status</span></div>
              <select className="param-input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="param-row">
              <div className="param-key-col"><span className="param-key">category</span></div>
              <input className="param-input" placeholder="crypto · politics · sports…" value={category} onChange={e => setCategory(e.target.value)} />
            </div>

            <div className="param-row">
              <div className="param-key-col"><span className="param-key">q</span></div>
              <input className="param-input" placeholder="關鍵字 (title/market_id)" value={q} onChange={e => setQ(e.target.value)} />
            </div>

            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–2000</span>
            </div>
          </div>

          <div className="header-section">
            <div className="param-section-label">Headers</div>
            <div className="header-row">
              <span className="header-k">X-API-Key</span>
              <span className="header-v">pmx_***Xs0</span>
            </div>
          </div>
        </>
      }
      visualSlot={data && (
        <div className="vis-table">
          <div className="vis-table-header">
            <span className="vis-table-title">Markets</span>
            <span className="text-muted" style={{ fontSize: 11 }}>{data.markets.length} 筆 · {data.as_of.slice(0, 10)}</span>
            {data.next_cursor && <span style={{ fontSize: 10, color: 'var(--orange)' }}>有下一頁 (next_cursor)</span>}
          </div>
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Event</th>
                <th>Title</th>
                <th>Status</th>
                <th className="r">Bid</th>
                <th className="r">Ask</th>
                <th className="r">Last</th>
                <th className="r">Volume</th>
                <th>Expires</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.markets.map(m => (
                <tr key={m.id}>
                  <td><PlatformBadge p={m.platform} /></td>
                  <td><span className="ellipsis" title={m.event_title} style={{ display:'block' }}>{m.event_title}</span></td>
                  <td><span className="ellipsis" title={m.title} style={{ display:'block' }}>{m.title}</span></td>
                  <td><span style={{ color: m.status === 'active' ? 'var(--green)' : 'var(--dim)', fontSize: 11 }}>● {m.status}</span></td>
                  <td className="r"><PriceYes v={m.price.yes_bid} /></td>
                  <td className="r"><PriceAsk v={m.price.yes_ask} /></td>
                  <td className="r"><PriceYes v={m.price.last_price} /></td>
                  <td className="r" style={{ color: 'var(--muted)', fontSize: 11 }}>{m.price.volume?.toLocaleString() ?? '—'}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(m.expiration_date)}</td>
                  <td><a href={m.source_url} target="_blank" rel="noreferrer" className="link-out">↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  )
}
