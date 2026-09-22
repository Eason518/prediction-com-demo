import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { formatDate } from '../components/ui'
import { api } from '../api'
import type { KalshiMarket } from '../api'

const EXAMPLE_TICKERS = [
  'KXBTCMINY-27JAN01-50000.00',
  'KXPRESPERSON-28-GNEWS',
]

function dollarToPercent(s?: string) {
  if (!s) return '—'
  const n = parseFloat(s)
  return isNaN(n) ? '—' : `${(n * 100).toFixed(1)}¢`
}

function InfoRow({ label, val }: { label: string; val?: string | null }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--b1)33' }}>
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
      <span style={{ fontSize: 11, color: 'var(--text)', textAlign: 'right', maxWidth: '60%' }}>{val ?? '—'}</span>
    </div>
  )
}

export default function KalshiMarketPage() {
  const [ticker, setTicker] = useState(EXAMPLE_TICKERS[0])

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<KalshiMarket | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  async function run() {
    if (!ticker.trim()) return
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      // API returns flat market object or {market: {...}}
      const raw = await api.kalshiMarket(ticker.trim()) as any
      const m: KalshiMarket = raw.market ?? raw
      setData(m); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/kalshi/markets/{ticker}"
      desc="查詢單一 Kalshi market 完整資訊，含即時價格、open interest、resolution rules、結算結果。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/kalshi/markets/</span>
            <span className="url-qs">{ticker || '{ticker}'}</span>
          </div>
          <div className="param-section">
            <div className="param-section-label">Path Params</div>
            <div className="param-row">
              <div className="param-key-col">
                <span className="param-key">ticker</span>
                <span className="param-req">required</span>
              </div>
              <input
                className="param-input"
                value={ticker}
                onChange={e => setTicker(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && run()}
                placeholder="KXBTCMINY-27JAN01-50000.00"
              />
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 4 }}>範例：</span>
              {EXAMPLE_TICKERS.map(t => (
                <button key={t} onClick={() => setTicker(t)}
                  style={{ fontSize: 10, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 4, padding: '2px 8px', color: 'var(--muted)', cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
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
          {/* Header card */}
          <div className="stat-card" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{data.title}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 5, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--blue)' }}>{data.ticker}</span>
                  {data.category && <span className="event-tag" style={{ fontSize: 10, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 10, padding: '1px 7px', color: 'var(--muted)' }}>{data.category}</span>}
                  <span style={{ color: data.status === 'active' ? 'var(--green)' : 'var(--muted)', fontSize: 11 }}>● {data.status}</span>
                  {data.result && <span style={{ color: 'var(--green)', fontSize: 11, fontWeight: 700 }}>Result: {data.result}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Price grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              { label: 'Yes Bid', val: data.yes_bid_dollars },
              { label: 'Yes Ask', val: data.yes_ask_dollars },
              { label: 'No Bid',  val: data.no_bid_dollars },
              { label: 'No Ask',  val: data.no_ask_dollars },
            ].map(({ label, val }) => (
              <div key={label} className="stat-card" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: label.includes('Bid') ? 'var(--green)' : 'var(--muted)' }}>
                  {dollarToPercent(val)}
                </div>
              </div>
            ))}
          </div>

          {/* Details */}
          <div className="card" style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '10px 14px' }}>
            <InfoRow label="Last Price" val={dollarToPercent(data.last_price_dollars)} />
            <InfoRow label="Volume" val={data.volume_fp ? parseFloat(data.volume_fp).toLocaleString(undefined, { maximumFractionDigits: 0 }) : undefined} />
            <InfoRow label="Open Interest" val={data.open_interest_fp} />
            <InfoRow label="Liquidity" val={data.liquidity_dollars ? `$${data.liquidity_dollars}` : undefined} />
            <InfoRow label="Close Time" val={formatDate(data.close_time)} />
            <InfoRow label="Event Ticker" val={data.event_ticker} />
          </div>

          {/* Resolution rules */}
          {data.rules_primary && (
            <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--dim)', marginBottom: 8 }}>Resolution Rule</div>
              <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.7 }}>{data.rules_primary}</p>
              {data.rules_secondary && (
                <p style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.7, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--b1)' }}>{data.rules_secondary}</p>
              )}
            </div>
          )}
        </>
      )}
    />
  )
}
