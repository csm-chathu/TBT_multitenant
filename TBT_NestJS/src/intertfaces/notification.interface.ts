export interface NotificationAttributes {
  id?: number
  message?: string
  hash?: string
  data?: string | Record<string, unknown>
  status?: string
  // convenience boolean for API consumers: true when status === 'read'
  isRead?: boolean
  level?: string
  type?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  user_id?: number
  ticket_id?: number
  // Optional secondary target user (e.g. assigned agent user.id)
  target_user_id?: number
}