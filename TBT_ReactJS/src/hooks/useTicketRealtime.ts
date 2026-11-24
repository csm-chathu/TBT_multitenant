import { useEffect, useRef } from 'react'

type Callbacks = {
  onTicketEvent?: (event: string, payload: any) => void
  onTicketRefresh?: (ticketId: number) => void
  onComment?: (comment: any) => void
}

export default function useTicketRealtime(ticketId?: number, callbacks: Callbacks = {}) {
  const cbRef = useRef(callbacks)

  useEffect(() => {
    cbRef.current = callbacks
  }, [callbacks.onTicketEvent, callbacks.onTicketRefresh, callbacks.onComment])

  useEffect(() => {
    const handler = async (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail
        if (!detail) return
        const ev = detail.event as string
        const payload = detail.payload
        if (!ev) return

        const incomingTicketId = payload?.ticket?.id ?? payload?.ticketId ?? payload?.id
        if (!ticketId || !incomingTicketId) return
        if (Number(ticketId) !== Number(incomingTicketId)) return

        // generic event callback
        try {
          cbRef.current.onTicketEvent?.(ev, payload)
        } catch (err) {
          console.warn('useTicketRealtime onTicketEvent handler failed', err)
        }

        if (ev === 'ticket.created' || ev === 'ticket.updated') {
          try {
            cbRef.current.onTicketRefresh?.(Number(ticketId))
          } catch (err) {
            console.warn('useTicketRealtime onTicketRefresh handler failed', err)
          }
        }

        if (ev === 'ticket.comment.public' || ev === 'ticket.comment.internal') {
          try {
            const comment = payload?.comment
            if (comment) {
              cbRef.current.onComment?.(comment)
            } else {
              // If comment not provided, signal caller to reload comments by passing null
              cbRef.current.onComment?.(null)
            }
          } catch (err) {
            console.warn('useTicketRealtime onComment handler failed', err)
          }
        }
      } catch (err) {
        console.warn('useTicketRealtime handler error', err)
      }
    }

    window.addEventListener('realtime:event', handler as EventListener)
    return () => window.removeEventListener('realtime:event', handler as EventListener)
  }, [ticketId])
}
