import { useState, useCallback, useMemo, useEffect } from 'react'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface StoredDateRange {
  start: string | null
  end: string | null
}

const DEFAULT_DAYS_AGO = 7

/**
 * Creates a default date range (7 days ago to today)
 */
const createDefaultDateRange = (): DateRange => {
  const today = new Date()
  today.setHours(23, 59, 59, 999) // End of today
  
  const startDate = new Date()
  startDate.setDate(today.getDate() - DEFAULT_DAYS_AGO)
  startDate.setHours(0, 0, 0, 0) // Start of day
  
  return {
    start: startDate,
    end: today,
  }
}

/**
 * Formats a date range for display
 */
export const formatDateRange = (start: Date | null, end: Date | null): string => {
  if (!start || !end) {
    return 'All Time'
  }

  const formatDate = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'short' })
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  // Same day
  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear() &&
    start.getDate() === end.getDate()
  ) {
    return formatDate(start)
  }

  // Same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    const month = start.toLocaleString('default', { month: 'short' })
    const year = start.getFullYear()
    return `${month} ${start.getDate()} - ${end.getDate()}, ${year}`
  }

  // Same year
  if (start.getFullYear() === end.getFullYear()) {
    return `${formatDate(start)} - ${formatDate(end)}`
  }

  return `${formatDate(start)} - ${formatDate(end)}`
}

/**
 * Custom hook for managing date range selection
 */
export const useDateRange = (initialRange?: DateRange, storageKey?: string) => {
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    if (typeof window !== 'undefined' && storageKey) {
      try {
        const raw = window.sessionStorage.getItem(storageKey)
        if (raw) {
          const parsed = JSON.parse(raw) as StoredDateRange
          const start = parsed.start ? new Date(parsed.start) : null
          const end = parsed.end ? new Date(parsed.end) : null
          const isValidStart = !start || !Number.isNaN(start.getTime())
          const isValidEnd = !end || !Number.isNaN(end.getTime())
          if (isValidStart && isValidEnd) {
            return { start, end }
          }
        }
      } catch {
        // Ignore invalid persisted values
      }
    }
    return initialRange ?? createDefaultDateRange()
  })

  useEffect(() => {
    if (typeof window === 'undefined' || !storageKey) return
    const payload: StoredDateRange = {
      start: dateRange.start ? dateRange.start.toISOString() : null,
      end: dateRange.end ? dateRange.end.toISOString() : null,
    }
    window.sessionStorage.setItem(storageKey, JSON.stringify(payload))
  }, [dateRange.end, dateRange.start, storageKey])

  const handleDateSelect = useCallback((start: Date | null, end: Date | null) => {
    setDateRange({ start, end })
  }, [])

  const dateRangeLabel = useMemo(
    () => formatDateRange(dateRange.start, dateRange.end),
    [dateRange.start, dateRange.end]
  )

  const isValid = useMemo(
    () => dateRange.start !== null && dateRange.end !== null,
    [dateRange.start, dateRange.end]
  )

  return {
    dateRange,
    setDateRange,
    handleDateSelect,
    dateRangeLabel,
    isValid,
  }
}

