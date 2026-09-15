'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Star,
  Search,
  Copy,
  Heart,
  Share2,
  MoreHorizontal,
  Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { TableSkeleton } from '@/components/bionis/skeletons'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MultiSelect, MultiSelectTrigger, MultiSelectValue, MultiSelectContent, MultiSelectList, MultiSelectItem } from '@/components/motion/multi-select'
import { ImageUpload, type ImageUploadHandle } from '@/components/image-upload'
import { VideoUpload } from '@/components/video-upload'
import { notifyNewPrompt } from '@/lib/notifications'
import { getDb } from '@/lib/firebase'
import {
  useAdminPrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  useAdminCategories,
} from '@/lib/admin-queries'
import { useToast } from '@/lib/use-toast'
import type { Prompt, PromptVideo } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
} from '@/components/motion/motion-components'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ''
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'ml_default'

export default function PromptsPage() {
  const { data: prompts = [], isLoading: loading } = useAdminPrompts()
  const { data: categories = [] } = useAdminCategories()
  const createPrompt = useCreatePrompt()
  const updatePrompt = useUpdatePrompt()
  const deletePromptMutation = useDeletePrompt()
  const toast = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [formText, setFormText] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formCloudinaryId, setFormCloudinaryId] = useState('')
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([])
  const [formOrder, setFormOrder] = useState('0')
  const [formTags, setFormTags] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)
  const [formIsPremium, setFormIsPremium] = useState(false)
  const [formVideo, setFormVideo] = useState<PromptVideo | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [hasPendingImage, setHasPendingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const imageUploadRef = useRef<ImageUploadHandle>(null)

  const openCreate = () => {
    setEditingPrompt(null)
    setFormText('')
    setFormImageUrl('')
    setFormCloudinaryId('')
    setFormCategoryIds(categories[0]?.id ? [categories[0].id] : [])
    setFormOrder(String(prompts.length))
    setFormTags('')
    setFormIsActive(true)
    setFormIsPremium(false)
    setFormVideo(null)
    setUploadError(null)
    setHasPendingImage(false)
    setSheetOpen(true)
  }

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormText(prompt.text)
    setFormImageUrl(prompt.imageUrl)
    setFormCloudinaryId(prompt.cloudinaryPublicId)
    setFormCategoryIds(prompt.categoryId ? [prompt.categoryId] : [])
    setFormOrder(String(prompt.order))
    setFormTags(prompt.tags.join(', '))
    setFormIsActive(prompt.isActive)
    setFormIsPremium(prompt.isPremium)
    setFormVideo(prompt.video ?? null)
    setUploadError(null)
    setHasPendingImage(false)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Step 1: Upload the pending image to Cloudinary (deferred until save)
      let imageUrl = formImageUrl
      let cloudinaryPublicId = formCloudinaryId

      if (imageUploadRef.current?.hasPendingUpload()) {
        const uploaded = await imageUploadRef.current.upload()
        if (!uploaded) {
          return // Upload failed — the error is shown inside ImageUpload
        }
        imageUrl = uploaded.imageUrl
        cloudinaryPublicId = uploaded.publicId
        setFormImageUrl(imageUrl)
        setFormCloudinaryId(cloudinaryPublicId)
      }

      if (!formText.trim() || !imageUrl) return

      // Step 2: Save prompt to Firestore
      const primaryCategoryId = formCategoryIds[0] ?? ''
      const data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'> = {
        text: formText,
        imageUrl,
        cloudinaryPublicId,
        categoryId: primaryCategoryId,
        order: Number(formOrder),
        likesCount: editingPrompt?.likesCount ?? 0,
        copiesCount: editingPrompt?.copiesCount ?? 0,
        shareCount: editingPrompt?.shareCount ?? 0,
        tags: formTags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
        isActive: formIsActive,
        isPremium: formIsPremium,
        video: formVideo,
      }

      if (editingPrompt) {
        await updatePrompt.mutateAsync({ id: editingPrompt.id, data })

        // The video was replaced or removed — clean up the previous asset.
        const previousPublicId =
          editingPrompt.video?.type === 'upload' ? editingPrompt.video.publicId : ''
        const nextPublicId = formVideo?.type === 'upload' ? formVideo.publicId : ''
        if (previousPublicId && previousPublicId !== nextPublicId) {
          try {
            await fetch('/api/cloudinary/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: previousPublicId, resourceType: 'video' }),
            })
          } catch {
            console.warn('Failed to delete replaced video from Cloudinary')
          }
        }

        toast.success('Prompt updated', 'The prompt has been saved.')
      } else {
        const newId = await createPrompt.mutateAsync(data)
        toast.success('Prompt created', 'The new prompt has been added.')
        try {
          const settingsRes = await fetch('/api/notifications/settings')
          const settings = settingsRes.ok ? await settingsRes.json() : null
          const autoNotify = settings?.autoNotifyNewPrompt ?? true
          if (autoNotify) {
            const categoryName = categories.find((c) => c.id === primaryCategoryId)?.name ?? 'New'
            await notifyNewPrompt(getDb(), newId, formText, categoryName, imageUrl, 'admin')
          }
        } catch (err) {
          console.warn('Failed to send auto-notification:', err)
        }
      }
      setSheetOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Please try again.'
      toast.error('Could not save prompt', message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    const prompt = prompts.find((p) => p.id === id)
    if (prompt?.cloudinaryPublicId && CLOUD_NAME) {
      try {
        await fetch('/api/cloudinary/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: prompt.cloudinaryPublicId }),
        })
      } catch {
        console.warn('Failed to delete Cloudinary image')
      }
    }
    await deletePromptMutation.mutateAsync(id)
    toast.success('Prompt deleted', 'The prompt has been removed.')
    setDeleteConfirm(null)
  }

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? 'Unknown'

  const filteredPrompts = prompts.filter(
    (p) =>
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))
  )

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1"><div className="h-7 w-32 bg-muted animate-pulse rounded-lg" /><div className="h-4 w-48 bg-muted animate-pulse rounded-lg" /></div>
          <div className="h-9 w-28 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="relative max-w-sm h-11 bg-muted animate-pulse rounded-lg" />
        <TableSkeleton rows={5} cols={6} />
      </div>
    )
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      {/* Header */}
      <FadeIn className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Prompts</h1>
          <p className="text-sm text-muted-foreground">
            {prompts.length} prompts total, {prompts.filter((p) => p.isActive).length} active
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus size={16} className="mr-2" />
          Add Prompt
        </Button>
      </FadeIn>

      {/* Search */}
      <FadeIn delay={0.05}>
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
      </FadeIn>

      {/* Table */}
      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Engagement</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrompts.map((prompt, i) => (
                  <AnimatedTableRow key={prompt.id} index={i} className="group">
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {prompt.imageUrl && (
                          <div className="relative size-10 shrink-0 overflow-hidden rounded-lg">
                            <Image src={prompt.imageUrl} alt="" fill className="object-cover" sizes="40px" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[280px]">{prompt.text}</p>
                          <div className="flex gap-1 mt-1">
                            {prompt.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCategoryName(prompt.categoryId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Heart size={12} /> {prompt.likesCount}</span>
                        <span className="flex items-center gap-1"><Copy size={12} /> {prompt.copiesCount}</span>
                        <span className="flex items-center gap-1"><Share2 size={12} /> {prompt.shareCount ?? 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {prompt.isActive ? (
                          <Eye size={14} className="text-green-500" />
                        ) : (
                          <EyeOff size={14} className="text-muted-foreground" />
                        )}
                        {prompt.isPremium && (
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                        )}
                        {prompt.video && (
                          <Video
                            size={14}
                            className="text-primary"
                            aria-label={
                              prompt.video.type === 'youtube' ? 'YouTube video' : 'Uploaded video'
                            }
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(prompt)}>
                            <Pencil size={14} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(prompt.id)} className="text-destructive">
                            <Trash2 size={14} className="mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </AnimatedTableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open && saving) return; setSheetOpen(open) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto" showCloseButton={!saving}>
          <SheetHeader>
            <SheetTitle>{editingPrompt ? 'Edit Prompt' : 'Create Prompt'}</SheetTitle>
            <SheetDescription>
              {editingPrompt ? 'Update the prompt details below.' : 'Fill in the details to create a new prompt.'}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-4 py-4 px-4">
            <div className="flex flex-col gap-2">
              <Label>Image *</Label>
              <ImageUpload
                ref={imageUploadRef}
                currentImageUrl={editingPrompt?.imageUrl}
                currentPublicId={editingPrompt?.cloudinaryPublicId}
                onUploadComplete={(data) => { setFormImageUrl(data.imageUrl); setFormCloudinaryId(data.publicId) }}
                onRemove={() => { setFormImageUrl(''); setFormCloudinaryId('') }}
                onPendingChange={setHasPendingImage}
                onError={setUploadError}
                cloudName={CLOUD_NAME}
                uploadPreset={UPLOAD_PRESET}
              />
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Video (optional)</Label>
              <VideoUpload
                value={formVideo}
                onChange={setFormVideo}
                savedPublicId={editingPrompt?.video?.publicId ?? ''}
                cloudName={CLOUD_NAME}
                uploadPreset={UPLOAD_PRESET}
                disabled={saving}
                onError={setUploadError}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Prompt Text *</Label>
              <Textarea value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Enter the prompt text..." rows={4} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Category *</Label>
              <MultiSelect value={formCategoryIds} onValueChange={setFormCategoryIds}>
                <MultiSelectTrigger><MultiSelectValue placeholder="Select category" /></MultiSelectTrigger>
                <MultiSelectContent>
                  <MultiSelectList ariaLabel="Categories">
                    {categories.map((cat) => (
                      <MultiSelectItem key={cat.id} value={cat.id}>{cat.name}</MultiSelectItem>
                    ))}
                  </MultiSelectList>
                </MultiSelectContent>
              </MultiSelect>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Order</Label>
              <Input type="number" value={formOrder} onChange={(e) => setFormOrder(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tags (comma separated)</Label>
              <Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="marketing, copywriting, social media" />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={formIsPremium} onCheckedChange={setFormIsPremium} />
                <Label>Premium</Label>
              </div>
            </div>
          </div>

          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formText.trim() || (!formImageUrl && !hasPendingImage)}
            >
              {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {saving ? 'Saving...' : editingPrompt ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure? The associated image will also be removed from Cloudinary. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deletePromptMutation.isPending}>
              {deletePromptMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
