"use client"

import React from 'react'
import { useAppSelector } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/user/userSlice'

interface RoleGuardProps {
  allowedRoles?: string[]
  children: React.ReactNode
}

const normalize = (s?: string) => (s ? String(s).toLowerCase().replace(/[^a-z0-9]/g, '') : '')

export default function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  if (!allowedRoles || allowedRoles.length === 0) return <>{children}</>

  const user = useAppSelector(selectCurrentUser)

  const userRoles = new Set<string>(
    (user?.roles || [])
      .flatMap((r: any) => [r.name, r.label])
      .filter(Boolean)
      .map(normalize)
  )

  const allowed = allowedRoles.map(normalize).some((r) => userRoles.has(r))
  if (!allowed) return null

  return <>{children}</>
}
