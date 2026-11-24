"use client"

import type React from "react"
import { useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Button from "../../../components/Atomic/Button"
import Filter, { FilterState } from "@/components/Molecules/Filter"
import DataTable from "@/components/Molecules/DataTable"
import DateRangePicker from "@/components/Molecules/DateRangePicker"
import { useDateRange } from "@/hooks/useDateRange"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchTickets, selectTicketMeta, selectTicketUpdated, clearTicketUpdated, type TicketUpdateEvent } from "@/redux/ticket/ticketSlice"
import { fetchOrganizations } from "@/redux/organizations/organizationSlice"
import { fetchAgents } from "@/redux/agent/agentSlice"
import { fetchItems } from "@/redux/item/itemSlice"
import { fetchLocations } from "@/redux/location/locationSlice"
import { Ticket } from "@/redux/ticket/ticketTypes"
import { getAllTickets, getTicketActionTypes, markTicketRead } from "@/services/ticketService"
import { getStatusClass, getAgingClass, computeAging } from '@/lib/statusUtils'
import { TICKET_PRIORITY, PRIORITY_LABELS, TICKET_PRIORITY_VALUES, type TicketPriorityValue } from "@/constants/ticketPriority"
import { formatRichTextToPlain, formatPhone } from "@/utils/textUtils"
import UpdateTicketStatusModal from "@/components/Molecules/UpdateTicketStatusModal"
import CustomerTagBadge from "@/components/Molecules/ui/CustomerTagBadge"
import TicketTimelineDrawer from "@/components/Molecules/TicketTimelineDrawer"

type SortColumn = 'ticketId' | 'title' | 'description' | 'createdAt' | 'priority' | 'assetsDevice' | 'reporter' | 'assignee' | null
type SortDirection = 'asc' | 'desc'
const TICKET_PAGE_FILTERS_STORAGE_KEY = 'dashboard-all-tickets-filters'
const TICKET_PAGE_DATE_STORAGE_KEY = 'dashboard-all-tickets-date-range'
const TICKET_PAGE_PAGINATION_STORAGE_KEY = 'dashboard-all-tickets-pagination'
const TICKET_PAGE_NEW_ONLY_STORAGE_KEY = 'dashboard-all-tickets-new-only'
const TICKET_PAGE_SEARCH_STORAGE_KEY = 'dashboard-all-tickets-search'

const defaultFilters: FilterState = {
  ticketType: "",
  organization: "",
  dateRange: "",
  assignedAgent: "",
  priority: "",
  device: "",
  status: "",
  location: "",
  actionType: "",
}

const getStoredFilters = (): FilterState => {
  if (typeof window === 'undefined') return defaultFilters
  try {
    const raw = window.sessionStorage.getItem(TICKET_PAGE_FILTERS_STORAGE_KEY)
    if (!raw) return defaultFilters
    const parsed = JSON.parse(raw) as Partial<FilterState>
    return { ...defaultFilters, ...parsed }
  } catch {
    return defaultFilters
  }
}

interface PaginationState {
  page: number;
  limit: number;
}

const defaultPagination: PaginationState = { page: 1, limit: 10 }
const getStoredPagination = (): PaginationState => {
  if (typeof window === 'undefined') return defaultPagination
  try {
    const raw = window.sessionStorage.getItem(TICKET_PAGE_PAGINATION_STORAGE_KEY)
    if (!raw) return defaultPagination
    const parsed = JSON.parse(raw)
    return { ...defaultPagination, ...parsed }
  } catch {
    return defaultPagination
  }
}

const AllTickets: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [visibleCount, setVisibleCount] = useState(0)
  const { tickets, loading, error } = useAppSelector((state) => state.tickets)
  const meta = useAppSelector(selectTicketMeta)
  const ticketUpdated = useAppSelector(selectTicketUpdated)
  const organizations = useAppSelector((state) => state.organizations.list)
  const agents = useAppSelector((state) => state.agents.agents)
  const items = useAppSelector((state) => state.items.items)
  const locations = useAppSelector((state) => state.locations.locations)
  
  // Initialize date range with default (last 7 days)
  const { dateRange, handleDateSelect } = useDateRange(undefined, TICKET_PAGE_DATE_STORAGE_KEY)
  
  const [filters, setFilters] = useState<FilterState>(getStoredFilters)
  const [pagination, setPagination] = useState(getStoredPagination)
  const [isExporting, setIsExporting] = useState(false)
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt')
  const [localReadIds, setLocalReadIds] = useState<Set<number>>(new Set())
  const [showNewOnly, setShowNewOnly] = useState(() => {
    try { return window.sessionStorage.getItem(TICKET_PAGE_NEW_ONLY_STORAGE_KEY) === 'true' } catch { return false }
  })
  const [searchInput, setSearchInput] = useState(() => {
    try { return window.sessionStorage.getItem(TICKET_PAGE_SEARCH_STORAGE_KEY) ?? '' } catch { return '' }
  })
  const [searchQuery, setSearchQuery] = useState(() => {
    try { return window.sessionStorage.getItem(TICKET_PAGE_SEARCH_STORAGE_KEY) ?? '' } catch { return '' }
  })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [actionTypes, setActionTypes] = useState<{ id: number; name: string }[]>([])
  const [statusModalTicket, setStatusModalTicket] = useState<Ticket | null>(null)
  const [timelineTicket, setTimelineTicket] = useState<{ id: number; title: string } | null>(null)

  useEffect(() => {
    if (organizations.length === 0) dispatch(fetchOrganizations())
    if (agents.length === 0) dispatch(fetchAgents())
    if (items.length === 0) dispatch(fetchItems())
    if (locations.length === 0) dispatch(fetchLocations())

    if (actionTypes.length === 0) {
      getTicketActionTypes()
        .then(setActionTypes)
        .catch((error) => console.error("Failed to load ticket action types", error))
    }
  }, [dispatch]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TICKET_PAGE_FILTERS_STORAGE_KEY, JSON.stringify(filters))
  }, [filters])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TICKET_PAGE_PAGINATION_STORAGE_KEY, JSON.stringify(pagination))
  }, [pagination])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(TICKET_PAGE_SEARCH_STORAGE_KEY, searchInput)
  }, [searchInput])

  useEffect(() => {
    try { window.sessionStorage.setItem(TICKET_PAGE_NEW_ONLY_STORAGE_KEY, String(showNewOnly)) } catch {}
  }, [showNewOnly])

  // Handle date range selection
  const handleDateRangeSelect = useCallback((start: Date | null, end: Date | null) => {
    handleDateSelect(start, end)
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [handleDateSelect])

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(prevFilters => {
      const isSame = 
        prevFilters.ticketType === newFilters.ticketType &&
        prevFilters.organization === newFilters.organization &&
        prevFilters.dateRange === newFilters.dateRange &&
        prevFilters.assignedAgent === newFilters.assignedAgent &&
        prevFilters.priority === newFilters.priority &&
        prevFilters.device === newFilters.device &&
        prevFilters.status === newFilters.status &&
        prevFilters.location === newFilters.location &&
        prevFilters.actionType === newFilters.actionType;

      if (!isSame) {
        setPagination(prev => ({ ...prev, page: 1 }));
        return newFilters;
      }
      return prevFilters;
    });
  }, []);

  // Debounce search input — fires fetch after 400 ms, min 2 chars
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (searchInput.length === 0) {
      setSearchQuery('')
      return
    }
    if (searchInput.length < 2) return
    debounceRef.current = setTimeout(() => { setSearchQuery(searchInput); setPagination(prev => ({ ...prev, page: 1 })) }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // Fetch tickets whenever date range, filters or search changes
  useEffect(() => {
    const search = searchQuery || undefined
    if (!dateRange.start || !dateRange.end) {
      dispatch(fetchTickets({
        priority: filters.priority || undefined,
        deviceId: filters.device ? Number(filters.device) : undefined,
        agentId: filters.assignedAgent ? Number(filters.assignedAgent) : undefined,
        status: filters.status || undefined,
        locationId: filters.location ? Number(filters.location) : undefined,
        actionType: filters.actionType || undefined,
        page: pagination.page,
        limit: pagination.limit,
        search,
        isUnread: showNewOnly || undefined,
      }))
      return
    }

    const startDate = new Date(dateRange.start)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(dateRange.end)
    endDate.setHours(23, 59, 59, 999)

    dispatch(fetchTickets({
      startDate,
      endDate,
      priority: filters.priority || undefined,
      deviceId: filters.device ? Number(filters.device) : undefined,
      agentId: filters.assignedAgent ? Number(filters.assignedAgent) : undefined,
      status: filters.status || undefined,
      locationId: filters.location ? Number(filters.location) : undefined,
      actionType: filters.actionType || undefined,
      page: pagination.page,
      limit: pagination.limit,
      search,
      isUnread: showNewOnly || undefined,
    }))
  }, [dispatch, dateRange.start, dateRange.end, filters.priority, filters.device, filters.assignedAgent, filters.status, filters.location, filters.actionType, pagination.page, pagination.limit, searchQuery, showNewOnly])

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

  // Sorting and filtering logic
  const sortAndFilterTickets = useCallback((list: Ticket[]) => {
    let sorted = [...list]
    if (sortColumn) {
      sorted.sort((a, b) => {
        let aValue: any
        let bValue: any
        
        switch (sortColumn) {
          case 'ticketId':
            aValue = a.id || a.ticketId || (a as any).hash || 0
            bValue = b.id || b.ticketId || (b as any).hash || 0
            const aNum = Number(aValue)
            const bNum = Number(bValue)
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
            }
            return sortDirection === 'asc' 
              ? String(aValue).localeCompare(String(bValue))
              : String(bValue).localeCompare(String(aValue))
          
          case 'title':
            aValue = a.title || a.heading || ''
            bValue = b.title || b.heading || ''
            return sortDirection === 'asc'
              ? String(aValue).localeCompare(String(bValue))
              : String(bValue).localeCompare(String(aValue))
          
          case 'description':
            aValue = a.body || ''
            bValue = b.body || ''
            return sortDirection === 'asc'
              ? String(aValue).localeCompare(String(bValue))
              : String(bValue).localeCompare(String(aValue))
          
          case 'createdAt':
            const aDate = a.createdAt || a.dateCreated
            const bDate = b.createdAt || b.dateCreated
            const normDate = (v: any) => typeof v === 'string' ? v.replace(/ [A-Z]{2,4}$/, '') : v
            const aTime = aDate ? new Date(normDate(aDate)).getTime() : 0
            const bTime = bDate ? new Date(normDate(bDate)).getTime() : 0
            return sortDirection === 'asc' ? aTime - bTime : bTime - aTime
          
          case 'priority':
            const aPriority = normalizePriority(a.priority)
            const bPriority = normalizePriority(b.priority)
            const aPriorityValue = aPriority ? TICKET_PRIORITY_VALUES.indexOf(aPriority) : -1
            const bPriorityValue = bPriority ? TICKET_PRIORITY_VALUES.indexOf(bPriority) : -1
            return sortDirection === 'asc'
              ? aPriorityValue - bPriorityValue
              : bPriorityValue - aPriorityValue
          
          case 'assetsDevice':
            aValue = (a as any)?.device?.name || (a as any)?.device?.serialNo || a.assetsDevice || ''
            bValue = (b as any)?.device?.name || (b as any)?.device?.serialNo || b.assetsDevice || ''
            return sortDirection === 'asc'
              ? String(aValue).localeCompare(String(bValue))
              : String(bValue).localeCompare(String(aValue))
          
          case 'reporter':
            const aReporterFirstName = a?.reporter?.first_name || ''
            const aReporterLastName = a?.reporter?.last_name || ''
            const aReporterName = [aReporterFirstName, aReporterLastName].filter(Boolean).join(' ')
            const bReporterFirstName = b?.reporter?.first_name || ''
            const bReporterLastName = b?.reporter?.last_name || ''
            const bReporterName = [bReporterFirstName, bReporterLastName].filter(Boolean).join(' ')
            return sortDirection === 'asc'
              ? aReporterName.localeCompare(bReporterName)
              : bReporterName.localeCompare(aReporterName)
          
          case 'assignee':
            const aAssigneeFirstName = a?.Agent?.first_name || ''
            const aAssigneeLastName = a?.Agent?.last_name || ''
            const aAssigneeName = [aAssigneeFirstName, aAssigneeLastName].filter(Boolean).join(' ')
            const bAssigneeFirstName = b?.Agent?.first_name || ''
            const bAssigneeLastName = b?.Agent?.last_name || ''
            const bAssigneeName = [bAssigneeFirstName, bAssigneeLastName].filter(Boolean).join(' ')
            return sortDirection === 'asc'
              ? aAssigneeName.localeCompare(bAssigneeName)
              : bAssigneeName.localeCompare(aAssigneeName)
          
          default:
            return 0
        }
      })
    }

    let filtered = sorted

    // Filter by ticket type
    if (filters.ticketType && filters.ticketType !== "all") {
      filtered = filtered.filter((ticket) => {
        const ticketType = ticket.ticketType?.toLowerCase() || ""
        const filterType = filters.ticketType.toLowerCase()
        return ticketType === filterType || 
               (filterType === "helpdesk" && ticketType === "help desk") ||
               (filterType === "help desk" && ticketType === "helpdesk")
      })
    }

    // Filter by organization
    if (filters.organization && filters.organization !== "all") {
      const selectedOrg = organizations.find(
        (org) => org.name.toLowerCase().replace(/\s+/g, "-") === filters.organization.toLowerCase()
      )
      const filterOrgName = selectedOrg?.name || filters.organization
      
      filtered = filtered.filter((ticket) => {
        const ticketOrgName = (ticket.Application?.organization?.name || ticket.organization || "").toLowerCase()
        const filterName = filterOrgName.toLowerCase()
        return ticketOrgName === filterName || 
               ticketOrgName.includes(filterName) || 
               filterName.includes(ticketOrgName) ||
               ticketOrgName === filterName.replace(/-/g, " ")
      })
    }

    return filtered
  }, [sortColumn, sortDirection, filters, organizations])

  const filteredTickets = useMemo(() => {
    return sortAndFilterTickets(tickets)
  }, [tickets, sortAndFilterTickets])

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; value: string; onRemove: () => void }[] = []
    const fmt = (d: Date | string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    if (dateRange.start && dateRange.end) {
      chips.push({ key: 'date', label: 'Date', value: `${fmt(dateRange.start)} – ${fmt(dateRange.end)}`, onRemove: () => handleDateRangeSelect(null, null) })
    }
    if (filters.status) chips.push({ key: 'status', label: 'Status', value: filters.status, onRemove: () => setFilters(prev => ({ ...prev, status: '' })) })
    if (filters.priority) chips.push({ key: 'priority', label: 'Priority', value: filters.priority, onRemove: () => setFilters(prev => ({ ...prev, priority: '' })) })
    if (filters.assignedAgent) {
      const agent = agents.find(a => String(a.id) === filters.assignedAgent)
      const name = agent ? (`${agent.first_name || ''} ${agent.last_name || ''}`.trim() || agent.nickname || `Agent #${agent.id}`) : `Agent #${filters.assignedAgent}`
      chips.push({ key: 'agent', label: 'Agent', value: name, onRemove: () => setFilters(prev => ({ ...prev, assignedAgent: '' })) })
    }
    if (filters.location) {
      const loc = locations.find(l => String(l.id) === filters.location)
      chips.push({ key: 'location', label: 'Location', value: loc?.name || loc?.label || `Location #${filters.location}`, onRemove: () => setFilters(prev => ({ ...prev, location: '' })) })
    }
    if (filters.device) {
      const item = items.find(i => String(i.id) === filters.device)
      chips.push({ key: 'device', label: 'Device', value: (item?.name as string) || `Device #${filters.device}`, onRemove: () => setFilters(prev => ({ ...prev, device: '' })) })
    }
    if (filters.actionType) {
      const at = actionTypes.find(t => String(t.id) === filters.actionType)
      chips.push({ key: 'actionType', label: 'Action', value: at?.name || `Type #${filters.actionType}`, onRemove: () => setFilters(prev => ({ ...prev, actionType: '' })) })
    }
    if (searchQuery) chips.push({ key: 'search', label: 'Search', value: `"${searchQuery}"`, onRemove: () => { setSearchInput(''); setSearchQuery('') } })
    if (showNewOnly) chips.push({ key: 'newOnly', label: 'Filter', value: 'New only', onRemove: () => setShowNewOnly(false) })
    return chips
  }, [dateRange.start, dateRange.end, filters, searchQuery, showNewOnly, agents, locations, items, actionTypes, handleDateRangeSelect])

  // Handle sort column click
  const handleSort = (column: string) => {
    const sortKey = column as SortColumn
    if (!sortKey) return
    
    if (sortColumn === sortKey) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column with default direction
      setSortColumn(sortKey)
      setSortDirection('asc')
    }
  }

  const getPriorityLabel = (priority: unknown): string => {
    const p = normalizePriority(priority)
    switch (p) {
      case TICKET_PRIORITY.LOW:
        return PRIORITY_LABELS[TICKET_PRIORITY.LOW]
      case TICKET_PRIORITY.MEDIUM:
        return PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM]
      case TICKET_PRIORITY.HIGH:
        return PRIORITY_LABELS[TICKET_PRIORITY.HIGH]
      case TICKET_PRIORITY.CRITICAL:
        return PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL]
      default:
        return "N/A"
    }
  }

  const getPriorityChip = (priority: unknown) => {
    const p = normalizePriority(priority)
    switch (p) {
      case TICKET_PRIORITY.LOW:
        return <span className="priority-chip priority-low">{PRIORITY_LABELS[TICKET_PRIORITY.LOW]}</span>
      case TICKET_PRIORITY.MEDIUM:
        return <span className="priority-chip priority-medium">{PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM]}</span>
      case TICKET_PRIORITY.HIGH:
        return <span className="priority-chip priority-high">{PRIORITY_LABELS[TICKET_PRIORITY.HIGH]}</span>
      case TICKET_PRIORITY.CRITICAL:
        return <span className="priority-chip priority-critical">{PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL]}</span>
      default:
        return <span className="priority-chip">N/A</span>
    }
  }

  const formatDateTime = (value: any): string => {
    if (!value) return ""
    try {
      const norm = typeof value === 'string' ? value.replace(/ [A-Z]{2,4}$/, '') : value
      const date = new Date(norm)
      if (Number.isNaN(date.getTime())) return ""
      return `${date.toLocaleString("en-US", {
        month: "short",
      })}${date.getDate()}, ${date.getFullYear()} ${date.toLocaleTimeString("en-US", {
        hour12: false,
      })}`
    } catch {
      return ""
    }
  }

  const stringifyField = (value: any): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value
    if (typeof value === "number" || typeof value === "bigint") return String(value)
    if (Array.isArray(value)) return value.map(stringifyField).filter(Boolean).join(", ")
    if (typeof value === "object") {
      const name = [value.first_name, value.last_name].filter(Boolean).join(" ").trim()
      return value.name || name || value.email || value.mobile_number || value.phone_number || (value.id ? String(value.id) : "")
    }
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }

  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      let exportTicketsList: Ticket[] = []

      try {
        let startDate: Date | undefined = undefined
        let endDate: Date | undefined = undefined
        if (dateRange.start) {
          startDate = new Date(dateRange.start)
          startDate.setHours(0, 0, 0, 0)
        }
        if (dateRange.end) {
          endDate = new Date(dateRange.end)
          endDate.setHours(23, 59, 59, 999)
        }

        const response = await getAllTickets({
          startDate,
          endDate,
          priority: filters.priority || undefined,
          deviceId: filters.device ? Number(filters.device) : undefined,
          agentId: filters.assignedAgent ? Number(filters.assignedAgent) : undefined,
          status: filters.status || undefined,
          locationId: filters.location ? Number(filters.location) : undefined,
          actionType: filters.actionType || undefined,
          page: 1,
          limit: meta?.total ? Math.max(meta.total, 100000) : 100000,
        })

        const fetched: Ticket[] = Array.isArray(response)
          ? response
          : (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data))
          ? (response as any).data
          : []

        if (fetched.length > 0) {
          exportTicketsList = sortAndFilterTickets(fetched)
        } else {
          exportTicketsList = filteredTickets
        }
      } catch (err) {
        console.error("Failed to fetch all tickets for export, falling back to current page", err)
        exportTicketsList = filteredTickets
      }

      if (!exportTicketsList.length) return

      const headers = [
        "id",
        "Application",
        "Ticket",
        "Agent Name",
        "Status",
        "Priority",
        "Customer",
        "Customer Contact",
        "Created At",
        "Current Status",
        "Updated At",
      ]

      const csvRows = exportTicketsList.map((ticket) => {
        const t: any = ticket as any
        const id = t.id ?? t.ticketId ?? ""
        const application =
          t.Application?.name ||
          t.application?.name ||
          t.application ||
          t.Application ||
          ""
        const ticketBody = t.title || t.heading || t.body || t.description || ""
        const agentName =
          [t.Agent?.first_name ?? "", t.Agent?.last_name ?? ""].filter(Boolean).join(" ").trim() ||
          stringifyField(t.assignee)
        const status = ticket.status || t.current_status || t.CurrentStatus || ""
        const priority = getPriorityLabel(ticket.priority)
        const customer = t.customer_id ?? t.customerId ?? t.Customer?.id ?? ""
        const customerContact =
          t.Customer?.mobile_number ||
          t.Customer?.phone_number ||
          t.mobile_number ||
          t.phone_number ||
          ""
        const createdAt = formatDateTime(ticket.createdAt || ticket.dateCreated)
        const currentStatus = t.current_status || t.CurrentStatus || ticket.status || ""
        const updatedAt = formatDateTime(ticket.updatedAt || t.updated_at)

        return [
          id,
          application,
          ticketBody,
          agentName,
          status,
          priority,
          customer,
          customerContact,
          createdAt,
          currentStatus,
          updatedAt,
        ]
      })

      const escapeCsvValue = (value: unknown): string => {
        const stringValue =
          value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, " ")
        if (/[",]/.test(stringValue)) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }

      const csvContent = [
        headers.join(","),
        ...csvRows.map((row) => row.map(escapeCsvValue).join(",")),
      ].join("\r\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute(
        "download",
        `tickets_${new Date().toISOString().slice(0, 10)}.csv`
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

const columns = useMemo(() => [
  {
    key: "actions",
    title: "Action",
    align: "center" as const,
    headerClassName: "text-center",
    cellClassName: "text-center",
    width: "56px",
    sortable: false,
    render: (_: any, ticket: Ticket) => {
      const ticketHash = (ticket as any).hash || ticket.hash
      const hashOrId = ticketHash || ticket.id
      return (
        <div className="flex items-center justify-center gap-1">
          <Button
            style="Icon"
            href={`/dashboard/tickets/details/${hashOrId}`}
            icon="visibility"
            onClick={() => { if (ticket.id) { markTicketRead(ticket.id); setLocalReadIds(prev => { const next = new Set(prev); next.add(ticket.id!); return next }) } }}
          />
          <button
            type="button"
            title="View Timeline"
            onClick={(e) => {
              e.stopPropagation()
              const id = Number(ticket.id)
              const title = (ticket as any).title || (ticket as any).heading || `Ticket #${id}`
              setTimelineTicket({ id, title })
            }}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-secondary text-textColor-muted hover:text-primary-500 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">timeline</span>
          </button>
        </div>
      )
    },
  },
  {
    key: "ticketId",
    title: "Ticket ID",
    sortable: true,
    width: "100px",
    render: (_: any, ticket: Ticket) => {
      const ticketId = ticket.id || ticket.ticketId || (ticket as any).hash || "N/A"
      const displayId = ticketId === "N/A" ? "N/A" : `#${ticketId}`
      const isRead = !!(ticket as any).read_at || localReadIds.has(ticket.id ?? 0)
      return (
        <span className="flex items-center gap-1.5">
          {!isRead && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 leading-none">
              NEW
            </span>
          )}
          {displayId}
        </span>
      )
    },
  },
  {
    key: "priority",
    title: "Priority",
    sortable: true,
    render: (priority: unknown) => priority ? getPriorityChip(priority) : <span>N/A</span>,
  },
  {
    key: "createdAt",
    title: "Created At",
    sortable: true,
    render: (value: string) => {
      if (!value) return <span className="text-textColor-muted text-xs">N/A</span>;
      const date = new Date(typeof value === 'string' ? value.replace(/ [A-Z]{2,4}$/, '') : value);
      const datePart = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timePart = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-textColor-primary">{datePart}</span>
          <span className="text-[11px] text-textColor-muted">{timePart}</span>
        </div>
      );
    },
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
    width: "130px",
    render: (_: any, ticket: Ticket) => {
      const status = (ticket as any).status || (ticket as any).current_status || (ticket as any).CurrentStatus || 'N/A'
      if (!status) return <span>N/A</span>
      return (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setStatusModalTicket(ticket) }}
          className="group inline-flex items-center gap-1 focus:outline-none"
          title="Click to update status"
        >
          <span className={`${getStatusClass(String(status))} group-hover:opacity-90 group-hover:shadow-sm transition-all cursor-pointer`}>
            {String(status)}
          </span>
          <span className="material-symbols-outlined text-xs text-textColor-muted opacity-0 group-hover:opacity-100 transition-opacity">
            edit
          </span>
        </button>
      )
    },
  },
  {
    key: "reporter",
    title: "Reporter",
    sortable: true,
    render: (_: any, ticket: Ticket) => {
      const firstName = ticket?.reporter?.first_name
      const lastName = ticket?.reporter?.last_name
      if (firstName || lastName) {
        return <span>{[firstName, lastName].filter(Boolean).join(' ')}</span>
      }
      const customer = (ticket as any).Customer
      const customerHash = customer?.hash
      const phone = customer?.mobile_number || customer?.phone_number
      const custName = [customer?.first_name, customer?.last_name]
        .filter((n: string) => n && !String(n).startsWith('+'))
        .join(' ').trim()
      const display = phone ? formatPhone(phone) : custName || null
      if (!display) return <span className="text-textColor-muted">N/A</span>
      if (customerHash) {
        return (
          <span
            className="inline-flex items-center gap-1.5 cursor-pointer text-blue-400 hover:text-blue-300"
            title="View customer profile"
            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/customers/details/${customerHash}`) }}
          >
            {display}
            <CustomerTagBadge tag={customer?.tag} size="sm" />
          </span>
        )
      }
      return (
        <span className="inline-flex items-center gap-1.5">
          {display}
          <CustomerTagBadge tag={customer?.tag} size="sm" />
        </span>
      )
    },
  },
  {
    key: "aging",
    title: "Aging",
    sortable: false,
    width: "100px",
    render: (_: any, ticket: Ticket) => {
      const { label, bucket } = computeAging(ticket)
      return <span className={getAgingClass(bucket)} title={label}>{label}</span>
    },
  },
  {
    key: "location",
    title: "Location",
    sortable: false,
    render: (_: any, ticket: Ticket) => {
      const locationName =
        (ticket as any).locationName ||
        (ticket as any)?.device?.location?.name ||
        (ticket as any)?.location?.name

      return locationName ? <span>{locationName}</span> : <span>N/A</span>
    },
  },
  {
    key: "title",
    title: "Title",
    sortable: true,
    render: (_: any, ticket: Ticket) => {
      const fullTitle = ticket.title || ticket.heading || "N/A"
      return <span>{fullTitle}</span>
    },
  },
  {
    key: "assignee",
    title: "Assignee",
    width: "max-w-28",
    sortable: true,
    render: (_: any, ticket: Ticket) => {
      const firstName = ticket?.Agent?.first_name;
      const lastName = ticket?.Agent?.last_name;
      return firstName || lastName
        ? <span>{firstName ?? "N/A"} {lastName ?? "N/A"}</span>
        : <span>N/A</span>;
    },
  },
  {
    key: "description",
    title: "Description",
    sortable: true,
    render: (_: any, ticket: Ticket) => {
      const description = formatRichTextToPlain(ticket.body)
      return <span>{description || "N/A"}</span>
    },
  },
  {
    key: "assetsDevice",
    title: "Assets",
    sortable: true,
    render: (_: any, t: any) => {
      const deviceName = t?.device?.name || t?.device?.serialNo || t?.assetsDevice
      return deviceName ? <span>{deviceName}</span> : <span>N/A</span>
    },
  },
  {
    key: "action_types",
    title: "Action Types",
    width: "220px",
    sortable: false,
    cellClassName: "align-top",
    render: (_: any, ticket: Ticket) => {
      const raw = (ticket as any).action_types
      const types: string[] = Array.isArray(raw)
        ? raw.map((t: any) => (typeof t === "string" ? t : t?.name || String(t)))
        : typeof raw === "string" && raw.trim()
        ? raw.split(",").map((s: string) => s.trim())
        : []

      if (types.length === 0) return <span>N/A</span>

      const displayTypes = types.slice(0, 5)
      const hasMore = types.length > 5

      return (
        <div className="flex flex-wrap gap-2 items-center">
          {displayTypes.map((type, idx) => (
            <span key={idx} className="chip">
              {type}
            </span>
          ))}
          {hasMore && (
            <span className="text-textColor-muted text-sm">...</span>
          )}
        </div>
      )
    },
  },
// eslint-disable-next-line react-hooks/exhaustive-deps
], [localReadIds])



  return (
    <div className="space-y-4">
      {ticketUpdated ? (() => {
        const ev = typeof ticketUpdated === 'object' ? ticketUpdated as TicketUpdateEvent : null
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
              {ev?.subtitle && <p className="text-xs text-red-600 mt-0.5 truncate">{ev.subtitle}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {(ev?.hash || ev?.id) && (
                <button
                  onClick={() => { if (ev?.id) markTicketRead(ev.id); navigate(`/dashboard/tickets/details/${ev.hash ?? ev.id}`) }}
                  className="px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
                >
                  View
                </button>
              )}
              <button
                onClick={() => { dispatch(fetchTickets()); dispatch(clearTicketUpdated()) }}
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

      {/* Title */}
      <p className="text-xl font-medium tracking-tighter">All Tickets ({visibleCount})</p>

      {/* Filter Bar - Date Range, Filters, and Export all on one line */}
      <div className="mt-6 flex items-center gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePicker
            onDateSelect={handleDateRangeSelect}
            defaultStartDate={dateRange.start || undefined}
            defaultEndDate={dateRange.end || undefined}
          />
          <Filter
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            organizationOptions={organizations.map((org) => ({
              value: org.name.toLowerCase().replace(/\s+/g, "-"),
              label: org.name,
            }))}
            agentOptions={agents.map((agent) => {
              const firstName = agent.first_name || ""
              const lastName = agent.last_name || ""
              const fullName = [firstName, lastName].filter(Boolean).join(" ") || agent.nickname || `Agent #${agent.id}`
              return {
                value: String(agent.id || ""),
                label: fullName,
              }
            })}
            deviceOptions={items.map((item) => ({
              value: String(item.id),
              label: item.name as string,
            }))}
            locationOptions={locations.map((location) => ({
              value: String(location.id),
              label: location.name || location.label || `Location #${location.id}`,
            }))}
            actionTypeOptions={actionTypes.map((type) => ({
              value: String(type.id),
              label: type.name,
            }))}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <span className={`text-sm font-semibold transition-colors ${showNewOnly ? 'text-blue-500' : 'text-textColor-muted'}`}>New only</span>
            <button
              role="switch"
              aria-checked={showNewOnly}
              onClick={() => setShowNewOnly(v => !v)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 shadow-inner ${showNewOnly ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${showNewOnly ? 'translate-x-[30px]' : 'translate-x-0.5'}`} />
            </button>
          </label>
          <button
            className="h-10 rounded-md px-3 flex items-center gap-x-2 text-base font-medium border border-primary-100 hover:bg-primary-100 disabled:opacity-60"
            onClick={handleExport}
          disabled={isExporting || (meta?.total === 0 && filteredTickets.length === 0)}
        >
          <img src="/src/assets/Images/Dashboard/doc/exl-icon.svg" alt="" />
          {isExporting ? "Exporting..." : "Export Tickets"}
        </button>
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeChips.map(chip => (
            <span key={chip.key} className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              <span className="opacity-60">{chip.label}:</span>
              <span>{chip.value}</span>
              <button onClick={chip.onRemove} className="ml-0.5 flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                <span className="material-symbols-outlined text-[11px] leading-none">close</span>
              </button>
            </span>
          ))}
          {activeChips.length > 1 && (
            <button
              onClick={() => {
                setFilters(defaultFilters)
                setSearchInput('')
                setSearchQuery('')
                setShowNewOnly(false)
                handleDateRangeSelect(null, null)
              }}
              className="text-xs text-textColor-muted hover:text-textColor-base underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {loading && tickets.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error loading tickets: {error}</p>
            <button 
              onClick={() => dispatch(fetchTickets())}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTickets}
          searchPlaceholder="Search by ID, title, description, phone, location, comments… (min 2)"
          searchValue={searchInput}
          onSearchChange={(term) => setSearchInput(term)}
          className="mt-6"
          onCountChange={setVisibleCount}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          resizable
          colWidthsStorageKey="dashboard-all-tickets-col-widths"
          serverPagination={{
            page: meta?.page || pagination.page,
            limit: meta?.limit || pagination.limit,
            total: meta?.total || tickets.length,
            totalPages: meta?.totalPages || Math.ceil(tickets.length / pagination.limit),
            onPageChange: (page) => setPagination(prev => ({ ...prev, page })),
            onLimitChange: (limit) => setPagination({ page: 1, limit }),
          }}
        />
      )}

      <UpdateTicketStatusModal
        open={Boolean(statusModalTicket)}
        ticket={statusModalTicket}
        onClose={() => setStatusModalTicket(null)}
        onSuccess={() => {
          dispatch(fetchTickets({
            priority: filters.priority || undefined,
            deviceId: filters.device ? Number(filters.device) : undefined,
            agentId: filters.assignedAgent ? Number(filters.assignedAgent) : undefined,
            status: filters.status || undefined,
            locationId: filters.location ? Number(filters.location) : undefined,
            actionType: filters.actionType || undefined,
            page: pagination.page,
            limit: pagination.limit,
            search: searchQuery || undefined,
            isUnread: showNewOnly || undefined,
          }))
        }}
      />

      <TicketTimelineDrawer ticket={timelineTicket} onClose={() => setTimelineTicket(null)} />
    </div>
  )
}

export default AllTickets
