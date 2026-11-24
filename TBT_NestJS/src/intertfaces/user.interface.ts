import { RoleAttributes } from './role.interface'

export interface UserAttributes {
  id?: number
  name?: string
  email: string
  mobile_number?: string
  username?: string
  password?: any
  status: string
  hash: string
  remember_token?: string
  emailStatus?: string
  user_id?: number
  phoneStatus?: string
  email_verified_at?: number
  phone_verified_at?: number
  passwordResetToken?: string
  passwordResetTokenExpiresAt?: number
  emailProofToken?: string
  emailProofTokenExpiresAt?: number
  phoneProofToken?: string
  phoneProofTokenExpiresAt?: number
  lastSeenAt?: number
  isPasswordSet?: boolean
  tosAcceptedByIp?: string
  roles?: Array<{ id?: number; name?: string; label?: string }>
  deletedAt?: number | Date | null
  deletedReason?: string | null
}