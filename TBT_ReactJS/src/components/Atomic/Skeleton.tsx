"use client"

import type React from 'react'

type SkeletonProps = React.HTMLAttributes<HTMLElement> & {
  as?: keyof JSX.IntrinsicElements
}

const Skeleton: React.FC<SkeletonProps> = ({ as = 'div', className = '', ...rest }) => {
  const Tag = as as any
  return (
    <Tag
      className={`animate-pulse bg-primary-100/40 dark:bg-slate-700/40 ${className}`}
      {...rest}
    />
  )
}

export default Skeleton
