import { useState, useCallback } from 'react'
import { useDateRange } from '@/hooks/useDateRange'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchAgents } from '@/redux/agent/agentSlice'
import { useEffect } from 'react'
import DateRangePicker from '@/components/Molecules/DateRangePicker'
import TicketAnalysis from './Overview/TicketAnalysis'

const ANALYSIS_DATE_STORAGE_KEY = 'dashboard-analysis-date-range'
const ANALYSIS_AGENT_STORAGE_KEY = 'dashboard-analysis-agent-filter'

type FilterType = 'day' | 'week' | 'month' | 'year' | null

export default function Analysis() {
  const dispatch = useAppDispatch()
  const { agents } = useAppSelector((state) => state.agents)

  const { dateRange, handleDateSelect, setDateRange, dateRangeLabel } = useDateRange(undefined, ANALYSIS_DATE_STORAGE_KEY)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('week')
  const [agentFilter, setAgentFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.sessionStorage.getItem(ANALYSIS_AGENT_STORAGE_KEY) ?? ''
  })

  useEffect(() => {
    if (agents.length === 0) void dispatch(fetchAgents())
  }, [agents.length, dispatch])

  useEffect(() => {
    if (typeof window !== 'undefined') window.sessionStorage.setItem(ANALYSIS_AGENT_STORAGE_KEY, agentFilter)
  }, [agentFilter])

  const handleDayFilter = useCallback(() => {
    const now = new Date()
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    setDateRange({ start: s, end: e })
    setSelectedFilter('day')
  }, [setDateRange])

  const handleWeekFilter = useCallback(() => {
    const now = new Date()
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    s.setDate(s.getDate() - 7)
    setDateRange({ start: s, end: e })
    setSelectedFilter('week')
  }, [setDateRange])

  const handleMonthFilter = useCallback(() => {
    const now = new Date()
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    s.setDate(s.getDate() - 30)
    setDateRange({ start: s, end: e })
    setSelectedFilter('month')
  }, [setDateRange])

  const handleYearFilter = useCallback(() => {
    const now = new Date()
    const e = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    s.setDate(s.getDate() - 365)
    setDateRange({ start: s, end: e })
    setSelectedFilter('year')
  }, [setDateRange])

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'bg-primary-500 text-white'
        : 'bg-surface-secondary text-textColor-muted hover:bg-primary-100 hover:text-primary-600'
    }`

  return (
    <div className="w-full">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-textColor-primary">Analysis</h1>
          <p className="text-sm text-textColor-muted mt-0.5">
            {dateRangeLabel || 'Ticket performance and agent metrics'}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick date filters */}
          <div className="flex items-center gap-1 bg-surface-secondary rounded-lg p-1">
            <button className={filterBtnClass(selectedFilter === 'day')} onClick={handleDayFilter}>Day</button>
            <button className={filterBtnClass(selectedFilter === 'week')} onClick={handleWeekFilter}>Week</button>
            <button className={filterBtnClass(selectedFilter === 'month')} onClick={handleMonthFilter}>Month</button>
            <button className={filterBtnClass(selectedFilter === 'year')} onClick={handleYearFilter}>Year</button>
          </div>

          {/* Date range picker */}
          <DateRangePicker
            defaultStartDate={dateRange.start || undefined}
            defaultEndDate={dateRange.end || undefined}
            onDateSelect={(s, e) => { handleDateSelect(s, e); setSelectedFilter(null) }}
          />

          {/* Agent filter */}
          {agents.length > 0 && (
            <select
              value={agentFilter}
              onChange={e => setAgentFilter(e.target.value)}
              className="text-sm border border-borderColor-secondary rounded-lg px-3 py-[7px] bg-surface-primary text-textColor-base focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All Agents</option>
              {agents.map((a: any) => (
                <option key={a.id} value={String(a.id)}>
                  {[a.first_name, a.last_name].filter(Boolean).join(' ') || a.email || `Agent #${a.id}`}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <TicketAnalysis dateRange={dateRange} agentId={agentFilter || undefined} />
    </div>
  )
}
