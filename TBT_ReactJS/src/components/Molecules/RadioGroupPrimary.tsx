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
}

const RadioGroupPrimary: React.FC<RadioGroupProps> = ({
  name,
  value,
  onChange,
  options,
  label,
  className,
  orientation = "horizontal",
  required = false,
  disabled = false,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <p className="text-sm uppercase font-semibold">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      )}
      <div className={cn("flex gap-4", orientation === "vertical" ? "flex-col" : "flex-row")}>
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${name}-${option.value}`}
            className={cn(
              "h-12 flex-1 flex items-center gap-x-4 px-5 border cursor-pointer duration-100 rounded-lg transition-colors",
              value === option.value 
                ? "bg-primary-500 border-primary-500" 
                : "bg-surface-primary border-borderColor-secondary hover:border-primary-300",
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
              className={cn(
                "m-0 p-0 w-4 h-4 cursor-pointer",
                value === option.value ? "accent-white" : "accent-primary-500"
              )}
            />
            <p className={`${value === option.value ? 'text-white': 'text-base'} font-medium`}>{option.label}</p>
          </label>
        ))}
      </div>
    </div>
  )
}

export default RadioGroupPrimary
