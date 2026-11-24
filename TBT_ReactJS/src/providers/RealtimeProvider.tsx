import React, { useEffect, useCallback } from 'react'
import usePusherClient from '@/hooks/usePusherClient'
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { fetchNotifications } from '@/services/notificationService'
import { setNotifications, addNotification } from '@/redux/notification/notificationSlice'
import { addTicketRealtime, upsertTicketRealtime, removeTicketRealtime, markTicketStale, setTicketUpdated, type TicketUpdateEvent } from '@/redux/ticket/ticketSlice'
import useToast from '@/hooks/useToast'

type Props = { children: React.ReactNode }

export default function RealtimeProvider({ children }: Props) {
  const user = useAppSelector(selectCurrentUser)
  const { init, subscribeMany, disconnect } = usePusherClient({ autoConnect: true })
  const dispatch = useAppDispatch()
  const { info: toastInfo, success: toastSuccess } = useToast()

  const isTabVisible = () => document.visibilityState === 'visible'

  const ticketLabel = (t: any): string => {
    const id = t?.id ?? t?.ticketId
    const title = t?.title ?? t?.heading
    return id ? (title ? `#${id} – ${title}` : `#${id}`) : ''
  }

  const changesLabel = (changes: any): string => {
    if (!changes || typeof changes !== 'object') return ''
    const parts: string[] = []
    if (changes.status)             parts.push(`Status → ${changes.status}`)
    if (changes.priority)           parts.push(`Priority → ${changes.priority}`)
    if (changes.agent_id !== undefined)       parts.push('Assignee changed')
    if (changes.multiple_assignees !== undefined) parts.push('Sub-assignees updated')
    if (changes.title)              parts.push('Title updated')
    if (changes.remarks)            parts.push('Remarks updated')
    return parts.join(', ')
  }

  const commentPreview = (p: any): string => {
    const text = p?.comment?.comment ?? p?.comment ?? ''
    if (!text) return ''
    const plain = String(text).replace(/<[^>]*>/g, '').trim()
    return plain.length > 60 ? `"${plain.slice(0, 60)}…"` : `"${plain}"`
  }

  const emitEvent = useCallback((event: string, payload: any) => {
    // eslint-disable-next-line no-console
    console.log('[realtime] received', event, payload)
    try {
      const ev = new CustomEvent('realtime:event', { detail: { event, payload } })
      window.dispatchEvent(ev)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[RealtimeProvider] failed to dispatch event', e)
    }

    // Refresh notifications from server and update redux
    ;(async () => {
      try {
        const res = await fetchNotifications(50)
        const items = Array.isArray(res.notifications) ? res.notifications : []
        dispatch(setNotifications(items))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[RealtimeProvider] failed to refresh notifications', err)
      }
    })()
  }, [dispatch])

  useEffect(() => {
    const unsubs: Array<() => void> = []
    if (!user) return () => { unsubs.forEach((u) => { try { u() } catch {} }) }

    ;(async () => {
      try {
        await init()

        // subscribe to private per-user channel
        const userChannel = `private-user-${user.id}`

        const u1 = await subscribeMany(userChannel, {
          'ticket.created': (p: any) => {
            emitEvent('ticket.created', p)
            try {
              const t = p?.ticket ?? p
              if (t && t.id) {
                try { dispatch(addTicketRealtime(t)) } catch (err) { /* ignore */ }
                const ev: TicketUpdateEvent = { type: 'created', id: t.id, hash: t.hash, title: t.title ?? t.heading }
                dispatch(setTicketUpdated(ev))
                if (isTabVisible()) toastSuccess(`New ticket assigned: ${ticketLabel(t)}`, { toastId: `ticket-assigned-${t.id}` })
              } else {
                dispatch(setTicketUpdated({ type: 'created' }))
                if (isTabVisible()) toastSuccess('New ticket assigned to you', { toastId: 'ticket-assigned-new' })
              }
            } catch (err) {
              console.warn('[RealtimeProvider] ticket.created toast error', err)
            }
          },
          'ticket.updated': (p: any) => {
            emitEvent('ticket.updated', p)
            const t = p?.ticket ?? p
            const id = t?.id ?? p?.ticketId ?? p?.id
            const what = changesLabel(p?.changes ?? t?.changes)
            const isOwnAction = user && p?.actorId && Number(p.actorId) === Number(user.id)
            if (id) {
              dispatch(markTicketStale(id))
              if (!isOwnAction) dispatch(setTicketUpdated({ type: 'updated', id, hash: t?.hash ?? p?.hash, title: t?.title ?? t?.heading, subtitle: what || undefined }))
            }
            if (isTabVisible() && id && !isOwnAction) {
              const label = ticketLabel(t) || `#${id}`
              toastInfo(`Ticket ${label} updated${what ? ` — ${what}` : ''}`, { toastId: `ticket-updated-${id}` })
            }
          },
          'ticket.deleted': (p: any) => emitEvent('ticket.deleted', p),
          'ticket.comment.internal': (p: any) => {
            emitEvent('ticket.comment.internal', p)
            if (isTabVisible()) {
              const t = p?.ticket ?? p
              const label = ticketLabel(t) || `#${p?.ticketId ?? p?.id ?? ''}`
              const preview = commentPreview(p)
              toastInfo(`Internal note on ${label}${preview ? `: ${preview}` : ''}`, { toastId: `comment-internal-${p?.ticketId ?? p?.id}` })
            }
          },
          // No toast here — public channel handles it for everyone
          'ticket.comment.public': (p: any) => emitEvent('ticket.comment.public', p),
        })
        unsubs.push(u1)

        // subscribe to public tickets channel (no auth required)
        const pubChannel = 'public-tickets'
        const u2 = await subscribeMany(pubChannel, {
          'ticket.created': (p: any) => {
            emitEvent('ticket.created', p)
            const t = p?.ticket ?? p
            const id = t?.id ?? t?.ticketId ?? p?.ticketId
            if (id) {
              try { dispatch(addTicketRealtime({ ...t, id })) } catch (err) { /* ignore */ }
              dispatch(setTicketUpdated({ type: 'created', id, hash: t?.hash ?? p?.hash, title: t?.title ?? t?.heading }))
              if (isTabVisible()) {
                toastInfo(`New ticket created: ${ticketLabel({ ...t, id }) || `#${id}`}`, { toastId: `ticket-created-${id}` })
              }
            }
          },
          'ticket.updated': (p: any) => {
            // Skip generic "updated" toast for comment events — ticket.comment.public handles those
            if (p?.eventType === 'COMMENT_ADDED' || p?.eventType === 'FILE_UPLOADED') {
              emitEvent('ticket.updated', p)
              return
            }
            emitEvent('ticket.updated', p)
            const t = p?.ticket ?? p
            const id = t?.id ?? t?.ticketId ?? p?.ticketId
            const what = changesLabel(p?.changes ?? t?.changes)
            const isOwnAction = user && p?.actorId && Number(p.actorId) === Number(user.id)
            if (id) {
              dispatch(upsertTicketRealtime({ ...t, id }))
              if (!isOwnAction) dispatch(setTicketUpdated({ type: 'updated', id, hash: t?.hash ?? p?.hash, title: t?.title ?? t?.heading, subtitle: what || undefined }))
            }
            if (isTabVisible() && id && !isOwnAction) {
              const label = ticketLabel({ ...t, id }) || `#${id}`
              toastInfo(`Ticket ${label} updated${what ? ` — ${what}` : ''}`, { toastId: `ticket-updated-${id}` })
            }
          },
          'ticket.deleted': (p: any) => {
            emitEvent('ticket.deleted', p)
            const t = p?.ticket ?? p
            const id = t?.id ?? p?.ticketId ?? p?.id
            if (id) dispatch(removeTicketRealtime(id))
          },
          'ticket.comment.public': (p: any) => {
            emitEvent('ticket.comment.public', p)
            const n = p?.notification ?? p
            if (n && (n.id || n.hash)) dispatch(addNotification(n))
            const t = p?.ticket ?? p
            const id = t?.id ?? p?.ticketId ?? p?.id
            const preview = commentPreview(p)
            if (id) dispatch(setTicketUpdated({ type: 'comment', id, hash: t?.hash ?? p?.hash, title: t?.title ?? t?.heading, subtitle: preview || undefined }))
            const isOwnComment = user && p?.comment?.from && Number(p.comment.from) === Number(user.id)
            if (isTabVisible() && !isOwnComment) {
              const label = ticketLabel(t) || `#${p?.ticketId ?? ''}`
              toastInfo(`New comment on ${label}${preview ? `: ${preview}` : ''}`, { toastId: `comment-public-${id}` })
            }
          },
        })
        unsubs.push(u2)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[RealtimeProvider] subscription error', e)
      }
    })()

    return () => { unsubs.forEach((u) => { try { u() } catch {} }) }
  }, [user, init, subscribeMany, emitEvent, dispatch])

  // ensure disconnect on unmount
  useEffect(() => () => { try { disconnect() } catch {} }, [disconnect])

  return <>{children}</>
}
