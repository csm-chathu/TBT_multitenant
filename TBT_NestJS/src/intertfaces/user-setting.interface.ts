export interface UserSettingsAttributes {
  id?: number
  settings?: string
  createdAt?: number | Date
  updatedAt?: number | Date
  user_id?: number
  organization_id?: number
  application_id?: number
}