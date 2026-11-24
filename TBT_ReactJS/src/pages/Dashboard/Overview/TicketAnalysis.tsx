import { useState, useEffect, useMemo } from 'react'
import { getAllTickets } from '@/services/ticketService'
import type { DateRange } from '@/hooks/useDateRange'

interface Props {
  dateRange?: DateRange
  agentId?: string
}

interface AgentStat {
  name: string
  total: number
  resolved: number
  avgHours: number | null
}

const HOURS = Array.from({ length: 24 }, (_, i) => i)

const fmt = (n: number, decimals = 1) =>
  Number.isFinite(n) ? n.toFixed(decimals).replace(/\.0$/, '') : '—'

const hourLabel = (h: number) => {
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}${period}`
}

export default function TicketAnalysis({ dateRange, agentId }: Props) {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!dateRange?.start || !dateRange?.end) return
    setLoading(true)
    getAllTickets({ startDate: dateRange.start!, endDate: dateRange.end!, agentId: agentId || undefined, limit: 2000 })
      .then(res => setTickets(Array.isArray(res) ? res : (res as any).data ?? []))
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }, [dateRange?.start, dateRange?.end, agentId])

  const stats = useMemo(() => {
    if (!tickets.length || !dateRange?.start || !dateRange?.end) return null

    const numDays = Math.max(1, Math.round((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000))
    const avgPerDay = tickets.length / numDays

    // Completion time: for resolved/closed tickets, use updatedAt - createdAt
    const completionHours: number[] = []
    tickets.forEach(t => {
      const isComplete = t.status === 'Resolved' || t.status === 'Closed'
      const created = t.dateCreated || t.createdAt
      const updated = t.updatedAt
      if (isComplete && created && updated) {
        const c = new Date(typeof created === 'string' ? created.replace(/ [A-Z]{2,4}$/, '') : created)
        const u = new Date(typeof updated === 'string' ? updated.replace(/ [A-Z]{2,4}$/, '') : updated)
        const hours = (u.getTime() - c.getTime()) / 3600000
        if (hours >= 0 && hours < 8760) completionHours.push(hours) // ignore bad data > 1 year
      }
    })
    const avgCompletionHours =
      completionHours.length > 0 ? completionHours.reduce((a, b) => a + b, 0) / completionHours.length : null

    // Hourly distribution
    const hourCounts = Array(24).fill(0)
    tickets.forEach(t => {
      const created = t.dateCreated || t.createdAt
      if (created) {
        const d = new Date(typeof created === 'string' ? created.replace(/ [A-Z]{2,4}$/, '') : created)
        if (!isNaN(d.getTime())) hourCounts[d.getHours()]++
      }
    })
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts))
    const maxHourCount = Math.max(...hourCounts)

    // Agent-wise stats
    const agentMap = new Map<string, { total: number; resolved: number; hours: number[] }>()
    tickets.forEach(t => {
      const agent = t.Agent || t.assignee
      const name =
        agent && typeof agent === 'object'
          ? [agent.first_name, agent.last_name].filter(Boolean).join(' ') || agent.name || agent.email || 'Unassigned'
          : typeof agent === 'string' && agent.trim()
          ? agent
          : 'Unassigned'

      if (!agentMap.has(name)) agentMap.set(name, { total: 0, resolved: 0, hours: [] })
      const entry = agentMap.get(name)!
      entry.total++
      const isComplete = t.status === 'Resolved' || t.status === 'Closed'
      if (isComplete) {
        entry.resolved++
        const created = t.dateCreated || t.createdAt
        const updated = t.updatedAt
        if (created && updated) {
          const c = new Date(typeof created === 'string' ? created.replace(/ [A-Z]{2,4}$/, '') : created)
          const u = new Date(typeof updated === 'string' ? updated.replace(/ [A-Z]{2,4}$/, '') : updated)
          const h = (u.getTime() - c.getTime()) / 3600000
          if (h >= 0 && h < 8760) entry.hours.push(h)
        }
      }
    })

    const agentStats: AgentStat[] = Array.from(agentMap.entries())
      .map(([name, d]) => ({
        name,
        total: d.total,
        resolved: d.resolved,
        avgHours: d.hours.length > 0 ? d.hours.reduce((a, b) => a + b, 0) / d.hours.length : null,
      }))
      .sort((a, b) => b.total - a.total)

    return { avgPerDay, avgCompletionHours, hourCounts, peakHour, maxHourCount, agentStats, total: tickets.length }
  }, [tickets, dateRange])

  const skeleton = (w: string) => (
    <div className={`h-4 bg-surface-secondary animate-pulse rounded ${w}`} />
  )

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-primary-500 text-[20px]">analytics</span>
        <h2 className="text-base font-semibold text-textColor-primary">Analysis</h2>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: 'Total Tickets',
            value: loading ? null : String(stats?.total ?? 0),
            icon: 'confirmation_number',
            color: 'text-primary-500 bg-primary-100',
          },
          {
            label: 'Avg Tickets / Day',
            value: loading ? null : fmt(stats?.avgPerDay ?? 0),
            icon: 'calendar_today',
            color: 'text-info-600 bg-info-100',
          },
          {
            label: 'Avg Completion Time',
            value: loading
              ? null
              : stats?.avgCompletionHours != null
              ? stats.avgCompletionHours >= 24
                ? `${fmt(stats.avgCompletionHours / 24)}d`
                : `${fmt(stats.avgCompletionHours)}h`
              : '—',
            icon: 'timer',
            color: 'text-success-600 bg-success-100',
          },
          {
            label: 'Peak Hour',
            value: loading ? null : stats ? hourLabel(stats.peakHour) : '—',
            icon: 'schedule',
            color: 'text-warning-600 bg-warning-100',
          },
        ].map(card => (
          <div key={card.label} className="bg-surface-primary rounded-xl border border-borderColor-secondary p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${card.color}`}>
              <span className="material-symbols-outlined text-[20px]">{card.icon}</span>
            </div>
            <div>
              <p className="text-[11px] text-textColor-muted">{card.label}</p>
              {loading ? skeleton('w-16 mt-1') : (
                <p className="text-xl font-bold text-textColor-primary leading-tight">{card.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Agent-wise breakdown */}
        <div className="lg:col-span-3 bg-surface-primary rounded-xl border border-borderColor-secondary p-4">
          <h3 className="text-sm font-semibold text-textColor-primary mb-3">Agent-wise Tickets</h3>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="flex gap-3">{skeleton('w-32')}{skeleton('w-full')}</div>)}
            </div>
          ) : !stats || stats.agentStats.length === 0 ? (
            <p className="text-sm text-textColor-muted py-4 text-center">No data</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[11px] uppercase text-textColor-muted border-b border-borderColor-secondary">
                    <th className="text-left pb-2 font-medium">Agent</th>
                    <th className="text-center pb-2 font-medium">Assigned</th>
                    <th className="text-center pb-2 font-medium">Resolved</th>
                    <th className="text-center pb-2 font-medium">Avg Time</th>
                    <th className="text-left pb-2 font-medium w-32">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderColor-secondary">
                  {stats.agentStats.slice(0, 8).map((a, i) => {
                    const resolveRate = a.total > 0 ? (a.resolved / a.total) * 100 : 0
                    return (
                      <tr key={i} className="h-10">
                        <td className="pr-3 max-w-[150px]">
                          <span className="truncate block text-textColor-primary font-medium">{a.name}</span>
                        </td>
                        <td className="text-center text-textColor-primary font-semibold">{a.total}</td>
                        <td className="text-center text-success-600 font-semibold">{a.resolved}</td>
                        <td className="text-center text-textColor-muted text-xs">
                          {a.avgHours != null
                            ? a.avgHours >= 24
                              ? `${fmt(a.avgHours / 24)}d`
                              : `${fmt(a.avgHours)}h`
                            : '—'}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${resolveRate}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-textColor-muted w-8 text-right">{Math.round(resolveRate)}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Hourly distribution */}
        <div className="lg:col-span-2 bg-surface-primary rounded-xl border border-borderColor-secondary p-4">
          <h3 className="text-sm font-semibold text-textColor-primary mb-3">Tickets by Hour</h3>
          {loading ? (
            <div className="flex items-end gap-1 h-32">
              {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="flex-1 bg-surface-secondary animate-pulse rounded-t" style={{ height: `${20 + Math.random() * 80}%` }} />
              ))}
            </div>
          ) : !stats ? null : (
            <>
              <div className="flex items-end gap-[2px] h-28">
                {HOURS.map(h => {
                  const count = stats.hourCounts[h]
                  const heightPct = stats.maxHourCount > 0 ? (count / stats.maxHourCount) * 100 : 0
                  const isPeak = h === stats.peakHour
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-surface-tertiary text-textColor-primary text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {hourLabel(h)}: {count}
                      </div>
                      <div
                        className={`w-full rounded-sm transition-all ${isPeak ? 'bg-primary-500' : 'bg-primary-200 dark:bg-primary-900'}`}
                        style={{ height: `${Math.max(heightPct, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  )
                })}
              </div>
              {/* X-axis labels — show every 6 hours */}
              <div className="flex justify-between mt-1">
                {[0, 6, 12, 18, 23].map(h => (
                  <span key={h} className="text-[10px] text-textColor-muted">{hourLabel(h)}</span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
