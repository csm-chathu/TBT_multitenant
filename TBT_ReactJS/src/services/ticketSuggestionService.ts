import api from './api';

export interface TicketSugestion {
  body(body: any): unknown;
  markdown: string;
  Answer: string;
}

export interface ChatTurn {
  sender: 'user' | 'assistant';
  message: string;
}

export const getTicketSuggestion = async (ticketId: string | undefined): Promise<TicketSugestion[]> => {
  const res = await api.get(`/ticket/${ticketId}/suggestion/call`);
  return res.data as TicketSugestion[];
};

export const sendTicketAiChatMessage = async (
  ticketId: string | undefined,
  userMessage: string,
  history: ChatTurn[]
): Promise<any> => {
  const res = await api.post(`/ticket/${ticketId}/suggestion/chat`, {
    userMessage,
    history,
  });
  return res.data;
};

