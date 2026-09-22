import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Spinner, ErrorBox, PlatformBadge } from '../components'

const EXAMPLES = [
  'polymarket:573656,kalshi:KXBTCMINY-27JAN01-50000.00',
  'polymarket:573654',
]

export default function PriceBulk() {
  const [input, setInput] = useState(EXAMPLES[0])
  const [ids, setIds] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['prices-bulk', ids],
    queryFn: () => api.pricesBulk(ids),
    enabled: ids.length > 0,
  })

  return (
    <>
      <div className="page-header">
        <div className="page-title">Price Bulk Snapshot</div>
        <span className="page-tag">GET /prices/bulk</span>
      </div>

      <div className="card">
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            輸入 <span className="mono" style={{ color: 'var(--blue)' }}>platform:market_id</span> 逗號分隔，批次查詢最新快照價格
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            rows={3}
            style={{
              background: 'var(--bg)', border: '1px solid var(--border2)', borderRadius: 5,
              padding: '8px 12px', color: 'var(--text)', fontSize: 12, fontFamily: 'monospace',
              resize: 'vertical', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="pill active" style={{ padding: '5px 16px' }} onClick={() => setIds(input)}>查詢</button>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>範例：</span>
            {EXAMPLES.map(ex => (
              <button key={ex} className="pill" style={{ fontSize: 10 }} onClick={() => setInput(ex)}>
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading && <Spinner />}
      {error && <ErrorBox message={String(error)} />}

      {data && (
        <>
          <div className="section-title">
            已解析 {data._meta.resolved} / {data._meta.requested} 筆
            {data._meta.unresolved_ids.length > 0 && (
              <span style={{ color: 'var(--orange)', marginLeft: 8 }}>
                ⚠ 未找到：{data._meta.unresolved_ids.join(', ')}
              </span>
            )}
          </div>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Market ID</th>
                  <th className="right">Yes Bid</th>
                  <th className="right">Yes Ask</th>
                  <th className="right">Last Price</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.prices).map(([key, p]) => {
                  const [platform, ...rest] = key.split(':')
                  const marketId = rest.join(':')
                  return (
                    <tr key={key}>
                      <td><PlatformBadge platform={platform} /></td>
                      <td><span className="mono" style={{ fontSize: 11 }}>{marketId}</span></td>
                      <td className="right">
                        {p.yes_bid != null ? <span className="price-yes">{p.yes_bid.toFixed(1)}¢</span> : <span className="price-null">—</span>}
                      </td>
                      <td className="right">
                        {p.yes_ask != null ? <span className="price-ask">{p.yes_ask.toFixed(1)}¢</span> : <span className="price-null">—</span>}
                      </td>
                      <td className="right">
                        {p.last_price != null ? <span className="price-yes">{p.last_price.toFixed(1)}¢</span> : <span className="price-null">—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(p.timestamp).toLocaleString('zh-TW')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!ids && <div className="empty-state">輸入 market IDs 後點查詢</div>}
    </>
  )
}
