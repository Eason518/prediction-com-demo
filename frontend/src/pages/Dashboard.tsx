import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { Spinner, ErrorBox, formatRelative } from '../components'

function QuotaBar({ label, used, limit, warn = false }: { label: string; used: number; limit: number; warn?: boolean }) {
  const pct = Math.min((used / limit) * 100, 100)
  return (
    <>
      <span className="quota-label">{label}</span>
      <div className="quota-track">
        <div className={`quota-fill ${warn || pct > 80 ? 'warn' : 'ok'}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="quota-count">{used.toLocaleString()} / {limit.toLocaleString()}</span>
    </>
  )
}

export default function Dashboard() {
  const status = useQuery({ queryKey: ['status'], queryFn: api.status, refetchInterval: 60_000 })
  const rl = useQuery({ queryKey: ['rate-limit'], queryFn: api.rateLimit, refetchInterval: 60_000 })

  const platforms = status.data?.platforms ?? {}
  const entries = Object.entries(platforms)
  const okCount = entries.filter(([, v]) => v.status === 'ok').length
  const totalActive = entries.reduce((s, [, v]) => s + v.active_markets, 0)
  const totalLive = entries.reduce((s, [, v]) => s + v.live_markets, 0)

  return (
    <>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <span className="page-tag">GET /status · /rate-limit</span>
      </div>

      {/* Quota */}
      {rl.isLoading && <Spinner />}
      {rl.error && <ErrorBox message={String(rl.error)} />}
      {rl.data && (
        <div className="quota-row">
          <QuotaBar label="月配額" used={rl.data.month.used} limit={rl.data.month.limit} />
          <div className="quota-sep" />
          <QuotaBar
            label="matched-markets"
            used={rl.data.groups['matched-markets']?.used ?? 0}
            limit={rl.data.groups['matched-markets']?.limit ?? 10}
            warn
          />
          <div className="quota-sep" />
          <span className="quota-label text-muted mono" style={{ fontSize: 11 }}>
            {rl.data.tier.toUpperCase()} · {rl.data.second.limit} req/sec
          </span>
        </div>
      )}

      {/* Stat cards */}
      {status.isLoading && <Spinner />}
      {status.error && <ErrorBox message={String(status.error)} />}
      {status.data && (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-label">總活躍市場</div>
              <div className="stat-value">{totalActive.toLocaleString()}</div>
              <div className="stat-sub">across {entries.length} platforms</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">即時可交易</div>
              <div className="stat-value">{totalLive.toLocaleString()}</div>
              <div className="stat-sub">live markets now</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">平台狀態</div>
              <div className="stat-value">
                <span className="text-green">{okCount} ok</span>
                {' / '}
                <span className="text-orange">{entries.length - okCount} stale</span>
              </div>
              <div className="stat-sub">ingestion health</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">API overall</div>
              <div className="stat-value" style={{ textTransform: 'uppercase', fontSize: 18 }}>
                <span className={status.data.status === 'ok' ? 'text-green' : 'text-orange'}>
                  {status.data.status}
                </span>
              </div>
              <div className="stat-sub">prediction.com</div>
            </div>
          </div>

          {/* Platform grid */}
          <div className="section-title">Platform Ingestion Status</div>
          <div className="platform-grid">
            {entries.map(([name, p]) => (
              <div key={name} className="platform-card">
                <div className={`platform-dot ${p.status}`} />
                <div>
                  <div className="platform-name">{name}</div>
                  <div className="platform-meta">
                    {p.active_markets.toLocaleString()} active · {p.live_markets.toLocaleString()} live
                  </div>
                  <div className="platform-meta" style={{ marginTop: 2 }}>
                    updated {formatRelative(p.last_updated)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
