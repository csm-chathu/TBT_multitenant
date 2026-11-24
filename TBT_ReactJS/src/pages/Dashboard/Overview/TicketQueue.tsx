import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/services/api'
import usePusherClient from '@/hooks/usePusherClient'

export type TicketQueueItem = {
  id: number | string
  queueId?: number
  ticketId?: number
  eventType?: string
  ticketHash?: string
  ticketTitle?: string
  ticketStatus?: string
  category: string
  time: string
  title?: string
  authorName?: string
  description: string
  status?: boolean
  priority?: string
  createdAt?: string
  isNew?: boolean
  isFading?: boolean
  reporterName?: string
}

function formatTimeAgo(dateInput?: string | Date): string {
  if (!dateInput) return 'Now'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return 'Now'

  const now = new Date()
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  if (diffInSeconds < 30) return 'Now'
  if (diffInSeconds < 60) return '1 min ago'
  
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function safeString(val: any): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    try {
      const parts: string[] = []
      if (val.status) parts.push(`Status: ${val.status}`)
      if (val.priority) parts.push(`Priority: ${val.priority}`)
      if (val.title && typeof val.title === 'string') parts.push(val.title)
      if (parts.length > 0) return parts.join(', ')
      return JSON.stringify(val)
    } catch {
      return ''
    }
  }
  return String(val)
}

export function mapRawToQueueItem(raw: any, isLiveEvent = false): TicketQueueItem {
  const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : {}
  const eventType = raw.event_type || raw.eventType || payload.eventType || payload.event_type || ''
  const queueId = raw.queueId || raw.id || payload.queueId
  const ticketId = raw.ticket_id || raw.ticketId || payload.ticketId || (eventType !== 'TICKET_CREATED' ? payload.id : undefined)

  let category = typeof payload.category === 'string' ? payload.category : ''
  
  if (category === 'Customer Insights') category = 'Internal Comment'
  if (category === 'Response to client feedback') category = 'Public Comment'

  if (
    category.toLowerCase() === 'change_assignee' ||
    eventType.toLowerCase() === 'change_assignee' ||
    eventType.toUpperCase() === 'CHANGE_ASSIGNEE'
  ) {
    category = 'Change_assignee'
  } else if (
    category.toLowerCase() === 'add_sub_assignee' ||
    eventType.toLowerCase() === 'add_sub_assignee' ||
    eventType.toUpperCase() === 'ADD_SUB_ASSIGNEE'
  ) {
    category = 'Add_Sub_assignee'
  }

  if (!category) {
    switch (eventType) {
      case 'TICKET_CREATED':
        category = 'Ticket Created'
        break
      case 'STATUS_CHANGED':
        category = 'Status Updated'
        break
      case 'PRIORITY_CHANGED':
        category = 'Priority Changed'
        break
      case 'COMMENT_ADDED':
        category = payload.isInternal || payload.type === 'internal' ? 'Internal Comment' : 'Public Comment'
        break
      case 'FILE_UPLOADED':
        category = 'Upload Attachment'
        break
      case 'DUE_DATE_CHANGED':
        category = 'Due Date Changed'
        break
      case 'Change_assignee':
      case 'CHANGE_ASSIGNEE':
        category = 'Change_assignee'
        break
      case 'Add_Sub_assignee':
      case 'ADD_SUB_ASSIGNEE':
        category = 'Add_Sub_assignee'
        break
      default:
        category = 'Recent Activity'
    }
  }

  let title = ticketId ? `Ticket #${ticketId}` : undefined
  if (!title && typeof payload.title === 'string' && !payload.title.includes('added a comment')) {
    title = payload.title
  }

  let description = ''
  let extractedAuthor = ''

  if (typeof payload.description === 'string' && payload.description) {
    description = payload.description
    const commentMatch = description.match(/^([A-Za-z0-9_ -]+)\s+added a comment:\s*(.*)$/i)
    if (commentMatch) {
      extractedAuthor = commentMatch[1].trim()
      description = commentMatch[2].trim()
    }
  } else if (payload.changes) {
    description = safeString(payload.changes)
  }

  if (!description) {
    if (payload.title && typeof payload.title === 'string') {
      description = payload.title
    } else if (raw.Ticket?.title) {
      description = raw.Ticket.title
    } else {
      description = eventType ? `Event: ${eventType}` : 'Activity update'
    }
  }

  const authorName =
    payload.authorName ||
    payload.author_name ||
    payload.fromUserStr ||
    payload.from_name ||
    payload.user_name ||
    raw.creator?.name ||
    raw.creator?.username ||
    raw.creator?.email ||
    extractedAuthor ||
    ''

  // Check if item status in DB is unread (false, 0, '0', 'false', 'pending')
  const isUnreadInDb =
    raw.status === false ||
    raw.status === 0 ||
    raw.status === '0' ||
    raw.status === 'false' ||
    raw.status === 'pending'

  const isNewItem = isLiveEvent || isUnreadInDb

  const ticketHash = raw.Ticket?.hash || payload.hash || undefined
  const ticketTitle = raw.Ticket?.title || payload.title || undefined
  const ticketStatus = raw.Ticket?.status || payload.status || undefined

  return {
    id: queueId ? String(queueId) : String(Math.random()),
    queueId: queueId ? Number(queueId) : undefined,
    ticketId: ticketId ? Number(ticketId) : undefined,
    eventType: eventType ? String(eventType) : undefined,
    ticketHash: ticketHash ? String(ticketHash) : undefined,
    ticketTitle: ticketTitle ? String(ticketTitle) : undefined,
    ticketStatus: ticketStatus ? String(ticketStatus) : undefined,
    category: safeString(category) || 'Recent Activity',
    time: formatTimeAgo(raw.createdAt || raw.created_at),
    title: title ? safeString(title) : undefined,
    authorName: safeString(authorName) || undefined,
    description: safeString(description) || 'Ticket activity update',
    status: Boolean(raw.status),
    priority: safeString(raw.priority),
    createdAt: raw.createdAt || raw.created_at,
    isNew: isNewItem,
    isFading: isLiveEvent,
  }
}

// Helper to check if an item is an allowed follow up item (Ticket Created or Public Comment only)
export function isAllowedFollowUpItem(item: TicketQueueItem): boolean {
  const cat = (item.category || '').toLowerCase().trim()
  const evt = (item.eventType || '').toUpperCase().trim()

  // Explicitly exclude internal comments
  if (cat === 'internal comment' || cat === 'customer insights') {
    return false
  }

  const isTicketCreated =
    cat === 'ticket created' ||
    evt === 'TICKET_CREATED'

  const isPublicComment =
    cat === 'public comment' ||
    cat === 'response to client feedback' ||
    (evt === 'COMMENT_ADDED' && cat !== 'internal comment')

  return isTicketCreated || isPublicComment
}

// Filter out any update info that is NOT ticket created or public comment
export function isIgnoredItem(item: TicketQueueItem): boolean {
  return !isAllowedFollowUpItem(item)
}

interface TicketQueueProps {
  onSelectTicket?: (ticketId: number) => void
}

const TicketQueue: React.FC<TicketQueueProps> = ({ onSelectTicket }) => {
  const navigate = useNavigate()
  const [items, setItems] = useState<TicketQueueItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  const { subscribe } = usePusherClient({ autoConnect: true })
  const [, setTick] = useState(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Re-render every 60s so relative times stay current
  useEffect(() => {
    tickRef.current = setInterval(() => setTick(t => t + 1), 60_000)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [])

  

  // Live incoming WebSocket events trigger smooth 5-second color fade
  const addNewLiveItem = useCallback((rawPayload: any) => {
    const newItem = mapRawToQueueItem(rawPayload, true)
    // Only show ticket created and public comments in follow up texts
    if (isIgnoredItem(newItem)) return

    newItem.isNew = true
    newItem.isFading = true

    setItems((prev) => {
      const filtered = prev.filter(
        (i) =>
          String(i.id) !== String(newItem.id) &&
          String(i.queueId) !== String(newItem.queueId) &&
          !isIgnoredItem(i)
      )
      return [newItem, ...filtered].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return bTime - aTime
      })
    })

    // Use double-rAF so the browser paints the green background before the fade starts
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setItems((prev) =>
          prev.map((i) =>
            String(i.id) === String(newItem.id) ? { ...i, isFading: false } : i
          )
        )
      })
    })
  }, [])

  const fetchQueue = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true)
    try {
      // Pass status=all and onlyFollowUp=true to fetch only ticket created and comment updates
      const res = await api.get('/realtime/queue', {
        params: { status: 'all', limit: 20, onlyFollowUp: 'true' },
      })
      const rawList = res?.data?.data || (Array.isArray(res?.data) ? res.data : [])
      if (Array.isArray(rawList) && rawList.length > 0) {
        setItems((prevItems) => {
          const activeLiveItemsMap = new Map<string, TicketQueueItem>()
          prevItems.forEach((i) => {
            if (i.isNew && !isIgnoredItem(i)) {
              if (i.queueId) activeLiveItemsMap.set(`q_${i.queueId}`, i)
              if (i.id) activeLiveItemsMap.set(String(i.id), i)
            }
          })

          const fetchedMapped = rawList
            .map((raw: any) => {
              const mapped = mapRawToQueueItem(raw, false)
              const liveMatch =
                (mapped.queueId && activeLiveItemsMap.get(`q_${mapped.queueId}`)) ||
                activeLiveItemsMap.get(String(mapped.id))

              if (liveMatch) {
                return {
                  ...mapped,
                  isNew: true,
                  isFading: liveMatch.isFading, // preserve green fade — don't kill it mid-animation
                }
              }
              return mapped
            })
            // Only allow Ticket Created and Public Comment in follow up texts
            .filter((item) => !isIgnoredItem(item))

          // Preserve unmerged live items that haven't been returned by REST API yet,
          // but only if they arrived within the last 30 seconds (avoids pinning old items
          // that have fallen outside the top-N REST window).
          const LIVE_WINDOW_MS = 30_000
          const now = Date.now()
          const fetchedIdSet = new Set(fetchedMapped.map((m) => String(m.id)))
          const unmergedLiveItems = prevItems.filter((i) => {
            if (!i.isNew || fetchedIdSet.has(String(i.id)) || isIgnoredItem(i)) return false
            const age = i.createdAt ? now - new Date(i.createdAt).getTime() : 0
            return age < LIVE_WINDOW_MS
          })

          return [...unmergedLiveItems, ...fetchedMapped].sort((a, b) => {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return bTime - aTime
          })
        })
      } else {
        setItems((prevItems) => {
          const liveItems = prevItems.filter((i) => i.isNew && !isIgnoredItem(i))
          return liveItems
        })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[TicketQueue] Failed to load queue from backend', err)
    } finally {
      setLoading(false)
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 300)
      }
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchQueue()
  }, [fetchQueue])

  // Polling fallback every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQueue()
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  // Subscribe to live Pusher event 'ticket.queue.new_event'
  useEffect(() => {
    let unsub: (() => void) | null = null

    const setupPusher = async () => {
      try {
        unsub = await subscribe('private-dashboard', 'ticket.queue.new_event', (payload: any) => {
          if (payload) addNewLiveItem(payload)
        })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[TicketQueue] Realtime queue pusher subscription failed', err)
      }
    }

    setupPusher()

    return () => {
      if (unsub) unsub()
    }
  }, [subscribe, addNewLiveItem])

  // Fallback: if Pusher ticket.queue.new_event is slow/missing, ticket.updated/created
  // window events (from public channel via RealtimeProvider) trigger a silent refetch.
  useEffect(() => {
    const handler = (e: Event) => {
      const { event } = (e as CustomEvent).detail || {}
      if (['ticket.created', 'ticket.updated', 'ticket.comment.public'].includes(event)) {
        fetchQueue()
      }
    }
    window.addEventListener('realtime:event', handler)
    return () => window.removeEventListener('realtime:event', handler)
  }, [fetchQueue])

  const handleItemClick = async (item: TicketQueueItem) => {
    // Dismiss yellow NEW tag locally & persist ACK in database
    if (item.isNew || item.isFading) {
      setItems((prev) =>
        prev.map((i) =>
          String(i.id) === String(item.id) ? { ...i, isNew: false, isFading: false, status: true } : i
        )
      )

      // Persist acknowledged status to backend DB so it stays read on refresh/page navigation
      const targetId = item.queueId || (typeof item.id === 'number' ? item.id : parseInt(String(item.id), 10))
      if (targetId && !isNaN(targetId)) {
        try {
          await api.post(`/realtime/queue/${targetId}/ack`, { status: true })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[TicketQueue] Failed to acknowledge queue item #${targetId}`, err)
        }
      }
    }

    if (item.ticketHash || item.ticketId) {
      if (onSelectTicket && item.ticketId) onSelectTicket(item.ticketId)
      else navigate(`/dashboard/tickets/details/${item.ticketHash || item.ticketId}`)
    }
  }

  const newItemsCount = items.filter((i) => i.isNew && !isIgnoredItem(i)).length

  if (loading) {
    return (
      <div className="overflow-auto h-[360px] p-4 space-y-3">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="animate-pulse space-y-2 py-2 border-b border-borderColor-secondary">
            <div className="h-4 bg-surface-tertiary rounded w-2/3" />
            <div className="h-3 bg-surface-tertiary rounded w-full" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[360px]">
      <div className="flex justify-between items-center px-4 py-1.5 text-xs text-textColor-muted border-b border-borderColor-secondary bg-surface-secondary/40">
        <span className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Realtime Queue
          {newItemsCount > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {newItemsCount} NEW
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={() => fetchQueue(true)}
          className="hover:text-primary-500 transition-colors flex items-center gap-1 text-xs cursor-pointer"
          title="Refresh Queue"
        >
          <span className={`material-symbols-outlined text-sm ${isRefreshing ? 'animate-spin' : ''}`}>
            refresh
          </span>
          Refresh
        </button>
      </div>

      <div className="overflow-auto flex-1 divide-y divide-borderColor-secondary">
        {items.filter((item) => !isIgnoredItem(item)).length === 0 ? (
          <div className="p-6 text-center text-sm text-textColor-muted">
            No recent follow up texts
          </div>
        ) : (
          items
            .filter((item) => !isIgnoredItem(item))
            .slice(0, 10)
            .map((item) => (
              <div
                key={`${item.id}-${item.category}-${item.time}`}
                onClick={() => handleItemClick(item)}
                style={{
                  backgroundColor: item.isFading ? 'rgba(34,197,94,0.2)' : 'transparent',
                  transition: item.isNew ? 'background-color 5s ease-out' : undefined,
                }}
                className={`space-y-1 py-2 px-4 ${
                  item.ticketId ? 'cursor-pointer' : ''
                } ${
                  item.isNew ? 'border-l-4 border-l-green-500' : 'hover:bg-surface-secondary'
                }`}
              >
                <div className="flex justify-between gap-4 text-sm text-textColor-muted font-medium">
                  <div className="max-w-8/12 flex items-center gap-2">
                    <h4>{item.category}</h4>
                    {item.isNew && (
                      <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                  </div>
                  <span className="max-w-4/12 text-right text-xs opacity-80">
                    {formatTimeAgo(item.createdAt || item.time)}
                  </span>
                </div>
                {item.title && (
                  <h5 className="font-medium text-sm text-textColor-primary flex items-center gap-1.5">
                    <span>{item.title}</span>
                    {item.authorName && (
                      <span className="text-xs text-textColor-muted font-normal">
                        by {item.authorName}
                      </span>
                    )}
                  </h5>
                )}
                <p className="text-sm text-textColor-secondary">{item.description}</p>
              </div>
            ))
        )}
      </div>

      {/* View More */}
      <button
        type="button"
        onClick={() => navigate('/dashboard/follow-up-history')}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-primary-500 bg-primary-50/60 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 border-t border-borderColor-secondary transition-colors shrink-0"
      >
        <span className="material-symbols-outlined text-[14px]">open_in_new</span>
        View More
      </button>
    </div>
  )
}

export default TicketQueue
