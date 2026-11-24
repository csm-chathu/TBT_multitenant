"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  className?: string
}

const Radio: React.FC<RadioProps> = ({ label, className, ...props }) => {
  return (
    <label className={cn("flex items-center gap-x-2 cursor-pointer", className)}>
      <input type="radio" {...props} />
      <p className="font-semibold">{label}</p>
    </label>
  )
}

export default Radio
