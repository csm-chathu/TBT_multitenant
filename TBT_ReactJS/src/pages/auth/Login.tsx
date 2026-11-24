import { isTicketTrackerUser } from "@/lib/userUtils"
"use client"

import type React from "react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Button from "../../components/Atomic/Button"
import LogoDark from "@/assets/Images/Logo-Dark.png"
import Mockdashboard from "@/assets/Images/Dashboard/mockdashboard.svg"
import api from '../../services/api'
import FooterBar from "@/components/Molecules/FooterBar"
import useToast from '@/hooks/useToast'
import { useApiNavigation } from "../../hooks/use-api-navigation"
import { setToken } from "@/lib/jwt"
import { useAppDispatch } from "@/redux/hooks"
import { setUser, fetchMe } from "@/redux/user/userSlice"

const Login: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { error: toastError } = useToast()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  // Set up navigation callback for API service to prevent page refresh
  useApiNavigation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.access_token; // adjust if your backend uses a different key
      if (token) {
        // Clear old user data from Redux before setting new token
        dispatch(setUser(null));
        setToken(token);
        // Fetch user data immediately after login so navbar updates right away
        const me = await dispatch(fetchMe()).unwrap();
        if (isTicketTrackerUser(me)) {
          navigate('/track-ticket');
        } else {
          navigate('/dashboard/overview');
        }
      } else {
        // Handle login error without page refresh
        toastError('Login failed: No token received');
      }
    } catch (error: unknown) {
      // Handle error without page refresh
      const status = (error as any)?.response?.status;
      if (status === 401) {
        toastError('Incorrect username or password');
      } else {
        const errorMsg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Login failed. Please check your credentials.';
        toastError(String(errorMsg));
      }
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
      {/* Login errors shown via shared useToast hook */}
      
      <div className="lg:flex flex-1">
        {/* Signin Form  */}
        <div className="lg:w-8/12 p-5">
             {/* Logo  */}
            <div className="lg:m-10 ">
              <img src={LogoDark} className="dark:hidden" alt="TBT-Logo" />
              {/* <img src={LogoLight} className="hidden dark:visible" alt="TBT-Logo" /> */}
            </div>
             {/* Form Container  */}
            <div className="m-auto mt-[12vh] lg:w-[540px] space-y-10">
                <div className="space-y-2">
                    <h1 className="text-4xl font-semibold">Sign in</h1>
                    <p className="text-base text-textColor-muted">Welcome Back! Please Sign in to your account.</p>
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
                     {/* Password  */}
                    <div className="space-y-2">
                        <label htmlFor="password" className="text-base font-semibold">
                          Password
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
                              placeholder="Enter your password"
                            />
                        </div>
                    </div>
                     {/* Forgot Button  */}
                    <div className="flex justify-end">
                        <Link to="/reset-password" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                         Forgot your password?
                       </Link>
                    </div>
                     {/* Submit Button  */}
                     <Button type="submit" text="Sign in" height="h-14" loading={loading} fullWidth />
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

export default Login
