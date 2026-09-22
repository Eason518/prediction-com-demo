import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { formatDate } from '../components/ui'
import { api } from '../api'
import type { KalshiMarketsResponse, KalshiMarket } from '../api'

const CATEGORIES = ['', 'Crypto', 'Politics', 'Sports', 'Economics', 'Financials',
  'Entertainment', 'Science and Technology', 'Climate and Weather', 'Companies', 'Mentions']
const STATUSES = ['', 'open', 'closed', 'settled', 'unopened']

function dollarToPercent(s?: string) {
  if (!s) return '—'
  const n = parseFloat(s)
  return isNaN(n) ? '—' : `${(n * 100).toFixed(1)}¢`
}

function MarketRow({ m }: { m: KalshiMarket }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <tr onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer' }}>
        <td>
          <span className="mono" style={{ fontSize: 10, color: 'var(--blue)' }}>{m.ticker}</span>
        </td>
        <td style={{ maxWidth: 240 }}>
          <span className="ellipsis" title={m.title} style={{ display: 'block' }}>{m.title}</span>
        </td>
        <td>
          <span style={{ color: m.status === 'active' ? 'var(--green)' : 'var(--muted)', fontSize: 11 }}>
            ● {m.status}
          </span>
        </td>
        <td className="r" style={{ color: 'var(--green)', fontWeight: 600 }}>{dollarToPercent(m.yes_bid_dollars)}</td>
        <td className="r" style={{ color: 'var(--muted)' }}>{dollarToPercent(m.yes_ask_dollars)}</td>
        <td className="r" style={{ color: 'var(--green)', fontWeight: 600 }}>{dollarToPercent(m.last_price_dollars)}</td>
        <td className="r" style={{ fontSize: 11, color: 'var(--muted)' }}>
          {m.volume_fp ? parseFloat(m.volume_fp).toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
        </td>
        <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{formatDate(m.close_time)}</td>
        <td style={{ color: 'var(--dim)', fontSize: 12 }}>{open ? '▲' : '▼'}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={9} style={{ background: 'var(--bg)', padding: '10px 14px' }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 8 }}>
              <div><span className="text-muted" style={{ fontSize: 10 }}>Event Ticker</span><br />
                <span className="mono" style={{ fontSize: 11 }}>{m.event_ticker}</span></div>
              <div><span className="text-muted" style={{ fontSize: 10 }}>Category</span><br />
                <span style={{ fontSize: 11 }}>{m.category ?? '—'}</span></div>
              <div><span className="text-muted" style={{ fontSize: 10 }}>Open Interest</span><br />
                <span style={{ fontSize: 11 }}>{m.open_interest_fp ?? '—'}</span></div>
              <div><span className="text-muted" style={{ fontSize: 10 }}>Liquidity</span><br />
                <span style={{ fontSize: 11 }}>${m.liquidity_dollars ?? '—'}</span></div>
              {m.result && <div><span className="text-muted" style={{ fontSize: 10 }}>Result</span><br />
                <span style={{ fontSize: 11, color: 'var(--green)' }}>{m.result}</span></div>}
            </div>
            {m.rules_primary && (
              <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, borderTop: '1px solid var(--b1)', paddingTop: 8 }}>
                <span style={{ color: 'var(--dim)', fontSize: 10, textTransform: 'uppercase' }}>Resolution Rule</span><br />
                {m.rules_primary}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

export default function KalshiMarketsPage() {
  const [status, setStatus]     = useState('open')
  const [category, setCategory] = useState('')
  const [eventTicker, setEventTicker] = useState('')
  const [limit, setLimit]       = useState('50')

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<KalshiMarketsResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  const qs = new URLSearchParams()
  if (status) qs.set('status', status)
  if (category) qs.set('category', category)
  if (eventTicker) qs.set('event_ticker', eventTicker)
  qs.set('limit', limit)

  async function run() {
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      const d = await api.kalshiMarkets({ status: status || undefined, category: category || undefined, event_ticker: eventTicker || undefined, limit: Number(limit) })
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/kalshi/markets"
      desc="Kalshi 完整市場目錄，含即時價格與狀態。可依 status、category、event_ticker 過濾，支援 cursor 分頁。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/kalshi/markets</span>
            {qs.toString() && <><span className="url-scheme">?</span><span className="url-qs">{qs.toString()}</span></>}
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">status</span></div>
              <select className="param-input" value={status} onChange={e => setStatus(e.target.value)}>
                {STATUSES.map(s => <option key={s} value={s}>{s || '— (all)'}</option>)}
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">category</span></div>
              <select className="param-input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c || '— (all)'}</option>)}
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">event_ticker</span></div>
              <input className="param-input" placeholder="KXBTCMINY-27JAN01" value={eventTicker} onChange={e => setEventTicker(e.target.value)} />
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–1000</span>
            </div>
          </div>
          <div className="header-section">
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Xs0</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <div className="vis-table">
          <div className="vis-table-header">
            <span className="vis-table-title">Kalshi Markets</span>
            <span className="text-muted" style={{ fontSize: 11 }}>
              {data._meta.count} 筆
              {data._meta.category ? ` · ${data._meta.category}` : ''}
              {data._meta.pages_scanned ? ` · scanned ${data._meta.pages_scanned} pages` : ''}
            </span>
            {data.cursor && <span style={{ fontSize: 10, color: 'var(--orange)' }}>有下一頁 (cursor)</span>}
          </div>
          <table>
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Title</th>
                <th>Status</th>
                <th className="r">Yes Bid</th>
                <th className="r">Yes Ask</th>
                <th className="r">Last</th>
                <th className="r">Volume</th>
                <th>Close</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.markets.map(m => <MarketRow key={m.ticker} m={m} />)}
            </tbody>
          </table>
        </div>
      )}
    />
  )
}
