export interface Item {
  id?: number; 
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
  category?: string;
  brand?: string;
  location?: {
    id?: number;
    name?: string;
  };
  InventoryItemCategory?: {
    name?: string;
  };
  InventoryItemBrand?: {
    name?: string;
  };
  InventoryItemLocation?: {
    id?: number;
    name?: string;
  };
}