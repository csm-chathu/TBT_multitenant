import Button from '@/components/Atomic/Button'
import React, { useRef } from 'react'
import UserAvatar from './UserAvatar'
import { useAppSelector, useAppDispatch } from '@/redux/hooks'
import { selectNotifications, markAllRead, markAsRead, setNotifications } from '@/redux/notification/notificationSlice'
import { useNavigate } from 'react-router-dom'
import { fetchNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/notificationService'
import { selectCurrentUser } from '@/redux/user/userSlice'
import { useEffect, useState } from 'react'

export const NotificationPopover = () => {
  const [Popover, setPopOver] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<'all' | 'unread'>('all')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector(selectCurrentUser)
  const [loading, setLoading] = useState(false)

  const notifications = useAppSelector(selectNotifications)
  
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  // Close popover on outside click
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setPopOver(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  const relevantUnreadCount = React.useMemo(() => notifications.filter((n:any) => !n.isRead).length, [notifications, user])
// console.log(notifications,relevantUnreadCount);

  // sort notifications: unread first, then by newest createdAt
  const sortedNotifications = React.useMemo(() => {
    if (!notifications) return []
    return [...notifications].sort((a: any, b: any) => {
      const aTime = new Date(a.createdAt || a.data?.payload?.comment?.createdAt || 0).getTime()
      const bTime = new Date(b.createdAt || b.data?.payload?.comment?.createdAt || 0).getTime()
      return bTime - aTime // newest first (createdAt DESC)
    })
  }, [notifications])


  const handleMarkAll = () => {
    // Optimistically update UI then call API
    dispatch(markAllRead())
    // Fire-and-forget API call to persist read state
    markAllNotificationsRead().catch((err) => {
      console.warn('markAllNotificationsRead failed', err)
    })
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification) return
    const id = notification.id ?? notification.hash ?? undefined
    if (id !== undefined) {
      // Only call mark-read if notification is not already read
      const alreadyRead = Boolean(notification.isRead)
      if (!alreadyRead) {
        // Optimistically mark read in UI
        dispatch(markAsRead(id))
        // Persist read state to backend (non-blocking)
        markNotificationRead(id).catch((err) => {
          console.warn('markNotificationRead failed', err)
        })
      }
    }
    console.log(notification);
    
    // try to resolve ticket id from several possible locations
    const ticketId = notification?.data?.ticket?.hash || null; 
    console.log(notification);
    
    if (ticketId) {
      // navigate to ticket details page if available
      navigate(`/dashboard/tickets/details/${ticketId}`)
    }
  }

  // Shared loader so we can fetch on mount and also refresh when popover opens
  const loadNotifications = React.useCallback(async (showLoading = false) => {
    if (!user) return
    try {
      if (showLoading) setLoading(true)
      // When explicitly loading (popover open), request a larger page so
      // new notifications are included. For background loads keep default.
      const res = await fetchNotifications(showLoading ? 100 : undefined)
      const normalized = (Array.isArray(res.notifications) ? res.notifications : []).map((n: any) => {
        const comment = n?.data?.payload?.comment
        const title = typeof n.message === 'string' ? n.message : n.message?.title ?? n.title ?? (comment ? `Ticket #${comment.ticket_id} update` : 'Notification')
        const createdAt = n.createdAt ?? comment?.createdAt ?? comment?.updatedAt ?? undefined
        const isRead = typeof n.isRead === 'boolean' ? n.isRead : (typeof n.read === 'boolean' ? n.read : (String(n.status || '').toLowerCase() === 'read'))
        return {
          ...n,
          title,
          createdAt,
          isRead,
        }
      })
      dispatch(setNotifications(normalized))
    } catch (err) {
      console.warn('Failed to fetch notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user, dispatch])

  // Fetch on mount / when user changes so the badge is present without opening the popover
  // useEffect(() => {
  //   loadNotifications(false)
  // }, [loadNotifications])

  // Also refresh when the popover opens (show loading indicator)
  useEffect(() => {
     loadNotifications(true)
  }, [ loadNotifications])

  // Subscribe to realtime comment events while the user is logged in.
  // Previously we only subscribed when the popover was open; subscribe
  // globally so the notification list is refreshed when events arrive.
  // useRealtimeNotifications({ enabled: Boolean(user), fetchOnEvent: true })

  return (
    <div className='relative' ref={notificationsRef}>
        <div className='relative'>
        <Button onClick={() => setPopOver(!Popover)} className={Popover ? 'bg-primary-100 text-textColor-base' : 'bg-none'} icon="notifications" style="Icon" />
        {relevantUnreadCount > 0 && (
          <span aria-label={`${relevantUnreadCount} unread notifications`} className='absolute -top-0 -right-0 bg-danger-600 text-white rounded-full px-1 text-xs flex items-center justify-center'>{relevantUnreadCount}</span>
        )}
      </div>
      {
        Popover &&
        <div className='absolute right-0 top-[52px] z-20 w-full md:w-[460px] md:max-h-[600px] md:min-h-[600px] bg-surface-primary border border-borderColor-secondary rounded-md shadow-2xl overflow-y-auto'>
          {/* Header */}
          <div>
            <div className='p-4 flex items-center justify-between '>
              <h3 className='text-xl font-medium'>Notification</h3>
              <div className='flex items-center gap-2'>
                <Button text='Mark all as Read' style='Tertiary' onClick={handleMarkAll} />
                {/* <Button icon='settings' style='Icon' href='/dashboard/settings/notification' /> */}
              </div>
            </div>
            <div className='border-b border-borderColor-secondary '>
              {/* Tabs */}
              <div className='px-4 '>
                <div className='flex gap-2 rounded-md bg-transparent'>
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 text-sm ${activeTab === 'all' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-textColor-muted'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('unread')}
                    className={`px-3 text-sm ${activeTab === 'unread' ? 'text-primary-600 border-b-2 border-primary-500' : 'text-textColor-muted'}`}
                  >
                    Unread
                  </button>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className='p-4'>
              {loading ? (
                <div className='text-sm text-textColor-muted'>Loading notifications...</div>
              ) : activeTab === 'all' ? (
                <div>
                  {sortedNotifications.length === 0 ? (
                    <p className='text-sm text-textColor-muted'>No notifications yet.</p>
                  ) : (
                    sortedNotifications.map((notification: any) => {
                    const comment = notification.data?.comment?.comment || 'Ticket Created or updated'
                    const displayTitle = notification.title ?? (typeof notification.message === 'string' ? notification.message : notification.message?.title) ?? (comment ? comment.comment ?? `Ticket #${comment.ticket_id} update` : 'Notification')
                    // const displayTitle = notification.title ?? (typeof notification.message === 'string' ? notification.message : notification.message?.title) ?? (comment ? comment.comment ?? `Ticket #${comment.ticket_id} update` : 'Notification')
                    const displayTime = notification.createdAt ?? comment?.createdAt ?? comment?.updatedAt
                    return (
                      <div
                        key={String(notification.id)}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notification)}
                        className='flex gap-4 border-b border-borderColor-secondary py-4 cursor-pointer hover:bg-surface-tertiary'
                      >
                        <UserAvatar background="#0AA60F" small name={displayTitle ? String(displayTitle).slice(0,1) : 'N'} />
                        <div className='flex-1'>
                          <h6 className={` ${notification.isRead ? 'text-textColor-muted': 'text-textColor-base'} `}>{displayTitle}</h6>
                          {comment && (<p className='text-sm text-textColor-muted'>{comment ?? ''}</p>)}
                          <p className='text-sm text-textColor-muted'>{displayTime ? new Date(String(displayTime)).toLocaleString() : ''}</p>
                        </div>
                        <span className={` ${notification.isRead ? 'bg-transparent': 'bg-info-500'} h-2 w-2 block mt-2 rounded-full`}></span>
                      </div>
                    )
                    })
                  )}
                </div>
              ) : (
                <div>
                  {sortedNotifications.filter((n: any) => !n.isRead ).length === 0 ? (
                    <p className='text-sm text-textColor-muted'>No unread notifications.</p>
                  ) : (
                    sortedNotifications.filter((n: any) => !n.isRead ).map((notification: any) => {
                      const comment = notification.data?.comment?.comment || 'Ticket Created or updated'
                      const displayTitle = notification.title ?? (typeof notification.message === 'string' ? notification.message : notification.message?.title) ?? (comment ? comment.comment ?? `Ticket #${comment.ticket_id} update` : 'Notification')
                      const displayTime = notification.createdAt ?? comment?.createdAt ?? comment?.updatedAt ?? notification
                      return (
                        <div
                          key={String(notification.id)}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleNotificationClick(notification)}
                          className='flex gap-4 border-b border-borderColor-secondary py-4 cursor-pointer hover:bg-surface-tertiary'
                        >
                          <UserAvatar background="#0AA60F" small name={displayTitle ? String(displayTitle).slice(0,1) : 'N'} />
                          <div className='flex-1'>
                            <h6 className={` ${notification.isRead ? 'text-textColor-muted': 'text-textColor-base'} `}>{displayTitle}</h6>
                            <p className='text-sm text-textColor-muted'>{displayTime ? new Date(String(displayTime)).toLocaleString() : ''}</p>
                          </div>
                          <span className={` ${notification.isRead ? 'bg-transparent': 'bg-info-500'} h-2 w-2 block mt-2 rounded-full`}></span>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      }
    </div>
  )
}
