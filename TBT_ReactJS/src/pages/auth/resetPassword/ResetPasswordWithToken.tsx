"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import Button from "../../../components/Atomic/Button"
import LogoDark from "@/assets/Images/Logo-Dark.png"
import Mockdashboard from "@/assets/Images/Dashboard/mockdashboard.svg"
import api from '../../../services/api'
import FooterBar from "@/components/Molecules/FooterBar"
import useToast from '@/hooks/useToast'
import { useApiNavigation } from "../../../hooks/use-api-navigation"

const ResetPasswordWithToken: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [success, setSuccess] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const navigate = useNavigate()
  const { error: toastError } = useToast()

  // Set up navigation callback for API service to prevent page refresh
  useApiNavigation()

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false)
        setIsValid(false)
        const msg = "Invalid reset link. Token is missing."
        setErrorMessage(msg)
        try { toastError(msg) } catch {}
        return
      }

      try {
        const response = await api.get(`/auth/validate-reset-token/${token}`)
        if (response.data.valid) {
          setIsValid(true)
        } else {
          setIsValid(false)
          const msg = "This password reset link is invalid or has expired. Please request a new one."
          setErrorMessage(msg)
          try { toastError(msg) } catch {}
        }
      } catch (error: any) {
        setIsValid(false)
        const errorMsg = error.response?.data?.message || 'This password reset link is invalid or has expired. Please request a new one.'
        setErrorMessage(errorMsg)
        try { toastError(String(errorMsg)) } catch {}
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      await api.post('/auth/reset-forgot-password', { 
        token, 
        password 
      })
      setSuccess(true)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reset password. The link may have expired or is invalid.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }


  if (success) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-primary">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="space-y-3 mb-6">
              <h2 className="text-3xl font-semibold text-textColor-base">Password reset successful</h2>
              <p className="text-sm text-textColor-muted">Your password has been reset successfully. Redirecting to login...</p>
            </div>
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Go to sign in
            </Link>
          </div>
        </div>
        <FooterBar />
      </div>
    )
  }

  // Show loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-primary">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="space-y-3 mb-6">
              <h2 className="text-3xl font-semibold text-textColor-base">Validating reset link...</h2>
              <p className="text-sm text-textColor-muted">Please wait while we verify your password reset link.</p>
            </div>
          </div>
        </div>
        <FooterBar />
      </div>
    )
  }

  // Show error if token is invalid
  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-primary">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="space-y-3 mb-6">
              <h2 className="text-3xl font-semibold text-textColor-base">Invalid reset link</h2>
              <p className="text-sm text-textColor-muted">{errorMessage}</p>
            </div>
            <div className="space-y-4">
              <Link to="/reset-password" className="block text-primary-600 hover:text-primary-500 font-medium">
                Request a new password reset link
              </Link>
              <Link to="/login" className="block text-sm text-textColor-muted hover:text-textColor-base">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
        <FooterBar />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
      {/* Errors are shown via shared useToast; keep `errorMessage` displayed inline where appropriate */}
      
      <div className="lg:flex flex-1">
        {/* Reset Password Form  */}
        <div className="lg:w-8/12 p-5">
             {/* Logo  */}
            <div className="lg:m-10 ">
              <img src={LogoDark} className="dark:hidden" alt="TBT-Logo" />
            </div>
             {/* Form Container  */}
            <div className="m-auto mt-[12vh] lg:w-[540px] space-y-10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-semibold">Reset your password</h1>
                    <p className="text-base text-textColor-muted">Enter your new password below.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                     {/* Password  */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-base font-semibold">
                          New Password
                        </label>
                        <div className="h-16 flex items-center relative">
                            <span className="absolute left-2 p-3 text-textColor-muted material-symbols-outlined ">lock</span>
                            <input
                              id="password"
                              name="password"
                              type="password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="h-full w-full text-lg  pl-20 rounded-lg border-2 border-borderColor-secondary outline-primary-500 bg-surface-primary"
                              placeholder="Enter your new password"
                            />
                        </div>
                    </div>
                     {/* Confirm Password  */}
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-base font-semibold">
                          Confirm Password
                        </label>
                        <div className="h-16 flex items-center relative">
                            <span className="absolute left-2 p-3 text-textColor-muted material-symbols-outlined ">lock</span>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="h-full w-full text-lg  pl-20 rounded-lg border-2 border-borderColor-secondary outline-primary-500 bg-surface-primary"
                              placeholder="Confirm your new password"
                            />
                        </div>
                    </div>
                     {/* Submit Button  */}
                     <Button type="submit" text="Reset password" height="h-14" loading={loading} fullWidth />
                    <div className="text-center">
                      <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                        Back to sign in
                      </Link>
                    </div>
                </form>
            </div>
        </div>
        {/* Image-Banner  */}
        <div className="hidden lg:block lg:w-4/12 bg-primary-100">
          <img src={Mockdashboard} className="w-[30vw] absolute z-10 right-0 bottom-0" alt="Dashboard.png" />
        </div>
      </div>
      <FooterBar />
    </div>
  )
}

export default ResetPasswordWithToken

