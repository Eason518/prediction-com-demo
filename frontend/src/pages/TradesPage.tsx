import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'
import { api } from '../api'
import type { TradesResponse } from '../api'

function shortAddr(addr: string | null) {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function TradesPage() {
  const [platform, setPlatform] = useState('')
  const [marketId, setMarketId] = useState('')
  const [limit, setLimit]       = useState('20')
  const [order, setOrder]       = useState('desc')

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<TradesResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()
  const [nextKey, setNextKey] = useState<string | null>(null)

  const qs = new URLSearchParams()
  if (platform) qs.set('platform', platform)
  if (marketId) qs.set('market_id', marketId)
  qs.set('limit', limit)
  qs.set('order', order)

  async function run(paginationKey?: string) {
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      const d = await api.trades({
        platform: platform || undefined,
        market_id: marketId || undefined,
        limit: Number(limit),
        order,
        pagination_key: paginationKey,
      })
      setData(d)
      setNextKey(d.pagination.pagination_key)
      setMs(Date.now() - t)
      setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  return (
    <ExplorerLayout
      method="GET" path="/trades"
      desc="統一跨平台成交紀錄（Polymarket + Kalshi）。可依 platform、market_id 過濾，支援 cursor 分頁。"
      onRun={() => run()}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/trades</span>
            {qs.toString() && <><span className="url-scheme">?</span><span className="url-qs">{qs.toString()}</span></>}
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">platform</span></div>
              <select className="param-input" value={platform} onChange={e => setPlatform(e.target.value)}>
                <option value="">— (all)</option>
                <option value="polymarket">polymarket</option>
                <option value="kalshi">kalshi</option>
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">market_id</span></div>
              <input className="param-input" placeholder="condition_id 或 ticker" value={marketId} onChange={e => setMarketId(e.target.value)} />
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">order</span></div>
              <select className="param-input" value={order} onChange={e => setOrder(e.target.value)}>
                <option value="desc">desc（最新優先）</option>
                <option value="asc">asc（最舊優先）</option>
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–500</span>
            </div>
          </div>
          <div className="header-section">
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8 }}>
              資料起始：2026-05-19。Polymarket wallet 欄位僅 Polymarket 有。
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Xs0</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          {/* Meta info */}
          <div style={{ background: 'var(--s1)', border: '1px solid var(--b1)', borderRadius: 'var(--r)', padding: '10px 14px', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              本頁 <strong style={{ color: 'var(--text)' }}>{data.pagination.count}</strong> 筆
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              有更多 <strong style={{ color: data.pagination.has_more ? 'var(--orange)' : 'var(--green)' }}>
                {data.pagination.has_more ? 'Yes' : 'No'}
              </strong>
            </span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              資料起始 {new Date(data._meta.data_available_from).toLocaleDateString('zh-TW')}
            </span>
          </div>

          {/* Table */}
          <div className="vis-table">
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Time</th>
                  <th>Side</th>
                  <th className="r">Price</th>
                  <th className="r">Shares</th>
                  <th className="r">USD</th>
                  <th>Maker</th>
                  <th>Taker</th>
                </tr>
              </thead>
              <tbody>
                {data.trades.map(tr => (
                  <tr key={tr.trade_id}>
                    <td><PlatformBadge p={tr.platform} /></td>
                    <td style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {new Date(tr.executed_at).toLocaleString('zh-TW')}
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 4,
                        background: tr.side === 'yes' ? 'var(--green-bg)' : tr.side === 'no' ? 'var(--red-bg)' : 'var(--s2)',
                        color: tr.side === 'yes' ? 'var(--green)' : tr.side === 'no' ? 'var(--red)' : 'var(--muted)',
                      }}>
                        {tr.side ?? '—'}
                        {tr.taker_side ? ` / ${tr.taker_side}` : ''}
                      </span>
                    </td>
                    <td className="r" style={{ fontWeight: 600, color: 'var(--text)' }}>
                      {(tr.price * 100).toFixed(1)}¢
                    </td>
                    <td className="r" style={{ color: 'var(--muted)', fontSize: 11 }}>
                      {tr.shares.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="r" style={{ color: 'var(--green)', fontWeight: 600 }}>
                      ${tr.amount_usd.toFixed(2)}
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>{shortAddr(tr.maker_addr)}</td>
                    <td style={{ fontSize: 10, color: 'var(--dim)', fontFamily: 'monospace' }}>{shortAddr(tr.taker_addr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextKey && (
              <button className="load-more-btn" onClick={() => run(nextKey)}
                style={{ borderRadius: '0 0 var(--r) var(--r)', padding: 10, width: '100%', background: 'var(--s2)', border: 'none', borderTop: '1px solid var(--b1)', color: 'var(--muted)', cursor: 'pointer', fontSize: 12 }}>
                載入下一頁
              </button>
            )}
          </div>
        </>
      )}
    />
  )
}
