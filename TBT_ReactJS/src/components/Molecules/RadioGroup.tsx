"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface RadioOption {
  label: string
  value: string
  disabled?: boolean
}

interface RadioGroupProps {
  name: string
  value: string | undefined
  onChange: (value: string) => void
  options: RadioOption[]
  label?: string
  className?: string
  orientation?: "horizontal" | "vertical"
  required?: boolean
  disabled?: boolean
  error?: string
}

const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  className,
  orientation = "horizontal",
  required = false,
  disabled = false,
  error,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <p className="text-sm uppercase font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      <div className={cn("flex flex-wrap gap-1 sm:gap-2", orientation === "vertical" ? "flex-col" : "flex-row")}>
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${name}-${option.value}`}
            className={cn(
              "h-10 flex items-center gap-x-2 px-3 sm:px-4 cursor-pointer duration-100 rounded-lg",
              value === option.value ,
              (option.disabled || disabled) && "opacity-50 cursor-not-allowed",
            )}
          >
            <input
              type="radio"
              id={`${name}-${option.value}`}
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              disabled={option.disabled || disabled}
              className="accent-primary-500"
            />
            <p className="text-sm sm:text-base font-medium">{option.label}</p>
          </label>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}

export default RadioGroup
