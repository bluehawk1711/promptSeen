'use client'

import { useState } from 'react'
import { TrendingUp, Eye, Heart, Copy, Share2, Users, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import type { DailyStats, Prompt } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
  LoadingDots,
} from '@/components/motion/motion-components'
import { useAdminDailyStats, useAdminTopPrompts } from '@/lib/admin-queries'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<7 | 30>(7)

  const { data: dailyStats = [], isLoading: loadingDaily, error: errorDaily } = useAdminDailyStats(30)
  const { data: topPrompts = [], isLoading: loadingTop, error: errorTop } = useAdminTopPrompts(10)

  const loading = loadingDaily || loadingTop
  const error = errorDaily?.message || errorTop?.message || null

  const recentStats = dailyStats.slice(0, dateRange)
  const totals = recentStats.reduce(
    (acc, s) => ({
      activeUsers: acc.activeUsers + (s.activeUsers || 0),
      promptViews: acc.promptViews + (s.promptViews || 0),
      likes: acc.likes + (s.likes || 0),
      copies: acc.copies + (s.copies || 0),
      shares: acc.shares + (s.shares || 0),
      adImpressions: acc.adImpressions + (s.adImpressions || 0),
      rewardCompletes: acc.rewardCompletes + (s.rewardCompletes || 0),
    }),
    { activeUsers: 0, promptViews: 0, likes: 0, copies: 0, shares: 0, adImpressions: 0, rewardCompletes: 0 }
  )

  const metricCards = [
    { title: 'Active Users', value: totals.activeUsers, icon: Users, description: `Avg ${Math.round(totals.activeUsers / Math.max(recentStats.length, 1))}/day`, color: 'bg-blue-500/10 text-blue-600' },
    { title: 'Prompt Views', value: totals.promptViews, icon: Eye, description: `${Math.round(totals.promptViews / Math.max(recentStats.length, 1))}/day`, color: 'bg-purple-500/10 text-purple-600' },
    { title: 'Likes', value: totals.likes, icon: Heart, description: `${Math.round(totals.likes / Math.max(recentStats.length, 1))}/day`, color: 'bg-red-500/10 text-red-600' },
    { title: 'Copies', value: totals.copies, icon: Copy, description: `${Math.round(totals.copies / Math.max(recentStats.length, 1))}/day`, color: 'bg-green-500/10 text-green-600' },
    { title: 'Shares', value: totals.shares, icon: Share2, description: `${Math.round(totals.shares / Math.max(recentStats.length, 1))}/day`, color: 'bg-orange-500/10 text-orange-600' },
    { title: 'Ad Impressions', value: totals.adImpressions, icon: TrendingUp, description: `${totals.rewardCompletes} reward completions`, color: 'bg-amber-500/10 text-amber-600' },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <LoadingDots className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading analytics...</p>
      </div>
    )
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Engagement metrics for the last {dateRange} days</p>
        </div>
        <div className="flex gap-2">
          <Button variant={dateRange === 7 ? 'default' : 'outline'} size="sm" onClick={() => setDateRange(7)}>7 Days</Button>
          <Button variant={dateRange === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDateRange(30)}>30 Days</Button>
        </div>
      </FadeIn>

      {error && (
        <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metricCards.map((stat) => {
          const Icon = stat.icon
          return (
            <StaggerItem key={stat.title}>
              <Card className="transition-all hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`flex size-7 items-center justify-center rounded-lg ${stat.color}`}>
                      <Icon className="size-3.5" />
                    </div>
                    <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            </StaggerItem>
          )
        })}
      </StaggerContainer>

      <div className="grid gap-6 lg:grid-cols-2">
        <FadeIn delay={0.2}>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="size-3.5" />
                </span>
                Daily Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentStats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No daily stats available yet. Stats are collected as users interact with the app.
                </p>
              ) : (
                <StaggerContainer className="space-y-2 max-h-[400px] overflow-y-auto">
                  {recentStats.map((stat) => (
                    <StaggerItem key={stat.date} direction="right" distance={8}>
                      <div className="flex items-center justify-between py-2.5 border-b last:border-0">
                        <span className="text-sm font-mono tabular-nums">{stat.date}</span>
                        <div className="flex gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users size={12} /> {stat.activeUsers || 0}</span>
                          <span className="flex items-center gap-1"><Eye size={12} /> {stat.promptViews || 0}</span>
                          <span className="flex items-center gap-1"><Heart size={12} /> {stat.likes || 0}</span>
                          <span className="flex items-center gap-1"><Copy size={12} /> {stat.copies || 0}</span>
                          <span className="flex items-center gap-1"><Share2 size={12} /> {stat.shares || 0}</span>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--chart-2)]/10 text-[var(--chart-2)]">
                  <TrendingUp className="size-3.5" />
                </span>
                Top Prompts by Likes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topPrompts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No prompts found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Prompt</TableHead>
                      <TableHead className="text-center">Likes</TableHead>
                      <TableHead className="text-center">Copies</TableHead>
                      <TableHead className="text-center">Shares</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPrompts.map((prompt, i) => (
                      <AnimatedTableRow key={prompt.id} index={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[250px]">{prompt.text}</p>
                        </TableCell>
                        <TableCell className="text-center text-sm tabular-nums">{prompt.likesCount.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-sm tabular-nums">{prompt.copiesCount.toLocaleString()}</TableCell>
                        <TableCell className="text-center text-sm tabular-nums">{(prompt.shareCount ?? 0).toLocaleString()}</TableCell>
                      </AnimatedTableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </PageTransition>
  )
}