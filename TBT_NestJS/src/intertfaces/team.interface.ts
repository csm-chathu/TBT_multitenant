export interface TeamAttributes {
  id?: number;
  name: string;
  email: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  status: string;
  hash: string;
  data?: string;
  description?: string;
  remarks?: string;
  application_id?: number;
  application?: {
    id: number;
    name?: string;
  };
  leader_id?: number;
  leader_name?: string;
  deletedAt?: Date | number | null;
  deletedReason?: string | null;
}

// Removed TeamWithApplicationAttributes; merged application into TeamAttributes