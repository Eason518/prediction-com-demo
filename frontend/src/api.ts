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
  status:        () => apiFetch<StatusResponse>('/api/status'),
  rateLimit:     () => apiFetch<RateLimitResponse>('/api/rate-limit'),
  markets:       (p: MarketsParams) => apiFetch<MarketsResponse>('/api/markets', p as any),
  events:        (p: EventsParams) => apiFetch<EventsResponse>('/api/events', p as any),
  search:        (q: string, limit = 10) => apiFetch<SearchResponse>('/api/search', { q, limit }),
  pricesBulk:    (ids: string) => apiFetch<PricesBulkResponse>('/api/prices/bulk', { ids }),
  kalshiMarkets: (p: KalshiMarketsParams) => apiFetch<KalshiMarketsResponse>('/api/kalshi/markets', p as any),
  kalshiMarket:  (ticker: string) => apiFetch<KalshiMarket>(`/api/kalshi/markets/${encodeURIComponent(ticker)}`),
  trades:        (p: TradesParams) => apiFetch<TradesResponse>('/api/trades', p as any),
  arb:           (limit?: number) => apiFetch<ArbResponse>('/api/arb', { limit }),
  ev:            (limit?: number) => apiFetch<EvResponse>('/api/ev', { limit }),
  smartMoney:    (p: AlertsParams) => apiFetch<AlertsResponse>('/api/alerts/smart-money', p as any),
  fadeFinder:    (p: AlertsParams) => apiFetch<AlertsResponse>('/api/alerts/fade-finder', p as any),
}

// ── Types ───────────────────────────────────────────────────────────────────────

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

// ── Kalshi ──────────────────────────────────────────────────────────────────────

export interface KalshiMarketsParams {
  status?: string
  category?: string
  event_ticker?: string
  series_ticker?: string
  tickers?: string
  limit?: number
  cursor?: string
}

export interface KalshiMarket {
  ticker: string
  event_ticker: string
  title: string
  status: string
  yes_bid_dollars: string
  yes_ask_dollars: string
  no_bid_dollars?: string
  no_ask_dollars?: string
  last_price_dollars: string
  volume_fp?: string
  open_interest_fp?: string
  liquidity_dollars?: string
  close_time: string
  open_time?: string
  category?: string
  rules_primary?: string
  rules_secondary?: string
  result: string
  tags?: string[]
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[]
  cursor?: string | null
  _meta: { count: number; source: string; category?: string; pages_scanned?: number }
}

// ── Trades ──────────────────────────────────────────────────────────────────────

export interface TradesParams {
  platform?: string
  market_id?: string
  limit?: number
  order?: string
  pagination_key?: string
}

export interface Trade {
  trade_id: string
  platform: string
  market_id: string
  token_id?: string
  side: string | null
  taker_side: string | null
  price: number
  shares: number
  amount_usd: number
  maker_addr: string | null
  taker_addr: string | null
  executed_at: string
  timestamp: number
}

export interface TradesResponse {
  trades: Trade[]
  pagination: { limit: number; count: number; has_more: boolean; pagination_key: string | null }
  _meta: { data_available_from: string; start_time: number; end_time: number; default_window_applied?: boolean }
}

// ── Arb ─────────────────────────────────────────────────────────────────────────

export interface ArbLeg {
  platform: string
  market_id: string
  side: string
  price: number
  fee_usd: number
  liquidity_usd: number
  source_url: string
}
export interface ArbOpportunity {
  group_id: number
  group_title: string
  event_type: string
  event_date: string | null
  detected_at: string
  roi_pct: number
  total_cost: number
  max_wager_usd: number
  legs: ArbLeg[]
}
export interface ArbResponse {
  as_of: string
  count: number
  delay_seconds: number
  opportunities: ArbOpportunity[]
}

// ── EV ──────────────────────────────────────────────────────────────────────────

export interface EvLeg {
  platform: string
  market_id: string
  side: string
  price: number
  roi_pct: number
  ev_usd_per_dollar: number
  source_url: string
}
export interface EvOpportunity {
  group_id: number
  group_title: string
  event_date: string | null
  detected_at: string
  consensus_probability: number
  legs: EvLeg[]
}
export interface EvResponse {
  as_of: string
  delay_seconds: number
  opportunities: EvOpportunity[]
}

// ── Alerts ───────────────────────────────────────────────────────────────────────

export interface AlertsParams {
  alert_type?: string
  limit?: number
  platform?: string
}
export interface Alert {
  id: number
  alert_type: string
  title: string
  description: string
  created_at: string
  platform_buy: string
  group_id: number
  event_id?: number
  market_slug?: string
  event_url?: string
  data: Record<string, unknown>
}
export interface AlertsResponse {
  alerts: Alert[]
  next_cursor?: string | null
}
