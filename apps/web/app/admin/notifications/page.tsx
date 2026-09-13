'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Send, Bell, Loader2, CheckCircle2, AlertCircle, Megaphone,
  Eye, MousePointerClick, Smartphone, BarChart3, ArrowUpRight,
  ArrowDownRight, Calendar, Sparkles, Users,
} from 'lucide-react'
import { NotificationsSkeleton } from '@/components/bionis/skeletons'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { NotificationAnalytics } from '@repo/shared/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
  FadeStatus,
  HoverCard,
} from '@/components/motion/motion-components'

export default function NotificationsPage() {
  const [analytics, setAnalytics] = useState<NotificationAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [dateRange, setDateRange] = useState('30')

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [target, setTarget] = useState<'all' | 'topic' | 'token'>('all')
  const [topic, setTopic] = useState('')
  const [token, setToken] = useState('')
  const [autoNotifEnabled, setAutoNotifEnabled] = useState(true)

  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' })

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/notifications/analytics?days=${dateRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setAutoNotifEnabled(data.autoNotifyNewPrompt ?? true)
      })
      .catch(() => {}) // ignore — default is true
  }, [])

  const handleAutoNotifToggle = async (checked: boolean) => {
    setAutoNotifEnabled(checked)
    await fetch('/api/notifications/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoNotifyNewPrompt: checked }),
    })
  }

  useEffect(() => { setLoading(true); fetchAnalytics() }, [fetchAnalytics])

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setStatus({ type: null, message: '' })
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), imageUrl: imageUrl.trim() || undefined, target, topic: target === 'topic' ? topic.trim() : undefined, token: target === 'token' ? token.trim() : undefined, sentBy: 'admin', source: 'manual' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to send')
      setStatus({ type: 'success', message: `Notification sent to ${result.notification.sentCount} devices (${result.notification.deliveredCount} delivered)` })
      setTitle(''); setBody(''); setImageUrl('')
      fetchAnalytics()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send notification'
      setStatus({ type: 'error', message })
    } finally {
      setSending(false)
    }
  }

  const chartData = useMemo(() => {
    if (!analytics?.dailyBreakdown) return []
    return analytics.dailyBreakdown.slice(-14).map((d) => ({
      date: new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      sent: d.sent,
      delivered: d.delivered,
      opened: d.opened,
    }))
  }, [analytics?.dailyBreakdown])

  if (loading && !analytics) {
    return <NotificationsSkeleton />
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      {/* Header */}
      <FadeIn className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Notifications</h1>
          <p className="text-sm text-muted-foreground">Send push notifications and track engagement</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => v && setDateRange(v)}>
          <SelectTrigger className="w-[140px]">
            <Calendar size={14} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </FadeIn>

      {/* Stats */}
      <StaggerContainer className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Sent', value: (analytics?.totalSent ?? 0).toLocaleString(), subtitle: `${analytics?.notifications.length ?? 0} campaigns`, icon: Send, color: 'bg-primary/10 text-primary' },
          { title: 'Delivered', value: (analytics?.totalDelivered ?? 0).toLocaleString(), subtitle: `${((analytics?.deliveryRate ?? 0) * 100).toFixed(1)}% delivery rate`, icon: Eye, color: 'bg-blue-500/10 text-blue-600', trend: (analytics?.deliveryRate ?? 0) >= 0.9 },
          { title: 'Opened / Tapped', value: (analytics?.totalOpened ?? 0).toLocaleString(), subtitle: `${((analytics?.openRate ?? 0) * 100).toFixed(1)}% open rate`, icon: MousePointerClick, color: 'bg-orange-500/10 text-orange-600', trend: (analytics?.openRate ?? 0) >= 0.15 },
          { title: 'Active Devices', value: String(analytics?.platformBreakdown.reduce((s, p) => s + p.count, 0) ?? 0), subtitle: analytics?.platformBreakdown.map((p) => `${p.platform}: ${p.count}`).join(', ') ?? '', icon: Smartphone, color: 'bg-purple-500/10 text-purple-600' },
        ].map((stat) => (
          <StaggerItem key={stat.title}>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex size-7 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="size-3.5" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground">{stat.title}</h3>
                </div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <div className="flex items-center gap-1 mt-1">
                  {stat.trend !== undefined && (
                    stat.trend ? <ArrowUpRight size={12} className="text-green-600" /> : <ArrowDownRight size={12} className="text-destructive" />
                  )}
                  <span className={`text-xs font-medium ${stat.trend === true ? 'text-green-600' : stat.trend === false ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {stat.subtitle}
                  </span>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Chart + Composer Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chart */}
        <FadeIn delay={0.2} className="lg:col-span-2">
          <Card className="transition-all hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="size-3.5" />
                </span>
                Daily Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="4 4" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="sent" fill="var(--chart-1)" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="delivered" fill="var(--chart-1)" fillOpacity={0.6} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="opened" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">No data yet</p>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Source + Auto-Notif */}
        <div className="flex flex-col gap-4">
          <FadeIn delay={0.25}>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--insight-prediction)] text-white">
                    <Sparkles className="size-3.5" />
                  </div>
                  <h3 className="font-medium">By Source</h3>
                </div>
                <div className="flex flex-col gap-3">
                  {analytics?.sourceBreakdown.map((src) => (
                    <div key={src.source} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={src.source === 'manual' ? 'default' : 'secondary'}>
                          {src.source === 'manual' ? 'Manual' : 'Auto'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{src.count} campaigns</span>
                      </div>
                      <span className="text-sm font-medium">{src.opened} opens</span>
                    </div>
                  ))}
                  {(!analytics?.sourceBreakdown || analytics.sourceBreakdown.length === 0) && (
                    <p className="text-sm text-muted-foreground">No data yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn delay={0.3}>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-[var(--insight-actions)] text-white">
                    <Bell className="size-3.5" />
                  </div>
                  <h3 className="font-medium">Auto-Notifications</h3>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">New Prompt Alert</p>
                    <p className="text-xs text-muted-foreground">Notify all users when a new prompt is uploaded</p>
                  </div>
                  <Switch checked={autoNotifEnabled} onCheckedChange={handleAutoNotifToggle} />
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </div>

      {/* Composer */}
      <FadeIn delay={0.35}>
        <Card className="transition-all hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-medium">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="size-3.5" />
              </span>
              Compose Notification
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Status — inside form */}
            <FadeStatus show={status.type !== null}>
              <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-destructive/10 text-destructive'}`}>
                {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {status.message}
              </div>
            </FadeStatus>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., New prompts just dropped!" maxLength={100} />
                <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Target Audience</Label>
                <div className="flex gap-2">
                  {(['all', 'topic', 'token'] as const).map((t) => (
                    <Button key={t} variant={target === t ? 'default' : 'outline'} size="sm" onClick={() => setTarget(t)}>
                      {t === 'all' && <Users size={14} className="mr-1" />}
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Body *</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="e.g., Check out the latest AI prompts for marketing..." rows={3} maxLength={500} />
              <p className="text-xs text-muted-foreground">{body.length}/500 characters</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Image URL (optional)</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
            </div>

            {target === 'topic' && (
              <div className="flex flex-col gap-2">
                <Label>Topic Name</Label>
                <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., marketing, new-prompts" />
              </div>
            )}

            {target === 'token' && (
              <div className="flex flex-col gap-2">
                <Label>FCM Token</Label>
                <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ExpoPushToken[...]" />
              </div>
            )}

            <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="w-full sm:w-auto">
              {sending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Send className="mr-2 size-4" />}
              {sending ? 'Sending...' : 'Send Notification'}
            </Button>
          </CardContent>
        </Card>
      </FadeIn>

      {/* History */}
      {analytics?.notifications && analytics.notifications.length > 0 && (
        <FadeIn delay={0.4}>
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-medium">Notification History</h2>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Title</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Target</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Sent</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Delivered</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Opened</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Rate</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Source</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.notifications.map((notif, i) => {
                      const openRate = (notif.deliveredCount ?? 0) > 0 ? ((notif.openedCount ?? 0) / notif.deliveredCount) * 100 : 0
                      return (
                        <AnimatedTableRow key={notif.id} index={i}>
                          <td className="px-4 py-3 text-sm font-medium max-w-[120px] truncate">{notif.title}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{notif.target}</Badge></td>
                          <td className="px-4 py-3 text-center text-sm">{notif.sentCount}</td>
                          <td className="px-4 py-3 text-center text-sm">{notif.deliveredCount}</td>
                          <td className="px-4 py-3 text-center text-sm font-medium">{notif.openedCount ?? 0}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-medium ${openRate >= 15 ? 'text-green-600' : openRate >= 5 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {openRate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={notif.source === 'auto' ? 'secondary' : 'default'} className="text-xs">
                              {notif.source === 'auto' ? 'Auto' : 'Manual'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : '—'}
                          </td>
                        </AnimatedTableRow>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}
    </PageTransition>
  )
}
