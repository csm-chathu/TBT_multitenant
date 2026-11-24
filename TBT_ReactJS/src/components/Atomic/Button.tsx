"use client"

import type React from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

interface ButtonProps {
  children?: React.ReactNode
  text?: string
  style?: "Primary" | "Secondary" | "Tertiary" | "Danger" | "Icon" | "IconDelete" | "Text"
  type?: "button" | "submit" | "reset"
  href?: string
  icon?: string
  loading?: boolean
  height?: string
  fullWidth?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const Button: React.FC<ButtonProps> = ({
  children,
  text,
  style = "Primary",
  type = "button",
  href,
  icon,
  loading = false,
  height = "h-10",
  fullWidth = false,
  onClick,
  disabled = false,
  className,
}) => {
  const baseClasses = "px-4 h-10 inline-flex justify-center items-center gap-1 text-base  rounded-xl "

  const styleClasses = {
    Primary: "text-white bg-primary-500 hover:bg-primary-600",
    Secondary: "text-white dark:text-black bg-secondary-600 hover:bg-secondary-800",
    Tertiary:
      "text-textColor-muted bg-transparent border border-primary-100 hover:bg-primary-100 hover:text-primary-500",
    Danger: "text-white bg-danger-500 hover:bg-danger-600",
    Icon: "px-0 w-10 text-textColor-muted hover:text-textColor-base hover:bg-primary-100",
    IconDelete: "px-0 w-10 text-textColor-muted hover:text-red-600 hover:bg-red-100",
    Text: "text-info-500 hover:text-info-600 focus:bg-info-100 rounded-none",
  }

  const classes = cn(
    baseClasses,
    styleClasses[style],
    loading && "opacity-20 cursor-not-allowed",
    fullWidth && "w-full",
    height,
    className,
  )

  const content = (
    <>
      {icon && <span className={cn("material-symbols-outlined", loading && "invisible")}>{icon}</span>}
      {loading && (
        <svg
          className="animate-spin h-5 w-5 absolute"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {(children || text) && <span className={cn(loading && "invisible")}>{children || text}</span>}
    </>
  )

  if (href) {
    return (
      <Link to={href} className={classes} onClick={onClick}>
        {content}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={classes}>
      {content}
    </button>
  )
}

export default Button
