import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getTicketHistoryByTicketId, type TicketHistoryEntry, formatPriorityForDisplay } from '@/services/ticketHistoryService'
import { getTicketComments, type TicketComment } from '@/services/ticketCommentService'
import { getTicketById } from '@/services/ticketService'
import { getStatusClass } from '@/lib/statusUtils'

type TimelineItem =
  | { kind: 'history'; entry: TicketHistoryEntry; date: Date }
  | { kind: 'comment'; comment: TicketComment; date: Date }

interface Props {
  ticket: { id: number; title: string } | null
  onClose: () => void
}

const toDate = (s?: string) => (s ? new Date(s.replace(/ [A-Z]{2,4}$/, '')) : new Date(0))

const fmtDate = (d: Date | null | undefined, withTime = false) => {
  if (!d || isNaN(d.getTime())) return null
  const datePart = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  if (!withTime) return datePart
  return datePart + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const fmtShort = (d: Date) =>
  isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) +
      ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

const getPriorityClass = (priority: any) => {
  const p = String(priority ?? '').toLowerCase()
  if (p === '4' || p === 'critical') return 'text-red-600 bg-red-100 dark:bg-red-900/30'
  if (p === '3' || p === 'high') return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30'
  if (p === '2' || p === 'medium') return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30'
  return 'text-green-600 bg-green-100 dark:bg-green-900/30'
}

function DrawerInner({ ticket, onClose, items, loading, ticketData }: {
  ticket: { id: number; title: string }
  onClose: () => void
  items: TimelineItem[]
  loading: boolean
  ticketData: any
}) {
  const td = ticketData as any
  const displayId = `TKT-${ticket.id}`
  const status = td?.status || ''
  const priority = formatPriorityForDisplay(td?.priority)
  const createdAt = (td?.createdAt || td?.dateCreated)
    ? new Date((td?.createdAt || td?.dateCreated).replace(/ [A-Z]{2,4}$/, ''))
    : null
  const updatedAt = td?.updatedAt ? new Date(td.updatedAt.replace(/ [A-Z]{2,4}$/, '')) : null
  const description = td?.body ? td.body.replace(/<[^>]*>/g, '').trim() : td?.description || ''
  const ticketType = td?.Application?.name || td?.ticketType || td?.type || ''
  const locationName = td?.locationName || td?.location?.name || td?.device?.location?.name || ''
  const assigneeName = (() => {
    const a = td?.assignee || td?.Agent
    if (!a) return ''
    if (typeof a === 'string') return a
    return [a.first_name, a.last_name].filter(Boolean).join(' ') || a.name || a.email || ''
  })()

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.4)', animation: 'fadeIn 150ms ease' }}
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999, width: '100%', maxWidth: '896px', display: 'flex', flexDirection: 'column', animation: 'slideInRight 220ms cubic-bezier(0.32,0.72,0,1)' }}
        className="bg-surface-primary shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-borderColor-secondary shrink-0">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-primary-500 text-sm font-semibold">{displayId}</span>
              <span className="text-textColor-muted text-sm">–</span>
              <span className="text-sm font-semibold text-textColor-primary truncate">{ticket.title}</span>
            </div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {status && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusClass(status)}`}>{status}</span>
              )}
              {priority && td?.priority && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${getPriorityClass(td.priority)}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
                  {priority.toLowerCase()}
                </span>
              )}
              {createdAt && (
                <span className="text-[11px] text-textColor-muted">{fmtDate(createdAt, true)}</span>
              )}
            </div>
            {assigneeName && (
              <p className="text-[12px] text-textColor-muted mt-1">
                Assigned to: <span className="font-semibold text-textColor-primary">{assigneeName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-secondary text-textColor-muted transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Ticket Details card */}
        {td && (
          <div className="px-5 py-3 border-b border-borderColor-secondary shrink-0">
            <div className="bg-surface-secondary rounded-lg p-4 border border-borderColor-secondary">
              <p className="text-[10px] font-semibold text-textColor-muted uppercase tracking-widest mb-3">Ticket Details</p>
              <hr className="border-borderColor-secondary mb-3" />
              {description && (
                <div className="mb-3">
                  <p className="text-[11px] text-textColor-muted mb-0.5">Description</p>
                  <p className="text-sm text-textColor-primary leading-snug line-clamp-3">{description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {ticketType && (
                  <div>
                    <p className="text-[11px] text-textColor-muted mb-0.5">Type</p>
                    <p className="text-sm font-medium text-textColor-primary">{ticketType}</p>
                  </div>
                )}
                {createdAt && (
                  <div>
                    <p className="text-[11px] text-textColor-muted mb-0.5">Created</p>
                    <p className="text-sm font-medium text-textColor-primary">{fmtDate(createdAt, true)}</p>
                  </div>
                )}
                {locationName && (
                  <div>
                    <p className="text-[11px] text-textColor-muted mb-0.5">Location</p>
                    <p className="text-sm font-medium text-textColor-primary">{locationName}</p>
                  </div>
                )}
                {updatedAt && (
                  <div>
                    <p className="text-[11px] text-textColor-muted mb-0.5">Last Updated</p>
                    <p className="text-sm font-medium text-textColor-primary">{fmtDate(updatedAt, true)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline header */}
        <div className="px-5 pt-4 pb-2 shrink-0 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-500 text-[18px]">timeline</span>
          <h3 className="text-sm font-semibold text-textColor-primary">Timeline</h3>
        </div>

        {/* Timeline content */}
        <div className="overflow-y-auto flex-1 px-5 pb-10">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="material-symbols-outlined text-[36px] text-textColor-muted">history</span>
              <p className="text-sm text-textColor-muted">No history found for this ticket.</p>
            </div>
          ) : (
            <div className="relative">
              {items.map((item, i) => {
                const isLast = i === items.length - 1

                if (item.kind === 'history') {
                  const { entry, date } = item
                  const dotColor =
                    entry.type === 'ticket_created'   ? 'bg-success-500' :
                    entry.type === 'status_changed'   ? 'bg-info-500' :
                    entry.type === 'priority_changed' ? 'bg-warning-500' :
                    entry.type === 'assignee_changed' ? 'bg-purple-500' : 'bg-primary-500'
                  const tagStyle =
                    entry.type === 'ticket_created'   ? 'bg-success-100 text-success-700' :
                    entry.type === 'status_changed'   ? 'bg-info-100 text-info-700' :
                    entry.type === 'priority_changed' ? 'bg-warning-100 text-warning-700' :
                    entry.type === 'assignee_changed' ? 'bg-purple-100 text-purple-700' :
                    'bg-surface-secondary text-textColor-muted'
                  const tagLabel =
                    entry.type === 'ticket_created'   ? 'Created' :
                    entry.type === 'status_changed'   ? 'Status Change' :
                    entry.type === 'priority_changed' ? 'Priority Change' :
                    entry.type === 'assignee_changed' ? 'Assignee Change' :
                    entry.type ?? 'Update'
                  const userName =
                    entry.user_name ||
                    (entry.user
                      ? [entry.user.first_name, entry.user.last_name].filter(Boolean).join(' ') ||
                        entry.user.name || entry.user.email
                      : '') || ''
                  return (
                    <div key={i} className="relative pl-6 pb-5 last:pb-0">
                      {!isLast && <span className="absolute left-[5px] top-4 w-0.5 h-full bg-borderColor-secondary" />}
                      <div className={`absolute left-0 top-1 h-3 w-3 rounded-full ${dotColor} ring-2 ring-surface-primary`} />
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${tagStyle}`}>{tagLabel}</span>
                      </div>
                      <p className="text-sm text-textColor-primary leading-snug">{entry.message}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {fmtShort(date) && <span className="text-[11px] text-textColor-muted">{fmtShort(date)}</span>}
                        {userName && <span className="text-[11px] text-textColor-muted">· {userName}</span>}
                      </div>
                    </div>
                  )
                }

                const { comment, date } = item
                const commenterName = comment.Agent
                  ? [comment.Agent.first_name, comment.Agent.last_name].filter(Boolean).join(' ') || comment.Agent.name || ''
                  : comment.user_name || ''
                const commentTagStyle = comment.type === 'internal' ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'
                const commentTagLabel = comment.type === 'internal' ? 'Internal Comment' : 'Comment'
                return (
                  <div key={i} className="relative pl-6 pb-5 last:pb-0">
                    {!isLast && <span className="absolute left-[5px] top-4 w-0.5 h-full bg-borderColor-secondary" />}
                    <div className={`absolute left-0 top-1 h-3 w-3 rounded-full ring-2 ring-surface-primary ${comment.type === 'internal' ? 'bg-warning-500' : 'bg-primary-500'}`} />
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block text-[10px] font-semibold rounded-full px-2 py-0.5 ${commentTagStyle}`}>{commentTagLabel}</span>
                    </div>
                    <div className="bg-surface-secondary rounded-lg px-3 py-2 border border-borderColor-secondary">
                      {commenterName && <p className="text-[11px] font-semibold text-textColor-primary mb-1">{commenterName}</p>}
                      <p className="text-sm text-textColor-primary leading-snug">{comment.comment}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {fmtShort(date) && <span className="text-[11px] text-textColor-muted">{fmtShort(date)}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideInRight { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}

export default function TicketTimelineDrawer({ ticket, onClose }: Props) {
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(false)
  const [ticketData, setTicketData] = useState<any>(null)

  useEffect(() => {
    if (!ticket) return
    setLoading(true)
    setItems([])
    setTicketData(null)

    Promise.all([
      getTicketHistoryByTicketId(ticket.id),
      getTicketComments(ticket.id).catch(() => [] as TicketComment[]),
      getTicketById(ticket.id).catch(() => null),
    ])
      .then(([history, comments, details]) => {
        const merged: TimelineItem[] = [
          ...history.map(entry => ({ kind: 'history' as const, entry, date: toDate(entry.createdAt || entry.created_at) })),
          ...comments.map(comment => ({ kind: 'comment' as const, comment, date: toDate(comment.createdAt) })),
        ].sort((a, b) => a.date.getTime() - b.date.getTime())
        setItems(merged)
        setTicketData(details)
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [ticket?.id])

  if (!ticket) return null

  return createPortal(
    <DrawerInner
      ticket={ticket}
      onClose={onClose}
      items={items}
      loading={loading}
      ticketData={ticketData}
    />,
    document.body
  )
}
