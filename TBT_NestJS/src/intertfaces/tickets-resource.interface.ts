export interface TicketsResourceAttributes {
  id?: number
  file_mime_type: string
  file_path: string
  thumb_path?: string
  data?: string
  hash: string
  remarks?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  deletedAt?: boolean | number | null
  ticket_id: number
}