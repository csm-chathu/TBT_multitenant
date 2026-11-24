import { Ticket, UpdateTicketDto, CreateTicketDto } from '@/redux/ticket/ticketTypes';
import api from './api';
import { uploadTicketResource } from './ticketResourceService';
import { 
  addTicketHistory, 
  createTicketCreationMessage, 
  formatPriorityForAPI 
} from './ticketHistoryService';

const API_URL = '/tickets';

export interface TicketFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  // Backend supports query params like: /tickets?status=open&priority=high
  status?: string;
  priority?: string;
  agentId?: number | string;
  device?: string;
  deviceId?: number;
  locationId?: number;
  page?: number;
  limit?: number;
  actionType?: string;
  search?: string;
  isUnread?: boolean;
  customerId?: number;
}

export interface PaginatedTickets {
  data: Ticket[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TicketCounts {
  assigned: number
  inProgress: number
  onHold: number
  resolved: number
  closed: number
  total: number
  priorityByStatus: Record<string, { low: number; medium: number; high: number; critical: number }>
  allPriorityCounts: { low: number; medium: number; high: number; critical: number }
}

export const getTicketCounts = async (filters?: {
  startDate?: string
  endDate?: string
  agentId?: number
}): Promise<TicketCounts> => {
  const params: Record<string, string> = {}
  if (filters?.startDate) params.startDate = filters.startDate
  if (filters?.endDate) params.endDate = filters.endDate
  if (filters?.agentId) params.agentId = String(filters.agentId)
  const res = await api.get(`${API_URL}/counts`, { params })
  return res.data
}

export const getAllTickets = async (filters?: TicketFilters): Promise<Ticket[] | PaginatedTickets> => {
  const params: Record<string, string> = {};

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Add date range filters if provided
  if (filters?.startDate) {
    params.startDate = formatDate(filters.startDate);
  }
  if (filters?.endDate) {
    params.endDate = formatDate(filters.endDate);
  }

  // Add backend status / priority filters if provided
  if (filters?.status) {
    params.status = filters.status;
  }
  if (filters?.priority) {
    params.priority = filters.priority;
  }
  if (filters?.agentId !== undefined && filters?.agentId !== null && String(filters.agentId).trim() !== '') {
    // Backend expects camelCase agentId query param
    params.agentId = String(filters.agentId).trim();
  }
  if (filters?.device) {
    params.device = filters.device;
  }
  if (filters?.deviceId !== undefined && filters?.deviceId !== null && !isNaN(filters.deviceId)) {
    params.deviceId = String(filters.deviceId);
  }
  if (filters?.locationId !== undefined && filters?.locationId !== null && !isNaN(filters.locationId)) {
    params.locationId = String(filters.locationId);
  }
  if (filters?.page) {
    params.page = String(filters.page);
  }
  if (filters?.limit) {
    params.limit = String(filters.limit);
  }
  if (filters?.actionType) {
    params.actionType = filters.actionType;
  }
  if (filters?.search && filters.search.trim().length >= 3) {
    params.search = filters.search.trim();
  }
  if (filters?.isUnread) {
    params.isUnread = 'true';
  }
  if (filters?.customerId !== undefined && filters.customerId !== null) {
    params.customerId = String(filters.customerId);
  }

  const response = await api.get(API_URL, { params });
  return response.data;
};

export const getTicketById = async (id: number): Promise<Ticket> => {
  const response = await api.get(`${API_URL}/${id}`);
  return response.data;
};

export const getTicketByHash = async (hash: string): Promise<Ticket> => {
  const response = await api.get(`${API_URL}/hash/${hash}`);
  return response.data;
};

// Enriched ticket with attachments and resources
export interface EnrichedTicketResponse {
  id: number;
  attachments?: string[];
  resources?: Array<{
    id?: number;
    hash: string; // S3 URL or key per backend suggestion
    file_mime_type?: string;
    originalName?: string;
  }>;
  // plus other ticket fields we may not need here
}

export const getEnrichedTicketById = async (id: number): Promise<EnrichedTicketResponse> => {
  const response = await api.get(`/tickets/enriched/${id}`);
  return response.data;
};

export const getAllEnrichedTickets = async (filters?: TicketFilters): Promise<EnrichedTicketResponse[]> => {
  const params: Record<string, string> = {};

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  if (filters?.startDate) params.startDate = formatDate(filters.startDate);
  if (filters?.endDate) params.endDate = formatDate(filters.endDate);
  if (filters?.status) params.status = filters.status;
  if (filters?.priority) params.priority = filters.priority;
  if (filters?.agentId !== undefined && filters?.agentId !== null && String(filters.agentId).trim() !== '') {
    params.agentId = String(filters.agentId).trim();
  }
  if (filters?.device) params.device = filters.device;
  if (filters?.deviceId !== undefined && filters?.deviceId !== null && !isNaN(filters.deviceId)) {
    params.deviceId = String(filters.deviceId);
  }
  if (filters?.locationId !== undefined && filters?.locationId !== null && !isNaN(filters.locationId)) {
    params.locationId = String(filters.locationId);
  }
  if (filters?.page) {
    params.page = String(filters.page);
  }
  if (filters?.limit) {
    params.limit = String(filters.limit);
  }
  if (filters?.actionType) {
    params.actionType = filters.actionType;
  }

  const response = await api.get('/tickets/enriched', { params });
  return response.data;
};

// New interface for S3 file upload ticket creation
export interface CreateTicketWithFilesPayload {
  title: string;
  priority: string;
  hash: string;
  application_id: number;
  // Optional camelCase alias if a caller prefers it; will be mapped to ticketType
  ticketType?: string;
  body?: string;
  status?: string;
  customer_id?: number;
  reporter_id?: number;
  // Contact numbers for reporting/notification (backend may accept either)
  mobile_number?: string;
  phone_number?: string;
  customer_email?: string;
  agent_id?: number;
  device_id?: number;
  ticket_template_id?: number;
  serialNo?: string;
  additional_data?: string;
  multiple_assignees?: number[];
  files?: File[];
}

export const createTicket = async (data: CreateTicketDto | any): Promise<Ticket> => {
  const response = await api.post(API_URL, data);
  const created = response.data as Ticket;
  
  // Add ticket creation history entry (non-blocking)
  const ticketId = created.id ?? created.ticketId;
  if (ticketId) {
    const status = data.status || created.status || 'Open';
    const priority = String(data.priority || created.priority || '');
    const ticketType = data.ticketType || created.ticketType;
    
    const message = createTicketCreationMessage(ticketType, status, priority);
    
    // History logging is non-blocking - errors won't break ticket creation
    addTicketHistory({
      message,
      type: 'ticket_created',
      status: status, // Status is required by backend
      priority: formatPriorityForAPI(priority),
      ticket_id: ticketId,
    }).catch((error) => {
      // Additional error handling if needed (already handled in addTicketHistory)
      console.warn('Ticket created but history logging failed:', error);
    });
  }
  
  return created;
};

// New function for S3 file upload integration
export const createTicketWithFiles = async (payload: CreateTicketWithFilesPayload): Promise<Ticket> => {
  // Validate required fields before making the request
  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim() === '') {
    throw new Error('Ticket title is required and must be a non-empty string.');
  }
  if (!payload.priority || typeof payload.priority !== 'string' || payload.priority.trim() === '') {
    throw new Error('Ticket priority is required and must be a non-empty string.');
  }
  if (!payload.hash || typeof payload.hash !== 'string' || payload.hash.trim() === '') {
    throw new Error('Ticket hash is required and must be a non-empty string.');
  }
  if (
    payload.application_id === undefined ||
    payload.application_id === null ||
    typeof payload.application_id !== 'number' ||
    isNaN(payload.application_id)
  ) {
    throw new Error('application_id is required and must be a valid number.');
  }

  try {
    // Post the ticket as JSON to satisfy backend validators
    const body: Record<string, any> = {
      title: payload.title,
      priority: payload.priority,
      hash: payload.hash,
      application_id: payload.application_id,
    };

    if (payload.body) body.body = payload.body;
    if (payload.status) body.status = payload.status;
    // forward contact numbers if provided
    if (payload.mobile_number && String(payload.mobile_number).trim() !== '') body.mobile_number = payload.mobile_number;
    if (payload.phone_number && String(payload.phone_number).trim() !== '') body.phone_number = payload.phone_number;
    if (payload.customer_email && String(payload.customer_email).trim() !== '') body.customer_email = payload.customer_email;
  if (typeof payload.customer_id === 'number' && !Number.isNaN(payload.customer_id)) body.customer_id = payload.customer_id;
  if (typeof payload.reporter_id === 'number' && !Number.isNaN(payload.reporter_id)) body.reporter_id = payload.reporter_id;
    if (typeof payload.agent_id === 'number' && !Number.isNaN(payload.agent_id)) body.agent_id = payload.agent_id;
    if (typeof payload.device_id === 'number' && !Number.isNaN(payload.device_id)) body.device_id = payload.device_id;
    if (typeof payload.ticket_template_id === 'number' && !Number.isNaN(payload.ticket_template_id)) body.ticket_template_id = payload.ticket_template_id;

    // Send any custom structured info as `data` if present
    if (payload.serialNo) body.data = payload.serialNo;
    if (payload.additional_data) body.additional_data = payload.additional_data;
    if (payload.multiple_assignees) body.multiple_assignees = payload.multiple_assignees;

    // Map ticket type to camelCase key expected by backend/UI
    if ('ticketType' in payload) {
      // If provided (even empty), include the key
      body.ticketType = (payload as any).ticketType ?? "";
    } else if (typeof payload.ticketType === 'string') {
      body.ticketType = payload.ticketType;
    }

    const response = await api.post(API_URL, body);
    const created = response.data as Ticket | any;

    // Upload files after ticket creation (if any)
    const ticketId: number | undefined = (created?.id ?? created?.ticketId) 
      ? Number(created.id ?? created.ticketId) 
      : undefined;

    // Add ticket creation history entry (non-blocking)
    if (ticketId) {
      const status = payload.status || created.status || 'Open';
      const priority = String(payload.priority || created.priority || '');
      const ticketType = payload.ticketType || created.ticketType;
      
      const message = createTicketCreationMessage(ticketType, status, priority);
      
      // History logging is non-blocking - errors won't break ticket creation
      addTicketHistory({
        message,
        type: 'ticket_created',
        status: status, // Status is required by backend
        priority: formatPriorityForAPI(priority),
        assignee: payload.agent_id || undefined,
        ticket_id: ticketId,
      }).catch((error) => {
        // Additional error handling if needed (already handled in addTicketHistory)
        console.warn('Ticket created but history logging failed:', error);
      });
    }

    if (ticketId && payload.files && payload.files.length > 0) {
      // Fire uploads sequentially to keep order and reduce server burst
      for (const file of payload.files) {
        try {
          await uploadTicketResource(payload.hash, file);
        } catch (e) {
          // Log and continue uploading remaining files
          console.warn('Failed to upload a ticket resource:', e);
        }
      }
    }

    return created;
  } catch (error) {
    console.error('Failed to create ticket with files:', error);
    throw error;
  }
};

export const updateTicket = async (id: number, data: UpdateTicketDto): Promise<Ticket> => {
  const response = await api.put(`${API_URL}/${id}`, data);
  return response.data;
};

export const updateTicketAssignees = async (ticketId: number, agentIds: number[]): Promise<Ticket> => {
  const response = await api.put(`${API_URL}/${ticketId}/assignees`, { agent_ids: agentIds });
  return response.data;
};

export const updateTicketActionTypes = async (ticketId: number, actionTypeIds: number[]): Promise<Ticket> => {
  const response = await api.put(`${API_URL}/${ticketId}/action-types`, { action_type_ids: actionTypeIds });
  return response.data;
};

export const deleteTicket = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
}; 

export interface TicketActionType {
  id: number;
  name: string;
}

export const getTicketActionTypes = async (): Promise<TicketActionType[]> => {
  const response = await api.get('/action-types');
  return response.data;
};

export const createActionType = async (name: string, applicationId?: number): Promise<TicketActionType> => {
  const response = await api.post('/action-types', { name, application_id: applicationId });
  return response.data;
};

export interface CreatePublicTicketPayload {
  customer_first_name: string;
  customer_last_name?: string;
  customer_email: string;
  mobile_number: string;
  title: string;
  body: string;
  priority?: string;
  application_id: number;
  serialNo?: string;
  files?: File[];
}

export interface PublicTicketResponse {
  success: boolean;
  message: string;
  referenceNumber: string;
  ticket: {
    id: number;
    referenceNumber: string;
    hash: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  };
}

export interface PublicFormOptions {
  applications: Array<{ id: number; name: string }>;
  priorities: Array<{ value: string; label: string }>;
}

export const getPublicFormOptions = async (): Promise<PublicFormOptions> => {
  const response = await api.get('/tickets/public/options');
  return response.data;
};

export const createPublicTicket = async (payload: CreatePublicTicketPayload): Promise<PublicTicketResponse> => {
  if (payload.files && payload.files.length > 0) {
    const formData = new FormData();
    formData.append('customer_first_name', payload.customer_first_name);
    if (payload.customer_last_name) formData.append('customer_last_name', payload.customer_last_name);
    formData.append('customer_email', payload.customer_email);
    formData.append('mobile_number', payload.mobile_number);
    formData.append('title', payload.title);
    formData.append('body', payload.body);
    if (payload.priority) formData.append('priority', payload.priority);
    formData.append('application_id', String(payload.application_id));
    if (payload.serialNo) formData.append('serialNo', payload.serialNo);

    payload.files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post('/tickets/public', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  const response = await api.post('/tickets/public', {
    ...payload,
    application_id: Number(payload.application_id),
  });
  return response.data;
};

export const markTicketRead = async (ticketId: number): Promise<void> => {
  try {
    await api.post(`/tickets/${ticketId}/read`);
  } catch {
    // non-critical, ignore failures
  }
};

export interface PublicTicketTrackingData {
  id: number;
  hash: string;
  title: string;
  body?: string;
  status: string;
  priority?: string;
  ticketType?: string;
  serialNo?: string;
  createdAt: string | number;
  updatedAt: string | number;
  resources?: any[];
  comments: Array<{
    id: number;
    comment: string;
    type?: string;
    createdAt: string | number;
    fromUser?: { name: string } | null;
    resources?: any;
  }>;
}

export const getPublicTicketTracking = async (hashOrId: string): Promise<PublicTicketTrackingData> => {
  const response = await api.get(`/tickets/public/track/${hashOrId}`);
  return response.data;
};

