import { useState, useRef, useEffect, useCallback } from 'react'
import { PRIORITY_LABELS_LOWERCASE, type TicketPriorityValue } from '@/constants/ticketPriority'

export type StatusCardKey = 'assigned' | 'inProgress' | 'onHold' | 'resolved' | 'closed' | 'all'

/**
 * Maps dashboard card keys to backend status query parameters
 */
export const STATUS_MAP: Record<StatusCardKey, string | undefined> = {
  all: undefined,
  assigned: 'assigned',
  inProgress: 'in progress',
  onHold: 'on hold',
  resolved: 'resolved',
  closed: 'closed',
} as const

/**
 * Converts priority value to backend string format
 */
export const toBackendPriority = (priority: TicketPriorityValue): string => {
  return PRIORITY_LABELS_LOWERCASE[priority]
}

export const DASHBOARD_FILTERS_STORAGE_KEY = 'dashboard-overview-ticket-filters'

/**
 * Custom hook for managing ticket filters (status and priority)
 */
export const useTicketFilters = () => {
  const [statusCardFilter, setStatusCardFilter] = useState<StatusCardKey>(() => {
    if (typeof window === 'undefined') return 'all'
    try {
      const raw = window.sessionStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY)
      if (!raw) return 'all'
      const parsed = JSON.parse(raw) as { statusCardFilter?: StatusCardKey }
      return parsed.statusCardFilter ?? 'all'
    } catch {
      return 'all'
    }
  })
  const [priorityFilter, setPriorityFilter] = useState<TicketPriorityValue | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const raw = window.sessionStorage.getItem(DASHBOARD_FILTERS_STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { priorityFilter?: TicketPriorityValue | null }
      return parsed.priorityFilter ?? null
    } catch {
      return null
    }
  })

  // Use refs to track current filters for realtime refresh
  const statusCardFilterRef = useRef<StatusCardKey>('all')
  const priorityFilterRef = useRef<TicketPriorityValue | null>(null)

  // Keep refs in sync with state
  useEffect(() => {
    statusCardFilterRef.current = statusCardFilter
  }, [statusCardFilter])

  useEffect(() => {
    priorityFilterRef.current = priorityFilter
  }, [priorityFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(
      DASHBOARD_FILTERS_STORAGE_KEY,
      JSON.stringify({
        statusCardFilter,
        priorityFilter,
      })
    )
  }, [priorityFilter, statusCardFilter])

  const resetFilters = useCallback(() => {
    setStatusCardFilter('all')
    setPriorityFilter(null)
  }, [])

  const getCurrentFilters = useCallback(() => {
    return {
      statusCard: statusCardFilterRef.current,
      priority: priorityFilterRef.current,
    }
  }, [])

  return {
    statusCardFilter,
    priorityFilter,
    setStatusCardFilter,
    setPriorityFilter,
    resetFilters,
    getCurrentFilters,
    statusCardFilterRef,
    priorityFilterRef,
  }
}

