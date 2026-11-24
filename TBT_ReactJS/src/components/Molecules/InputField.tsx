"use client"

import type React from "react"
import FormField from "./FormField"
import Input from "../Atomic/Input"

interface InputFieldProps {
  label: string
  name: string
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "date"
   value: string | undefined | number;
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  lettersOnly?: boolean
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  hint,
  disabled = false,
  className,
  lettersOnly = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (lettersOnly) {
      // Only allow letters, spaces, hyphens, and apostrophes
      newValue = newValue.replace(/[^a-zA-Z\s\-']/g, '');
    }
    onChange(newValue);
  };

  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <Input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormField>
  )
}

export default InputField
