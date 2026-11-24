"use client"

import type React from "react"
import FormField from "./FormField"
import TextEditor from "@/components/Atomic/TextEditor"

interface TextEditorFieldProps {
  label: string
  name: string
  value: string | undefined
  onChange: (value: string) => void
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  placeholder?: string
}

const TextEditorField: React.FC<TextEditorFieldProps> = ({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  hint,
  disabled = false,
  className,
  placeholder,
}) => {
  return (
    <FormField label={label} required={required} error={error} hint={hint} className={className} htmlFor={name}>
      <TextEditor value={value} onChange={onChange} disabled={disabled} placeholder={placeholder} />
    </FormField>
  )
}

export default TextEditorField
