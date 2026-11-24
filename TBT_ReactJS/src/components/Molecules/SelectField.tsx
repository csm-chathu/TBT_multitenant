"use client"

import type React from "react"
import FormField from "./FormField"
import Select from "../Atomic/Select"

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectFieldProps {
  label: string
  name: string
  value: string | number | undefined
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}

const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  error,
  hint,
  disabled = false,
  className,
}) => {
  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <Select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  )
}

export default SelectField
