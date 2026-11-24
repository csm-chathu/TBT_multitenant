export interface TicketInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface TicketInvoiceAttributes {
  id?: number;
  ticket_id: number;
  items?: TicketInvoiceItem[];
  extra_notes?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  attachments?: any[];
  createdAt?: number | Date;
  updatedAt?: number | Date;
}
