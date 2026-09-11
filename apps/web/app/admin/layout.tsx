'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from '@/lib/auth'
import { QueryProvider } from '@/lib/query-provider'
import { DashboardNavigationProvider } from '@/components/bionis/navigation'
import { AdminDashboardLayout } from '@/components/bionis/dashboard-layout'

function AdminContent({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (isLoginPage) {
      if (!loading && user) router.push('/admin')
    } else if (!loading && !user) {
      router.push('/admin/login')
    }
  }, [user, loading, router, isLoginPage])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isLoginPage) {
    return <main>{children}</main>
  }

  if (!user) return null

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <QueryProvider>
      <AuthProvider>
        <DashboardNavigationProvider>
          <AdminContent>{children}</AdminContent>
        </DashboardNavigationProvider>
      </AuthProvider>
    </QueryProvider>
  )
}
