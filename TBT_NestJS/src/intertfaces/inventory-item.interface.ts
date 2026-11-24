export interface InventoryItemAttributes {
  id?: number; // Optional for creation
  user?: string;
  name?: string;
  description?: string;
  condition?: string;
  ownership?: string;
  serialNo?: string;
  hash?: string;
  ipAddress?: string;
  purchasedAt?: string;
  data?: string;
  remarks?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  category_id?: number;
  brand_id?: number;
  location_id?: number;
  user_id?: number;
  deletedAt?: Date;
}
