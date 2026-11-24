"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string
  children: React.ReactNode
}

const Select: React.FC<SelectProps> = ({ className, children, ...props }) => {
  return (
    <select
      className={cn(
          "w-full px-4 py-3 text-base border border-borderColor-secondary rounded-xl bg-surface-secondary appearance-none",
          "text-textColor-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
          "transition-all duration-200 cursor-pointer",
          className,
        )}
      {...props}
    >
      {children}
    </select>
  )
}

export default Select
