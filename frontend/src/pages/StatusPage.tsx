import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { StatusDot, relativeTime } from '../components/ui'
import { api } from '../api'
import type { StatusResponse } from '../api'

export default function StatusPage() {
  const [state, setState] = useState<RequestState>('idle')
  const [data, setData] = useState<StatusResponse | null>(null)
  const [ms, setMs] = useState<number>()
  const [err, setErr] = useState<string>()

  async function run() {
    setState('loading')
    const t = Date.now()
    try {
      const d = await api.status()
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) {
      setErr(String(e)); setState('error')
    }
  }

  const entries = data ? Object.entries(data.platforms) : []
  const okCount = entries.filter(([, v]) => v.status === 'ok').length
  const totalActive = entries.reduce((s, [, v]) => s + v.active_markets, 0)
  const totalLive   = entries.reduce((s, [, v]) => s + v.live_markets, 0)

  return (
    <ExplorerLayout
      method="GET" path="/status"
      desc="返回 API 整體狀態與各平台 ingestion 健康度。不需要 API Key。"
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/status</span>
          </div>
          <div className="header-section" style={{ marginTop: 12 }}>
            <div className="param-section-label">Notes</div>
            <p style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 }}>
              此 endpoint 不需要 Auth，無 Query Params。<br/>
              直接點 ▶ Run 即可。
            </p>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-label">Overall</div>
              <div className="stat-val text-green">{data.status.toUpperCase()}</div>
              <div className="stat-sub">{entries.length} platforms</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Platform Health</div>
              <div className="stat-val">
                <span className="text-green">{okCount}</span>
                <span className="text-muted" style={{ fontSize: 14 }}> ok / </span>
                <span className="text-orange">{entries.length - okCount}</span>
                <span className="text-muted" style={{ fontSize: 14 }}> stale</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Active Markets</div>
              <div className="stat-val">{totalActive.toLocaleString()}</div>
              <div className="stat-sub">across all platforms</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Live Markets</div>
              <div className="stat-val">{totalLive.toLocaleString()}</div>
              <div className="stat-sub">tradeable right now</div>
            </div>
          </div>

          <div className="section-sep">Platform Details</div>
          <div className="platform-grid">
            {entries.map(([name, p]) => (
              <div key={name} className="pf-card">
                <div className="pf-top">
                  <StatusDot status={p.status} />
                  <span className="pf-name">{name}</span>
                  <span className={`pf-badge ${p.status}`}>{p.status}</span>
                </div>
                <div className="pf-stats">
                  <span className="pf-stat">活躍 <strong>{p.active_markets.toLocaleString()}</strong></span>
                  <span className="pf-stat">即時 <strong>{p.live_markets.toLocaleString()}</strong></span>
                </div>
                <div className="pf-updated">更新 {relativeTime(p.last_updated)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    />
  )
}
