import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { api } from '../api'
import type { RateLimitResponse } from '../api'

export default function RateLimitPage() {
  const [state, setState] = useState<RequestState>('idle')
  const [data, setData] = useState<RateLimitResponse | null>(null)
  const [ms, setMs] = useState<number>()
  const [err, setErr] = useState<string>()

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.rateLimit()
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  function fillColor(pct: number) {
    if (pct > 90) return 'fill-red'
    if (pct > 70) return 'fill-orange'
    return 'fill-green'
  }

  const monthPct = data ? (data.month.used / data.month.limit) * 100 : 0
  const mmq = data?.groups['matched-markets']
  const mmPct = mmq ? (mmq.used / mmq.limit) * 100 : 0

  const tiers = ['free', 'dev', 'pro', 'enterprise']

  return (
    <ExplorerLayout
      method="GET" path="/rate-limit"
      desc="查詢當前 API Key 的配額使用狀況。此請求本身不計入月配額。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/rate-limit</span>
          </div>
          <div className="header-section" style={{ marginTop: 12 }}>
            <div className="param-section-label">Headers</div>
            <div className="header-row">
              <span className="header-k">X-API-Key</span>
              <span className="header-v">pmx_***Xs0</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>
              無 Query Params。此 endpoint 不消耗月配額，可安全輪詢。
            </div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          {/* Tier */}
          <div className="quota-card">
            <div className="param-section-label">API Tier</div>
            <div className="tier-row">
              {tiers.map(t => (
                <div key={t} className={`tier-chip ${data.tier === t ? 'active' : ''}`}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                  {data.tier === t ? ' ✓' : ''}
                </div>
              ))}
            </div>
          </div>

          {/* Month quota */}
          <div className="quota-card">
            <div className="param-section-label">月配額 (month)</div>
            <div className="quota-row2">
              <div className="quota-info">
                <div className="quota-name">Total Requests / Month</div>
                <div className="quota-sub">
                  {data.second.limit} req/sec · 重置 {new Date(data.month.reset * 1000).toLocaleDateString('zh-TW')}
                </div>
              </div>
              <div className="quota-track" style={{ maxWidth: 180 }}>
                <div className={`quota-fill ${fillColor(monthPct)}`} style={{ width: `${monthPct}%` }} />
              </div>
              <div className="quota-nums">
                <span style={{ color: monthPct > 70 ? 'var(--orange)' : 'var(--green)' }}>
                  {data.month.used.toLocaleString()}
                </span>
                {' / '}
                {data.month.limit.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Sub quotas */}
          {mmq && (
            <div className="quota-card">
              <div className="param-section-label">matched-markets 獨立配額</div>
              <div className="quota-row2">
                <div className="quota-info">
                  <div className="quota-name">matched-markets / Month</div>
                  <div className="quota-sub">/events · /matching-markets 計入此 quota</div>
                </div>
                <div className="quota-track" style={{ maxWidth: 180 }}>
                  <div className={`quota-fill ${fillColor(mmPct)}`} style={{ width: `${mmPct}%` }} />
                </div>
                <div className="quota-nums">
                  <span style={{ color: mmPct > 70 ? 'var(--orange)' : 'var(--green)' }}>
                    {mmq.used}
                  </span>
                  {' / '}
                  {mmq.limit}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    />
  )
}
