/**
 * Ticket Status Constants
 * Centralized status values for ticket management
 */

export const TICKET_STATUS = {
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  REOPEN: "Reopen",
  BLOCKED: "Blocked",
} as const;

/**
 * Array of all ticket status values
 */
export const TICKET_STATUS_VALUES = Object.values(TICKET_STATUS);

/**
 * Array of ticket status options formatted for select dropdowns
 */
export const TICKET_STATUS_OPTIONS = TICKET_STATUS_VALUES.map((status) => ({
  value: status,
  label: status,
}));

