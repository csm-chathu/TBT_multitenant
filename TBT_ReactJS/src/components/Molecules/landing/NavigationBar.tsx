import type React from "react"
import { Link } from "react-router-dom"
import { useState, useEffect } from "react"
import Button from "../../Atomic/Button"
import UserAvatar from "../ui/UserAvatar"
import { getToken } from "@/lib/jwt"
import { getDisplayName } from "@/lib/userUtils"
import { getCurrentUser } from "@/services/userService"
import { User } from "@/redux/user/userTypes"
import { useApiNavigation } from "@/hooks/use-api-navigation"

import LogoDark from "@/assets/Images/Logo-Dark.png"
import LogoLight from "@/assets/Images/Logo-Light.png"
import ThemeSwitch from "../ui/ThemeSwitch"

const NavigationBar: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  // Set up navigation callback for API service to handle 401/403 redirects
  useApiNavigation()

  const fetchUserData = async () => {
    const token = getToken()
    if (!token) {
      setIsLoggedIn(false)
      setUserName(null)
      return
    }

    try {
      // Fetch user data from backend endpoint
      // The backend will validate the JWT token
      const user: User = await getCurrentUser()
      setIsLoggedIn(true)
      setUserName(getDisplayName(user))
    } catch (error: any) {
      // If 401/403, the API interceptor will handle redirect to login
      // For other errors, just set logged out state
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        console.error('Failed to fetch user data:', error)
      }
      setIsLoggedIn(false)
      setUserName(null)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  return (
    <nav className="bg-surface-primary shadow-sm border-b border-borderColor-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={LogoDark} alt="Logo"  className="h-8 w-auto dark:hidden"/>
              <img src={LogoLight} alt="Logo" className="h-8 w-auto hidden dark:block"/>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <a href="#how-it-works" className="text-textColor-muted hover:text-primary-500 px-3 py-2 text-sm font-medium">
                How It Works
              </a>
              <a href="#features" className="text-textColor-muted hover:text-primary-500 px-3 py-2 text-sm font-medium">
                Features
              </a>
              <a href="#contact" className="text-textColor-muted hover:text-primary-500 px-3 py-2 text-sm font-medium">
                Contact
              </a>
              <Link to="/user-guide" className="text-textColor-muted hover:text-primary-500 px-3 py-2 text-sm font-medium">
                User Guide
              </Link>
              <Link to="/create-ticket" className="text-textColor-muted hover:text-primary-500 px-3 py-2 text-sm font-medium">
                Submit Ticket
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeSwitch/>
            {isLoggedIn ? (
              <UserAvatar background="#f97316" name={userName || "User"} href="" />
            ) : (
              <Button href="/login" style="Tertiary" text="Sign In" />
            )}
            <Button 
              href={isLoggedIn ? "/dashboard/overview" : "/login"} 
              text="Get Started" 
            />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default NavigationBar
