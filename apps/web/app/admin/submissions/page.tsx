'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Loader2, MessageSquare, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectList, MultiSelectItem } from '@/components/motion/multi-select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminSubmissions, useAdminCategories, useReviewSubmission, useApproveSubmission } from '@/lib/admin-queries'
import { useToast } from '@/lib/use-toast'
import type { PromptSubmission } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
} from '@/components/motion/motion-components'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Rejected' },
} as const

export default function SubmissionsPage() {
  const { data: submissions = [], isLoading } = useAdminSubmissions()
  const { data: categories = [] } = useAdminCategories()
  const reviewMutation = useReviewSubmission()
  const approveMutation = useApproveSubmission()
  const toast = useToast()

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [reviewSheet, setReviewSheet] = useState<PromptSubmission | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [categoryIds, setCategoryIds] = useState<string[]>([])

  const isProcessing = reviewMutation.isPending || approveMutation.isPending

  const openReview = (submission: PromptSubmission) => {
    setReviewSheet(submission)
    setReviewNote('')
    setCategoryIds(submission.suggestedCategoryId ? [submission.suggestedCategoryId] : [categories[0]?.id].filter(Boolean))
  }

  const handleApprove = async () => {
    if (!reviewSheet) return
    await approveMutation.mutateAsync({
      submission: reviewSheet,
      categoryIds,
      reviewNote,
      reviewedBy: 'admin',
    })
    toast.success('Submission approved', 'The prompt has been published.')
    setReviewSheet(null)
  }

  const handleReject = async () => {
    if (!reviewSheet) return
    await reviewMutation.mutateAsync({ id: reviewSheet.id, status: 'rejected', reviewNote, reviewedBy: 'admin' })
    toast.success('Submission rejected', 'The submission has been rejected.')
    setReviewSheet(null)
  }

  const filteredSubmissions = filter === 'all' ? submissions : submissions.filter((s) => s.status === filter)
  const pendingCount = submissions.filter((s) => s.status === 'pending').length
  const approvedCount = submissions.filter((s) => s.status === 'approved').length
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length

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
          <h1 className="text-xl font-medium md:text-2xl">Submissions</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending review, {submissions.length} total
          </p>
        </div>
      </FadeIn>

      <StaggerContainer className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: 'Pending', count: pendingCount, icon: Clock, color: 'bg-amber-500/10 text-amber-600' },
          { label: 'Approved', count: approvedCount, icon: CheckCircle, color: 'bg-green-500/10 text-green-600' },
          { label: 'Rejected', count: rejectedCount, icon: XCircle, color: 'bg-red-500/10 text-red-600' },
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
          {(['pending', 'all', 'approved', 'rejected'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && pendingCount > 0 && (
                <Badge className="ml-2" variant="secondary">{pendingCount}</Badge>
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
                  <TableHead>Submitter</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <MessageSquare className="size-8" />
                        <p className="text-sm">No {filter === 'all' ? '' : filter} submissions found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub, i) => {
                    const config = STATUS_CONFIG[sub.status]
                    const StatusIcon = config.icon
                    return (
                      <AnimatedTableRow key={sub.id} index={i} className="group">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{sub.submitterName}</p>
                              <p className="text-xs text-muted-foreground font-mono">{sub.submitterUid.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm truncate max-w-[300px]">{sub.text}</p>
                          {sub.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {sub.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categories.find((c) => c.id === sub.suggestedCategoryId)?.name ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${config.bg} ${config.color}`}>
                            <StatusIcon size={12} />
                            {config.label}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {sub.status === 'pending' && (
                            <Button variant="ghost" size="sm" onClick={() => openReview(sub)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MessageSquare size={14} className="mr-1" />
                              Review
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

      <Sheet open={reviewSheet !== null} onOpenChange={(open) => { if (!open && isProcessing) return; setReviewSheet(open ? reviewSheet : null) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" showCloseButton={!isProcessing}>
          <SheetHeader>
            <SheetTitle>Review Submission</SheetTitle>
            <SheetDescription>Review this prompt submission and approve or reject it.</SheetDescription>
          </SheetHeader>

          {reviewSheet && (
            <div className="flex flex-col gap-4 py-4 px-4">
              <div className="rounded-xl border p-4 bg-muted/30">
                <p className="text-sm font-medium leading-relaxed">{reviewSheet.text}</p>
                {reviewSheet.imageUrl && (
                  <img src={reviewSheet.imageUrl} alt="Preview" className="mt-3 h-24 w-24 rounded-lg object-cover" />
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Submitted by <span className="font-medium text-foreground">{reviewSheet.submitterName}</span>
              </p>

              <div className="flex flex-col gap-2">
                <Label>Assign Categories</Label>
                <MultiSelect value={categoryIds} onValueChange={(v) => setCategoryIds(v)}>
                  <MultiSelectTrigger>
                    <MultiSelectValue placeholder="Select categories" />
                  </MultiSelectTrigger>
                  <MultiSelectContent>
                    <MultiSelectList>
                      {categories.map((cat) => (
                        <MultiSelectItem key={cat.id} value={cat.id}>{cat.name}</MultiSelectItem>
                      ))}
                    </MultiSelectList>
                  </MultiSelectContent>
                </MultiSelect>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Review Note (optional)</Label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note for the submitter..." rows={3} />
              </div>
            </div>
          )}

          <SheetFooter>
            <Button variant="outline" onClick={handleReject} disabled={isProcessing}>
              <XCircle size={14} className="mr-1" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing || categoryIds.length === 0} className="bg-green-600 hover:bg-green-700">
              {(approveMutation.isPending) && <Loader2 size={14} className="mr-1 animate-spin" />}
              <CheckCircle size={14} className="mr-1" /> Approve & Publish
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageTransition>
  )
}
