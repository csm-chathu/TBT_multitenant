export interface TicketHistoryAttributes {
  id?: number
  message: string
  type: string
  action?: string
  status: string
  user_id?: number
  user_data?: string
  previous_data?: string
  new_data?: string
  data?: string
  remarks?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  ticket_id: number
  role_id?: number
}
