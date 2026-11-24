/**
 * Utility functions for parsing and extracting data from ticket objects
 */

import { Ticket } from '@/redux/ticket/ticketTypes'

/**
 * Type guard to check if a value is a record/object
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Safely parses a JSON string or returns the value if already an object
 */
function parseJsonField<T = unknown>(value: unknown): T | null {
  if (!value) return null
  
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }
  
  if (isRecord(value)) {
    return value as T
  }
  
  return null
}

/**
 * Extracts indicator types from a parsed JSON object
 */
function extractIndicatorTypesFromObject(obj: Record<string, unknown>): string[] {
  const indicatorValue = obj.indicatorType ?? obj.indicatorTypes ?? obj.indicators
  
  if (Array.isArray(indicatorValue)) {
    return indicatorValue
      .map((value) => {
        if (value === null || value === undefined) return null
        return String(value).trim()
      })
      .filter((value): value is string => Boolean(value && value.length > 0))
  }
  
  if (typeof indicatorValue === 'string' && indicatorValue.trim().length > 0) {
    return [indicatorValue.trim()]
  }
  
  return []
}

/**
 * Extracts indicator types from a ticket's various data fields
 * Checks multiple possible field names to handle backend inconsistencies
 * 
 * Priority order:
 * 1. additional_data (primary field)
 * 2. additinal_data (backend typo variant)
 * 3. serialNo (legacy field)
 * 4. data (generic data field)
 * 5. ticket_data (alternative data field)
 * 
 * @param ticket - The ticket object to extract indicator types from
 * @returns Array of indicator type strings, empty array if none found
 */
export function getIndicatorTypesFromTicket(ticket: Ticket): string[] {
  if (ticket.action_types && Array.isArray(ticket.action_types)) {
    const mapped = ticket.action_types.map((val: any) => {
      if (typeof val === 'string') return val;
      if (val && typeof val === 'object' && val.name) return val.name;
      return null;
    }).filter(Boolean);
    if (mapped.length > 0) return mapped as string[];
  }

  // Priority order: additional_data > additinal_data (typo) > serialNo > data > ticket_data
  const sources = [
    ticket.additional_data,
    ticket.additinal_data, // Handle backend typo
    ticket.serialNo,
    ticket.data,
    ticket.ticket_data,
  ]
  
  // Try each source in order, return first non-empty result
  for (const source of sources) {
    if (!source) continue
    
    const parsed = parseJsonField<Record<string, unknown>>(source)
    if (parsed) {
      const indicatorTypes = extractIndicatorTypesFromObject(parsed)
      if (indicatorTypes.length > 0) {
        return indicatorTypes
      }
    }
  }
  
  return []
}

