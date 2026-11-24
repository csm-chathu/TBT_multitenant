import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { getAllTickets, getTicketCounts, type TicketCounts } from '@/services/ticketService'
import type { Ticket } from '@/redux/ticket/ticketTypes'
import type { DateRange } from './useDateRange'
import { STATUS_MAP, toBackendPriority, type StatusCardKey } from './useTicketFilters'
import type { TicketPriorityValue } from '@/constants/ticketPriority'

/**
 * Prepares date objects for API calls
 */
const prepareDates = (dateRange: DateRange) => {
  if (!dateRange.start || !dateRange.end) {
    return null
  }

  const startDate = new Date(dateRange.start)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(dateRange.end)
  endDate.setHours(23, 59, 59, 999)

  return { startDate, endDate }
}

/**
 * Creates a stable key from date range for comparison
 */
const getDateRangeKey = (dateRange: DateRange): string => {
  if (!dateRange.start || !dateRange.end) {
    return ''
  }
  return `${dateRange.start.getTime()}-${dateRange.end.getTime()}`
}


/**
 * Custom hook for managing ticket data fetching and filtering
 */
export const useTicketOverview = (dateRange: DateRange) => {
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([])
  const [ticketCounts, setTicketCounts] = useState<TicketCounts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Memoize date range key to prevent unnecessary re-renders
  const dateRangeKey = useMemo(() => getDateRangeKey(dateRange), [
    dateRange.start?.getTime(),
    dateRange.end?.getTime(),
  ])

  // Store dates in ref to avoid dependency issues
  const dateRangeRef = useRef(dateRange)
  useEffect(() => {
    dateRangeRef.current = dateRange
  }, [dateRangeKey])

  /**
   * Fetches recent tickets with optional status and priority filters
   */
  const fetchRecentTickets = useCallback(
    async (cardKey: StatusCardKey, priority: TicketPriorityValue | null) => {
      const dates = prepareDates(dateRangeRef.current)
      if (!dates) {
        setRecentTickets([])
        return
      }

      const statusParam = STATUS_MAP[cardKey]
      const priorityParam = priority ? toBackendPriority(priority) : undefined

      try {
        const data = await getAllTickets({
          startDate: dates.startDate,
          endDate: dates.endDate,
          status: statusParam,
          priority: priorityParam,
        })

        if (isMountedRef.current) {
          setRecentTickets(Array.isArray(data) ? data : data.data) // Return all tickets, pagination handled in component
        }
      } catch (err) {
        // Silently fail - keep previous recentTickets
        console.warn('Failed to fetch recent tickets:', err)
      }
    },
    [] // No dependencies - uses ref
  )

  /**
   * Fetches all tickets for the current date range
   */
  const fetchAllTickets = useCallback(async (agentId?: number) => {
    const dates = prepareDates(dateRangeRef.current)
    if (!dates) {
      setTicketCounts(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const counts = await getTicketCounts({
        startDate: dates.startDate.toISOString(),
        endDate: dates.endDate.toISOString(),
        agentId,
      })

      if (!isMountedRef.current) return
      setTicketCounts(counts)
      setIsLoading(false)
    } catch (err) {
      if (!isMountedRef.current) return
      const error = err instanceof Error ? err : new Error('Failed to fetch ticket counts')
      setError(error)
      setIsLoading(false)
    }
  }, [])

  /**
   * Refreshes tickets (used for realtime updates)
   */
  const refreshTickets = useCallback(async () => {
    await fetchAllTickets()
  }, [fetchAllTickets])

  return {
    recentTickets,
    ticketCounts,
    isLoading,
    error,
    fetchAllTickets,
    fetchRecentTickets,
    refreshTickets,
  }
}

