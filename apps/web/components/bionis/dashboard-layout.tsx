'use client'

import type { ReactNode } from 'react'
import { AdminSidebar } from './sidebar'
import { AdminTopbar } from './topbar'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

type DashboardLayoutProps = { children: ReactNode }

export function AdminDashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden no-scrollbar" style={{ '--sidebar-width': '16rem', '--sidebar-width-icon': '3.5rem' } as React.CSSProperties}>
      <AdminSidebar />
      <SidebarInset className="flex flex-1 flex-col overflow-hidden min-w-0">
        <AdminTopbar />
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
