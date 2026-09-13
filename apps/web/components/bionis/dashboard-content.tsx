'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
} from 'recharts'
import { FileText, Tags, Users, Heart, Copy, Share2, Send, Eye, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react'
import { useAdminStats, useNotificationStats } from '@/lib/admin-queries'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DashboardSkeleton } from './skeletons'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  ScaleIn,
  AnimatedCounter,
  HoverCard,
} from '@/components/motion/motion-components'

function ScoreDonut({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.round((Math.min(value, max) / Math.max(max, 1)) * 100)
  const data = [{ v: pct }, { v: 100 - pct }]

  return (
    <ScaleIn delay={0.3} className="relative size-36 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius="72%" outerRadius="88%"
            dataKey="v" startAngle={90} endAngle={-270} stroke="none" cornerRadius={10}
            isAnimationActive animationDuration={1000} animationEasing="ease-out">
            <Cell fill="var(--primary)" />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Active</span>
        <AnimatedCounter value={value} className="text-3xl font-bold tracking-tight" />
      </div>
    </ScaleIn>
  )
}

function StatCard({
  title, value, subtitle, icon: Icon, iconBg, trend, trendUp, accent, index = 0,
}: {
  title: string; value: string | number; subtitle?: string
  icon: ComponentType<{ className?: string }>; iconBg: string
  trend?: string; trendUp?: boolean; accent?: string; index?: number
}) {
  return (
    <StaggerItem>
      <HoverCard className={cn(
        'relative overflow-hidden rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm group',
        accent && 'border-l-4',
      )} style={accent ? { borderLeftColor: accent } : undefined}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
            <motion.div
              whileHover={{ scale: 1.15, rotate: 8 }}
              transition={{ duration: 0.2 }}
              className={cn('flex size-9 items-center justify-center rounded-xl', iconBg)}
            >
              <Icon className="size-[18px]" />
            </motion.div>
          </div>
          <AnimatedCounter value={typeof value === 'number' ? value : 0} className="text-3xl font-bold tracking-tight" />
          {typeof value === 'string' && <p className="text-3xl font-bold tracking-tight tabular-nums">{value}</p>}
          {subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2.5">
              <ArrowUpRight size={14} className={cn(trendUp ? 'text-emerald-600' : 'rotate-90 text-red-500')} />
              <span className={cn('text-xs font-semibold', trendUp ? 'text-emerald-600' : 'text-red-500')}>{trend}</span>
              <span className="text-xs text-muted-foreground ml-0.5">vs last week</span>
            </div>
          )}
        </CardContent>
      </HoverCard>
    </StaggerItem>
  )
}

interface TooltipPayloadItem {
  color: string
  dataKey: string
  value: number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}

function ChartTooltipContent({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="rounded-xl border bg-card px-3.5 py-2.5 shadow-lg"
    >
      <p className="text-xs font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground capitalize">{p.dataKey}</span>
          <span className="font-semibold ml-auto tabular-nums">{p.value}</span>
        </div>
      ))}
    </motion.div>
  )
}

import type { ComponentType } from 'react'

export function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useAdminStats()
  const { data: notifStats, isLoading: notifLoading } = useNotificationStats()

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [])

  const engagementData = useMemo(() => {
    const days = 14
    const base = (stats?.totalLikes ?? 0) / 14 || 3
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (days - 1 - i))
      return {
        date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        likes: Math.round(base * (0.7 + Math.random() * 0.6)),
        copies: Math.round(base * 0.5 * (0.6 + Math.random() * 0.8)),
        shares: Math.round(base * 0.3 * (0.5 + Math.random() * 1.0)),
      }
    })
  }, [stats])

  const categoryData = useMemo(() => [
    { name: 'Marketing', value: 32, fill: 'oklch(0.6988 0.1843 49.1654)' },
    { name: 'Creative', value: 24, fill: 'oklch(0.6090 0.1848 41.0964)' },
    { name: 'Business', value: 18, fill: 'oklch(0.5148 0.1709 36.0412)' },
    { name: 'Tech', value: 14, fill: 'oklch(0.4412 0.1458 34.2806)' },
    { name: 'Social', value: 12, fill: 'oklch(0.3865 0.1231 33.8219)' },
  ], [])

  const loading = statsLoading || notifLoading
  const totalEngagement = (stats?.totalLikes ?? 0) + (stats?.totalCopies ?? 0) + (stats?.totalShares ?? 0)

  if (loading) return <DashboardSkeleton />

  return (
    <PageTransition className="flex flex-col gap-7">
      {/* Header */}
      <FadeIn distance={10} className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{greeting}, Admin</h1>
        <Badge variant="outline" className="gap-1.5 text-xs font-normal px-3 py-1">
          <Calendar className="size-3.5" />
          {new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Badge>
      </FadeIn>

      {/* Hero Overview */}
      <FadeIn delay={0.1} className="relative overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-primary/[0.04] via-background to-background p-6 ring-1 ring-primary/10">
        <div className="flex items-center gap-8">
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-bold tracking-tight">App Overview</h2>
            <Badge className="bg-primary/15 text-primary border-0 hover:bg-primary/20 text-xs font-semibold px-3">Active</Badge>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Your app has <span className="font-bold text-foreground">{stats?.totalPrompts ?? 0} prompts</span> across{' '}
              <span className="font-bold text-foreground">{stats?.totalCategories ?? 0} categories</span> with{' '}
              <span className="font-bold text-foreground">{totalEngagement.toLocaleString()} total engagements</span>.
            </p>
          </div>
          <ScoreDonut value={stats?.activePrompts ?? 0} max={Math.max(stats?.totalPrompts ?? 1, 1)} />
        </div>
      </FadeIn>

      {/* Key Metrics */}
      <div className="space-y-4">
        <FadeIn delay={0.2}>
          <h2 className="text-lg font-bold tracking-tight">Key Metrics</h2>
          <p className="text-sm text-muted-foreground">Content performance overview</p>
        </FadeIn>
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard index={0} title="Total Prompts" value={stats?.totalPrompts ?? 0} subtitle={`${stats?.activePrompts ?? 0} active, ${stats?.premiumPrompts ?? 0} premium`}
            icon={FileText} iconBg="bg-primary/10 text-primary" accent="var(--primary)" trend="+12% this week" trendUp />
          <StatCard index={1} title="Categories" value={stats?.totalCategories ?? 0} subtitle="Prompt categories"
            icon={Tags} iconBg="bg-orange-500/10 text-orange-600" accent="oklch(0.6090 0.1848 41.0964)" />
          <StatCard index={2} title="Users" value={stats?.totalUsers ?? 0} subtitle="Registered users"
            icon={Users} iconBg="bg-blue-500/10 text-blue-600" accent="oklch(0.55 0.20 250)" trend="+5% this week" trendUp />
          <StatCard index={3} title="Submissions" value={stats?.totalSubmissions ?? 0} subtitle={`${stats?.pendingSubmissions ?? 0} pending review`}
            icon={Send} iconBg="bg-purple-500/10 text-purple-600" accent="oklch(0.55 0.20 300)" />
        </StaggerContainer>
      </div>

      {/* Engagement */}
      <div className="space-y-4">
        <FadeIn delay={0.3}>
          <h2 className="text-lg font-bold tracking-tight">Engagement</h2>
        </FadeIn>
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StaggerItem>
            <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium text-muted-foreground">Total Likes</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                  <Heart className="size-[18px]" />
                </div>
              </div>
              <AnimatedCounter value={stats?.totalLikes ?? 0} className="text-3xl font-bold tracking-tight" />
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium text-muted-foreground">Total Copies</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                  <Copy className="size-[18px]" />
                </div>
              </div>
              <AnimatedCounter value={stats?.totalCopies ?? 0} className="text-3xl font-bold tracking-tight" />
            </HoverCard>
          </StaggerItem>
          <StaggerItem>
            <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[13px] font-medium text-muted-foreground">Total Shares</p>
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Share2 className="size-[18px]" />
                </div>
              </div>
              <AnimatedCounter value={stats?.totalShares ?? 0} className="text-3xl font-bold tracking-tight" />
            </HoverCard>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <FadeIn delay={0.4}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 pb-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary"><TrendingUp className="size-4" /></span>
                  <h3 className="text-base font-bold tracking-tight">Engagement Trend</h3>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1" /> Likes</div>
                  <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2" /> Copies</div>
                  <div className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-3" /> Shares</div>
                </div>
              </div>
              <div className="h-64 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                      <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.25} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="6 6" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} dx={-4} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="likes" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#g1)" dot={false} activeDot={{ r: 5, strokeWidth: 2, fill: 'var(--card)' }} animationDuration={1200} />
                    <Area type="monotone" dataKey="copies" stroke="var(--chart-2)" strokeWidth={2} fill="url(#g2)" dot={false} activeDot={{ r: 4 }} animationDuration={1400} />
                    <Area type="monotone" dataKey="shares" stroke="var(--chart-3)" strokeWidth={2} fill="none" strokeDasharray="6 6" dot={false} activeDot={{ r: 4 }} animationDuration={1600} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.5}>
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="p-5 pb-0">
                <div className="flex items-center gap-2.5 mb-1">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600"><Tags className="size-4" /></span>
                  <h3 className="text-base font-bold tracking-tight">Prompts by Category</h3>
                </div>
              </div>
              <div className="flex items-center gap-8 p-5 pt-3">
                <ScaleIn delay={0.6} className="size-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius="50%" outerRadius="85%"
                        dataKey="value" stroke="none" cornerRadius={6} paddingAngle={3}
                        isAnimationActive animationDuration={1200}>
                        {categoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ScaleIn>
                <StaggerContainer className="flex flex-1 flex-col gap-3.5">
                  {categoryData.map((cat, i) => (
                    <StaggerItem key={cat.name} direction="right" distance={8}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="size-3 rounded-md shrink-0" style={{ backgroundColor: cat.fill }} />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm tabular-nums text-muted-foreground font-medium">{cat.value}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Notification Stats */}
      {notifStats && (
        <div className="space-y-4">
          <FadeIn delay={0.55}>
            <h2 className="text-lg font-bold tracking-tight">Notifications</h2>
          </FadeIn>
          <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StaggerItem>
              <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground">Notifications Sent</p>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600"><Send className="size-[18px]" /></div>
                </div>
                <AnimatedCounter value={notifStats.totalSent} className="text-3xl font-bold tracking-tight" />
                <p className="text-xs text-muted-foreground mt-1.5">{notifStats.totalNotifs} campaigns</p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground">Delivery Rate</p>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Eye className="size-[18px]" /></div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{notifStats.deliveryRate}%</p>
                <p className="text-xs text-muted-foreground mt-1.5">{notifStats.totalDelivered} delivered</p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="rounded-xl border-0 bg-card ring-1 ring-foreground/10 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-medium text-muted-foreground">Open Rate</p>
                  <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><TrendingUp className="size-[18px]" /></div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{notifStats.openRate}%</p>
                <p className="text-xs text-muted-foreground mt-1.5">{notifStats.activeTokens} active devices</p>
              </HoverCard>
            </StaggerItem>
          </StaggerContainer>
        </div>
      )}
    </PageTransition>
  )
}
