'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type DashboardNavigation = {
  pathname: string
}

const DashboardNavigationContext = createContext<DashboardNavigation | null>(null)

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const value = useMemo(() => ({ pathname }), [pathname])

  return (
    <DashboardNavigationContext.Provider value={value}>
      {children}
    </DashboardNavigationContext.Provider>
  )
}

export function useDashboardNavigation() {
  const context = useContext(DashboardNavigationContext)
  if (!context) {
    throw new Error('useDashboardNavigation must be used within DashboardNavigationProvider')
  }
  return context
}

export function DashboardLink({
  href,
  children,
  className,
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return (
    <Link
      href={href}
      className={className}
      onClick={onClick}
      {...props}
    >
      {children}
    </Link>
  )
}
