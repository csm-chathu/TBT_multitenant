import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { NotificationRecord } from '@/services/notificationService'

interface NotificationState {
  items: NotificationRecord[]
  loading: boolean
  error?: string | null
}

const initialState: NotificationState = {
  items: [],
  loading: false,
  error: null,
}

const normalize = (n: any): NotificationRecord => {
  if (!n) return n
  // Parse data if it's a JSON string
  let parsedData = n.data
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData)
    } catch {
      // leave as string if parse fails
    }
  }

  const isRead = typeof n.isRead === 'boolean' ? n.isRead : (typeof n.read === 'boolean' ? n.read : (String(n.status || '').toLowerCase() === 'read'))

  return {
    ...n,
    data: parsedData,
    isRead,
  }
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<NotificationRecord[]>) {
      state.items = (action.payload || []).map((n) => normalize(n))
      state.error = null
    },
    addNotification(state, action: PayloadAction<NotificationRecord>) {
        state.items = [normalize(action.payload), ...state.items]
    },
      updateNotification(state, action: PayloadAction<NotificationRecord>) {
        const incoming = normalize(action.payload)
        if (!incoming) return
        // try to find by id or hash
        const idx = state.items.findIndex((n) => (n.id !== undefined && incoming.id !== undefined && String(n.id) === String(incoming.id)) || (n.hash && incoming.hash && String(n.hash) === String(incoming.hash)))
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...incoming }
        } else {
          // prepend if not found
          state.items = [incoming, ...state.items]
        }
      },
    markAllRead(state) {
      state.items = state.items.map((n) => ({ ...n, isRead: true }))
    },
    markAsRead(state, action: PayloadAction<string | number>) {
      const id = action.payload
      state.items = state.items.map((n) => {
        if (n.id === id || String(n.id) === String(id)) return { ...n, isRead: true }
        return n
      })
    },
    clearNotifications(state) {
      state.items = []
    },
  },
})

export const { setNotifications, addNotification, updateNotification, markAllRead, markAsRead, clearNotifications } = notificationSlice.actions

export const selectNotifications = (state: any) => state.notifications?.items ?? []
export const selectNotificationsLoading = (state: any) => state.notifications?.loading

export default notificationSlice.reducer
