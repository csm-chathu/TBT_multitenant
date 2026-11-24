"use client"

import React, { useState, useRef, useEffect } from "react"
import { ChevronDown, X } from "lucide-react"
import FormField from "./FormField"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SearchableSelectFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  allowCustomValue?: boolean
}

const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Search...",
  required = false,
  error,
  hint,
  disabled = false,
  className,
  allowCustomValue = false,
}) => {
  const selectableOptions = options.filter((o) => !o.disabled)
  const selectedOption = selectableOptions.find((o) => o.value === value)

  const [inputValue, setInputValue] = useState(
    selectedOption?.label ?? (allowCustomValue ? value : "")
  )
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep input text in sync when the external value changes
  useEffect(() => {
    const opt = selectableOptions.find((o) => o.value === value)
    if (opt) {
      setInputValue(opt.label)
    } else if (allowCustomValue) {
      setInputValue(value)
    } else {
      setInputValue("")
    }
  }, [value, selectableOptions, allowCustomValue])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // If user typed something that didn't result in a selection, restore the label
        const opt = selectableOptions.find((o) => o.value === value)
        if (!allowCustomValue) {
          setInputValue(opt?.label ?? "")
        }
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [value, selectableOptions, allowCustomValue])

  const filtered = inputValue
    ? selectableOptions.filter((o) =>
        o.label.toLowerCase().includes(inputValue.toLowerCase())
      )
    : selectableOptions

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setOpen(true)
    
    if (allowCustomValue) {
      onChange(newValue)
    } else {
      // Clear selection if the user edits the text
      if (value) onChange("")
    }
  }

  const handleSelect = (opt: SelectOption) => {
    onChange(opt.value)
    setInputValue(opt.label)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setInputValue("")
    setOpen(false)
  }

  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <input
            id={name}
            type="text"
            autoComplete="off"
            disabled={disabled}
            value={inputValue}
            placeholder={placeholder}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            className="w-full px-4 py-3 pr-16 text-base border border-borderColor-secondary rounded-xl bg-surface-secondary placeholder:text-textColor-muted text-textColor-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
            {value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 text-textColor-muted hover:text-textColor-base transition-colors"
                tabIndex={-1}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-textColor-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {open && !disabled && (
          <ul className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-borderColor-secondary bg-surface-primary shadow-lg">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-sm text-textColor-muted">No results found</li>
            ) : (
              filtered.map((opt) => (
                <li
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    opt.value === value
                      ? "bg-primary-500 text-white"
                      : "text-textColor-base hover:bg-surface-secondary"
                  }`}
                >
                  {opt.label}
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </FormField>
  )
}

export default SearchableSelectField
