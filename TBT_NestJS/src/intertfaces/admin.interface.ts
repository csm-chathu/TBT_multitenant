export interface AdminAttributes {
  id?: number
  first_name: string
  last_name: string
  email: string
  mobile_number?: string
  phone_number?: string
  address_line1?: string
  address_line2?: string
  city?: string
  dob?: Date
  sex?: string
  status: string
  hash: string
  salutation_id?: number
  user_id?: number
  country_id?: number
  state_id?: number
}