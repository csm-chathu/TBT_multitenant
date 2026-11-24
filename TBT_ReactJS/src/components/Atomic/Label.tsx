import type React from "react"
import { cn } from "@/lib/utils"

interface LabelProps {
  children: React.ReactNode
  required?: boolean
  className?: string
  htmlFor?: string
}

const Label: React.FC<LabelProps> = ({ children, required = false, className, htmlFor }) => {
  return (
    <label htmlFor={htmlFor} className={cn("text-xs uppercase font-semibold block", className)}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

export default Label
