export interface AuthKeyAttributes {
  id?: number
  secret_key?: string
  name?: string
  status?: boolean
  description?: string
  remarks?: string
  data?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  organization_id?: number
}