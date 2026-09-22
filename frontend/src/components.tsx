// Shared small components

export function Spinner() {
  return <div className="spinner" />
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="error-box">⚠️ {message}</div>
}

export function PlatformBadge({ platform }: { platform: string }) {
  return <span className={`pb pb-${platform}`}>{platform}</span>
}

export function PriceCell({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="price-null">—</span>
  return <span className="price-yes">{value.toFixed(1)}¢</span>
}

export function PriceAsk({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="price-null">—</span>
  return <span className="price-ask">{value.toFixed(1)}¢</span>
}

export function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return '剛更新'
  if (m < 60) return `${m} 分鐘前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小時前`
  return `${Math.floor(h / 24)} 天前`
}
