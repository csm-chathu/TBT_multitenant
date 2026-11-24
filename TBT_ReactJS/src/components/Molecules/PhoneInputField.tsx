"use client"

import type React from "react"
import { useState } from "react"
import PhoneInput, { type Country, isValidPhoneNumber } from "react-phone-number-input"
import "react-phone-number-input/style.css"
import FormField from "./FormField"
import { cn } from "@/lib/utils"

interface PhoneInputFieldProps {
  label: string
  name: string
  value: string | undefined
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  defaultCountry?: Country
}

const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  label,
  name,
  value,
  onChange,
  placeholder = "Enter phone number",
  required = false,
  error,
  hint,
  disabled = false,
  className,
  defaultCountry = 'US',
}) => {
  const [localError, setLocalError] = useState<string | undefined>(undefined)

  const handleChange = (val: string | undefined) => {
    const nextValue = val || ""
    onChange(nextValue)

    // Live validation: only start showing error once user has typed a reasonable length
    const digitsOnly = nextValue.replace(/\D/g, "")
    if (!nextValue || digitsOnly.length < 7) {
      setLocalError(undefined)
      return
    }

    setLocalError(isValidPhoneNumber(nextValue) ? undefined : "Please enter a valid phone number")
  }

  const combinedError = error || localError

  return (
    <FormField label={label} required={required} error={combinedError} hint={hint} className={className} htmlFor={name}>
      <div className={cn("phone-input-wrapper", combinedError && "phone-input-error")}>
        <PhoneInput
          international
          defaultCountry={defaultCountry}
          limitMaxLength
          value={value || undefined}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className="phone-input"
          numberInputProps={{
            className: cn(
              "phone-input-number",
              "w-full px-4 py-3 text-base border rounded-xl bg-surface-secondary",
              "placeholder:text-textColor-muted text-textColor-base",
              "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
              "transition-all duration-200",
              combinedError 
                ? "border-red-500 focus:ring-red-500" 
                : "border-borderColor-secondary",
              disabled && "opacity-50 cursor-not-allowed"
            ),
            id: name,
            name: name,
          }}
        />
      </div>
    </FormField>
  )
}

export default PhoneInputField

