export interface AgentAttributes {
  id?: number; // Optional for creation
  nickname?: string;
  first_name: string;
  last_name?: string;
  email: string;
  mobile_number?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  dob?: string;
  sex?: string;
  status: string;
  hash: string;
  description?: string;
  remarks?: string;
  data?: string;
  salutation_id?: number;
  user_id?: number;
  country_id?: number;
  state_id?: number;
  deletedAt?: Date | number | null;
  deletedReason?: string | null;
}
