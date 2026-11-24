export interface TicketCommentAttributes {
  id?: number;
  comment?: string;
  data?: string;
  remarks?: string;
  type?: string;
  resources?: string;
  createdAt?: number | Date;
  updatedAt?: number | Date;
  ticket_id?: number;
  parent_id?: number;
  from?: number;
  to?: number;
}
