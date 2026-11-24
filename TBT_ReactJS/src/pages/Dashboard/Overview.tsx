import type React from 'react'
import { useEffect, useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ResolveRate from './Overview/ResolveRate'
import TicketChart from './Overview/TicketChart'
import TicketQueue from './Overview/TicketQueue'
import RecentTickets from './Overview/RecentTickets'
import Button from '@/components/Atomic/Button'
// import HistoryLog from './Overview/HistoryLog'
import DateRangePicker from '@/components/Molecules/DateRangePicker'
import { useDateRange } from '@/hooks/useDateRange'
import { useTicketOverview } from '@/hooks/useTicketOverview'
import { useTicketFilters } from '@/hooks/useTicketFilters'
import { TICKET_PRIORITY, PRIORITY_LABELS, type TicketPriorityValue } from '@/constants/ticketPriority'
import type { TicketEventName } from '@/hooks/useNotificationPolling'
import { useNotificationPolling } from '@/hooks/useNotificationPolling'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { selectTicketUpdated, clearTicketUpdated } from '@/redux/ticket/ticketSlice'
import { fetchAgents } from '@/redux/agent/agentSlice'

/**
 * Priority color configuration for chart display
 */
const PRIORITY_COLORS = {
  [TICKET_PRIORITY.LOW]: '#22c55e',
  [TICKET_PRIORITY.MEDIUM]: '#3b82f6',
  [TICKET_PRIORITY.HIGH]: '#ffc961',
  [TICKET_PRIORITY.CRITICAL]: '#ff7761',
} as const

/**
 * Overview Dashboard Component
 * 
 * Displays ticket statistics, charts, and recent tickets with filtering capabilities.
 * Supports realtime updates via Pusher notifications.
 */
type FilterType = 'day' | 'week' | 'month' | 'year' | null
const OVERVIEW_DATE_STORAGE_KEY = 'dashboard-overview-date-range'
const OVERVIEW_AGENT_STORAGE_KEY = 'dashboard-overview-agent-filter'
const EMPTY_PRIORITY = { low: 0, medium: 0, high: 0, critical: 0 }

const Overview: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { agents } = useAppSelector((state) => state.agents)
  const ticketUpdated = useAppSelector(selectTicketUpdated)
  // Date range management
  const { dateRange, handleDateSelect, setDateRange, dateRangeLabel, isValid } = useDateRange(undefined, OVERVIEW_DATE_STORAGE_KEY)
  
  // Track which filter button is selected - default to 'week' since default date range is 7 days
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('week')
  const [agentFilter, setAgentFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.sessionStorage.getItem(OVERVIEW_AGENT_STORAGE_KEY) ?? ''
  })
  const OVERVIEW_CHART_TYPE_STORAGE_KEY = 'tbt_overview_chart_type'
  const [chartType, setChartTypeState] = useState<'pie' | 'queue'>(() => {
    if (typeof window === 'undefined') return 'queue'
    try {
      const saved = localStorage.getItem(OVERVIEW_CHART_TYPE_STORAGE_KEY)
      if (saved === 'queue' || saved === 'pie') return saved
    } catch (e) {
      // ignore
    }
    return 'queue'
  })

  const setChartType = (type: 'pie' | 'queue') => {
    setChartTypeState(type)
    try {
      localStorage.setItem(OVERVIEW_CHART_TYPE_STORAGE_KEY, type)
    } catch (e) {
      // ignore
    }
  }

  // Ticket data fetching and management
  const {
    ticketCounts,
    isLoading,
    error,
    fetchAllTickets,
    fetchRecentTickets,
    refreshTickets,
  } = useTicketOverview(dateRange)

  // Filter management
  const {
    statusCardFilter,
    setStatusCardFilter,
    priorityFilter,
    setPriorityFilter,
  } = useTicketFilters()

  // Fetch agents once for dropdown options
  useEffect(() => {
    if (agents.length === 0) {
      void dispatch(fetchAgents())
    }
  }, [agents.length, dispatch])

  // Detect and set the correct filter button based on current date range
  // This ensures the button is highlighted correctly on initial load
  useEffect(() => {
    if (!dateRange.start || !dateRange.end) {
      return
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    today.setHours(23, 59, 59, 999)

    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)

    // Normalize dates to compare only date part (ignore time)
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      return normalized.getTime()
    }

    const startTime = normalizeDate(start)
    const endTime = normalizeDate(end)
    const todayTime = normalizeDate(today)

    // Check if it matches day (same day as today)
    if (startTime === todayTime && endTime === todayTime) {
      setSelectedFilter('day')
      return
    }

    // Check if it matches week (7 days ago to today)
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - 7)
    const weekStartTime = normalizeDate(weekStart)
    
    if (startTime === weekStartTime && endTime === todayTime) {
      setSelectedFilter('week')
      return
    }

    // Check if it matches month (30 days ago to today)
    const monthStart = new Date(today)
    monthStart.setDate(monthStart.getDate() - 30)
    const monthStartTime = normalizeDate(monthStart)
    
    if (startTime === monthStartTime && endTime === todayTime) {
      setSelectedFilter('month')
      return
    }

    // Check if it matches year (365 days ago to today)
    const yearStart = new Date(today)
    yearStart.setDate(yearStart.getDate() - 365)
    const yearStartTime = normalizeDate(yearStart)
    
    if (startTime === yearStartTime && endTime === todayTime) {
      setSelectedFilter('year')
      return
    }

    // If it doesn't match any preset, set to null (custom range)
    setSelectedFilter(null)
  }, [dateRange.start, dateRange.end])

  const ticketTotals = useMemo(() => ({
    total: ticketCounts?.total ?? 0,
    assigned: ticketCounts?.assigned ?? 0,
    inProgress: ticketCounts?.inProgress ?? 0,
    onHold: ticketCounts?.onHold ?? 0,
    resolved: ticketCounts?.resolved ?? 0,
    closed: ticketCounts?.closed ?? 0,
  }), [ticketCounts])

  const priorityCounts = useMemo(
    () => ticketCounts?.allPriorityCounts ?? EMPTY_PRIORITY,
    [ticketCounts]
  )

  const assignedPriorityCounts = useMemo(() => ticketCounts?.priorityByStatus?.assigned ?? EMPTY_PRIORITY, [ticketCounts])
  const inProgressPriorityCounts = useMemo(() => ticketCounts?.priorityByStatus?.inProgress ?? EMPTY_PRIORITY, [ticketCounts])
  const onHoldPriorityCounts = useMemo(() => ticketCounts?.priorityByStatus?.onHold ?? EMPTY_PRIORITY, [ticketCounts])
  const resolvedPriorityCounts = useMemo(() => ticketCounts?.priorityByStatus?.resolved ?? EMPTY_PRIORITY, [ticketCounts])
  const closedPriorityCounts = useMemo(() => ticketCounts?.priorityByStatus?.closed ?? EMPTY_PRIORITY, [ticketCounts])

  // Card data configuration
  const cardData = useMemo(
    () => [
      {
        key: 'assigned' as const,
        title: 'Assigned Tickets',
        total: String(ticketTotals.assigned),
        percentage: ticketTotals.total
          ? Math.round((ticketTotals.assigned / ticketTotals.total) * 100)
          : 0,
        priorityCounts: assignedPriorityCounts,
      },
      {
        key: 'inProgress' as const,
        title: 'In Progress Tickets',
        total: String(ticketTotals.inProgress),
        percentage: ticketTotals.total
          ? Math.round((ticketTotals.inProgress / ticketTotals.total) * 100)
          : 0,
        priorityCounts: inProgressPriorityCounts,
      },
      {
        key: 'onHold' as const,
        title: 'On hold Tickets',
        total: String(ticketTotals.onHold),
        percentage: ticketTotals.total
          ? Math.round((ticketTotals.onHold / ticketTotals.total) * 100)
          : 0,
        priorityCounts: onHoldPriorityCounts,
      },
      {
        key: 'resolved' as const,
        title: 'Resolved Tickets',
        total: String(ticketTotals.resolved),
        percentage: ticketTotals.total
          ? Math.round((ticketTotals.resolved / ticketTotals.total) * 100)
          : 0,
        priorityCounts: resolvedPriorityCounts,
      },
      {
        key: 'closed' as const,
        title: 'Closed Tickets',
        total: String(ticketTotals.closed),
        percentage: ticketTotals.total
          ? Math.round((ticketTotals.closed / ticketTotals.total) * 100)
          : 0,
        priorityCounts: closedPriorityCounts,
      },
    ],
    [
      ticketTotals,
      assignedPriorityCounts,
      inProgressPriorityCounts,
      onHoldPriorityCounts,
      resolvedPriorityCounts,
      closedPriorityCounts,
    ]
  )

  // Priority status data for chart legend
  const statusData = useMemo(
    () => [
      {
        title: PRIORITY_LABELS[TICKET_PRIORITY.LOW],
        total: String(priorityCounts.low ?? 0),
        bg: PRIORITY_COLORS[TICKET_PRIORITY.LOW],
      },
      {
        title: PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM],
        total: String(priorityCounts.medium ?? 0),
        bg: PRIORITY_COLORS[TICKET_PRIORITY.MEDIUM],
      },
      {
        title: PRIORITY_LABELS[TICKET_PRIORITY.HIGH],
        total: String(priorityCounts.high ?? 0),
        bg: PRIORITY_COLORS[TICKET_PRIORITY.HIGH],
      },
      {
        title: PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL],
        total: String(priorityCounts.critical ?? 0),
        bg: PRIORITY_COLORS[TICKET_PRIORITY.CRITICAL],
      },
    ],
    [priorityCounts]
  )

  // Chart data
  const ticketChartData = useMemo(
    () => [
      priorityCounts.low,
      priorityCounts.medium,
      priorityCounts.high,
      priorityCounts.critical,
    ],
    [priorityCounts]
  )

  const resolveRatePercent = useMemo(
    () =>
      ticketTotals.total
        ? Math.round(((ticketTotals.resolved + ticketTotals.closed) / ticketTotals.total) * 100)
        : 0,
    [ticketTotals]
  )

  // Memoize date range key to prevent unnecessary re-renders
  const dateRangeKey = useMemo(
    () => (dateRange.start && dateRange.end ? `${dateRange.start.getTime()}-${dateRange.end.getTime()}` : ''),
    [dateRange.start?.getTime(), dateRange.end?.getTime()]
  )

  // Fetch counts when date range or agent filter changes
  useEffect(() => {
    if (!isValid || !dateRangeKey) return
    const agentId = agentFilter ? Number(agentFilter) : undefined
    void fetchAllTickets(agentId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRangeKey, fetchAllTickets, isValid, agentFilter])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(OVERVIEW_AGENT_STORAGE_KEY, agentFilter)
  }, [agentFilter])

  // Realtime event handler
  const handleRealtimeEvent = useCallback(
    (event: TicketEventName, payload: unknown) => {
      console.log('[Overview] Realtime event received, refreshing tickets:', event, payload)
      void refreshTickets()
    },
    [refreshTickets]
  )

  useNotificationPolling({ enabled: true, onEvent: handleRealtimeEvent })

  // Card click handler
  const handleCardClick = useCallback(
    (key: typeof statusCardFilter) => {
      setStatusCardFilter(key)
      setPriorityFilter(null)
      void fetchRecentTickets(key, null)
    },
    [setStatusCardFilter, setPriorityFilter, fetchRecentTickets]
  )

  // Priority click handler
  const handlePriorityClick = useCallback(
    (event: React.MouseEvent, key: typeof statusCardFilter, priority: TicketPriorityValue) => {
      event.stopPropagation()
      setStatusCardFilter(key)
      setPriorityFilter(priority)
      void fetchRecentTickets(key, priority)
    },
    [setStatusCardFilter, setPriorityFilter, fetchRecentTickets]
  )

  // Day filter handler - sets date range to today
  const handleDayFilter = useCallback(() => {
    const now = new Date()
    
    // Create start of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startOfDay.setHours(0, 0, 0, 0)
    
    // Create end of today
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endOfDay.setHours(23, 59, 59, 999)
    
    // Use setDateRange directly to ensure state update
    setDateRange({ start: startOfDay, end: endOfDay })
    setSelectedFilter('day')
  }, [setDateRange])

  // Week filter handler - sets date range to last 7 days from today
  const handleWeekFilter = useCallback(() => {
    const now = new Date()
    
    // Create end of today
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endOfDay.setHours(23, 59, 59, 999)
    
    // Create start date (7 days ago)
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate.setDate(startDate.getDate() - 7)
    startDate.setHours(0, 0, 0, 0)
    
    // Use setDateRange directly to ensure state update
    setDateRange({ start: startDate, end: endOfDay })
    setSelectedFilter('week')
  }, [setDateRange])

  // Month filter handler - sets date range to last 30 days from today
  const handleMonthFilter = useCallback(() => {
    const now = new Date()
    
    // Create end of today
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endOfDay.setHours(23, 59, 59, 999)
    
    // Create start date (30 days ago)
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate.setDate(startDate.getDate() - 30)
    startDate.setHours(0, 0, 0, 0)
    
    // Use setDateRange directly to ensure state update
    setDateRange({ start: startDate, end: endOfDay })
    setSelectedFilter('month')
  }, [setDateRange])

  // Year filter handler - sets date range to last 365 days from today
  const handleYearFilter = useCallback(() => {
    const now = new Date()

    // Create end of today
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    endOfDay.setHours(23, 59, 59, 999)

    // Create start date (365 days ago)
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    startDate.setDate(startDate.getDate() - 365)
    startDate.setHours(0, 0, 0, 0)

    // Use setDateRange directly to ensure state update
    setDateRange({ start: startDate, end: endOfDay })
    setSelectedFilter('year')
  }, [setDateRange])
  
  // Reset selected filter when custom date range is selected
  const handleCustomDateSelect = useCallback((start: Date | null, end: Date | null) => {
    handleDateSelect(start, end)
    setSelectedFilter(null)
  }, [handleDateSelect])

  return (
    <>
      <div className="flex flex-col gap-3">
        {ticketUpdated ? (() => {
          const ev = typeof ticketUpdated === 'object' ? ticketUpdated : null
          const icon = ev?.type === 'created' ? 'add_circle' : ev?.type === 'comment' ? 'chat' : 'update'
          const heading = ev?.type === 'created'
            ? `New ticket created${ev.id ? ` #${ev.id}` : ''}${ev.title ? ` – ${ev.title}` : ''}`
            : ev?.type === 'comment'
            ? `New comment${ev.id ? ` on #${ev.id}` : ''}${ev.title ? ` – ${ev.title}` : ''}`
            : ev?.type === 'updated'
            ? `Ticket${ev.id ? ` #${ev.id}` : ''} updated${ev.title ? ` – ${ev.title}` : ''}`
            : 'New ticket updates are available'
          return (
            <div className="bg-red-50 border-l-4 border-red-400 rounded px-4 py-3 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-400 text-xl flex-shrink-0">{icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-800 truncate">{heading}</p>
                {ev?.subtitle && (
                  <p className="text-xs text-red-600 mt-0.5 truncate">{ev.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(ev?.hash || ev?.id) && (
                  <button
                    onClick={() => navigate(`/dashboard/tickets/details/${ev.hash ?? ev.id}`)}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                  >
                    View
                  </button>
                )}
                <button
                  onClick={() => { void refreshTickets(); dispatch(clearTicketUpdated()) }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => dispatch(clearTicketUpdated())}
                  className="p-1 rounded text-gray-500 hover:text-gray-800 transition-colors"
                  title="Dismiss"
                >
                  <span className="material-symbols-outlined text-base leading-none">close</span>
                </button>
              </div>
            </div>
          )
        })() : null}
        <div className="flex items-center gap-3 flex-nowrap justify-between">
          <div className="flex items-center gap-3">
            <p className="text-xl font-medium tracking-tighter flex-shrink-0">Overview</p>
          </div>

          <div className="flex items-center gap-3 flex-nowrap">
            <div className="relative">
            <div className={`overflow-x-auto no-scrollbar flex items-center gap-3` }>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-10 px-3 pr-10 rounded-xl bg-surface-primary border border-primary-100 focus:outline-none appearance-none min-w-[180px] flex-shrink-0"
            >
              <option value="">All agents</option>
              {agents.map((agent) => {
                const firstName = agent.first_name || ''
                const lastName = agent.last_name || ''
                const label =
                  [firstName, lastName].filter(Boolean).join(' ') ||
                  agent.nickname ||
                  `Agent #${agent.id}`
                return (
                  <option key={agent.id} value={String(agent.id ?? '')}>
                    {label}
                  </option>
                )
              })}
            </select>
            <span className="absolute right-2 top-2 material-symbols-outlined pointer-events-none">expand_more</span>
            </div>
          </div>
          <button
            onClick={handleDayFilter}
            className={`px-4 h-10 inline-flex justify-center items-center gap-1 text-base rounded-xl transition-colors ${
              selectedFilter === 'day'
                ? 'text-primary-500 bg-primary-100 border border-primary-500'
                : 'text-textColor-muted bg-transparent border border-primary-100 hover:bg-primary-100 hover:text-primary-500'
            }`}
          >
            Day
          </button>
          <button
            onClick={handleWeekFilter}
            className={`px-4 h-10 inline-flex justify-center items-center gap-1 text-base rounded-xl transition-colors ${
              selectedFilter === 'week'
                ? 'text-primary-500 bg-primary-100 border border-primary-500'
                : 'text-textColor-muted bg-transparent border border-primary-100 hover:bg-primary-100 hover:text-primary-500'
            }`}
          >
            Week
          </button>
          <button
            onClick={handleMonthFilter}
            className={`px-4 h-10 inline-flex justify-center items-center gap-1 text-base rounded-xl transition-colors ${
              selectedFilter === 'month'
                ? 'text-primary-500 bg-primary-100 border border-primary-500'
                : 'text-textColor-muted bg-transparent border border-primary-100 hover:bg-primary-100 hover:text-primary-500'
            }`}
          >
            Month
          </button>
          <button
            onClick={handleYearFilter}
            className={`px-4 h-10 inline-flex justify-center items-center gap-1 text-base rounded-xl transition-colors ${
              selectedFilter === 'year'
                ? 'text-primary-500 bg-primary-100 border border-primary-500'
                : 'text-textColor-muted bg-transparent border border-primary-100 hover:bg-primary-100 hover:text-primary-500'
            }`}
          >
            Year
          </button>
          <DateRangePicker
            onDateSelect={handleCustomDateSelect}
            defaultStartDate={dateRange.start || undefined}
            defaultEndDate={dateRange.end || undefined}
          />
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 flex items-center justify-center p-8">
          <div className="text-danger-600">Error loading tickets: {error.message}</div>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 space-y-4">


          {/* Cards + Chart skeleton */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="lg:w-9/12 grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-surface-primary rounded-lg border border-borderColor-secondary p-4">
                  <div className="h-6 w-3/4 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse mb-3" />
                  <div className="h-8 w-1/4 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse mb-4" />
                  <div className="h-3 w-full bg-primary-100/40 dark:bg-slate-700/40 rounded animate-pulse mb-2" />
                  <div className="flex justify-between items-center mt-3">
                    <div className="h-4 w-20 bg-primary-100/40 dark:bg-slate-700/40 rounded animate-pulse" />
                    <div className="h-4 w-8 bg-primary-100/40 dark:bg-slate-700/40 rounded animate-pulse" />
                  </div>
                </div>
              ))}

              <div className="p-4 bg-surface-primary rounded-lg border border-borderColor-secondary">
                <div className="h-6 w-40 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse mb-4" />
                <div className="flex justify-between items-end">
                  <div className="h-20 w-2/3 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                  <div className="h-20 w-1/3 space-y-3">
                    <div className="h-4 w-full rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                    <div className="h-4 w-full rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:w-3/12 p-4 space-y-6 bg-surface-primary rounded-lg border border-borderColor-secondary">
              <div className="h-6 w-40 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
              <div className="h-40 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                <div className="h-6 w-20 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Recent tickets skeleton */}
          <div className="mt-5 flex flex-col lg:flex-row gap-5">
            <div className="flex-1 bg-surface-primary rounded-lg border border-borderColor-secondary p-4">
              <div className="h-6 w-48 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="space-y-2">
                    <div className="h-4 w-48 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse mt-2" />
                  </div>
                  <div className="h-6 w-20 rounded bg-primary-100/40 dark:bg-slate-700/40 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <div className="mt-6 flex flex-col lg:flex-row gap-4">
            {/* Total Tickets Chart / Follow up texts Switch */}
            <style>{`
              @keyframes gemini-shift {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .gemini-widget {
                background: linear-gradient(-45deg, #4285f4, #8b5cf6, #06b6d4, #a855f7, #ec4899, #3b82f6, #06b6d4);
                background-size: 300% 300%;
                animation: gemini-shift 5s ease infinite;
              }
            `}</style>
            <div className="gemini-widget lg:w-3/12 rounded-xl pt-[3px] shadow-lg">
              <div className="rounded-b-xl rounded-t-none bg-surface-primary h-full flex flex-col">
              <div className="flex justify-between p-4">
                <h2 className="text-xl font-medium">{chartType === 'pie' ? 'Total Tickets' : 'Follow up texts'}</h2>
                <div className="inline-flex justify-center items-center border border-borderColor-secondary rounded-xl overflow-hidden">
                  <Button onClick={() => setChartType('pie')} style="Icon" icon="pie_chart" className={`h-8 rounded-none border-r border-borderColor-secondary hover:text-primary-500 ${chartType === 'pie' ? 'bg-primary-100 text-primary-500' : ''}`}/>
                  <Button onClick={() => setChartType('queue')} style="Icon" icon="list_alt" className={`h-8 rounded-none hover:text-primary-500 ${chartType === 'queue' ? 'bg-primary-100 text-primary-500' : ''}`}/>
                </div>
              </div>
              {chartType === 'pie' ? (
                <div className="space-y-6">
                  <div className="lg:h-56">
                    <TicketChart data={ticketChartData} />
                  </div>
                  <div className="flex flex-wrap justify-between p-4">
                    {statusData.map((item) => (
                      <div key={item.title}>
                        <p className="flex items-center gap-2 text-sm">
                          <span
                            style={{ backgroundColor: item.bg }}
                            className="h-2 w-2 inline-flex rounded-full"
                          />
                          {item.title}
                        </p>
                        <p className="text-lg font-medium">{item.total}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : chartType === 'queue' && (
                <TicketQueue />
              )}
              </div>
            </div>

            <div className="lg:w-9/12 grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Status Cards */}
              {cardData.map((card) => (
                <div
                  key={card.key}
                  className={`bg-surface-primary rounded-lg cursor-pointer transition-all duration-200 ${
                    statusCardFilter === card.key
                      ? 'border-2 border-primary-400 shadow-lg scale-[1.02]'
                      : 'border border-borderColor-secondary hover:shadow-md'
                  }`}
                  onClick={() => handleCardClick(card.key)}
                >
                  <div className="p-4">
                    <div className="lg:flex justify-between">
                      <div>
                        <p className="text-lg font-medium">{card.title}</p>
                        <p className="text-sm text-textColor-muted">{dateRangeLabel}</p>
                      </div>
                      <h2 className="text-3xl font-semibold">{card.total}</h2>
                    </div>
                    <div className="mt-6 h-2 w-full bg-primary-100 rounded-md overflow-hidden">
                      <span
                        style={{ width: `${card.percentage}%` }}
                        className="h-full bg-primary-500 block rounded-md"
                      />
                    </div>
                    <div className="mt-1 flex justify-between text-sm text-textColor-muted">
                      <p>Percentage</p>
                      <p>{card.percentage}%</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 lg:flex items-center justify-between border-t border-borderColor-secondary">
                    <p className="text-sm font-medium text-textColor-muted">Priority</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { priority: TICKET_PRIORITY.LOW, label: 'low', baseColor: 'text-success-600', activeBg: 'bg-success-100', hoverBg: 'hover:bg-success-100' },
                        { priority: TICKET_PRIORITY.MEDIUM, label: 'medium', baseColor: 'text-info-600', activeBg: 'bg-info-100', hoverBg: 'hover:bg-info-100' },
                        { priority: TICKET_PRIORITY.HIGH, label: 'high', baseColor: 'text-warning-600', activeBg: 'bg-warning-100', hoverBg: 'hover:bg-warning-100' },
                        { priority: TICKET_PRIORITY.CRITICAL, label: 'critical', baseColor: 'text-danger-600', activeBg: 'bg-danger-100', hoverBg: 'hover:bg-danger-100' },
                      ].map(({ priority, label, baseColor, activeBg, hoverBg }) => {
                        const count = card.priorityCounts[label as keyof typeof card.priorityCounts]
                        const isSelected = statusCardFilter === card.key && priorityFilter === priority
                        return (
                          <p
                            key={priority}
                            data-tip={PRIORITY_LABELS[priority]}
                            className={`tooltip px-2 py-1 text-sm font-medium rounded cursor-pointer ${baseColor} ${isSelected ? activeBg : hoverBg}`}
                            onClick={(e) => handlePriorityClick(e, card.key, priority)}
                          >
                            {count}
                          </p>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Resolve Rate Card */}
              <div className="p-4 bg-surface-primary rounded-lg border border-borderColor-secondary">
                <p className="text-lg font-medium">Resolve Rate</p>
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end">
                  <div className="w-full lg:w-[60%] flex justify-start">
                    <ResolveRate resolvedPercent={resolveRatePercent} />
                  </div>
                  <div className="flex flex-col w-full lg:w-[30%] space-y-4 items-start">
                    <div className="flex flex-col">
                      <p className="text-sm text-textColor-muted">Resolved</p>
                      <p className="text-2xl font-medium">{ticketTotals.resolved + ticketTotals.closed}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm text-textColor-muted">Total</p>
                      <p className="text-2xl font-medium">{ticketTotals.total}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </>
      )}

      {/* Recent Tickets — always mounted so it doesn't remount when parent isLoading toggles */}
      <div className="mt-5 flex flex-col lg:flex-row gap-5">
        <RecentTickets statusFilter={statusCardFilter} dateRangeLabel={dateRangeLabel} dateRange={dateRange} agentId={agentFilter || undefined} />
        {/* <HistoryLog /> */}
      </div>

    </>
  )
}

export default Overview
