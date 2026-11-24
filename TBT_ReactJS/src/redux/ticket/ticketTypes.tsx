import type { TicketPriorityValue } from "@/constants/ticketPriority"

/**
 * JSON data fields that may contain structured ticket metadata
 * These fields can be either JSON strings or already parsed objects
 */
type JsonDataField = string | Record<string, unknown>

export interface Ticket {
  id?: number;
  ticketId: number;
  ticketType: string;
  dateCreated: string;
  priority: TicketPriorityValue;
  organization: string;
  assetsDevice: string;
  incidentType: string[];
  indicators: string[];
  assignee: string;
  location?: string;
  status?: string;
  title?: string;
  heading?: string;
  body?: string;
  hash?: string;
  createdAt?: Date;
  updatedAt?: Date;
  /**
   * Primary field for additional ticket metadata (JSON string or object)
   * Contains structured data like indicatorType, notes, etc.
   */
  additional_data?: JsonDataField;
  /**
   * Typo variant from backend - kept for backward compatibility
   * @deprecated Use additional_data instead
   */
  additinal_data?: JsonDataField;
  /**
   * Serial number or serialized ticket data (JSON string or object)
   */
  serialNo?: JsonDataField;
  /**
   * Generic data field (JSON string or object)
   */
  data?: JsonDataField;
  /**
   * Alternative ticket data field (JSON string or object)
   */
  ticket_data?: JsonDataField;
  Agent?: {
    id: number;
    first_name: string;
    last_name: string;
    nickname: string;
  }
  reporter?: {
    id: number;
    first_name: string;
    last_name: string;
  }
  Application?: {
    id: number;
    name: string;
    organization?: {
      id: number;
      name: string;
    };
  }
  device?: {
    id: number;
    name: string;
  }
  action_types?: string[] | Array<{ id: number; name: string }>;
}

export interface CreateTicketDto {
  ticketType: string;
  priority: TicketPriorityValue | "1" | "2" | "3" | "4";
  organization: string;
  assetsDevice: string;
  incidentType: string[];
  indicators: string[];
  reporter: string;
  assignee: string;
  location?: string;
  status?: string;
  description?: string;
}

export interface UpdateTicketDto {
  ticketType?: string;
  priority?: TicketPriorityValue | "1" | "2" | "3" | "4" | "low" | "medium" | "high" | "critical" | "Low" | "Medium" | "High" | "Critical";
  organization?: string;
  assetsDevice?: string;
  incidentType?: string[];
  action_types?: number[] | string[] | Array<{ id: number; name: string }>;
  action_type_ids?: number[];
  indicators?: string[];
  reporter?: string;
  assignee?: string;
  agent_id?: number;
  location?: string;
  status?: string | null;
  description?: string;
} 