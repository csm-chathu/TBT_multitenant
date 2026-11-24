export interface TicketStatsAttributes {
  id?: number;
  date?: string;
  type?: string;
  role_user_id?: number;
  day_stats?: string;
  week_stats?: string;
  month_stats?: string;
  year_stats?: string;
  all_stats?: string;
  hash?: string;
  remarks?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
}
