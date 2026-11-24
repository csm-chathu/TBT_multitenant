"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import Label from "../Atomic/Label"

interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  error,
  hint,
  className,
  children,
  htmlFor,
}) => {
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required}>
          {label}
        </Label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-textColor-muted">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export default FormField
