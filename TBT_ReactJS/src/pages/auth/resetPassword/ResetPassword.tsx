"use client"

import type React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import Button from "../../../components/Atomic/Button"
import LogoDark from "@/assets/Images/Logo-Dark.png"
// import LogoLight from "../../assets/Images/Logo-Light.png"
import Mockdashboard from "@/assets/Images/Dashboard/mockdashboard.svg"
import FooterBar from "@/components/Molecules/FooterBar"
import api from "@/services/api"

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post('/auth/send-password-recovery-email', { email })
      setSent(true)
    } catch (error) {
      console.error('Failed to send password recovery email:', error)
      // You might want to show an error message to the user here
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex flex-col bg-surface-primary">
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <div className="space-y-3 mb-6">
              <h2 className="text-3xl font-semibold text-textColor-base">Check your email</h2>
              <p className="text-sm text-textColor-muted">We've sent a password reset link to {email}</p>
            </div>
            <Link to="/login" className="text-primary-600 hover:text-primary-500">
              Back to sign in
            </Link>
          </div>
        </div>
        <FooterBar />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
        <div className="lg:flex flex-1">
        {/* Signin Form  */}
        <div className="lg:w-8/12 p-5">
             {/* Logo  */}
            <div className="lg:m-10 ">
              <img src={LogoDark} alt="TBT-Logo" />
            </div>
             {/* Form Container  */}
            <div className="m-auto mt-[12vh] lg:w-[540px] space-y-10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-semibold">Reset your password</h1>
                    <p className="text-base text-textColor-muted"> Enter your email address and we'll send you a link to reset your password.</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                     {/* Email  */}
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-base font-semibold">
                          Email address
                        </label>
                        <div className=" h-16 flex items-center relative">
                            <span className="absolute left-2 p-3 text-textColor-muted  material-symbols-outlined ">mail</span>
                            <input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="h-full w-full text-lg  pl-20 rounded-lg border-2 border-borderColor-secondary outline-primary-500 bg-surface-primary"
                              placeholder="Enter your email"
                            />
                        </div>
                    </div>
                     
                    {/* Submit Button  */}
                    <Button type="submit" text="Send reset link" height="h-14" loading={loading} fullWidth />
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

export default ResetPassword
