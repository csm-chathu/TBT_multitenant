export interface TicketAttributes {
  id?: number
  title: string
  body?: string
  init_message?: number
  ticket_template_id?: number
  device_id?: number
  status?: string
  priority: string
  data?: string
  additinal_data?: string
  hash: string
  remarks?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  customer_id?: number
  agent_id?: number
  application_id: number
  alert_id?: number
  serialNo?: string
  ticketType?: string
  attachments?: string[]
  reporter_id?: number
  multiple_assignees?: number[]
  action_types?: number[] | string[] | Array<{ id: number; name: string }>
  read_at?: Date | null
}