import type React from "react"
import { useState, useEffect } from 'react'
import { Link } from "react-router-dom"
import ThemeSwitch from "./ThemeSwitch"
import Breadcrumbs from "./Breadcrumbs"
import { NotificationPopover } from "./NotificationPopover"
import { ProfilePopover } from "./ProfilePopover"
import GlobalSearch from "./GlobalSearch"
import RingCentralWidget from "./RingCentralWidget"
import QuickTicketModal from "./QuickTicketModal"

const AppBar: React.FC = () => {
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickModalOpen, setQuickModalOpen] = useState(false)

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <div className="mt-16 md:mt-0 h-16 bg-surface-primary flex items-center justify-between px-3 border-b border-borderColor-secondary gap-2">
        <Breadcrumbs/>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Global search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-borderColor-secondary bg-surface-secondary text-text-secondary hover:text-text-primary hover:border-primary-500 transition-colors text-sm"
            title="Search (Ctrl+K)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="hidden md:inline">Search…</span>
            <kbd className="hidden md:inline text-xs border border-borderColor-secondary rounded px-1 py-0.5 bg-surface-primary">Ctrl K</kbd>
          </button>

          {/* Create Ticket Button */}
          <Link
            to="/dashboard/tickets/add"
            className="flex items-center justify-center gap-1 px-2.5 sm:px-4 h-9 sm:h-10 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors text-sm font-medium shrink-0"
            title="Create Ticket"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            <span className="hidden sm:inline">Create Ticket</span>
          </Link>

          {/* Quick Ticket Button (Opens Modal) */}
          <button
            type="button"
            onClick={() => setQuickModalOpen(true)}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3.5 h-9 sm:h-10 rounded-xl bg-amber-500 hover:bg-amber-600 text-white transition-colors text-sm font-medium shrink-0 cursor-pointer"
            title="Quick Ticket"
          >
            <span className="material-symbols-outlined text-xl">bolt</span>
            <span className="hidden sm:inline">Quick Ticket</span>
          </button>

          <NotificationPopover/>
          <ThemeSwitch/>
          <ProfilePopover/>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <QuickTicketModal open={quickModalOpen} onClose={() => setQuickModalOpen(false)} />
      <RingCentralWidget />
    </>
  )
}

export default AppBar
