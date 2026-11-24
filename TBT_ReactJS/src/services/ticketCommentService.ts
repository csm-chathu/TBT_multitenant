import api from './api';

export type TicketCommentType = 'public' | 'internal';

export interface TicketComment {
  id: number;
  ticket_id: number;
  comment: string;
  type: TicketCommentType;
  from?: number | null;
  remarks?: string | null;
  createdAt: string;
  updatedAt?: string;
  // Allow backend to include extra fields without breaking the UI
  [key: string]: any;
}

export interface CreateTicketCommentDto {
  comment: string;
  type?: TicketCommentType; // omit or 'public' = send SMS; 'internal' = no SMS
  remarks?: string;
  files?: File[];
}

export const getTicketComments = async (ticketId: number): Promise<TicketComment[]> => {
  const res = await api.get(`/tickets/${ticketId}/comments`);
  return res.data as TicketComment[];
};

export const createTicketComment = async (
  ticketId: number,
  payload: CreateTicketCommentDto,
): Promise<TicketComment> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    if (payload.comment) formData.append('comment', payload.comment);
    if (payload.type) formData.append('type', payload.type);
    if (payload.remarks) formData.append('remarks', payload.remarks);
    payload.files.forEach((file) => {
      formData.append('files', file);
    });
    const res = await api.post(`/tickets/${ticketId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data as TicketComment;
  }
  const res = await api.post(`/tickets/${ticketId}/comments`, payload);
  return res.data as TicketComment;
};


