import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge, PriceYes, PriceAsk, formatTs } from '../components/ui'
import { api } from '../api'
import type { PricesBulkResponse } from '../api'

const EXAMPLES = [
  'polymarket:573656,kalshi:KXBTCMINY-27JAN01-50000.00',
  'polymarket:573654',
]

export default function PricesBulkPage() {
  const [ids, setIds] = useState(EXAMPLES[0])
  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<PricesBulkResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.pricesBulk(ids.trim())
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/prices/bulk"
      desc="批次查詢多個市場的最新快照價格。傳入逗號分隔的 platform:market_id 組合。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/prices/bulk</span>
            <span className="url-scheme">?</span>
            <span className="url-qs">ids={ids.slice(0, 40)}{ids.length > 40 ? '…' : ''}</span>
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row" style={{ flexDirection: 'column', gap: 6 }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <div className="param-key-col">
                  <span className="param-key">ids</span>
                  <span className="param-req">required</span>
                </div>
                <textarea
                  className="param-input"
                  style={{ flex:1, minHeight:80, resize:'vertical', fontFamily:'monospace', fontSize:11 }}
                  value={ids}
                  onChange={e => setIds(e.target.value)}
                  placeholder="polymarket:573656,kalshi:KXTICKER"
                />
              </div>
              <div style={{ display:'flex',gap:6,flexWrap:'wrap' }}>
                <span style={{ fontSize:10,color:'var(--dim)',paddingTop:4 }}>範例：</span>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} onClick={() => setIds(ex)}
                    style={{ fontSize:10,background:'var(--s2)',border:'1px solid var(--b2)',borderRadius:4,padding:'2px 8px',color:'var(--muted)',cursor:'pointer' }}>
                    Example {i+1}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="header-section">
            <div style={{ fontSize:11,color:'var(--muted)',marginBottom:8,lineHeight:1.5 }}>
              格式：<span className="mono" style={{ color:'var(--blue)' }}>platform:market_id</span>
              ，逗號分隔。<br/>
              platform 前綴會被 server 自動 strip，可用原始 market_id 或帶前綴均可。
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Xs0</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div className="bulk-meta">
            <div className="bulk-meta-item">Requested: <strong>{data._meta.requested}</strong></div>
            <div className="bulk-meta-item">Resolved: <strong style={{ color:'var(--green)' }}>{data._meta.resolved}</strong></div>
            {data._meta.unresolved_ids.length > 0 && (
              <div className="bulk-meta-item" style={{ color:'var(--orange)' }}>
                Unresolved: {data._meta.unresolved_ids.join(', ')}
              </div>
            )}
          </div>
          <div className="vis-table">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Market ID</th>
                  <th className="r">Yes Bid</th>
                  <th className="r">Yes Ask</th>
                  <th className="r">Last Price</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.prices).map(([key, p]) => {
                  const [platform, ...rest] = key.split(':')
                  return (
                    <tr key={key}>
                      <td><PlatformBadge p={platform} /></td>
                      <td><span className="mono" style={{ fontSize:11 }}>{rest.join(':')}</span></td>
                      <td className="r"><PriceYes v={p.yes_bid} /></td>
                      <td className="r"><PriceAsk v={p.yes_ask} /></td>
                      <td className="r"><PriceYes v={p.last_price} /></td>
                      <td style={{ fontSize:11,color:'var(--muted)',whiteSpace:'nowrap' }}>{formatTs(p.timestamp)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    />
  )
}
