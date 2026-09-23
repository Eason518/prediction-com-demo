import { useState, useEffect, useRef, useCallback } from 'react'
import ExplorerLayout from '../components/ExplorerLayout'
import { PlatformBadge } from '../components/ui'

const WS_URL = `${import.meta.env.VITE_API_BASE?.replace('http', 'ws') ?? 'ws://localhost:8000'}/ws`

const CHANNELS = ['prices', 'smart_money', 'fade_finder', 'arb', 'ev', 'orderbook', 'lifecycle']

interface WsMessage {
  id: number
  ts: string
  raw: unknown
  channel?: string
  type?: string
}

let msgId = 0

export default function LiveFeedPage() {
  const [channel, setChannel]     = useState('prices')
  const [marketIds, setMarketIds] = useState('573656')
  const [connected, setConnected] = useState(false)
  const [messages, setMessages]   = useState<WsMessage[]>([])
  const [status, setStatus]       = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [autoScroll, setAutoScroll] = useState(true)

  const wsRef     = useRef<WebSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, autoScroll])

  const connect = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
    setStatus('connecting')
    setMessages([])

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      setStatus('connected')
      // Subscribe
      const ids = marketIds.split(',').map(s => s.trim()).filter(Boolean)
      ws.send(JSON.stringify({ action: 'subscribe', channel, market_ids: ids }))
    }

    ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data)
        setMessages(prev => [...prev.slice(-199), {
          id: ++msgId,
          ts: new Date().toLocaleTimeString('zh-TW'),
          raw: parsed,
          channel: parsed.channel,
          type: parsed.type,
        }])
      } catch {
        setMessages(prev => [...prev.slice(-199), { id: ++msgId, ts: new Date().toLocaleTimeString('zh-TW'), raw: e.data }])
      }
    }

    ws.onerror = () => {
      setStatus('error')
      setConnected(false)
    }

    ws.onclose = () => {
      setConnected(false)
      setStatus(prev => prev === 'connected' ? 'idle' : prev)
    }
  }, [channel, marketIds])

  const disconnect = useCallback(() => {
    wsRef.current?.close()
    wsRef.current = null
    setConnected(false)
    setStatus('idle')
  }, [])

  useEffect(() => () => { wsRef.current?.close() }, [])

  // Fake "request" state for ExplorerLayout
  const reqState: 'idle' | 'loading' | 'ok' | 'error' =
    status === 'idle' ? 'idle' :
    status === 'connecting' ? 'loading' :
    status === 'error' ? 'error' : 'ok'

  function typeColor(type?: string) {
    if (!type) return 'var(--dim)'
    if (type === 'subscribed') return 'var(--green)'
    if (type === 'error') return 'var(--red)'
    if (type === 'price_update') return 'var(--blue)'
    if (type?.includes('alert')) return 'var(--orange)'
    return 'var(--muted)'
  }

  return (
    <ExplorerLayout
      method="WS" path="/ws (proxy)"
      desc="即時 WebSocket 串流。Backend 代理連線至 wss://ws.predictionhunt.com，API key 不外露。支援所有 Pro channels。"
      onRun={connected ? disconnect : connect}
      runDisabled={false}
      responseState={reqState}
      responseData={messages.map(m => m.raw)}
      responseMs={undefined}
      requestSlot={
        <>
          <div className="url-preview">
            <span className="url-scheme">ws://</span>
            <span className="url-host">localhost:8000</span>
            <span className="url-path">/ws</span>
            <span style={{ color: 'var(--dim)', fontSize: 10 }}> → wss://ws.predictionhunt.com</span>
          </div>

          {/* Subscribe config */}
          <div className="param-section">
            <div className="param-section-label">Subscribe 設定</div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">channel</span></div>
              <select className="param-input" value={channel} onChange={e => setChannel(e.target.value)} disabled={connected}>
                {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="param-row">
              <div className="param-key-col"><span className="param-key">market_ids</span></div>
              <input className="param-input" value={marketIds} onChange={e => setMarketIds(e.target.value)}
                disabled={connected} placeholder="573656,12345" style={{ fontFamily: 'monospace', fontSize: 11 }} />
            </div>
          </div>

          {/* Subscribe message preview */}
          <div style={{ margin: '0 14px 12px', background: 'var(--bg)', border: '1px solid var(--b2)', borderRadius: 5, padding: '8px 10px', fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ color: 'var(--dim)', fontSize: 10, marginBottom: 4 }}>Send (on connect)</div>
            <span className="jk">{JSON.stringify({
              action: 'subscribe',
              channel,
              market_ids: marketIds.split(',').map(s => s.trim()).filter(Boolean)
            }, null, 2)}</span>
          </div>

          {/* Status */}
          <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--green)' : status === 'connecting' ? 'var(--orange)' : 'var(--dim)',
              boxShadow: connected ? '0 0 6px var(--green)' : 'none',
            }} />
            <span style={{ fontSize: 11, color: connected ? 'var(--green)' : 'var(--muted)' }}>
              {status === 'idle' ? '未連線' : status === 'connecting' ? '連線中…' : status === 'connected' ? '已連線' : '連線失敗'}
            </span>
          </div>

          <div style={{ padding: '0 14px 14px' }}>
            <button
              onClick={connected ? disconnect : connect}
              style={{
                width: '100%', padding: '8px 0', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 12,
                background: connected ? 'var(--red-bg)' : 'var(--blue)', color: connected ? 'var(--red)' : '#fff',
                border: connected ? '1px solid var(--red)' : 'none',
              }}>
              {connected ? '■ Disconnect' : '▶ Connect'}
            </button>
          </div>
        </>
      }
      visualSlot={
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 6 }}>
          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              {messages.length} 筆訊息（最多保留 200）
            </span>
            <label style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', marginLeft: 'auto' }}>
              <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
              自動捲動
            </label>
            <button onClick={() => setMessages([])}
              style={{ fontSize: 11, background: 'var(--s2)', border: '1px solid var(--b2)', borderRadius: 4, padding: '2px 10px', color: 'var(--muted)', cursor: 'pointer' }}>
              清除
            </button>
          </div>

          {/* Message stream */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {messages.length === 0 && (
              <div className="empty-state" style={{ marginTop: 40 }}>
                {connected ? '等待訊息…' : '連線後開始串流'}
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', padding: '5px 2px', borderBottom: '1px solid var(--b1)22' }}>
                <span style={{ fontSize: 10, color: 'var(--dim)', flexShrink: 0, paddingTop: 2 }}>{m.ts}</span>
                <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--s2)', color: typeColor(m.type), flexShrink: 0 }}>
                  {m.type ?? 'msg'}
                </span>
                {m.channel && <PlatformBadge p={m.channel} />}
                <span style={{ fontSize: 11, color: 'var(--text)', fontFamily: 'monospace', wordBreak: 'break-all', flex: 1 }}>
                  {typeof m.raw === 'string' ? m.raw : JSON.stringify(m.raw)}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      }
    />
  )
}
