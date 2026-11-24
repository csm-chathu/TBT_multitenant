"use client"

import type React from "react"
import { useState, useEffect } from "react"
// import Button from "@/components/Atomic/Button"

export interface DateRangeFilterState {
  dateRange: string
  organization?: string
}

interface DateRangeFilterProps {
  onFilterChange?: (filters: DateRangeFilterState) => void
  showOrganization?: boolean
  organizationOptions?: Array<{ value: string; label: string }>
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  onFilterChange,
  showOrganization = false,
  organizationOptions = []
}) => {
  const [filters, setFilters] = useState<DateRangeFilterState>({
    dateRange: "Last 30 Days",
    organization: showOrganization ? "" : undefined,
  })

  // Notify parent component when filters change
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
  }, [filters, onFilterChange])

  const handleFilterChange = (field: keyof DateRangeFilterState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // const handleAddFilter = () => {
  //   console.log("Add filter clicked", filters)
  //   // Filter is applied automatically when dropdowns change
  // }

  return (
    <form action="#" className="flex flex-wrap gap-3">
      {/* Organization Select - Only shown if showOrganization is true */}
      {showOrganization && (
        <div className="relative">
          <select
            name="organization"
            value={filters.organization || ""}
            onChange={(e) => handleFilterChange("organization", e.target.value)}
            className="h-10 px-3 pr-10 rounded-lg bg-surface-primary focus:outline-none appearance-none"
          >
            <option value="" disabled>
              Select Organization
            </option>
            <option value="all">All Organization</option>
            {organizationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="absolute right-2 top-2 material-symbols-outlined pointer-events-none">expand_more</span>
        </div>
      )}

      {/* Date Range Select */}
      <div className="relative">
        <select
          name="dateRange"
          value={filters.dateRange}
          onChange={(e) => handleFilterChange("dateRange", e.target.value)}
          className="h-10 px-3 pr-10 rounded-lg bg-surface-primary focus:outline-none appearance-none"
        >
          <option value="All">All</option>
          <option value="Last 30 Days">Last 30 Days</option>
          <option value="Last 7 Days">Last 7 Days</option>
          <option value="Last 90 Days">Last 90 Days</option>
          <option value="This Month">This Month</option>
          <option value="This Year">This Year</option>
        </select>
        <span className="absolute right-2 top-2 material-symbols-outlined pointer-events-none">expand_more</span>
      </div>

      {/* Add Filter Button */}
      {/* <Button style="Text" icon="add" text="Add Filter" onClick={handleAddFilter} /> */}
    </form>
  )
}

export default DateRangeFilter

