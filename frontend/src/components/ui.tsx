export function PlatformBadge({ p }: { p: string }) {
  return <span className={`pb pb-${p}`}>{p}</span>
}

export function PriceYes({ v }: { v?: number | null }) {
  if (v == null) return <span className="price-null">—</span>
  return <span className="price-yes">{v.toFixed(1)}¢</span>
}

export function PriceAsk({ v }: { v?: number | null }) {
  if (v == null) return <span className="price-null">—</span>
  return <span className="price-ask">{v.toFixed(1)}¢</span>
}

export function Spinner() {
  return <div className="spinner" />
}

export function ErrorBox({ msg }: { msg: string }) {
  return <div className="error-box">⚠ {msg}</div>
}

export function formatDate(iso?: string | null) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('zh-TW') } catch { return iso }
}

export function formatTs(iso: string) {
  try { return new Date(iso).toLocaleString('zh-TW') } catch { return iso }
}

export function relativeTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return '剛剛'
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  return `${Math.floor(h / 24)} 天前`
}

export function StatusDot({ status }: { status: string }) {
  const ok = status === 'ok'
  return (
    <span
      style={{
        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
        background: ok ? 'var(--green)' : 'var(--orange)',
        boxShadow: ok ? '0 0 6px #3fb95055' : 'none',
        flexShrink: 0,
      }}
    />
  )
}
