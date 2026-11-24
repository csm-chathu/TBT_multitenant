export interface Location {
  id?: number; // Optional for creation
  name?: string;
  label?: string;
  description?: string;
  remarks?: string;
  address?: string;
  hash?: string;
  data?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  country_id?: number;
  organization_id?: number;
  // Optional denormalized display fields
  country?: string;
  organization?: string;
  // Optional nested relations returned by API includes
  Country?: {
    id?: number;
    name?: string;
  };
  Organization?: {
    id?: number;
    name?: string;
  };
}
