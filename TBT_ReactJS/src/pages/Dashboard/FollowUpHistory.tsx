import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import usePusherClient from '@/hooks/usePusherClient'
import {
  mapRawToQueueItem,
  isAllowedFollowUpItem,
  isIgnoredItem,
  type TicketQueueItem,
} from './Overview/TicketQueue'
import { getStatusClass } from '@/lib/statusUtils'

const CATEGORY_STYLE: Record<string, string> = {
  'Ticket Created': 'bg-success-100 text-success-700',
  'Public Comment': 'bg-primary-100 text-primary-700',
}

const categoryStyle = (cat: string) =>
  CATEGORY_STYLE[cat] || 'bg-surface-secondary text-textColor-muted'

const formatDateParts = (dateStr: string | undefined): { date: string; time: string } | null => {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}

type DateFilter = 'today' | 'week' | 'all'
const PAGE_SIZE = 20

const fmtDate = (d: Date) => d.toISOString().slice(0, 10)

const todayRange = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { start, end }
}

const weekStart = () => {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d
}

export default function FollowUpHistory() {
  const navigate = useNavigate()
  const [items, setItems] = useState<TicketQueueItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  // Pagination (server-side for week/all)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const { subscribe } = usePusherClient({ autoConnect: true })

  const isPaginated = dateFilter === 'week' || dateFilter === 'all'

  const buildParams = useCallback((p = 1) => {
    const params: Record<string, any> = {
      status: 'all',
      onlyFollowUp: 'true',
    }
    if (categoryFilter) {
      params.category = categoryFilter
    }
    if (isPaginated) {
      params.limit = PAGE_SIZE
      params.page = p
      if (dateFilter === 'week') params.startDate = fmtDate(weekStart())
    } else {
      // today: fetch all server-side with date filter, no pagination
      const { start, end } = todayRange()
      params.startDate = fmtDate(start)
      params.endDate = fmtDate(end)
      params.limit = 500
    }
    return params
  }, [dateFilter, isPaginated, categoryFilter])

  const fetchPage = useCallback(async (p: number, silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await api.get('/realtime/queue', { params: buildParams(p) })
      const rawList = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
      const meta = res?.data?.meta
      const mapped: TicketQueueItem[] = Array.isArray(rawList)
        ? rawList
            .map((r: any) => {
              const item = mapRawToQueueItem(r, false)
              const rep = r.Ticket?.reporter
              const cust = r.Ticket?.Customer
              item.reporterName = rep
                ? [rep.first_name, rep.last_name].filter(Boolean).join(' ') || rep.email
                : cust
                ? [cust.first_name, cust.last_name].filter(Boolean).join(' ') || cust.mobile_number || cust.phone_number || cust.email
                : undefined
              return item
            })
            .filter(isAllowedFollowUpItem)
            .filter(item => item.ticketStatus?.toLowerCase() !== 'closed')
        : []
      setItems(mapped)
      if (meta) {
        setTotalPages(meta.totalPages ?? 1)
        setTotalItems(meta.total ?? mapped.length)
      } else {
        setTotalPages(1)
        setTotalItems(mapped.length)
      }
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  // Reset page and refetch when dateFilter or categoryFilter changes
  useEffect(() => {
    setPage(1)
    fetchPage(1)
  }, [dateFilter, categoryFilter, fetchPage])

  // Prepend live item (only on page 1)
  const addLiveItem = useCallback((rawPayload: any) => {
    const newItem = mapRawToQueueItem(rawPayload, true)
    const rep = rawPayload.Ticket?.reporter
    const cust = rawPayload.Ticket?.Customer
    newItem.reporterName = rep
      ? [rep.first_name, rep.last_name].filter(Boolean).join(' ') || rep.email
      : cust
      ? [cust.first_name, cust.last_name].filter(Boolean).join(' ') || cust.mobile_number || cust.phone_number || cust.email
      : undefined
    if (isIgnoredItem(newItem)) return
    if (newItem.ticketStatus?.toLowerCase() === 'closed') return

    if (page === 1) {
      setItems(prev => {
        const filtered = prev.filter(
          i =>
            String(i.id) !== String(newItem.id) &&
            String(i.queueId) !== String(newItem.queueId) &&
            isAllowedFollowUpItem(i) &&
            i.ticketStatus?.toLowerCase() !== 'closed'
        )
        return [newItem, ...filtered]
      })
      setTimeout(() => {
        setItems(prev =>
          prev.map(i => String(i.id) === String(newItem.id) ? { ...i, isFading: false } : i)
        )
      }, 50)
    }
    setTotalItems(prev => prev + 1)
  }, [page])

  // Pusher subscription
  useEffect(() => {
    let unsub: (() => void) | null = null
    subscribe('private-dashboard', 'ticket.queue.new_event', (payload: any) => {
      if (payload) addLiveItem(payload)
    }).then(fn => { unsub = fn }).catch(() => {})
    return () => { if (unsub) unsub() }
  }, [subscribe, addLiveItem])

  // Window event fallback
  useEffect(() => {
    const handler = (e: Event) => {
      const { event } = (e as CustomEvent).detail || {}
      if (['ticket.created', 'ticket.comment.public'].includes(event)) fetchPage(page, true)
    }
    window.addEventListener('realtime:event', handler)
    return () => window.removeEventListener('realtime:event', handler)
  }, [addLiveItem, fetchPage, page])

  const handlePageChange = (p: number) => {
    setPage(p)
    fetchPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Client-side search and category filter (applied on top of server results)
  const filtered = useMemo(() => {
    return items.filter(item => {
      if (!isAllowedFollowUpItem(item)) return false
      if (item.ticketStatus?.toLowerCase() === 'closed') return false
      if (categoryFilter && item.category !== categoryFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (
          !item.category?.toLowerCase().includes(q) &&
          !item.ticketTitle?.toLowerCase().includes(q) &&
          !item.description?.toLowerCase().includes(q) &&
          !item.authorName?.toLowerCase().includes(q) &&
          !item.reporterName?.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [items, categoryFilter, search])

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-500 text-white'
        : 'bg-surface-secondary text-textColor-muted hover:bg-primary-100 hover:text-primary-600'
    }`

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-secondary text-textColor-muted transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h1 className="text-lg font-bold text-textColor-primary">Follow Up Texts</h1>
          <p className="text-sm text-textColor-muted">Full activity history</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-textColor-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-sm text-textColor-muted">{totalItems} items</span>
          <button
            type="button"
            onClick={() => fetchPage(page, false)}
            className="flex items-center gap-1 text-sm text-primary-500 hover:underline"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
          {(['today', 'week', 'all'] as DateFilter[]).map(f => (
            <button key={f} className={filterBtnClass(dateFilter === f)} onClick={() => setDateFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="text-sm border border-borderColor-secondary rounded-lg px-3 py-[7px] bg-surface-primary text-textColor-base focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">All Categories</option>
          <option value="Ticket Created">Ticket Created</option>
          <option value="Public Comment">Public Comment</option>
        </select>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-sm border border-borderColor-secondary rounded-lg px-3 py-[7px] bg-surface-primary text-textColor-base focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-surface-primary rounded-xl border border-borderColor-secondary overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="material-symbols-outlined text-[36px] text-textColor-muted">inbox</span>
            <p className="text-sm text-textColor-muted">No activity found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-secondary border-b border-borderColor-secondary">
                <tr className="text-[11px] uppercase text-textColor-muted">
                  <th className="text-left px-4 py-3 font-medium w-28">Ticket</th>
                  <th className="text-left px-4 py-3 font-medium">Title</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium">Reporter</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor-secondary">
                {filtered.map((item, i) => (
                  <tr
                    key={`${item.id}-${i}`}
                    style={{
                      backgroundColor: item.isFading ? 'rgba(34,197,94,0.2)' : 'transparent',
                      transition: item.isNew ? 'background-color 5s ease-out' : undefined,
                    }}
                    className={item.isNew ? '' : 'hover:bg-surface-secondary'}
                  >
                    {/* Ticket ID */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {(item.ticketHash || item.ticketId) ? (
                          <button
                            type="button"
                            onClick={async () => {
                              if (item.isNew) {
                                setItems(prev => prev.map(i => String(i.id) === String(item.id) ? { ...i, isNew: false, isFading: false } : i))
                                const targetId = item.queueId || (typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10))
                                if (targetId && !isNaN(targetId)) {
                                  api.post(`/realtime/queue/${targetId}/ack`, { status: true }).catch(() => null)
                                }
                              }
                              navigate(`/dashboard/tickets/details/${item.ticketHash || item.ticketId}`)
                            }}
                            className="font-semibold text-primary-500 hover:underline text-sm"
                          >
                            TKT-{item.ticketId}
                          </button>
                        ) : (
                          <span className="text-textColor-muted">—</span>
                        )}
                        {item.isNew && (
                          <span className="inline-block bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
                        )}
                      </div>
                    </td>
                    {/* Title */}
                    <td className="px-4 py-3 text-textColor-primary max-w-[200px] truncate">
                      {item.ticketTitle || '—'}
                    </td>
                    {/* Category + Description */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className={`inline-block self-start text-[11px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(item.category)}`}>
                          {item.category}
                        </span>
                        <span className="text-sm text-textColor-secondary truncate max-w-xs">
                          {item.description}
                        </span>
                      </div>
                    </td>
                    {/* Reporter */}
                    <td className="px-4 py-3 text-sm text-textColor-secondary whitespace-nowrap">
                      {item.reporterName || <span className="text-textColor-muted">—</span>}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      {item.ticketStatus ? (
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded ${getStatusClass(item.ticketStatus)}`}>
                          {item.ticketStatus}
                        </span>
                      ) : (
                        <span className="text-textColor-muted">—</span>
                      )}
                    </td>
                    {/* Time */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {(() => {
                        const parts = formatDateParts(item.createdAt)
                        return parts ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="text-sm text-textColor-primary">{parts.date}</span>
                            <span className="text-xs text-textColor-muted">{parts.time}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-textColor-muted">{item.time}</span>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination — only for week/all */}
        {isPaginated && !loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-borderColor-secondary">
            <span className="text-sm text-textColor-muted">
              Page {page} of {totalPages} · {totalItems} total
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed text-textColor-muted transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let p: number
                if (totalPages <= 7) p = i + 1
                else if (page <= 4) p = i + 1
                else if (page >= totalPages - 3) p = totalPages - 6 + i
                else p = page - 3 + i
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePageChange(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-primary-500 text-white'
                        : 'hover:bg-surface-secondary text-textColor-muted'
                    }`}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed text-textColor-muted transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
