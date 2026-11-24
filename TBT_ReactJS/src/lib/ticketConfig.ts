/**
 * Ticket Configuration Utilities
 * Handles parsing and validation of ticket type configuration from environment variables
 */

import { TICKET_TYPE, TICKET_TYPE_VALUES, type TicketTypeValue } from "@/constants/ticketTypes";

/**
 * Default ticket types if none are configured
 */
const DEFAULT_TICKET_TYPES: TicketTypeValue[] = [TICKET_TYPE.HELPDESK];

/**
 * Validates if a string is a valid ticket type
 */
const isValidTicketType = (value: string): value is TicketTypeValue => {
  return TICKET_TYPE_VALUES.includes(value as TicketTypeValue);
};

/**
 * Parses ticket types from environment variable
 * Format: comma-separated array (e.g., "helpdesk" or "helpdesk,cyber")
 * 
 * @returns Array of valid ticket types, defaults to ["helpdesk"] if none found
 */
export const getTicketTypesFromEnv = (): TicketTypeValue[] => {
  const envValue = import.meta.env.VITE_TICKET_TYPES;

  // If not set, return default
  if (!envValue || typeof envValue !== "string") {
    return DEFAULT_TICKET_TYPES;
  }

  // Parse comma-separated values
  const parsedTypes = envValue
    .split(",")
    .map((type) => type.trim().toLowerCase())
    .filter((type): type is TicketTypeValue => isValidTicketType(type));

  // Remove duplicates
  const uniqueTypes = Array.from(new Set(parsedTypes));

  // Return valid types or default if none found
  return uniqueTypes.length > 0 ? uniqueTypes : DEFAULT_TICKET_TYPES;
};

