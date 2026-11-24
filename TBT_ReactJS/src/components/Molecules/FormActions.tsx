"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import Button from "../Atomic/Button"


interface FormActionsProps {
  onSubmit: () => void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  isSubmitting?: boolean
  className?: string
}

const FormActions: React.FC<FormActionsProps> = ({
  onSubmit,
  onCancel,
  submitText = "Submit",
  cancelText = "Reset form",
  isSubmitting = false,
  className,
}) => {
  return (
    <div className={cn("flex justify-end gap-3", className)}>
      {onCancel && <Button style="Tertiary" text={cancelText} onClick={onCancel} disabled={isSubmitting} />}
      <Button
        style="Primary"
        text={isSubmitting ? "Submitting..." : submitText}
        onClick={onSubmit}
        disabled={isSubmitting}
      />
    </div>
  )
}

export default FormActions
