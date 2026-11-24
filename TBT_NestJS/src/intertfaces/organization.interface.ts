export interface OrganizationAttributes {
  id?: number
  name: string
  email: string
  phone_number?: string
  address_line1?: string
  address_line2?: string
  city?: string
  status: string
  hash: string
  country_id?: number
  state_id?: number
  user_id?: number
}