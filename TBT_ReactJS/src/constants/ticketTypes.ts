/**
 * Ticket Type Constants
 * Centralized ticket type values for ticket management
 */

export const TICKET_TYPE = {
  HELPDESK: "helpdesk",
  CYBER: "cyber",
} as const;

/**
 * Ticket type value type
 */
export type TicketTypeValue = typeof TICKET_TYPE[keyof typeof TICKET_TYPE];

/**
 * Array of all valid ticket type values
 */
export const TICKET_TYPE_VALUES = Object.values(TICKET_TYPE);

/**
 * Ticket type label mapping
 */
export const TICKET_TYPE_LABELS = {
  [TICKET_TYPE.HELPDESK]: "Help Desk",
  [TICKET_TYPE.CYBER]: "Cyber Security",
} as const;

/**
 * Array of ticket type options formatted for select dropdowns
 */
export const TICKET_TYPE_OPTIONS = TICKET_TYPE_VALUES.map((type) => ({
  value: type,
  label: TICKET_TYPE_LABELS[type],
}));

