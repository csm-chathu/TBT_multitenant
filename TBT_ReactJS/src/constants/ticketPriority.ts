/**
 * Ticket Priority Constants
 * Centralized priority values for ticket management
 */

export const TICKET_PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

/**
 * Priority value type
 */
export type TicketPriorityValue = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

/**
 * Priority label mapping
 */
export const PRIORITY_LABELS = {
  [TICKET_PRIORITY.LOW]: "Low",
  [TICKET_PRIORITY.MEDIUM]: "Medium",
  [TICKET_PRIORITY.HIGH]: "High",
  [TICKET_PRIORITY.CRITICAL]: "Critical",
} as const;

/**
 * Priority label lowercase mapping
 */
export const PRIORITY_LABELS_LOWERCASE = {
  [TICKET_PRIORITY.LOW]: "low",
  [TICKET_PRIORITY.MEDIUM]: "medium",
  [TICKET_PRIORITY.HIGH]: "high",
  [TICKET_PRIORITY.CRITICAL]: "critical",
} as const;

/**
 * Array of all priority values
 */
export const TICKET_PRIORITY_VALUES = Object.values(TICKET_PRIORITY);

/**
 * Array of priority options formatted for select dropdowns
 */
export const TICKET_PRIORITY_OPTIONS = [
  { value: String(TICKET_PRIORITY.LOW), label: PRIORITY_LABELS[TICKET_PRIORITY.LOW] },
  { value: String(TICKET_PRIORITY.MEDIUM), label: PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM] },
  { value: String(TICKET_PRIORITY.HIGH), label: PRIORITY_LABELS[TICKET_PRIORITY.HIGH] },
  { value: String(TICKET_PRIORITY.CRITICAL), label: PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL] },
];

