import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'
import { api } from '../api'
import type { EvResponse, EvOpportunity } from '../api'

function EvCard({ opp }: { opp: EvOpportunity }) {
  const consensusPct = (opp.consensus_probability * 100).toFixed(1)
  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', overflow: 'hidden', marginBottom: 8 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{opp.group_title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            {opp.event_date} · Consensus <strong style={{ color: 'var(--blue)' }}>{consensusPct}%</strong>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: opp.legs[0]?.roi_pct > 0 ? 'var(--green)' : 'var(--muted)' }}>
            +{(opp.legs[0]?.roi_pct ?? 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: 10, color: 'var(--muted)' }}>best leg ROI</div>
        </div>
      </div>

      {opp.legs.map((leg, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: i < opp.legs.length - 1 ? '1px solid var(--b1)33' : 'none' }}>
          <PlatformBadge p={leg.platform} />
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 4,
            background: leg.side === 'yes' ? 'var(--green-bg)' : 'var(--red-bg)',
            color: leg.side === 'yes' ? 'var(--green)' : 'var(--red)',
          }}>
            {leg.side.toUpperCase()} @ {(leg.price * 100).toFixed(1)}¢
          </span>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* EV bar */}
            <div style={{ height: 4, background: 'var(--s3)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
              <div style={{ height: '100%', background: 'var(--blue)', width: `${Math.min(leg.roi_pct, 100)}%`, borderRadius: 2 }} />
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, minWidth: 50, textAlign: 'right' }}>
            +{leg.roi_pct.toFixed(1)}% ROI
          </span>
          <a href={leg.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 11, textDecoration: 'none' }}>↗</a>
        </div>
      ))}

      <div style={{ padding: '6px 14px', background: 'var(--bg)', borderTop: '1px solid var(--b1)', fontSize: 10, color: 'var(--dim)' }}>
        Detected {new Date(opp.detected_at).toLocaleTimeString('zh-TW')}
      </div>
    </div>
  )
}

export default function EvPage() {
  const [limit, setLimit] = useState('20')
  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<EvResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  async function run() {
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      const d = await api.ev(Number(limit))
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/ev"
      desc="+EV 信號。跨平台 consensus 機率與市場價格出現落差，代表市場定價可能偏低（Expected Value 為正）。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/ev</span>
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
              計入 <strong>ev</strong> 獨立配額（Pro = 5,000/月）。<br />
              Consensus = 跨平台加權平均機率。ROI = (consensus / price) - 1。
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Q9Y</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--muted)', flexWrap: 'wrap' }}>
            <span><strong style={{ color: 'var(--text)' }}>{data.opportunities.length}</strong> 個 +EV 機會</span>
            <span>as of {new Date(data.as_of).toLocaleString('zh-TW')}</span>
          </div>
          {data.opportunities.map(opp => <EvCard key={opp.group_id} opp={opp} />)}
          {data.opportunities.length === 0 && <div className="empty-state">目前無 +EV 信號</div>}
        </>
      )}
    />
  )
}
