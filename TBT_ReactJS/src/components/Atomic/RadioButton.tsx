"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface RadioButtonProps {
  id: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  label: string
  className?: string
  disabled?: boolean
}

const RadioButton: React.FC<RadioButtonProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  className,
  disabled = false,
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "h-12 w-full flex items-center gap-x-4 px-5 border border-borderColor-secondary cursor-pointer duration-100 rounded-lg",
        checked && "bg-primary-100 border-primary-500",
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="accent-primary-500"
      />
      <p className="text-base font-medium">{label}</p>
    </label>
  )
}

export default RadioButton
