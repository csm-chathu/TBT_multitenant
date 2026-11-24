"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import FormField from "./FormField"
import { cn } from "@/lib/utils"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface MultiSelectFieldProps {
  label: string
  name: string
  value: string[]
  onChange: (value: string[]) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select options",
  required = false,
  error,
  hint,
  disabled = false,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleOutsideClick)
    return () => document.removeEventListener("mousedown", handleOutsideClick)
  }, [])

  const handleToggle = () => {
    if (!disabled) setIsOpen(!isOpen)
  }

  const handleCheckboxChange = (optionValue: string, isChecked: boolean) => {
    if (isChecked) {
      onChange([...value, optionValue])
    } else {
      onChange(value.filter((v) => v !== optionValue))
    }
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedOptions = options.filter(opt => value.includes(opt.value))

  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <div className="relative" ref={containerRef}>
        <div
          onClick={handleToggle}
          className={cn(
            "min-h-[48px] w-full flex items-center justify-between px-3 py-2 text-base border border-borderColor-secondary rounded-xl bg-surface-secondary cursor-pointer",
            isOpen && "ring-2 ring-primary-500 border-transparent",
            disabled && "opacity-50 cursor-not-allowed",
            error && "border-red-500"
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 mr-2">
            {selectedOptions.length === 0 ? (
              <span className="text-gray-400 px-1">{placeholder}</span>
            ) : (
              selectedOptions.map((opt) => (
                <span
                  key={opt.value}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-gray-300 bg-gray-200 text-gray-700 text-sm font-medium"
                >
                  {opt.label}
                  <button
                    type="button"
                    onClick={(e) => removeOption(opt.value, e)}
                    className="hover:text-red-500 text-gray-500 rounded-full focus:outline-none flex items-center justify-center transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex items-center gap-1.5 text-gray-400">
            {value.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="hover:text-white p-1 flex items-center justify-center transition-colors rounded-full"
                title="Clear all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
            <div className="w-px h-5 bg-borderColor-secondary mx-0.5"></div>
            <svg
              className={cn("w-4 h-4 transition-transform text-gray-400", isOpen && "rotate-180")}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto border border-borderColor-secondary rounded-xl bg-surface-secondary shadow-lg">
            {options.length === 0 ? (
              <div className="px-4 py-3 text-gray-500 italic">No options available</div>
            ) : (
              options.map((option, index) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-center px-4 py-3 cursor-pointer hover:bg-surface-tertiary transition-colors",
                    index !== options.length - 1 && "border-b border-borderColor-secondary",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 mr-3 rounded border-gray-600 bg-transparent text-primary-500 focus:ring-primary-500 focus:ring-offset-surface-secondary focus:ring-2 cursor-pointer"
                    checked={value.includes(option.value)}
                    onChange={(e) => {
                      if (!option.disabled) {
                        handleCheckboxChange(option.value, e.target.checked)
                      }
                    }}
                    disabled={disabled || option.disabled}
                  />
                  <span className="text-sm text-textColor-base">{option.label}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </FormField>
  )
}

export default MultiSelectField
