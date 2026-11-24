"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, Search } from "lucide-react"

export interface FilterOption {
  value: string
  label: string
}

interface SearchableFilterSelectProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: FilterOption[]
  defaultOptionLabel: string
  placeholder?: string
  className?: string
}

const SearchableFilterSelect: React.FC<SearchableFilterSelectProps> = ({
  name,
  value,
  onChange,
  options,
  defaultOptionLabel,
  placeholder = "Search...",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Auto-focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchTerm("")
    }
  }, [isOpen])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Find currently selected option label
  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption ? selectedOption.label : defaultOptionLabel

  // Default option (e.g. "All Priorities", "All Agents", etc.)
  const defaultOption: FilterOption = { value: "", label: defaultOptionLabel }

  // Filter options based on search query (case-insensitive)
  const normalizedSearch = searchTerm.trim().toLowerCase()

  const isDefaultMatching =
    !normalizedSearch || defaultOptionLabel.toLowerCase().includes(normalizedSearch)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(normalizedSearch)
  )

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} onKeyDown={handleKeyDown}>
      {/* Trigger Button */}
      <button
        type="button"
        id={`filter-select-trigger-${name}`}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-36 h-10 px-3 rounded-lg bg-surface-primary hover:bg-surface-secondary border border-borderColor-secondary flex items-center justify-between gap-2 text-sm text-textColor-base cursor-pointer focus:outline-none transition-all duration-150 ${
          isOpen ? "ring-2 ring-primary-500/20 border-primary-500" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate text-left font-normal" title={displayLabel}>
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-textColor-muted transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 min-w-[200px] w-56 rounded-xl border border-borderColor-secondary bg-surface-primary shadow-lg p-2 flex flex-col gap-2 left-0 top-full"
          role="listbox"
        >
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-textColor-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-borderColor-secondary rounded-lg bg-surface-secondary placeholder:text-textColor-muted text-textColor-base focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options Container */}
          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {/* Default Option (e.g. All Priorities) */}
            {isDefaultMatching && (
              <button
                type="button"
                onClick={() => handleSelect(defaultOption.value)}
                className={`w-full text-left px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                  value === defaultOption.value
                    ? "bg-primary-50 text-primary-600 font-semibold"
                    : "text-textColor-base hover:bg-surface-secondary"
                }`}
              >
                <span className="truncate">{defaultOption.label}</span>
              </button>
            )}

            {/* Filtered Options List */}
            {filteredOptions.map((option) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors duration-150 flex items-center justify-between ${
                    isSelected
                      ? "bg-primary-50 text-primary-600 font-semibold"
                      : "text-textColor-base hover:bg-surface-secondary"
                  }`}
                >
                  <span className="truncate" title={option.label}>
                    {option.label}
                  </span>
                </button>
              )
            })}

            {/* No Results Message */}
            {!isDefaultMatching && filteredOptions.length === 0 && (
              <div className="px-3 py-3 text-center text-xs text-textColor-muted font-medium">
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchableFilterSelect
