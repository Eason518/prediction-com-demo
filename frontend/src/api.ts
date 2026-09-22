const BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

async function apiFetch<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(`${BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    })
  }
  const res = await fetch(url.toString())
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  status: () => apiFetch<StatusResponse>('/api/status'),
  rateLimit: () => apiFetch<RateLimitResponse>('/api/rate-limit'),
  markets: (p: MarketsParams) => apiFetch<MarketsResponse>('/api/markets', p as any),
  events: (p: EventsParams) => apiFetch<EventsResponse>('/api/events', p as any),
  search: (q: string, limit = 10) => apiFetch<SearchResponse>('/api/search', { q, limit }),
  pricesBulk: (ids: string) => apiFetch<PricesBulkResponse>('/api/prices/bulk', { ids }),
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PlatformStatus {
  active_markets: number
  live_markets: number
  last_updated: string
  status: 'ok' | 'stale'
}
export interface StatusResponse {
  status: string
  platforms: Record<string, PlatformStatus>
}

export interface QuotaEntry { limit: number; used: number; remaining: number; reset: number }
export interface RateLimitResponse {
  success: boolean
  tier: string
  second: { limit: number }
  month: QuotaEntry
  groups: Record<string, QuotaEntry>
}

export interface MarketPrice {
  yes_bid: number | null
  yes_ask: number | null
  last_price: number | null
  no_bid?: number | null
  no_ask?: number | null
  volume: number | null
  liquidity: number | null
}
export interface Market {
  id: number
  market_id: string
  platform: string
  category: string
  event_title: string
  title: string
  subtitle: string | null
  status: string
  expiration_date: string | null
  source_url: string
  price: MarketPrice
}
export interface MarketsResponse {
  as_of: string
  markets: Market[]
  next_cursor?: string
  total?: number
}
export interface MarketsParams {
  platform?: string
  status?: string
  category?: string
  q?: string
  limit?: number
  cursor?: string
}

export interface EventGroup {
  group_id: number
  title: string
  platform_count: number
  platforms: string[]
  market_class: string | null
  market_type: string | null
  markets?: GroupMarket[]
}
export interface GroupMarket {
  market_id: string
  platform: string
  yes_bid?: number | null
  yes_ask?: number | null
  last_price?: number | null
  source_url: string
}
export interface PredictionEvent {
  event_name: string
  event_type: string
  event_date: string | null
  group_count?: number
  groups: EventGroup[]
}
export interface EventsResponse { events: PredictionEvent[]; next_cursor?: string }
export interface EventsParams {
  event_type?: string
  status?: string
  q?: string
  include_groups?: boolean
  limit?: number
  cursor?: string
}

export interface SearchResponse { count: number; events: PredictionEvent[] }

export interface BulkPrice {
  last_price: number | null
  yes_bid: number | null
  yes_ask: number | null
  timestamp: string
}
export interface PricesBulkResponse {
  _meta: { requested: number; resolved: number; unresolved_ids: string[] }
  prices: Record<string, BulkPrice>
}
