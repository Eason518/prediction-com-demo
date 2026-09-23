import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'
import { api } from '../api'
import type { ArbResponse, ArbOpportunity } from '../api'

function ArbCard({ opp }: { opp: ArbOpportunity }) {
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 8 }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{opp.group_title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            <span style={{ background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 10, padding: '1px 7px', marginRight: 6 }}>{opp.event_type}</span>
            {opp.event_date}
          </div>
        </div>
        {/* ROI badge */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--green)' }}>+{opp.roi_pct.toFixed(1)}%</div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>ROI · max ${opp.max_wager_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>

      {/* Legs */}
      <div style={{ padding: '6px 0' }}>
        {opp.legs.map((leg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: i < opp.legs.length - 1 ? '1px solid var(--b1)33' : 'none' }}>
            <PlatformBadge p={leg.platform} />
            <div style={{ flex: 1 }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{leg.market_id.slice(0, 40)}{leg.market_id.length > 40 ? '…' : ''}</span>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
              background: leg.side === 'yes' ? 'var(--green-bg)' : 'var(--red-bg)',
              color: leg.side === 'yes' ? 'var(--green)' : 'var(--red)',
            }}>
              {leg.side.toUpperCase()} @ {(leg.price * 100).toFixed(1)}¢
            </span>
            <div style={{ textAlign: 'right', minWidth: 80 }}>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Liq ${leg.liquidity_usd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
              <div style={{ fontSize: 10, color: 'var(--dim)' }}>fee ${leg.fee_usd}</div>
            </div>
            <a href={leg.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 11, textDecoration: 'none' }}>↗</a>
          </div>
        ))}
      </div>

      {/* Cost summary */}
      <div style={{ padding: '8px 14px', background: 'var(--bg)', borderTop: '1px solid var(--b1)', display: 'flex', gap: 20 }}>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Total cost <strong style={{ color: 'var(--text)' }}>${opp.total_cost.toFixed(2)}</strong></span>
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>Detected {new Date(opp.detected_at).toLocaleTimeString('zh-TW')}</span>
      </div>
    </div>
  )
}

export default function ArbPage() {
  const [limit, setLimit] = useState('20')
  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<ArbResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  async function run() {
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      const d = await api.arb(Number(limit))
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/arb"
      desc="跨平台套利機會。同一事件在不同平台出現價差，同時買兩邊可鎖定獲利。ROI 已扣除手續費。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/arb</span>
            <span className="url-scheme">?</span>
            <span className="url-qs">limit={limit}</span>
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–100</span>
            </div>
          </div>
          <div className="header-section">
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>
              計入 <strong>arb</strong> 獨立配額（Pro = 5,000/月）。<br />
              每次 Run 消耗 1 次配額。
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Q9Y</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span>找到 <strong style={{ color: 'var(--text)' }}>{data.count}</strong> 個機會</span>
            <span>as of {new Date(data.as_of).toLocaleString('zh-TW')}</span>
            {data.delay_seconds > 0 && <span style={{ color: 'var(--orange)' }}>延遲 {data.delay_seconds}s</span>}
          </div>
          {data.opportunities.map(opp => <ArbCard key={opp.group_id} opp={opp} />)}
          {data.opportunities.length === 0 && <div className="empty-state">目前無套利機會</div>}
        </>
      )}
    />
  )
}
