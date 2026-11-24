import type { Ticket } from '@/redux/ticket/ticketTypes'
import { TICKET_STATUS } from '@/constants/ticketStatus'
import { TICKET_PRIORITY, type TicketPriorityValue } from '@/constants/ticketPriority'

export interface PriorityCounts {
  low: number
  medium: number
  high: number
  critical: number
}

export interface TicketAnalysis {
  total: number
  assigned: number
  inProgress: number
  onHold: number
  resolved: number
  closed: number
  assignedTickets: Ticket[]
  inProgressTickets: Ticket[]
  onHoldTickets: Ticket[]
  resolvedTickets: Ticket[]
  closedTickets: Ticket[]
  allPriorityCounts: PriorityCounts
}

/**
 * Normalizes priority value from various formats to TicketPriorityValue
 */
export const normalizePriority = (value: unknown): TicketPriorityValue | undefined => {
  if (value === null || value === undefined) return undefined
  
  const str = String(value).toLowerCase().trim()
  
  // String matching
  if (str === String(TICKET_PRIORITY.LOW) || str === 'low') return TICKET_PRIORITY.LOW
  if (str === String(TICKET_PRIORITY.MEDIUM) || str === 'medium' || str === 'med') {
    return TICKET_PRIORITY.MEDIUM
  }
  if (str === String(TICKET_PRIORITY.HIGH) || str === 'high') return TICKET_PRIORITY.HIGH
  if (str === String(TICKET_PRIORITY.CRITICAL) || str === 'critical' || str === 'crit') {
    return TICKET_PRIORITY.CRITICAL
  }
  
  // Numeric matching
  const num = Number(str)
  if (!isNaN(num) && [1, 2, 3, 4].includes(num)) {
    return num as TicketPriorityValue
  }
  
  return undefined
}

/**
 * Normalizes status string for comparison
 */
export const normalizeStatus = (status?: string): string => {
  return (status ?? '').replace(/[\s_-]+/g, ' ').trim().toLowerCase()
}

/**
 * Creates a status matcher function
 */
export const createStatusMatcher = (...statuses: string[]) => {
  const normalizedTargets = statuses.map(normalizeStatus)
  return (status?: string) => normalizedTargets.includes(normalizeStatus(status))
}

/**
 * Calculates priority counts for a set of tickets
 */
export const calculatePriorityCounts = (tickets: Ticket[]): PriorityCounts => {
  const counts: PriorityCounts = { low: 0, medium: 0, high: 0, critical: 0 }

  for (const ticket of tickets) {
    const priority = normalizePriority((ticket as any).priority)
    if (priority === TICKET_PRIORITY.LOW) counts.low += 1
    else if (priority === TICKET_PRIORITY.MEDIUM) counts.medium += 1
    else if (priority === TICKET_PRIORITY.HIGH) counts.high += 1
    else if (priority === TICKET_PRIORITY.CRITICAL) counts.critical += 1
  }

  return counts
}

/**
 * Analyzes tickets and categorizes them by status and priority
 */
export const analyzeTickets = (tickets: Ticket[]): TicketAnalysis => {
  const isResolvedStatus = createStatusMatcher(TICKET_STATUS.RESOLVED)
  const isClosedStatus = createStatusMatcher(TICKET_STATUS.CLOSED)
  const isInProgressStatus = createStatusMatcher(TICKET_STATUS.IN_PROGRESS)
  const isOnHoldStatus = createStatusMatcher(TICKET_STATUS.ON_HOLD)
  const isAssignedStatus = createStatusMatcher(TICKET_STATUS.ASSIGNED)

  // Initialize collections
  const assignedTickets: Ticket[] = []
  const inProgressTickets: Ticket[] = []
  const onHoldTickets: Ticket[] = []
  const resolvedTickets: Ticket[] = []
  const closedTickets: Ticket[] = []
  const allPriorityCounts: PriorityCounts = { low: 0, medium: 0, high: 0, critical: 0 }

  // Single pass through tickets to categorize and count
  for (const ticket of tickets) {
    const priority = normalizePriority((ticket as any).priority)
    
    // Count priorities
    if (priority === TICKET_PRIORITY.LOW) allPriorityCounts.low += 1
    else if (priority === TICKET_PRIORITY.MEDIUM) allPriorityCounts.medium += 1
    else if (priority === TICKET_PRIORITY.HIGH) allPriorityCounts.high += 1
    else if (priority === TICKET_PRIORITY.CRITICAL) allPriorityCounts.critical += 1

    // Categorize by status (ticket can belong to multiple categories if status matches multiple)
    if (isAssignedStatus(ticket.status)) assignedTickets.push(ticket)
    if (isInProgressStatus(ticket.status)) inProgressTickets.push(ticket)
    if (isOnHoldStatus(ticket.status)) onHoldTickets.push(ticket)
    if (isResolvedStatus(ticket.status)) resolvedTickets.push(ticket)
    if (isClosedStatus(ticket.status)) closedTickets.push(ticket)
  }

  return {
    total: tickets.length,
    assigned: assignedTickets.length,
    inProgress: inProgressTickets.length,
    onHold: onHoldTickets.length,
    resolved: resolvedTickets.length,
    closed: closedTickets.length,
    assignedTickets,
    inProgressTickets,
    onHoldTickets,
    resolvedTickets,
    closedTickets,
    allPriorityCounts,
  }
}

