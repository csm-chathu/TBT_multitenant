export interface TeamRolesAttributes {
  id?: number; // Optional for creation
  name?: string;
  label?: string;
  data?: string;
  remarks?: string;
  team_id?: number;
  role_id?: number;
  createdAt?: number | Date;
  updatedAt?: number | Date;
}
