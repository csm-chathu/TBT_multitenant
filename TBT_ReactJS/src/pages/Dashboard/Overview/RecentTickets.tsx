import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from '@/components/Atomic/Button'
import type { Ticket } from '@/redux/ticket/ticketTypes'
import { TICKET_PRIORITY, PRIORITY_LABELS, TICKET_PRIORITY_VALUES, type TicketPriorityValue } from '@/constants/ticketPriority'
import { getStatusClass, computeAging, getAgingClass } from '@/lib/statusUtils'
import { formatRichTextToPlain, formatPhone } from '@/utils/textUtils'
import { STATUS_MAP, type StatusCardKey } from '@/hooks/useTicketFilters'
import { getAllTickets } from '@/services/ticketService'
import type { DateRange } from '@/hooks/useDateRange'
import UpdateTicketStatusModal from '@/components/Molecules/UpdateTicketStatusModal'
import TicketTimelineDrawer from '@/components/Molecules/TicketTimelineDrawer'
import CustomerTagBadge from '@/components/Molecules/ui/CustomerTagBadge'

function useDebounce<T>(value: T, delay: number): T {
    const [d, setD] = useState(value)
    useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t) }, [value, delay])
    return d
}

interface RecentTicketsProps {
    statusFilter?: StatusCardKey
    dateRangeLabel?: string
    dateRange?: DateRange
    agentId?: string
}

const ITEMS_PER_PAGE = 10

type SortColumn = 'id' | 'status' | 'priority' | 'createdOn' | null
type SortDirection = 'asc' | 'desc'

const RECENT_TICKETS_PAGE_STORAGE_KEY = 'dashboard-recent-tickets-page'
const RECENT_TICKETS_SEARCH_KEY = 'dashboard-recent-tickets-search'
const RECENT_TICKETS_COL_WIDTHS_KEY = 'dashboard-recent-tickets-col-widths'

const DEFAULT_COL_WIDTHS = [60, 90, 90, 110, 200, 130, 110, 100, 220, 110, 110, 100, 160]

const getStoredColWidths = (): number[] => {
    if (typeof window === 'undefined') return DEFAULT_COL_WIDTHS
    try {
        const stored = window.sessionStorage.getItem(RECENT_TICKETS_COL_WIDTHS_KEY)
        if (!stored) return DEFAULT_COL_WIDTHS
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length === DEFAULT_COL_WIDTHS.length) return parsed
    } catch { /* ignore */ }
    return DEFAULT_COL_WIDTHS
}

const getStoredPage = () => {
    if (typeof window === 'undefined') return 1
    try {
        const stored = window.sessionStorage.getItem(RECENT_TICKETS_PAGE_STORAGE_KEY)
        return stored ? Number(stored) : 1
    } catch {
        return 1
    }
}

const getStoredSearch = () => {
    if (typeof window === 'undefined') return ''
    try { return window.sessionStorage.getItem(RECENT_TICKETS_SEARCH_KEY) ?? '' } catch { return '' }
}

const RecentTickets = ({ statusFilter, dateRangeLabel, dateRange, agentId }: RecentTicketsProps) => {
    const navigate = useNavigate()
    const [currentPage, setCurrentPage] = useState(getStoredPage)
    const [sortColumn, setSortColumn] = useState<SortColumn>('id')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
    const [colWidths, setColWidths] = useState<number[]>(getStoredColWidths)
    const [search, setSearch] = useState(getStoredSearch)
    const [tickets, setTickets] = useState<Ticket[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [statusModalTicket, setStatusModalTicket] = useState<Ticket | null>(null)
    const [timelineTicket, setTimelineTicket] = useState<{ id: number; title: string } | null>(null)
    const debouncedSearch = useDebounce(search, 400)
    const resizingRef = useRef<{ colIndex: number; startX: number; startWidth: number } | null>(null)
    const isFirstMount = useRef(true)

    // Reset to page 1 when filters change (skip on first mount to preserve stored page)
    useEffect(() => {
        if (isFirstMount.current) { isFirstMount.current = false; return }
        setCurrentPage(1)
    }, [debouncedSearch, statusFilter, agentId, dateRange?.start, dateRange?.end])

    const fetchTicketsList = useCallback(() => {
        if (!dateRange?.start || !dateRange?.end) return
        setIsLoading(true)
        const statusParam = statusFilter ? STATUS_MAP[statusFilter] : undefined
        getAllTickets({
            startDate: dateRange.start,
            endDate: dateRange.end,
            status: statusParam,
            agentId: agentId || undefined,
            search: debouncedSearch || undefined,
            page: currentPage,
            limit: ITEMS_PER_PAGE,
        }).then(res => {
            if (Array.isArray(res)) {
                setTickets(res)
                setTotalCount(res.length)
            } else {
                setTickets((res as any).data ?? [])
                setTotalCount((res as any).meta?.total ?? 0)
            }
        }).catch(() => setTickets([])).finally(() => setIsLoading(false))
    }, [currentPage, debouncedSearch, statusFilter, agentId, dateRange?.start, dateRange?.end])

    // Server fetch
    useEffect(() => {
        fetchTicketsList()
    }, [fetchTicketsList])

    const handleResizeStart = useCallback((e: React.MouseEvent, colIndex: number) => {
        e.preventDefault()
        e.stopPropagation()
        resizingRef.current = { colIndex, startX: e.clientX, startWidth: colWidths[colIndex] }
        document.body.style.userSelect = 'none'
        document.body.style.cursor = 'col-resize'

        const onMouseMove = (ev: MouseEvent) => {
            if (!resizingRef.current) return
            const { colIndex, startX, startWidth } = resizingRef.current
            const delta = ev.clientX - startX
            const newWidth = Math.max(50, startWidth + delta)
            setColWidths(prev => {
                const next = [...prev]
                next[colIndex] = newWidth
                return next
            })
        }

        const onMouseUp = () => {
            resizingRef.current = null
            document.body.style.userSelect = ''
            document.body.style.cursor = ''
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }, [colWidths])
    
    // Constrain currentPage when total count changes
    useEffect(() => {
        const maxPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
        if (currentPage > maxPages && maxPages > 0) {
            setCurrentPage(maxPages)
        }
    }, [totalCount, currentPage])
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(RECENT_TICKETS_PAGE_STORAGE_KEY, String(currentPage))
        }
    }, [currentPage])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(RECENT_TICKETS_SEARCH_KEY, search)
        }
    }, [search])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(RECENT_TICKETS_COL_WIDTHS_KEY, JSON.stringify(colWidths))
        }
    }, [colWidths])
    
    // Normalize priority helper (needed for sorting)
    const normalizePriority = (value: unknown): TicketPriorityValue | undefined => {
        if (value === null || value === undefined) return undefined
        const str = String(value).toLowerCase().trim()
        if (str === String(TICKET_PRIORITY.LOW) || str === 'low') return TICKET_PRIORITY.LOW
        if (str === String(TICKET_PRIORITY.MEDIUM) || str === 'medium' || str === 'med') return TICKET_PRIORITY.MEDIUM
        if (str === String(TICKET_PRIORITY.HIGH) || str === 'high') return TICKET_PRIORITY.HIGH
        if (str === String(TICKET_PRIORITY.CRITICAL) || str === 'critical' || str === 'crit') return TICKET_PRIORITY.CRITICAL
        const n = Number(str)
        if (TICKET_PRIORITY_VALUES.includes(n as any)) return n as TicketPriorityValue
        return undefined
    }
    
    // Sorting logic
    const sortedTickets = useMemo(() => {
        if (!sortColumn) return tickets
        
        return [...tickets].sort((a, b) => {
            let aValue: any
            let bValue: any
            
            switch (sortColumn) {
                case 'id':
                    aValue = (a as any).id || (a as any).ticketId || 0
                    bValue = (b as any).id || (b as any).ticketId || 0
                    // Handle numeric IDs
                    const aNum = Number(aValue)
                    const bNum = Number(bValue)
                    if (!isNaN(aNum) && !isNaN(bNum)) {
                        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
                    }
                    // Fallback to string comparison
                    return sortDirection === 'asc' 
                        ? String(aValue).localeCompare(String(bValue))
                        : String(bValue).localeCompare(String(aValue))
                
                case 'status':
                    aValue = a.status || ''
                    bValue = b.status || ''
                    return sortDirection === 'asc'
                        ? String(aValue).localeCompare(String(bValue))
                        : String(bValue).localeCompare(String(aValue))
                
                case 'priority':
                    const aPriority = normalizePriority(a.priority)
                    const bPriority = normalizePriority(b.priority)
                    // Priority values: LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4
                    const aPriorityValue = aPriority ? TICKET_PRIORITY_VALUES.indexOf(aPriority) : -1
                    const bPriorityValue = bPriority ? TICKET_PRIORITY_VALUES.indexOf(bPriority) : -1
                    return sortDirection === 'asc'
                        ? aPriorityValue - bPriorityValue
                        : bPriorityValue - aPriorityValue
                
                case 'createdOn':
                    const aDate = a.dateCreated || a.createdAt
                    const bDate = b.dateCreated || b.createdAt
                    const aTime = aDate ? new Date(aDate).getTime() : 0
                    const bTime = bDate ? new Date(bDate).getTime() : 0
                    return sortDirection === 'asc' ? aTime - bTime : bTime - aTime
                
                default:
                    return 0
            }
        })
    }, [tickets, sortColumn, sortDirection])

    // Server handles filtering — sortedTickets is the current page from server
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
    const currentPageTickets = sortedTickets
    const totalTickets = totalCount
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + currentPageTickets.length

    
    // Handle sort column click
    const handleSort = (column: SortColumn) => {
        if (!column) return
        
        if (sortColumn === column) {
            // Toggle direction if same column
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            // Set new column with default direction
            setSortColumn(column)
            setSortDirection('asc')
        }
        setCurrentPage(1) // Reset to first page when sorting
    }
    
    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisiblePages = 5

        if (totalPages <= maxVisiblePages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Always show first page
            pages.push(1)

            if (currentPage > 3) {
                pages.push("...")
            }

            // Show pages around current page
            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i)
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push("...")
            }

            // Always show last page if more than 1 page
            if (totalPages > 1) {
                pages.push(totalPages)
            }
        }

        return pages
    }

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }
    
    // Table headers with dynamic sort state
    interface TableHeader {
        label: string
        sortable: boolean
        column: SortColumn
    }
    
    const thead: TableHeader[] = [
            { label: "Action", sortable: false, column: null },
            { label: "Ticket ID", sortable: true, column: 'id' },
            { label: "Priority", sortable: true, column: 'priority' },
            { label: "Created At", sortable: true, column: 'createdOn' },
            { label: "Status", sortable: true, column: 'status' },
            { label: "Reporter", sortable: false, column: null },
            { label: "Aging", sortable: false, column: null },
            { label: "Location", sortable: false, column: null },
            { label: "Title", sortable: false, column: null },
            { label: "Assigned Agent", sortable: false, column: null },
            { label: "Description", sortable: false, column: null },
            { label: "Application", sortable: false, column: null },
            { label: "Action Types", sortable: false, column: null },
    ];

    const getPriorityClass = (priority: any) => {
        const p = normalizePriority(priority)
        switch (p) {
            case TICKET_PRIORITY.LOW:
                return "priority-chip priority-low";
            case TICKET_PRIORITY.MEDIUM:
                return "priority-chip priority-medium";
            case TICKET_PRIORITY.HIGH:
                return "priority-chip priority-high";
            case TICKET_PRIORITY.CRITICAL:
                return "priority-chip priority-critical";
            default:
                return "";
        }
    };
    // Defensive formatter to turn possibly-object fields into readable strings
    const asDisplay = (val: any): string | undefined => {
        if (val === null || val === undefined) return undefined
        if (typeof val === 'string' || typeof val === 'number') return String(val)
        if (Array.isArray(val)) return val.map((v) => asDisplay(v)).filter(Boolean).join(', ')
        if (typeof val === 'object') {
            const fullName = [val.first_name, val.last_name].filter(Boolean).join(' ').trim()
            return val.name || fullName || val.email || val.mobile_number || val.phone_number || (typeof val.id !== 'undefined' ? `#${val.id}` : undefined)
        }
        try { return JSON.stringify(val) } catch { return String(val) }
    }

    const statusLabel = (() => {
        if (!statusFilter || statusFilter === 'all') return ''
        const s = STATUS_MAP[statusFilter]
        return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
    })()

    return (
        <>
                {/* Tickets Table  */}
                <div className="lg:w-full space-y-4 overflow-auto p-4 bg-surface-primary border border-borderColor-secondary rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold">
                                Recent Tickets{statusLabel && ` (${statusLabel})`}
                            </h2>
                            {dateRangeLabel && (
                                <span className="flex items-center gap-1.5 text-sm text-text-secondary border border-borderColor-secondary rounded-md px-2.5 py-1">
                                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {dateRangeLabel}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search tickets…"
                                    className="pl-8 pr-3 py-1.5 text-sm rounded-md border border-borderColor-secondary bg-surface-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
                                />
                            </div>
                            <Button style="Tertiary" text="View All" href="/dashboard/tickets" />
                        </div>
                    </div>
                 
                    <table className="table-fixed w-full border border-borderColor-secondary rounded-lg">
                        <colgroup>
                            {colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}
                        </colgroup>
                        <thead>
                            <tr>
                                {thead.map((header, index) => {
                                    const isSorted = header.column === sortColumn
                                    const currentSortDirection = isSorted ? sortDirection : null

                                    return (
                                        <th
                                            key={index}
                                            className={`relative text-xs text-left h-10 px-2 whitespace-nowrap uppercase bg-surface-secondary overflow-hidden ${
                                                header.sortable ? 'cursor-pointer hover:bg-surface-tertiary transition-colors' : ''
                                            }`}
                                            onClick={() => header.sortable && handleSort(header.column)}
                                        >
                                            <div className="flex items-center gap-1">
                                                <span>{header.label}</span>
                                                {header.sortable && (
                                                    <span className={isSorted ? 'text-primary-600' : 'text-textColor-muted'}>
                                                        {currentSortDirection === 'desc' ? (
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : currentSortDirection === 'asc' ? (
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12z" />
                                                                <path d="M15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            {/* Resize handle */}
                                            <div
                                                className="absolute top-0 right-0 h-full w-2 cursor-col-resize z-10 hover:bg-primary-400/40 transition-colors"
                                                onMouseDown={(e) => handleResizeStart(e, index)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                                    <tr key={i} className="h-14">
                                        {thead.map((_, j) => (
                                            <td key={j} className="px-2 py-2">
                                                <div className="h-4 bg-surface-secondary animate-pulse rounded w-3/4" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                            <>
                            {currentPageTickets.length === 0 && (
                                <tr>
                                    <td colSpan={thead.length} className="text-center py-4 text-muted-foreground">No recent tickets</td>
                                </tr>
                            )}
                            {currentPageTickets.map((ticket, index) => {
                                const t: any = ticket as any
                                const ticketId = t.id || t.ticketId || 'N/A'
                                const displayId = ticketId === 'N/A' ? 'N/A' : `#${ticketId}`
                                // Display Customer's first name and last name (if exists) in requester column
                                const getRequesterName = () => {
                                    if (t.Customer) {
                                        const firstName = t.Customer.first_name || ''
                                        const lastName = t.Customer.last_name || ''
                                        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
                                        const display = fullName || 'N/A'
                                        return /^\+?[\d\s\-().]{7,}$/.test(display) ? formatPhone(display) : display
                                    }
                                    const raw = asDisplay(t.reporter) || 'N/A'
                                    return /^\+?[\d\s\-().]{7,}$/.test(raw) ? formatPhone(raw) : raw
                                }
                                const requesterName = getRequesterName()
                                const ticketTitle = ticket.title || (t as any).heading || 'N/A'
                                const description = formatRichTextToPlain(ticket.body)
                                const status = ticket.status || 'N/A'
                                const normalizedPriority = normalizePriority(ticket.priority)
                                const priorityLabel = normalizedPriority ? PRIORITY_LABELS[normalizedPriority] : 'N/A'
                                const priorityClass = normalizedPriority ? getPriorityClass(ticket.priority) : 'priority-chip'
                                const locationName =
                                    t.locationName ||
                                    t?.device?.location?.name ||
                                    t?.location?.name ||
                                    'N/A'
                                const assigneeName = asDisplay(t.assignee) || asDisplay(t.Agent) || 'N/A'
                                const applicationName = asDisplay(t.Application) || t.Application?.name || 'N/A'
                                
                                // Format created date
                                const formatDate = (dateStr?: string | Date) => {
                                    if (!dateStr) return null
                                    try {
                                        const date = typeof dateStr === 'string' ? new Date(dateStr.replace(/ [A-Z]{2,4}$/, '')) : dateStr
                                        if (isNaN(date.getTime())) return null
                                        return {
                                            datePart: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                                            timePart: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                                        }
                                    } catch {
                                        return null
                                    }
                                }
                                const createdOn = formatDate(ticket.dateCreated || ticket.createdAt)
                                
                                // Get ticket hash or id for view button
                                const ticketHash = (ticket as any).hash || ticket.hash
                                const hashOrId = ticketHash || ticket.id || t.ticketId

                                return (
                                    <tr key={index} className="h-14 hover:shadow-lg dark:hover:shadow-black/50">
                                            <td>
                                                <div className="flex gap-x-2 justify-start pt-2">
                                                    <Button style="Icon" href={`/dashboard/tickets/details/${hashOrId}`} icon="visibility" />
                                                    <button
                                                        type="button"
                                                        title="View Timeline"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            const id = Number(t.id || t.ticketId)
                                                            setTimelineTicket({ id, title: ticketTitle })
                                                        }}
                                                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-secondary text-textColor-muted hover:text-primary-500 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">timeline</span>
                                                    </button>
                                                </div>
                                            </td>
                                            <td>{displayId}</td>
                                            <td>
                                                <span className={priorityClass}>{priorityLabel}</span>
                                            </td>
                                            <td>
                                                {createdOn ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-semibold text-textColor-primary">{createdOn.datePart}</span>
                                                        <span className="text-[11px] text-textColor-muted">{createdOn.timePart}</span>
                                                    </div>
                                                ) : <span className="text-textColor-muted text-xs">N/A</span>}
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); setStatusModalTicket(ticket) }}
                                                    className="group inline-flex items-center gap-1 focus:outline-none cursor-pointer text-left"
                                                    title="Click to update status"
                                                >
                                                    <span className={`${getStatusClass(status)} group-hover:opacity-90 group-hover:shadow-sm transition-all`}>
                                                        {status}
                                                    </span>
                                                    <span className="material-symbols-outlined text-xs text-textColor-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                        edit
                                                    </span>
                                                </button>
                                            </td>
                                            <td>
                                                {t.Customer?.hash ? (
                                                    <span
                                                        className="inline-flex items-center gap-1.5 text-primary-500 cursor-pointer hover:opacity-70"
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/customers/details/${t.Customer.hash}`); }}
                                                    >
                                                        {requesterName}
                                                        <CustomerTagBadge tag={t.Customer?.tag} size="sm" />
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {requesterName}
                                                        <CustomerTagBadge tag={t.Customer?.tag} size="sm" />
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                {(() => { const { label, bucket } = computeAging(ticket); return <span className={getAgingClass(bucket)} title={label}>{label}</span> })()}
                                            </td>
                                            <td>{locationName}</td>
                                            <td className='max-w-[200px]'>
                                                <span className='text-sm'>{ticketTitle}</span>
                                            </td>
                                            <td>{assigneeName}</td>
                                            <td>
                                                <span className='text-sm'>{description || 'N/A'}</span>
                                            </td>
                                            <td className='max-w-10'>{applicationName}</td>
                                            <td>
                                                {(() => {
                                                    const raw = (t as any).action_types
                                                    const types: string[] = Array.isArray(raw)
                                                        ? raw.map((x: any) => (typeof x === 'string' ? x : x?.name || String(x)))
                                                        : typeof raw === 'string' && raw.trim()
                                                        ? raw.split(',').map((s: string) => s.trim())
                                                        : []
                                                    if (types.length === 0) return <span>N/A</span>
                                                    return (
                                                        <div className="flex flex-wrap gap-1">
                                                            {types.slice(0, 3).map((type, idx) => (
                                                                <span key={idx} className="chip">{type}</span>
                                                            ))}
                                                            {types.length > 3 && <span className="text-textColor-muted text-sm">...</span>}
                                                        </div>
                                                    )
                                                })()}
                                            </td>
                                    </tr>
                                )
                            })}
                            </>
                            )}
                        </tbody>
                    </table>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-borderColor-secondary flex items-center justify-between">
                            <div className="text-sm text-textColor-muted">
                                Showing {startIndex + 1} to {Math.min(endIndex, totalTickets)} of {totalTickets} tickets
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Previous Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5 text-textColor-muted" />
                                </button>

                                {/* Page Numbers */}
                                {getPageNumbers().map((page, index) => (
                                    <div key={index}>
                                        {page === "..." ? (
                                            <span className="px-3 py-2 text-textColor-muted">...</span>
                                        ) : (
                                            <button
                                                onClick={() => handlePageChange(page as number)}
                                                className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                                                    currentPage === page
                                                        ? "bg-primary-500 text-white"
                                                        : "text-textColor-muted hover:bg-primary-100"
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Next Button */}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5 text-textColor-muted" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <UpdateTicketStatusModal
                    open={Boolean(statusModalTicket)}
                    ticket={statusModalTicket}
                    onClose={() => setStatusModalTicket(null)}
                    onSuccess={(updatedTicket) => {
                        setTickets(prev => prev.map(t => {
                            const tId = (t as any).id || (t as any).ticketId
                            const uId = (updatedTicket as any).id || (updatedTicket as any).ticketId
                            return tId === uId ? { ...t, status: updatedTicket.status } : t
                        }))
                        fetchTicketsList()
                    }}
                />

                <TicketTimelineDrawer ticket={timelineTicket} onClose={() => setTimelineTicket(null)} />
        </>
    )
}

export default RecentTickets