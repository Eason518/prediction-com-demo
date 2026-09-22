import { useState, type ReactNode } from 'react'
import JsonViewer from './JsonViewer'
import { Spinner, ErrorBox } from './ui'

export type RequestState = 'idle' | 'loading' | 'ok' | 'error'

interface ExplorerProps {
  method: 'GET' | 'WS'
  path: string
  desc: string
  // request panel content
  requestSlot: ReactNode
  // visual response content
  visualSlot: ReactNode | null
  // raw response data for JSON tab
  responseData: unknown
  responseState: RequestState
  responseMs?: number
  responseError?: string
  onRun: () => void
  runDisabled?: boolean
  locked?: { tier: string; what: string }
}

export default function ExplorerLayout({
  method, path, desc,
  requestSlot, visualSlot,
  responseData, responseState, responseMs, responseError,
  onRun, runDisabled, locked,
}: ExplorerProps) {
  const [tab, setTab] = useState<'visual' | 'json'>('visual')

  const methodClass = method === 'WS' ? 'm-ws' : 'm-get'

  return (
    <div className="explorer">
      {/* Endpoint header */}
      <div className="ep-header">
        <div className="ep-title">
          <span className={`ep-method ${methodClass}`}>{method}</span>
          <span className="ep-path">/api/v2{path}</span>
        </div>
        <div className="ep-desc">{desc}</div>
      </div>

      <div className="split">
        {/* REQUEST */}
        <div className="req-panel">
          <div className="pane-bar">
            <span className="pane-label">Request</span>
            {!locked && (
              <button
                className="run-btn"
                onClick={onRun}
                disabled={runDisabled || responseState === 'loading'}
              >
                {responseState === 'loading' ? '…' : '▶ Run'}
              </button>
            )}
          </div>

          {locked ? (
            <div className="locked-req">
              <div style={{ fontSize: 28 }}>🔒</div>
              <div className="locked-tier">需要 {locked.tier}</div>
              <div className="locked-what">{locked.what}</div>
              <a
                href="https://prediction.com/api/docs/pricing"
                target="_blank" rel="noreferrer"
                className="upgrade-btn"
              >
                查看升級方案 →
              </a>
            </div>
          ) : requestSlot}
        </div>

        {/* RESPONSE */}
        <div className="res-panel">
          <div className="res-bar">
            <span className="pane-label">Response</span>
            {responseState === 'ok' && (
              <>
                <span className="status-ok">200 OK</span>
                {responseMs != null && <span className="res-ms">{responseMs}ms</span>}
              </>
            )}
            {responseState === 'error' && <span className="status-err">Error</span>}
            {responseState === 'loading' && <Spinner />}
            {responseState === 'idle' && !locked && (
              <span className="res-hint">點 ▶ Run 發送請求</span>
            )}
            {!locked && responseState !== 'idle' && responseState !== 'loading' && (
              <div className="tab-bar">
                <button className={`tab-btn ${tab === 'visual' ? 'active' : ''}`} onClick={() => setTab('visual')}>Visual</button>
                <button className={`tab-btn ${tab === 'json' ? 'active' : ''}`} onClick={() => setTab('json')}>JSON</button>
              </div>
            )}
          </div>

          <div className="res-body">
            {responseState === 'idle' && !locked && (
              <div className="empty-state">
                <div className="empty-icon">📡</div>
                <div>填好參數後點 ▶ Run</div>
              </div>
            )}
            {locked && (
              <div className="empty-state">
                <div className="empty-icon">🔒</div>
                <div>{locked.tier} 才能使用此 API</div>
              </div>
            )}
            {responseState === 'loading' && (
              <div className="empty-state"><Spinner /></div>
            )}
            {responseState === 'error' && responseError && (
              <div style={{ padding: 16 }}><ErrorBox msg={responseError} /></div>
            )}
            {responseState === 'ok' && (
              <>
                {tab === 'visual' && (
                  <div className="visual-body">
                    {visualSlot ?? (
                      <div className="empty-state">
                        <div>無視覺化呈現，請切換 JSON</div>
                      </div>
                    )}
                  </div>
                )}
                {tab === 'json' && <JsonViewer data={responseData} />}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
