export interface Application {
  id?: number 
  name?: string
  service_email?: string
  service_phone_number?: string
  status?: string
  description?: string
  remarks?: string
  hash?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  organization_id?: number
  organization?: {
    id?: number
    name?: string
    email?: string
    status?: string
  }
}