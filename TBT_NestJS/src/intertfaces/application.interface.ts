export interface ApplicationAttributes {
  id?: number // Optional for creation
  name?: string
  service_email?: string
  service_phone_number?: string
  status?: string
  description?: string
  remarks?: string
  hash?: string
  organization_id: number
  organization?: {
    id: number
    name: string
    email: string
    status: string
  }
}
