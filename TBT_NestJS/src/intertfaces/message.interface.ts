export interface MessageAttributes {
  id?: number
  from: string
  to: string
  message: string
  message_data?: string
  type?: string
  direction?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  customer_id?: number
  application_id?: number
  ticket_id?: number
}