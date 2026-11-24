import api from './api';

export interface CreateTicketHistoryDto {
  message: string;
  type: 'status_changed' | 'priority_changed' | 'assignee_changed' | 'ticket_created';
  status: string; // Required by backend - always include current ticket status
  priority?: string;
  assignee?: string | number;
  user_id?: number;
  ticket_id: number;
}

export interface TicketHistoryEntry {
  id?: number;
  message: string;
  type?: string;
  status?: string;
  priority?: string;
  assignee?: string | number;
  ticket_id?: number;
  createdAt?: string;
  created_at?: string;
  user_name?: string;
  user?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface TicketSmsCount {
  total: number;
  outbound: number;
  inbound: number;
}

export const getTicketSmsCount = async (ticketId: number): Promise<TicketSmsCount> => {
  const res = await api.get(`/tickets/${ticketId}/messages/count`);
  return res.data;
};

export const getTicketHistoryByTicketId = async (ticketId: number): Promise<TicketHistoryEntry[]> => {
  if (!ticketId) return [];
  const res = await api.get(`/ticket/history/by-ticket/${ticketId}`);
  const data = res.data;
  if (Array.isArray(data)) return data as TicketHistoryEntry[];
  if (Array.isArray(data?.data)) return data.data as TicketHistoryEntry[];
  return [];
};

const ensureStatus = (status?: string | null): string =>
  (status && status.trim().length > 0 ? status : 'Open');

let cachedUserId: number | undefined;
let userIdPromise: Promise<number | undefined> | null = null;

const fetchCurrentUserId = async (): Promise<number | undefined> => {
  try {
    const res = await api.get('/auth/me');
    const id =
      res?.data?.id ??
      res?.data?.user?.id ??
      res?.data?.user_id;
    return typeof id === 'number' ? id : undefined;
  } catch (err) {
    console.warn('Failed to fetch current user id for history:', err);
    return undefined;
  }
};

const getCurrentUserId = async (): Promise<number | undefined> => {
  if (cachedUserId !== undefined) return cachedUserId;
  if (userIdPromise) return userIdPromise;
  userIdPromise = fetchCurrentUserId().then((id) => {
    cachedUserId = id;
    userIdPromise = null;
    return id;
  });
  return userIdPromise;
};

export const createStatusChangeHistory = (params: {
  oldStatus: string;
  newStatus?: string | null;
  ticketId: number;
}): CreateTicketHistoryDto => {
  const nextStatus = ensureStatus(params.newStatus);
  const previousStatus = ensureStatus(params.oldStatus);
  return {
    message: `Ticket status changed from ${previousStatus} to ${nextStatus}`,
    type: 'status_changed',
    status: nextStatus,
    ticket_id: params.ticketId,
  };
};

export const createPriorityChangeHistory = (params: {
  oldPriorityLabel: string;
  newPriorityLabel: string;
  status?: string | null;
  priorityValue?: string;
  ticketId: number;
}): CreateTicketHistoryDto => {
  const status = ensureStatus(params.status);
  return {
    message: `Ticket priority changed from ${params.oldPriorityLabel} to ${params.newPriorityLabel}`,
    type: 'priority_changed',
    status,
    priority: params.priorityValue,
    ticket_id: params.ticketId,
  };
};

export const createAssigneeChangeHistory = (params: {
  oldAssigneeName: string;
  newAssigneeName?: string;
  status?: string | null;
  assigneeId?: string | number;
  ticketId: number;
}): CreateTicketHistoryDto => {
  const status = ensureStatus(params.status);
  const hasNewAssignee = !!params.newAssigneeName && params.newAssigneeName.trim().length > 0;
  const message = hasNewAssignee
    ? `Ticket assignee changed from ${params.oldAssigneeName} to ${params.newAssigneeName}`
    : `Ticket assignee removed (was ${params.oldAssigneeName})`;

  return {
    message,
    type: 'assignee_changed',
    status,
    assignee: params.assigneeId,
    ticket_id: params.ticketId,
  };
};

/**
 * Format priority value for display
 * @param priority - Priority value (string or number)
 * @returns Formatted priority string (e.g., "High", "Low")
 */
export const formatPriorityForDisplay = (priority: string | number | undefined | null): string => {
  if (!priority) return 'No Priority';
  
  if (typeof priority === 'string') {
    const normalized = priority.trim().toLowerCase();
    // Handle common priority strings
    const priorityMap: Record<string, string> = {
      '1': 'Low',
      '2': 'Medium',
      '3': 'High',
      '4': 'Critical',
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical',
    };
    
    return priorityMap[normalized] || priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  }
  
  // Handle numeric priority
  const priorityMap: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Critical',
  };
  
  return priorityMap[priority] || String(priority);
};

/**
 * Format priority value for API (lowercase string)
 * @param priority - Priority value (string or number)
 * @returns Lowercase priority string for API
 */
export const formatPriorityForAPI = (priority: string | number | undefined | null): string | undefined => {
  if (!priority) return undefined;
  
  if (typeof priority === 'string') {
    return priority.trim().toLowerCase();
  }
  
  // Convert numeric priority to lowercase string
  const priorityMap: Record<number, string> = {
    1: 'low',
    2: 'medium',
    3: 'high',
    4: 'critical',
  };
  
  return priorityMap[priority] || String(priority).toLowerCase();
};

/**
 * Create a ticket creation history message
 * @param ticketType - Type of ticket (e.g., "Cyber", "Help Desk")
 * @param status - Ticket status
 * @param priority - Ticket priority
 * @returns Formatted history message
 */
export const createTicketCreationMessage = (
  ticketType: string | undefined,
  status: string,
  priority: string
): string => {
  const priorityDisplay = formatPriorityForDisplay(priority);
  const typeSegment = ticketType ? ` (${ticketType})` : '';
  return `Ticket created${typeSegment} with status "${status}" and priority "${priorityDisplay}"`;
};

/**
 * Add a ticket history entry
 * This function silently handles errors to prevent history logging from breaking the main flow.
 * @param payload - The ticket history data
 */
export const addTicketHistory = async (payload: CreateTicketHistoryDto): Promise<void> => {
  try {
    const userId = await getCurrentUserId();
    const body: CreateTicketHistoryDto = {
      ...payload,
      ...(userId ? { user_id: userId } : {}),
    };
    await api.post('/ticket/history', body);
  } catch (error) {
    // Log error but don't throw - history logging should not break the main flow
    // Consider using a proper logging service in production
    console.error('Failed to add ticket history:', {
      error,
      payload: {
        ...payload,
        // Don't log full message to avoid sensitive data in logs
        message: payload.message.substring(0, 50) + '...',
      },
    });
  }
};

