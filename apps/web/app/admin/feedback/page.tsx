'use client'

import { useState } from 'react'
import { MessageSquare, Loader2, Clock, Eye, Archive, Star, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAdminFeedback, useUpdateFeedbackStatus } from '@/lib/admin-queries'
import { useToast } from '@/lib/use-toast'
import type { Feedback, FeedbackStatus } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
} from '@/components/motion/motion-components'

const STATUS_CONFIG: Record<FeedbackStatus, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  new: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'New' },
  read: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-500/10', label: 'Read' },
  archived: { icon: Archive, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Archived' },
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  improvement: 'Improvement',
  other: 'Other',
}

const CATEGORY_COLORS: Record<string, string> = {
  bug: 'bg-red-500/10 text-red-600',
  feature: 'bg-purple-500/10 text-purple-600',
  improvement: 'bg-blue-500/10 text-blue-600',
  other: 'bg-muted text-muted-foreground',
}

export default function FeedbackPage() {
  const { data: feedback = [], isLoading } = useAdminFeedback()
  const updateStatus = useUpdateFeedbackStatus()
  const toast = useToast()

  const [filter, setFilter] = useState<'all' | FeedbackStatus>('all')

  const filteredFeedback = filter === 'all' ? feedback : feedback.filter((f) => f.status === filter)
  const newCount = feedback.filter((f) => f.status === 'new').length
  const readCount = feedback.filter((f) => f.status === 'read').length
  const archivedCount = feedback.filter((f) => f.status === 'archived').length

  const handleMarkAsRead = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'read' })
    toast.success('Marked as read', 'Feedback marked as read.')
  }

  const handleArchive = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: 'archived' })
    toast.success('Archived', 'Feedback archived.')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Feedback</h1>
          <p className="text-sm text-muted-foreground">
            {newCount} new, {feedback.length} total
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'New', count: newCount, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
          { label: 'Read', count: readCount, icon: Eye, color: 'bg-blue-500/10 text-blue-600' },
          { label: 'Archived', count: archivedCount, icon: Archive, color: 'bg-muted text-muted-foreground' },
        ].map((stat) => (
          <StaggerItem key={stat.label}>
            <Card className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex size-7 items-center justify-center rounded-lg ${stat.color}`}>
                    <stat.icon className="size-3.5" />
                  </div>
                  <h3 className="font-medium">{stat.label}</h3>
                </div>
                <p className="text-2xl font-bold tabular-nums">{stat.count}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </StaggerContainer>

      <FadeIn delay={0.1}>
        <div className="flex gap-2">
          {(['new', 'all', 'read', 'archived'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'new' && newCount > 0 && (
                <Badge className="ml-2" variant="secondary">{newCount}</Badge>
              )}
            </Button>
          ))}
        </div>
      </FadeIn>

      <FadeIn delay={0.15}>
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedback.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MessageSquare className="size-8" />
                        <p className="text-sm">No {filter === 'all' ? '' : filter} feedback found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedback.map((fb, i) => {
                    const config = STATUS_CONFIG[fb.status]
                    const StatusIcon = config.icon
                    return (
                      <AnimatedTableRow key={fb.id} index={i} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{fb.userName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{fb.userEmail || fb.userId.slice(0, 8) + '...'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm max-w-[320px] leading-relaxed">{fb.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={CATEGORY_COLORS[fb.category]}>
                            {CATEGORY_LABELS[fb.category] ?? fb.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {fb.rating ? (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, si) => (
                                <Star
                                  key={si}
                                  size={12}
                                  className={si < fb.rating! ? 'text-yellow-500 fill-yellow-500' : 'text-muted'}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {fb.status === 'new' && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(fb.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye size={14} className="mr-1" />
                              Mark Read
                            </Button>
                          )}
                          {fb.status !== 'archived' && (
                            <Button variant="ghost" size="sm" onClick={() => handleArchive(fb.id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Archive size={14} className="mr-1" />
                              Archive
                            </Button>
                          )}
                        </TableCell>
                      </AnimatedTableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>
    </PageTransition>
  )
}
