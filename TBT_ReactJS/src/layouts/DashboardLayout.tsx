import { isTicketTrackerUser } from "@/lib/userUtils"
import { useNavigate } from "react-router-dom"
"use client"

import FooterBar from "@/components/Molecules/FooterBar"
import AppBar from "@/components/Molecules/ui/AppBar"
import SideNavbar from "@/components/Molecules/ui/SideNavbar"
import type React from "react"
import {  useEffect, useState, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchMe, selectCurrentUser } from '@/redux/user/userSlice'

const DashboardLayout: React.FC = () => {
  const [sidebarToggle, setSidebarToggle] = useState(false)
  const location = useLocation()
  // const { success: toastSuccess, info: toastInfo } = useToast()
  const dispatch = useAppDispatch()
  const user = useAppSelector(selectCurrentUser)

  // Fetch user data on mount if not already loaded (fallback for page refresh)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      dispatch(fetchMe())
    } else if (isTicketTrackerUser(user)) {
      navigate('/track-ticket', { replace: true })
    }
  }, [dispatch, user, navigate])

  const pathnameRef = useRef(location.pathname)
  useEffect(() => {
    pathnameRef.current = location.pathname
  }, [location.pathname])

  const handleToggle = () => {
    setSidebarToggle(!sidebarToggle)
  }

  return (
    <div className="flex h-screen bg-surface-secondary">
      <SideNavbar toggle={sidebarToggle} onToggle={handleToggle} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <AppBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4">
            <Outlet />
          </div>
        </main>
        {/* Footer stick to the bottom */}
        <FooterBar /> 
      </div>

    </div>
  )
}

export default DashboardLayout
