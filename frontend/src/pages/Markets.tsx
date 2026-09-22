import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import type { Market } from '../api'
import { Spinner, ErrorBox, PlatformBadge, PriceCell, PriceAsk, formatDate } from '../components'

const CATEGORIES = ['all', 'crypto', 'politics', 'sports', 'entertainment', 'science']
const PLATFORMS = ['all', 'polymarket', 'kalshi', 'polymarket_us', 'predictit', 'prophetx', 'opinion', 'predictfun', 'novig']

export default function Markets() {
  const [category, setCategory] = useState('')
  const [platform, setPlatform] = useState('')
  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState<string | undefined>()
  const [allMarkets, setAllMarkets] = useState<Market[]>([])

  const params = { category: category || undefined, platform: platform || undefined, q: q || undefined, limit: 50, cursor }
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['markets', category, platform, q, cursor],
    queryFn: () => api.markets(params),
    placeholderData: (prev) => prev,
  })

  // accumulate pages
  const markets = cursor ? [...allMarkets, ...(data?.markets ?? [])] : (data?.markets ?? [])

  function applyFilter() {
    setCursor(undefined)
    setAllMarkets([])
  }

  function loadMore() {
    if (data?.next_cursor) {
      setAllMarkets(markets)
      setCursor(data.next_cursor)
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-title">Markets</div>
        <span className="page-tag">GET /markets</span>
        {data?.total != null && <span className="text-muted" style={{ fontSize: 11 }}>{data.total.toLocaleString()} 筆</span>}
      </div>

      <div className="data-table">
        <div className="table-controls">
          <span className="table-title">Markets</span>
          {CATEGORIES.map(c => (
            <button key={c} className={`pill ${category === (c === 'all' ? '' : c) ? 'active' : ''}`}
              onClick={() => { setCategory(c === 'all' ? '' : c); applyFilter() }}>
              {c}
            </button>
          ))}
          <select className="search-input" style={{ width: 120 }} value={platform}
            onChange={e => { setPlatform(e.target.value === 'all' ? '' : e.target.value); applyFilter() }}>
            {PLATFORMS.map(p => <option key={p} value={p === 'all' ? '' : p}>{p}</option>)}
          </select>
          <input className="search-input" placeholder="🔍 關鍵字…" value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilter()} />
          <button className="pill" onClick={applyFilter}>搜尋</button>
        </div>

        {(isLoading || isFetching) && <div style={{ padding: 16 }}><Spinner /></div>}
        {error && <div style={{ padding: 14 }}><ErrorBox message={String(error)} /></div>}

        {markets.length > 0 && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Event</th>
                  <th>Market</th>
                  <th>Status</th>
                  <th className="right">Bid</th>
                  <th className="right">Ask</th>
                  <th className="right">Last</th>
                  <th className="right">Volume</th>
                  <th>Expires</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {markets.map(m => (
                  <tr key={m.id}>
                    <td><PlatformBadge platform={m.platform} /></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={m.event_title}>
                      {m.event_title}
                    </td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={m.title}>
                      {m.title}
                    </td>
                    <td>
                      <span style={{ color: m.status === 'active' ? 'var(--green)' : 'var(--text-dim)', fontSize: 11 }}>
                        ● {m.status}
                      </span>
                    </td>
                    <td className="right"><PriceCell value={m.price.yes_bid} /></td>
                    <td className="right"><PriceAsk value={m.price.yes_ask} /></td>
                    <td className="right"><PriceCell value={m.price.last_price} /></td>
                    <td className="right" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      {m.price.volume != null ? m.price.volume.toLocaleString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                      {formatDate(m.expiration_date)}
                    </td>
                    <td>
                      <a href={m.source_url} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--blue)', fontSize: 11, textDecoration: 'none' }}>↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data?.next_cursor && (
              <button className="load-more-btn" onClick={loadMore} disabled={isFetching}>
                {isFetching ? '載入中…' : '載入更多'}
              </button>
            )}
          </>
        )}

        {!isLoading && markets.length === 0 && (
          <div className="empty-state">沒有符合條件的市場</div>
        )}
      </div>
    </>
  )
}
