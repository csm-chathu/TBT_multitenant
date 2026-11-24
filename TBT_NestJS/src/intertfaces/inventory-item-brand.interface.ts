export interface InventoryItemBrandAttributes {
  id?: number; // Optional for creation
  name?: string;
  label?: string;
  description?: string;
  remarks?: string;
  hash?: string;
  data?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  deletedAt?: Date;
}
