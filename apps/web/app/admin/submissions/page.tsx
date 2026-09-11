'use client'

import { useState } from 'react'
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore'
import { CheckCircle, XCircle, Clock, Loader2, MessageSquare, User, Calendar } from 'lucide-react'
import { getDb } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAdminSubmissions, useAdminCategories, useReviewSubmission } from '@/lib/admin-queries'
import type { PromptSubmission } from '@repo/shared/types'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-500/10', label: 'Pending' },
  approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-500/10', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10', label: 'Rejected' },
} as const

export default function SubmissionsPage() {
  const { data: submissions = [], isLoading } = useAdminSubmissions()
  const { data: categories = [] } = useAdminCategories()
  const reviewMutation = useReviewSubmission()

  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [reviewSheet, setReviewSheet] = useState<PromptSubmission | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [categoryId, setCategoryId] = useState('')

  const openReview = (submission: PromptSubmission) => {
    setReviewSheet(submission)
    setReviewNote('')
    setCategoryId(submission.suggestedCategoryId || categories[0]?.id || '')
  }

  const handleApprove = async () => {
    if (!reviewSheet) return
    const promptRef = await addDoc(collection(getDb(), 'prompts'), {
      text: reviewSheet.text,
      imageUrl: reviewSheet.imageUrl || '',
      cloudinaryPublicId: '',
      categoryId,
      order: 999,
      likesCount: 0,
      copiesCount: 0,
      shareCount: 0,
      tags: reviewSheet.tags,
      isActive: true,
      isPremium: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    await reviewMutation.mutateAsync({ id: reviewSheet.id, status: 'approved', reviewNote, reviewedBy: 'admin' })
    await updateDoc(doc(getDb(), 'submissions', reviewSheet.id), { approvedPromptId: promptRef.id })
    setReviewSheet(null)
  }

  const handleReject = async () => {
    if (!reviewSheet) return
    await reviewMutation.mutateAsync({ id: reviewSheet.id, status: 'rejected', reviewNote, reviewedBy: 'admin' })
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
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Submissions</h1>
          <p className="text-sm text-muted-foreground">
            {pendingCount} pending review, {submissions.length} total
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 stagger-children">
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Clock className="size-3.5" />
              </div>
              <h3 className="font-medium">Pending</h3>
            </div>
            <p className="text-2xl font-bold tabular-nums">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-green-500/10 text-green-600">
                <CheckCircle className="size-3.5" />
              </div>
              <h3 className="font-medium">Approved</h3>
            </div>
            <p className="text-2xl font-bold tabular-nums">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                <XCircle className="size-3.5" />
              </div>
              <h3 className="font-medium">Rejected</h3>
            </div>
            <p className="text-2xl font-bold tabular-nums">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
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

      {/* Table */}
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
                filteredSubmissions.map((sub) => {
                  const config = STATUS_CONFIG[sub.status]
                  const StatusIcon = config.icon
                  return (
                    <TableRow key={sub.id} className="group">
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
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Sheet */}
      <Sheet open={reviewSheet !== null} onOpenChange={() => setReviewSheet(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
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
                <Label>Assign Category</Label>
                <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Review Note (optional)</Label>
                <Textarea value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note for the submitter..." rows={3} />
              </div>
            </div>
          )}

          <SheetFooter>
            <Button variant="outline" onClick={handleReject} disabled={reviewMutation.isPending}>
              <XCircle size={14} className="mr-1" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={reviewMutation.isPending || !categoryId} className="bg-green-600 hover:bg-green-700">
              <CheckCircle size={14} className="mr-1" /> Approve & Publish
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
