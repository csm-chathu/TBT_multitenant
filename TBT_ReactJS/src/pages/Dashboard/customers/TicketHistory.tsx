import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { getAllTickets } from "@/services/ticketService"
import { getTicketHistoryByTicketId, getTicketSmsCount, type TicketHistoryEntry, type TicketSmsCount } from "@/services/ticketHistoryService"
import { getMessagesByTicketId, type MessageRecord } from "@/services/messageService"
import { formatDateTimeLong } from "@/utils/dateFormat"
import { formatRichTextToPlain } from "@/utils/textUtils"
import { getStatusClass } from "@/lib/statusUtils"
import Button from "@/components/Atomic/Button"
import PopupModal from "@/components/Molecules/ui/PopupModal"
import UpdateTicketStatusModal from "@/components/Molecules/UpdateTicketStatusModal"

interface TicketHistoryProps {
  customerId: number
}

const TicketHistory = ({ customerId }: TicketHistoryProps) => {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<any | null>(null)
  const [history, setHistory] = useState<TicketHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [smsCounts, setSmsCounts] = useState<Record<number, TicketSmsCount>>({})
  const [smsModalTicket, setSmsModalTicket] = useState<any | null>(null)
  const [smsMessages, setSmsMessages] = useState<MessageRecord[]>([])
  const [smsLoading, setSmsLoading] = useState(false)
  const [statusModalTicket, setStatusModalTicket] = useState<any | null>(null)

  useEffect(() => {
    if (!customerId) return
    setLoading(true)
    setError(null)
    getAllTickets({ customerId })
      .then((result) => {
        const list = Array.isArray(result) ? result : (result as any).data ?? []
        setTickets(list)
        // Fetch SMS counts for all tickets in parallel
        Promise.all(
          list.filter((t: any) => t.id).map((t: any) =>
            getTicketSmsCount(t.id)
              .then((count) => ({ id: t.id, count }))
              .catch(() => ({ id: t.id, count: { total: 0, outbound: 0, inbound: 0 } }))
          )
        ).then((results) => {
          const map: Record<number, TicketSmsCount> = {}
          results.forEach(({ id, count }) => { map[id] = count })
          setSmsCounts(map)
        })
      })
      .catch(() => setError("Failed to load tickets"))
      .finally(() => setLoading(false))
  }, [customerId])

  useEffect(() => {
    if (!selected?.id) { setHistory([]); return }
    setHistoryLoading(true)
    getTicketHistoryByTicketId(selected.id)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [selected])

  const RATE = 0.0083
  const calcSegments = (text: string) => {
    const len = text?.length || 0
    if (len === 0) return 0
    if (len <= 160) return 1
    return Math.ceil(len / 153)
  }
  const fmtCost = (usd: number) => `~$${usd.toFixed(4)}`

  const openSmsModal = (ticket: any) => {
    setSmsModalTicket(ticket)
    setSmsMessages([])
    setSmsLoading(true)
    getMessagesByTicketId(ticket.id)
      .then(setSmsMessages)
      .catch(() => setSmsMessages([]))
      .finally(() => setSmsLoading(false))
  }

  const fmtDate = (v: any) => formatDateTimeLong(typeof v === 'string' ? v.replace(' PST', '') : v)
  const getTitle = (t: any) => formatRichTextToPlain(t.title || t.heading || 'Untitled')
  const getTicketLabel = (t: any) => t.id ? `TKT-${String(t.id).padStart(3, '0')}` : t.hash ?? '—'
  const getAssignee = (t: any) => {
    const a = t.Agent
    if (!a) return 'Unassigned'
    return [a.first_name, a.last_name].filter(Boolean).join(' ') || a.nickname || 'Unassigned'
  }

  return (
    <>
      <h5 className="uppercase text-sm pb-3 border-b border-borderColor-secondary">Ticket History</h5>

      {loading && (
        <div className="divide-y divide-borderColor-secondary animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-surface-secondary rounded" />
                  <div className="h-5 w-20 bg-surface-secondary rounded-full" />
                  <div className="h-5 w-16 bg-surface-secondary rounded-full" />
                </div>
                <div className="h-3.5 w-64 bg-surface-secondary rounded" />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-8 w-32 bg-surface-secondary rounded-lg" />
                <div className="h-3 w-28 bg-surface-secondary rounded" />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-red-400 py-4 text-center">{error}</p>
      )}
      {!loading && !error && tickets.length === 0 && (
        <p className="text-sm text-textColor-muted py-4 text-center">No tickets found for this customer.</p>
      )}

      {!loading && !error && tickets.length > 0 && (
        <div className="divide-y divide-borderColor-secondary">
          {tickets.map((ticket) => (
            <div key={ticket.id ?? ticket.hash} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium text-primary-500 cursor-pointer hover:opacity-70"
                    onClick={() => setSelected(ticket)}
                  >
                    {getTicketLabel(ticket)}
                  </span>
                  {ticket.status && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setStatusModalTicket(ticket) }}
                      className="group inline-flex items-center gap-1 focus:outline-none cursor-pointer text-left"
                      title="Click to update status"
                    >
                      <span className={`status-chip ${getStatusClass(ticket.status)} group-hover:opacity-90 transition-all`}>
                        {ticket.status}
                      </span>
                      <span className="material-symbols-outlined text-xs text-textColor-muted opacity-0 group-hover:opacity-100 transition-opacity">
                        edit
                      </span>
                    </button>
                  )}
                  {ticket.priority && (
                    <span className={`priority-chip priority-${ticket.priority?.toLowerCase()}`}>{ticket.priority}</span>
                  )}
                </div>
                <p className="text-sm line-clamp-1 text-textColor-muted">{getTitle(ticket)}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {smsCounts[ticket.id] !== undefined && smsCounts[ticket.id].total > 0 && (
                  <div
                    className="flex items-center gap-3 text-xs bg-surface-secondary rounded-lg px-3 py-2 cursor-pointer hover:bg-primary-100 transition-colors"
                    onClick={(e) => { e.stopPropagation(); openSmsModal(ticket); }}
                    title="View SMS messages"
                  >
                    <span className="flex items-center gap-1 text-textColor-muted">
                      <span className="material-symbols-outlined text-sm">sms</span>
                      <span className="font-medium text-textColor-base">{smsCounts[ticket.id].total}</span>
                    </span>
                    <span className="text-primary-500">↑{smsCounts[ticket.id].outbound}</span>
                    <span className="text-green-500">↓{smsCounts[ticket.id].inbound}</span>
                    <span className="text-yellow-400 border-l border-borderColor-secondary pl-2">{fmtCost(smsCounts[ticket.id].total * RATE)}</span>
                  </div>
                )}
                <div className="text-xs text-textColor-muted text-right space-y-1">
                  <p>Created: {fmtDate(ticket.createdAt)}</p>
                  <p>Updated: {fmtDate(ticket.updatedAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SMS Modal */}
      <PopupModal
        open={!!smsModalTicket}
        onClose={() => setSmsModalTicket(null)}
        title={`SMS — ${smsModalTicket ? getTicketLabel(smsModalTicket) : ''}`}
        hideFooter
      >
        {!smsLoading && smsMessages.length > 0 && (() => {
          const totalSegments = smsMessages.reduce((sum, m) => sum + calcSegments(m.message), 0)
          const totalCost = totalSegments * RATE
          const outCount = smsMessages.filter(m => m.direction === 'outgoing' || m.direction === 'outbound').length
          const inCount = smsMessages.filter(m => m.direction === 'incoming' || m.direction === 'inbound').length
          return (
            <div className="flex gap-4 mb-3 p-3 bg-surface-secondary rounded-lg text-xs">
              <span className="text-textColor-muted">Segments: <strong className="text-textColor-base">{totalSegments}</strong></span>
              <span className="text-primary-500">↑ Sent: {outCount}</span>
              <span className="text-green-500">↓ Received: {inCount}</span>
              <span className="ml-auto text-yellow-400 font-semibold">Est. Cost: ${totalCost.toFixed(4)}</span>
            </div>
          )
        })()}
        <div className="min-w-[480px] max-h-[60vh] overflow-y-auto space-y-3 pr-1">
          {smsLoading && <p className="text-sm text-textColor-muted text-center py-6">Loading messages…</p>}
          {!smsLoading && smsMessages.length === 0 && (
            <p className="text-sm text-textColor-muted text-center py-6">No messages found.</p>
          )}
          {!smsLoading && smsMessages.map((msg) => {
            const isOutgoing = msg.direction === 'outgoing' || msg.direction === 'outbound'
            const time = fmtDate(msg.createdAt || msg.dateCreated)
            return (
              <div key={msg.id} className={`flex flex-col gap-1 ${isOutgoing ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isOutgoing ? 'bg-primary-500 text-white rounded-tr-sm' : 'bg-surface-secondary text-textColor-base rounded-tl-sm'}`}>
                  {msg.message}
                </div>
                <span className="text-[10px] text-textColor-muted px-1">{time !== 'N/A' ? time : ''}</span>
              </div>
            )
          })}
        </div>
      </PopupModal>

      {/* Drawer overlay */}
      <div
        className={`fixed -top-3 inset-0 z-30 transition-all duration-300 ${selected ? 'pointer-events-auto bg-black/80' : 'pointer-events-none bg-transparent'}`}
        onClick={() => setSelected(null)}
      >
        <div
          className={`absolute top-0 right-0 h-full w-full max-w-2xl bg-surface-primary shadow-lg overflow-auto transition-transform duration-300 ease-out ${selected ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {selected && (
            <>
              {/* Drawer Header */}
              <div className="p-4 sticky top-0 z-50 flex justify-between items-start gap-10 bg-surface-primary border-b border-primary-100">
                <div className="space-y-4">
                  <h5 className="text-lg font-medium">
                    <span className="text-primary-500 pr-3">{getTicketLabel(selected)} -</span>
                    {getTitle(selected)}
                  </h5>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selected.status && (
                      <span className={`status-chip ${getStatusClass(selected.status)}`}>{selected.status}</span>
                    )}
                    {selected.priority && (
                      <span className={`priority-chip priority-${selected.priority?.toLowerCase()}`}>{selected.priority}</span>
                    )}
                    <p className="text-sm text-textColor-muted">{fmtDate(selected.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <p className="text-textColor-muted">Assigned to:</p>
                    <p>{getAssignee(selected)}</p>
                  </div>
                </div>
                <Button style="Icon" icon="close" onClick={() => setSelected(null)} />
              </div>

              {/* Drawer Body */}
              <div className="space-y-4 p-4">
                {/* Ticket Details */}
                <div className="bg-surface-secondary p-4 space-y-3 rounded-lg">
                  <h5 className="uppercase text-sm pb-3 border-b border-borderColor-secondary">Ticket Details</h5>
                  <div className="pt-3 grid grid-cols-2 gap-4">
                    {(selected.body || selected.description) && (
                      <div className="col-span-2 space-y-1">
                        <p className="text-sm text-textColor-muted">Description</p>
                        <p className="text-sm whitespace-pre-wrap">{formatRichTextToPlain(selected.body || selected.description)}</p>
                      </div>
                    )}
                    {selected.ticketType && (
                      <div className="space-y-1">
                        <p className="text-sm text-textColor-muted">Type</p>
                        <p className="text-sm">{selected.ticketType}</p>
                      </div>
                    )}
                    {selected.locationName && (
                      <div className="space-y-1">
                        <p className="text-sm text-textColor-muted">Location</p>
                        <p className="text-sm">{selected.locationName}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <p className="text-sm text-textColor-muted">Created</p>
                      <p className="text-sm">{fmtDate(selected.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-textColor-muted">Last Updated</p>
                      <p className="text-sm">{fmtDate(selected.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Ticket History Timeline */}
                <div className="bg-surface-secondary p-4 space-y-3 rounded-lg">
                  <h5 className="uppercase text-sm pb-3 border-b border-borderColor-secondary">Ticket History</h5>
                  {historyLoading && <p className="text-sm text-textColor-muted">Loading history…</p>}
                  {!historyLoading && history.length === 0 && (
                    <p className="text-sm text-textColor-muted">No history available.</p>
                  )}
                  {!historyLoading && history.length > 0 && (
                    <div>
                      {history.map((entry, i) => {
                        const isLast = i === history.length - 1
                        const dotColor =
                          entry.type === 'ticket_created' ? 'bg-success-500' :
                          entry.type === 'status_changed' ? 'bg-info-500' :
                          entry.type === 'priority_changed' ? 'bg-warning-500' :
                          'bg-primary-500'
                        const userName = entry.user_name || [entry.user?.first_name, entry.user?.last_name].filter(Boolean).join(' ') || entry.user?.name || entry.user?.email || ''
                        const entryDate = fmtDate(entry.createdAt || entry.created_at)
                        return (
                          <div key={entry.id ?? i} className="py-3 relative">
                            {!isLast && <span className="w-0.5 h-[90%] absolute left-1 top-4 bg-borderColor-secondary block" />}
                            <div className="flex items-center gap-4">
                              <div className={`h-3 w-3 ${dotColor} absolute rounded-full`} />
                              <p className="ml-7 text-sm">{entry.message}</p>
                              {entryDate !== 'N/A' && <p className="text-xs text-textColor-muted shrink-0">{entryDate}</p>}
                            </div>
                            {userName && <p className="ml-7 text-xs text-textColor-muted mt-1">{userName}</p>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* View Full Ticket */}
                {selected.hash && (
                  <div className="flex justify-end">
                    <Button
                      style="Primary"
                      text="View Full Ticket"
                      onClick={() => {
                        setSelected(null)
                        navigate(`/dashboard/tickets/details/${selected.hash}`)
                      }}
                    />
                  </div>
                )}

                <div className="p-4" />
              </div>
            </>
          )}
        </div>
      </div>
      <UpdateTicketStatusModal
        open={Boolean(statusModalTicket)}
        ticket={statusModalTicket}
        onClose={() => setStatusModalTicket(null)}
        onSuccess={(updatedTicket) => {
          setTickets(prev => prev.map(t => {
            const tId = t.id || t.ticketId
            const uId = (updatedTicket as any).id || (updatedTicket as any).ticketId
            return tId === uId ? { ...t, status: updatedTicket.status } : t
          }))
        }}
      />
    </>
  )
}

export default TicketHistory
