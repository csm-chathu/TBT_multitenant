export interface InventoryItemLocationAttributes {
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
  deletedAt?: Date;
}
