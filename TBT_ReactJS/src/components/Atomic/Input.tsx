"use client"

import type React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full px-4 py-2 text-base border border-borderColor-secondary rounded-md bg-surface-secondary",
        "placeholder:text-textColor-muted text-textColor-base",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
        "transition-all duration-200",
        className,
      )}
      {...props}
    />
  )
})

Input.displayName = "Input"

export default Input
