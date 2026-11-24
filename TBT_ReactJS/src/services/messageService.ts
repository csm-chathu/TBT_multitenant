import api from './api';

export type MessageStatus = 'SENT' | 'FAILED' | 'RECEIVED' | 'QUEUED' | 'STORED';

export interface BaseMessageDto {
  to?: string; // E.164 format e.g. +16262098347
  message: string;
  ticket_id?: number; // helps backend link to customer/application
}

export interface CustomerInfo {
  id: number;
  first_name: string;
  last_name: string;
}

export interface ApplicationInfo {
  id: number;
  name?: string;
  [key: string]: any;
}

export interface MessageRecord {
  id: number;
  dateCreated?: string; // Legacy field, prefer createdAt
  createdAt?: string;
  updatedAt?: string;
  from: string;
  to: string;
  type: string; // e.g. 'email', 'SMS'
  message: string;
  message_data?: string; // JSON string
  direction?: 'inbound' | 'outbound' | 'incoming' | 'outgoing';
  status?: MessageStatus; // Optional, may use direction instead
  customer_id?: number | null;
  application_id?: number | null;
  ticket_id?: number | null;
  customer?: string | null | CustomerInfo; // Can be string or object
  customer_name?: string; // Computed field from backend
  application?: string | null | ApplicationInfo; // Can be string or object
  Customer?: CustomerInfo | null; // Nested object from API
  Application?: ApplicationInfo | null; // Nested object from API
  // Allow backend to include extra fields without breaking the UI
  [key: string]: any;
}

const API_URL = '/messages';

// Fallback mock data so UI still renders if API is unavailable
const mockMessages: MessageRecord[] = [
  {
    id: 1,
    createdAt: new Date().toISOString(),
    from: '+16262098347',
    to: '+16262098347',
    type: 'SMS',
    message: 'TBT (eLifeAmerica) : Sample. Use @25 always when reply to this ticket. - Reply HELP for help or STOP to unsubscribe',
    direction: 'incoming',
    status: 'RECEIVED',
    customer_name: 'N/A',
    application: 'N/A',
    ticket_id: 25,
  },
];

export const getAllMessages = async (): Promise<MessageRecord[]> => {
  try {
    const res = await api.get(API_URL);
    return res.data as MessageRecord[];
  } catch (error) {
    console.warn('Messages API not available, using mock data:', error);
    return new Promise((resolve) => setTimeout(() => resolve(mockMessages), 300));
  }
};

export const getMessagesByTicketId = async (ticketId: number): Promise<MessageRecord[]> => {
  try {
    const res = await api.get(`/tickets/${ticketId}/messages`);
    return res.data as MessageRecord[];
  } catch (error) {
    console.warn('Ticket messages API not available, returning empty list:', error);
    return [];
  }
};

export const createMessage = async (payload: BaseMessageDto): Promise<MessageRecord> => {
  try {
    const res = await api.post(API_URL, payload);
    return res.data as MessageRecord;
  } catch (error) {
    console.warn('Create message API not available, simulating store:', error);
    const stub: MessageRecord = {
      id: Math.floor(Math.random() * 100000),
      dateCreated: new Date().toLocaleString(),
      from: '+16262098347',
      to: payload.to || '+10000000000',
      type: 'SMS',
      message: payload.message,
      status: 'STORED',
      ticket_id: payload.ticket_id ?? null,
      customer: 'N/A',
      application: 'N/A',
    };
    return new Promise((resolve) => setTimeout(() => resolve(stub), 200));
  }
};

export const sendMessage = async (payload: BaseMessageDto): Promise<MessageRecord> => {
  // Removed external send endpoint; we now only store the message
  return await createMessage(payload);
};

// Helper: format a ticket reply message in the required template
// Backend will append the ticket instructions and unsubscribe text
export const formatTicketReplyMessage = (body: string): string => {
  return `TBT (eLifeAmerica) : ${body} `;
};

// Convenience: send and store a ticket reply using the standardized format
export const sendTicketReplyMessage = async (
  params: { to?: string; body: string; ticketId?: number }
): Promise<MessageRecord> => {
  const message = formatTicketReplyMessage(params.body);
  return await sendMessage({ message, to: params.to, ticket_id: params.ticketId });
};