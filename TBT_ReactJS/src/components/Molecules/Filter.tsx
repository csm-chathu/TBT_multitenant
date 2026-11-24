"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { TICKET_STATUS_VALUES } from "@/constants/ticketStatus"

export interface FilterState {
  ticketType: string
  organization: string
  dateRange: string
  assignedAgent: string
  priority: string
  device: string
  status: string
  location: string
  actionType: string
}

interface OrganizationOption { value: string; label: string }
interface AgentOption { value: string; label: string }
interface DeviceOption { value: string; label: string }
interface LocationOption { value: string; label: string }

interface FilterProps {
  onFilterChange?: (filters: FilterState) => void
  organizationOptions?: OrganizationOption[]
  agentOptions?: AgentOption[]
  initialFilters?: FilterState
  deviceOptions?: DeviceOption[]
  locationOptions?: LocationOption[]
  actionTypeOptions?: { value: string; label: string }[]
}

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

import SearchableFilterSelect from "@/components/Molecules/SearchableFilterSelect"

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
]

type ExtraKey = 'device' | 'location' | 'actionType'

const EXTRA_OPTIONS: { key: ExtraKey; label: string }[] = [
  { key: 'device', label: 'Device' },
  { key: 'location', label: 'Location' },
  { key: 'actionType', label: 'Action Type' },
]

const Filter: React.FC<FilterProps> = ({
  onFilterChange,
  organizationOptions: _organizationOptions = [],
  agentOptions = [],
  deviceOptions = [],
  locationOptions = [],
  actionTypeOptions = [],
  initialFilters,
}) => {
  const [filters, setFilters] = useState<FilterState>({ ...defaultFilters, ...initialFilters })
  const [activeExtras, setActiveExtras] = useState<ExtraKey[]>(() => {
    const initial = { ...defaultFilters, ...initialFilters }
    return EXTRA_OPTIONS.filter(o => !!initial[o.key]).map(o => o.key)
  })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const statusOptions = TICKET_STATUS_VALUES.map(s => ({ value: s, label: s }))

  // Sync initialFilters
  useEffect(() => {
    if (!initialFilters) return
    setFilters(prev => {
      const next = { ...defaultFilters, ...initialFilters }
      const isSame = (Object.keys(next) as (keyof FilterState)[]).every(k => prev[k] === next[k])
      return isSame ? prev : next
    })
    // Auto-add extras that have values
    const newExtras = EXTRA_OPTIONS.filter(o => !!initialFilters[o.key]).map(o => o.key)
    if (newExtras.length) setActiveExtras(prev => Array.from(new Set([...prev, ...newExtras])))
  }, [initialFilters])

  // Notify parent
  useEffect(() => {
    const id = setTimeout(() => { onFilterChange?.(filters) }, 400)
    return () => clearTimeout(id)
  }, [filters, onFilterChange])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const addExtra = (key: ExtraKey) => {
    setActiveExtras(prev => prev.includes(key) ? prev : [...prev, key])
    setDropdownOpen(false)
  }

  const removeExtra = (key: ExtraKey) => {
    setActiveExtras(prev => prev.filter(k => k !== key))
    handleFilterChange(key, '')
  }

  const availableToAdd = EXTRA_OPTIONS.filter(o => !activeExtras.includes(o.key))
  const hasActiveExtra = activeExtras.length > 0

  return (
    <form action="#" className="flex items-center gap-2 flex-wrap">
      <SearchableFilterSelect
        name="priority"
        value={filters.priority}
        onChange={val => handleFilterChange("priority", val)}
        options={priorityOptions}
        defaultOptionLabel="All Priorities"
        placeholder="Search Priority..."
      />

      <SearchableFilterSelect
        name="assignedAgent"
        value={filters.assignedAgent}
        onChange={val => handleFilterChange("assignedAgent", val)}
        options={agentOptions}
        defaultOptionLabel="All Agents"
        placeholder="Search Agent..."
      />

      <SearchableFilterSelect
        name="status"
        value={filters.status}
        onChange={val => handleFilterChange("status", val)}
        options={statusOptions}
        defaultOptionLabel="All Statuses"
        placeholder="Search Status..."
      />

      {/* Active extra filters */}
      {activeExtras.map(key => {
        const meta = EXTRA_OPTIONS.find(o => o.key === key)!
        const options = key === 'device' ? deviceOptions : key === 'location' ? locationOptions : actionTypeOptions
        const defaultLabel = key === 'device' ? 'All Devices' : key === 'location' ? 'All Locations' : 'All Action Types'
        return (
          <div key={key} className="flex items-center gap-1">
            <SearchableFilterSelect
              name={key}
              value={filters[key]}
              onChange={val => handleFilterChange(key, val)}
              options={options}
              defaultOptionLabel={defaultLabel}
              placeholder={`Search ${meta.label}...`}
            />
            <button
              type="button"
              onClick={() => removeExtra(key)}
              className="text-text-secondary hover:text-red-400 transition-colors text-lg leading-none"
              title={`Remove ${meta.label} filter`}
            >
              ×
            </button>
          </div>
        )
      })}

      {/* More filters dropdown — only show if there are extras left to add */}
      {availableToAdd.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-sm transition-colors ${
              hasActiveExtra
                ? 'border-primary-500 text-primary-500 bg-primary-500/10'
                : 'border-borderColor-secondary text-text-secondary hover:border-primary-500 hover:text-primary-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            More filters
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-surface-primary border border-borderColor-secondary rounded-lg shadow-lg min-w-[160px] py-1">
              {availableToAdd.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => addExtra(opt.key)}
                  className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </form>
  )
}

export default Filter
