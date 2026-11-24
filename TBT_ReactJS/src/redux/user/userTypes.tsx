export interface User {
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  [key: string]: any; // Allow for additional fields from backend
}

