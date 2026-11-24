import api from './api';

export interface TicketInvoiceItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface TicketInvoice {
  id: number;
  ticket_id: number;
  items: TicketInvoiceItem[];
  extra_notes?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  attachments?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTicketInvoicePayload {
  ticket_id?: number;
  items?: TicketInvoiceItem[];
  extra_notes?: string;
  subtotal?: number;
  tax_rate?: number;
  tax_amount?: number;
  total?: number;
  attachments?: any[];
}

export type UpdateTicketInvoicePayload = Partial<CreateTicketInvoicePayload>;

export const ticketInvoiceApi = {
  getInvoice: async (ticketId: number): Promise<TicketInvoice | null> => {
    try {
      const response = await api.get(`/tickets/${ticketId}/invoice`);
      return response.data;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        return null; // No invoice exists
      }
      throw error;
    }
  },
    
  createInvoice: async (ticketId: number, payload: CreateTicketInvoicePayload): Promise<TicketInvoice> => {
    const response = await api.post(`/tickets/${ticketId}/invoice`, payload);
    return response.data;
  },
    
  updateInvoice: async (ticketId: number, invoiceId: number, payload: UpdateTicketInvoicePayload): Promise<{ success: boolean }> => {
    const response = await api.put(`/tickets/${ticketId}/invoice/${invoiceId}`, payload);
    return response.data;
  },
    
  deleteInvoice: async (ticketId: number, invoiceId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/tickets/${ticketId}/invoice/${invoiceId}`);
    return response.data;
  },
  
  uploadAttachment: async (ticketId: number, file: File): Promise<{ url: string, key?: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/tickets/${ticketId}/invoice/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
