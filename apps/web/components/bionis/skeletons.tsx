'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />
}

export function StatCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="size-9 rounded-xl" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function ChartCardSkeleton() {
  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5 pb-0">
          <div className="flex items-center gap-2.5 mb-4">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="p-5 pt-3">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </CardContent>
    </Card>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-0">
        <div className="p-4">
          {/* Header */}
          <div className="flex gap-4 pb-3 border-b">
            {Array.from({ length: cols }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Rows */}
          {Array.from({ length: rows }).map((_, row) => (
            <div key={row} className="flex gap-4 py-4 border-b last:border-0">
              {Array.from({ length: cols }).map((_, col) => (
                <Skeleton key={col} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function OverviewCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 bg-muted/30 p-6 ring-1 ring-border">
      <div className="flex items-center gap-8">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-4 w-3/4 max-w-sm" />
        </div>
        <Skeleton className="size-36 rounded-full shrink-0" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-7 w-48 rounded-full" />
      </div>
      <OverviewCardSkeleton />
      <div className="space-y-4">
        <div>
          <Skeleton className="h-6 w-32 mb-1" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  )
}

export function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2"><ChartCardSkeleton /></div>
        <div className="space-y-4">
          <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-24" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></CardContent></Card>
          <Card className="border-0 shadow-sm"><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  )
}
