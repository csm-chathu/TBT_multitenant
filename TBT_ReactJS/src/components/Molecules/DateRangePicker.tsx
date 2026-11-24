"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface DateRangePickerProps {
  onDateSelect?: (startDate: Date | null, endDate: Date | null) => void
  defaultStartDate?: Date
  defaultEndDate?: Date
  className?: string
}

export default function DateRangePicker({
  onDateSelect,
  defaultStartDate = (() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)
    return startOfWeek
  })(),
  defaultEndDate = (() => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const endOfWeek = new Date(today)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek))
    return endOfWeek
  })(),
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate)
  const [isSelectingEnd, setIsSelectingEnd] = useState(false)

  const calendarRef = useRef<HTMLDivElement>(null)
  const isSyncingRef = useRef(false)
  const lastNotifiedRef = useRef<{ start: number | null; end: number | null }>({ 
    start: defaultStartDate ? defaultStartDate.getTime() : null, 
    end: defaultEndDate ? defaultEndDate.getTime() : null 
  })

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Utility function to format date as DD/MM/YYYY
  const formatDate = (date: Date | null) => {
    if (!date) return ""
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  // Month names for display
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  // Year options for quick selection (range: currentYear-5 .. currentYear+5)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }).map((_, i) => currentYear - 5 + i)

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  // Navigation functions
  const getPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const getNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  // Sync internal state with external prop changes (only when props actually change)
  useEffect(() => {
    const startTime = defaultStartDate?.getTime()
    const endTime = defaultEndDate?.getTime()
    const currentStartTime = startDate?.getTime()
    const currentEndTime = endDate?.getTime()
    
    // Only sync if dates actually changed and we're not in the middle of a user selection
    if (defaultStartDate && startTime !== currentStartTime && !isSelectingEnd) {
      isSyncingRef.current = true
      setStartDate(new Date(defaultStartDate))
      lastNotifiedRef.current.start = startTime
    }
    if (defaultEndDate && endTime !== currentEndTime && !isSelectingEnd) {
      isSyncingRef.current = true
      setEndDate(new Date(defaultEndDate))
      lastNotifiedRef.current.end = endTime
    }
    
    // Reset syncing flag after state updates
    if (isSyncingRef.current) {
      setTimeout(() => {
        isSyncingRef.current = false
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultStartDate?.getTime(), defaultEndDate?.getTime()])

  // Notify parent when dates change (only if not syncing, dates actually changed, and both dates are set)
  useEffect(() => {
    if (isSyncingRef.current) return
    if (!startDate || !endDate) return // Only notify when both dates are set
    
    const currentStartTime = startDate.getTime()
    const currentEndTime = endDate.getTime()
    
    // Only notify if dates actually changed
    if (
      onDateSelect &&
      (lastNotifiedRef.current.start !== currentStartTime || 
       lastNotifiedRef.current.end !== currentEndTime)
    ) {
      lastNotifiedRef.current = { start: currentStartTime, end: currentEndTime }
      onDateSelect(startDate, endDate)
    }
  }, [startDate, endDate, onDateSelect])

  // Date selection logic
  const handleDateClick = (day: number, monthOffset = 0) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset, day)

    if (!startDate || (startDate && endDate)) {
      // Start new selection
      isSyncingRef.current = false // User action, not sync
      setStartDate(selectedDate)
      setEndDate(null)
      setIsSelectingEnd(true)
      // Don't notify parent yet - wait for end date
    } else if (isSelectingEnd) {
      // Select end date - now we have both dates, notify parent
      isSyncingRef.current = false // User action, not sync
      let finalStart = startDate!
      let finalEnd = selectedDate
      
      if (selectedDate < startDate!) {
        finalStart = selectedDate
        finalEnd = startDate!
      }
      
      // Update last notified BEFORE setting state to prevent duplicate calls
      lastNotifiedRef.current = {
        start: finalStart.getTime(),
        end: finalEnd.getTime()
      }
      
      setStartDate(finalStart)
      setEndDate(finalEnd)
      setIsSelectingEnd(false)
      
      // Notify parent immediately when range is complete
      if (onDateSelect) {
        onDateSelect(finalStart, finalEnd)
      }
    }
  }

  // Date styling helpers
  const isDateInRange = (date: Date) => {
    if (!startDate || !endDate) return false
    return date >= startDate && date <= endDate
  }

  const isDateSelected = (date: Date) => {
    if (!startDate) return false
    if (startDate && date.getTime() === startDate.getTime()) return true
    if (endDate && date.getTime() === endDate.getTime()) return true
    return false
  }

  // Utility function for conditional classes
  const cn = (...classes: (string | boolean | undefined)[]) => {
    return classes.filter(Boolean).join(" ")
  }

  // Render calendar grid
  const renderCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const daysInPrevMonth = getDaysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))

    const days = []

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, day)

      days.push(
        <button
          key={`prev-${day}`}
          onClick={() => handleDateClick(day, -1)}
          className={cn(
            "w-10 h-10 flex items-center justify-center text-sm text-textColor-muted hover:bg-primary-100 rounded transition-colors",
            isDateInRange(date) && "bg-primary-100",
            isDateSelected(date) && "bg-primary-500 text-white hover:bg-primary-600",
          )}
        >
          {day}
        </button>,
      )
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)

      days.push(
        <button
          key={day}
          onClick={() => handleDateClick(day, 0)}
          className={cn(
            "w-10 h-10 flex items-center justify-center text-sm text-textColor-base hover:bg-primary-100 rounded font-medium transition-colors",
            isDateInRange(date) && "bg-primary-100",
            isDateSelected(date) && "bg-primary-500 text-white hover:bg-primary-600",
          )}
        >
          {day}
        </button>,
      )
    }

    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7
    const nextMonthDays = totalCells - (firstDay + daysInMonth)

    for (let day = 1; day <= nextMonthDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day)

      days.push(
        <button
          key={`next-${day}`}
          onClick={() => handleDateClick(day, 1)}
          className={cn(
            "w-10 h-10 flex items-center justify-center text-sm text-textColor-muted hover:bg-primary-100 rounded transition-colors",
            isDateInRange(date) && "bg-primary-100",
            isDateSelected(date) && "bg-primary-500 text-white hover:bg-primary-600",
          )}
        >
          {day}
        </button>,
      )
    }

    return days
  }

  return (
    <div className={`${className || "min-w-[280px]"} max-w-[520px] relative`} ref={calendarRef}>
      {/* Date Input Fields */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-10 px-4 border border-borderColor-secondary rounded-lg bg-surface-primary cursor-pointer transition-colors flex items-center gap-3"
          >
            <Calendar className="w-5 h-5 text-textColor-muted" />
            <span className="text-textColor-base font-medium">{formatDate(startDate) || "Select Start date"} -- {formatDate(endDate) || "Select End date"}</span>
          </div>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute right-0 w-full p-2 z-50 bg-surface-primary border border-borderColor-secondary rounded-xl shadow-2xl ">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-2 border-b border-borderColor-secondary">
            <button onClick={getPreviousMonth} className="p-2 hover:bg-primary-100 text-textColor-muted hover:text-textColor-base rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 " />
            </button>

            <div className="flex items-center gap-2">
              <label className="sr-only">Month</label>
              <select
                aria-label="Select month"
                value={currentMonth.getMonth()}
                onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), Number(e.target.value), 1))}
                className="px-2 py-1 rounded-md border border-borderColor-secondary bg-surface-primary text-sm"
              >
                {monthNames.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <label className="sr-only">Year</label>
              <select
                aria-label="Select year"
                value={currentMonth.getFullYear()}
                onChange={(e) => setCurrentMonth(new Date(Number(e.target.value), currentMonth.getMonth(), 1))}
                className="px-2 py-1 rounded-md border border-borderColor-secondary bg-surface-primary text-sm"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button onClick={getNextMonth} className="p-2 hover:bg-primary-100 text-textColor-muted hover:text-textColor-base rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 " />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="w-full h-10 flex items-center justify-center text-xs font-medium text-textColor-muted">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1">{renderCalendarGrid()}</div>
        </div>
      )}
    </div>
  )
}
