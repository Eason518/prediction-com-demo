import { useState } from 'react'
import ExplorerLayout, { type RequestState } from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'
import { api } from '../api'
import type { AlertsResponse, Alert } from '../api'

const PLATFORMS = ['', 'polymarket', 'kalshi', 'predictit', 'prophetx', 'opinion', 'predictfun']

function AlertCard({ alert }: { alert: Alert }) {
  const [open, setOpen] = useState(false)
  const data = alert.data as any
  const isSmartMoney = alert.alert_type.includes('smart_money') || alert.alert_type.includes('whale')
  const accentColor = isSmartMoney ? 'var(--blue)' : 'var(--purple)'
  const accentBg    = isSmartMoney ? 'var(--blue-bg)' : 'var(--purple-bg)'

  return (
    <div style={{ background: 'var(--s1)', border: `1px solid var(--b1)`, borderLeft: `3px solid ${accentColor}`, borderRadius: 'var(--r)', marginBottom: 6, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: accentBg, color: accentColor, border: `1px solid ${accentColor}44` }}>
              {alert.alert_type}
            </span>
            <PlatformBadge p={alert.platform_buy} />
          </div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{alert.title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{alert.description}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--dim)' }}>
            {new Date(alert.created_at).toLocaleString('zh-TW')}
          </div>
          {data?.pnl_to_date != null && (
            <div style={{ fontSize: 11, fontWeight: 700, color: data.pnl_to_date >= 0 ? 'var(--green)' : 'var(--red)', marginTop: 3 }}>
              PnL ${(data.pnl_to_date / 1000).toFixed(1)}K
            </div>
          )}
        </div>
        <span style={{ color: 'var(--dim)', fontSize: 12, marginTop: 2 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--b1)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: 5 }}>
          {data?.amount != null && <div style={{ fontSize: 11 }}><span className="text-muted">Amount: </span>${(data.amount as number).toFixed(2)}</div>}
          {data?.price != null && <div style={{ fontSize: 11 }}><span className="text-muted">Price: </span>{((data.price as number) * 100).toFixed(1)}¢</div>}
          {data?.outcome && <div style={{ fontSize: 11 }}><span className="text-muted">Outcome: </span>{data.outcome as string}</div>}
          {data?.userAddr && <div style={{ fontSize: 11 }}><span className="text-muted">Wallet: </span><span className="mono" style={{ fontSize: 10 }}>{data.userAddr as string}</span></div>}
          {alert.event_url && (
            <a href={alert.event_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 11 }}>
              View market ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  endpoint: 'smart-money' | 'fade-finder'
}

export default function AlertsPage({ endpoint }: Props) {
  const isSmartMoney = endpoint === 'smart-money'
  const [alertType, setAlertType] = useState('all')
  const [platform, setPlatform]   = useState('')
  const [limit, setLimit]         = useState('20')

  const [state, setState] = useState<RequestState>('idle')
  const [data, setData]   = useState<AlertsResponse | null>(null)
  const [ms, setMs]       = useState<number>()
  const [err, setErr]     = useState<string>()

  const qs = new URLSearchParams({ alert_type: alertType, limit })
  if (platform) qs.set('platform', platform)

  async function run() {
    setState('loading'); setErr(undefined)
    const t = Date.now()
    try {
      const params = { alert_type: alertType, limit: Number(limit), platform: platform || undefined }
      const d = isSmartMoney ? await api.smartMoney(params) : await api.fadeFinder(params)
      setData(d); setMs(Date.now() - t); setState('ok')
    } catch (e) { setErr(String(e)); setState('error') }
  }

  const SMART_MONEY_TYPES = ['all', 'smart_money', 'insider', 'captain_hook']
  const FADE_TYPES        = ['all', 'fade']
  const alertTypes        = isSmartMoney ? SMART_MONEY_TYPES : FADE_TYPES

  return (
    <ExplorerLayout
      method="GET"
      path={`/alerts/${endpoint}`}
      desc={isSmartMoney
        ? '大單鯨魚買賣信號。追蹤 Polymarket 高 PnL 錢包的大額交易，含 whale、insider、captain_hook 三種子類型。'
        : 'Fade-the-whale 信號。歷史上大錢常往錯誤方向移動的市場，顯示反向操作機會。'}
      onRun={run}
      responseState={state} responseData={data} responseMs={ms} responseError={err}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">https://</span>
            <span className="url-host">prediction.com</span>
            <span className="url-path">/api/v2/alerts/{endpoint}</span>
            <span className="url-scheme">?</span>
            <span className="url-qs">{qs.toString()}</span>
          </div>
          <div className="param-section">
            <div className="param-section-label">Query Params</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">alert_type</span></div>
              <select className="param-input" value={alertType} onChange={e => setAlertType(e.target.value)}>
                {alertTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">platform</span></div>
              <select className="param-input" value={platform} onChange={e => setPlatform(e.target.value)}>
                {PLATFORMS.map(p => <option key={p} value={p}>{p || '— (all)'}</option>)}
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">limit</span></div>
              <input className="param-input" style={{ width: 70, flex: 'none' }} value={limit} onChange={e => setLimit(e.target.value)} />
              <span style={{ fontSize: 10, color: 'var(--dim)', paddingTop: 5 }}>1–100</span>
            </div>
          </div>
          <div className="header-section">
            <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 8 }}>
              計入 <strong>{isSmartMoney ? 'smart-money' : 'fade-finder'}</strong> 獨立配額（Pro = 5,000/月）。
            </div>
            <div className="param-section-label">Headers</div>
            <div className="header-row"><span className="header-k">X-API-Key</span><span className="header-v">pmx_***Q9Y</span></div>
          </div>
        </>
      }
      visualSlot={data && (
        <>
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
            <strong style={{ color: 'var(--text)' }}>{data.alerts.length}</strong> 筆 alerts
            {data.next_cursor && <span style={{ color: 'var(--orange)', marginLeft: 8 }}>· 有更多</span>}
          </div>
          {data.alerts.map(a => <AlertCard key={a.id} alert={a} />)}
          {data.alerts.length === 0 && <div className="empty-state">無符合 alerts</div>}
        </>
      )}
    />
  )
}
