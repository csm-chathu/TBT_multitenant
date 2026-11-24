/**
 * Ticket status and priority constants
 * Centralized for consistency across the application
 */
export const TICKET_STATUS = {
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPEN: 'Reopen',
  BLOCKED: 'Blocked',
} as const;

export const TICKET_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUS);
export const TICKET_PRIORITY_VALUES = Object.values(TICKET_PRIORITY);

