export interface Customer {
  id?: number; 
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile_number?: string;
  phone_number?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  dob?: string;
  sex?: string;
  status?: string;
  hash?: string;
  description?: string;
  remarks?: string;
  data?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  salutation_id?: number;
  user_id?: number;
  country_id?: number;
  state_id?: number;
  first_ticket_id?: number;
  customer_code?: string;
  tag?: string;
  // Optional nested relations returned by API includes
  country?: {
    id?: number;
    name?: string;
  };
  Country?: {
    id?: number;
    name?: string;
  };
  state?: {
    id?: number;
    name?: string;
  };
  State?: {
    id?: number;
    name?: string;
  };
}
