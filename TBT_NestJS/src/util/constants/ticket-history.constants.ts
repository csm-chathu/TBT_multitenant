/**
 * Constants for Ticket History queries and operations
 */
export const TICKET_HISTORY_CONSTANTS = {
  // Attributes to exclude from ticket history queries
  EXCLUDED_ATTRIBUTES: ['user_id'] as const,

  // User attributes to include in ticket history queries
  USER_ATTRIBUTES: ['id', 'name', 'email'] as const,

  // Default ordering for ticket history
  DEFAULT_ORDER: [['createdAt', 'DESC']] as const,

  // Error messages
  ERRORS: {
    NOT_FOUND: 'Ticket history not found',
  },
} as const;

