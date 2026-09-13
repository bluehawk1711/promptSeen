'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, MoreHorizontal, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { TableSkeleton } from '@/components/bionis/skeletons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAdminCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/lib/admin-queries'
import { useToast } from '@/lib/use-toast'
import type { Category } from '@repo/shared/types'
import {
  PageTransition,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  AnimatedTableRow,
} from '@/components/motion/motion-components'

export default function CategoriesPage() {
  const { data: categories = [], isLoading: loading } = useAdminCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const toast = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  const openCreate = () => {
    setEditingCategory(null)
    setFormName('')
    setFormSlug('')
    setFormIsActive(true)
    setSheetOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormName(cat.name)
    setFormSlug(cat.slug)
    setFormIsActive(cat.isActive)
    setSheetOpen(true)
  }

  const handleSlugGenerate = (name: string) => {
    setFormSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
  }

  const handleSave = async () => {
    const data = { name: formName, slug: formSlug, icon: '📁', color: '#F26522', order: editingCategory?.order ?? categories.length, isActive: formIsActive }
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, data })
      toast.success('Category updated', 'The category has been saved.')
    } else {
      await createCategory.mutateAsync(data)
      toast.success('Category created', 'The new category has been added.')
    }
    setSheetOpen(false)
  }

  const handleDelete = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id)
    toast.success('Category deleted', 'The category has been removed.')
    setDeleteConfirm(null)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1"><div className="h-7 w-40 bg-muted animate-pulse rounded-lg" /><div className="h-4 w-32 bg-muted animate-pulse rounded-lg" /></div>
          <div className="h-9 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <TableSkeleton rows={5} cols={6} />
      </div>
    )
  }

  return (
    <PageTransition className="flex flex-col gap-6">
      <FadeIn className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-medium md:text-2xl">Categories</h1>
          <p className="text-sm text-muted-foreground">{categories.length} categories total</p>
        </div>
        <Button onClick={openCreate} className="shrink-0">
          <Plus size={16} className="mr-2" /> Add Category
        </Button>
      </FadeIn>

      <FadeIn delay={0.1}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Prompts</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((cat, i) => (
                  <AnimatedTableRow key={cat.id} index={i} className="group">
                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
                          <FolderOpen size={14} className="text-primary" />
                        </div>
                        <span className="font-medium">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{cat.slug}</Badge></TableCell>
                    <TableCell className="text-center">{cat.promptCount}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={cat.isActive ? 'default' : 'secondary'}>
                        {cat.isActive ? 'Active' : 'Hidden'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" />}>
                          <MoreHorizontal size={16} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(cat)}>
                            <Pencil size={14} className="mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirm(cat.id)} className="text-destructive">
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

      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open && (createCategory.isPending || updateCategory.isPending)) return; setSheetOpen(open) }}>
        <SheetContent showCloseButton={!(createCategory.isPending || updateCategory.isPending)}>
          <SheetHeader>
            <SheetTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</SheetTitle>
            <SheetDescription>{editingCategory ? 'Update the category details.' : 'Add a new category for prompts.'}</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-4 py-4 px-4">
            <div className="flex flex-col gap-2">
              <Label>Name *</Label>
              <Input value={formName} onChange={(e) => { setFormName(e.target.value); if (!editingCategory) handleSlugGenerate(e.target.value) }} placeholder="e.g., Marketing" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Slug</Label>
              <Input value={formSlug} onChange={(e) => setFormSlug(e.target.value)} placeholder="auto-generated-from-name" disabled={!!editingCategory} />
              <p className="text-xs text-muted-foreground">{editingCategory ? 'Slug cannot be changed after creation.' : 'Auto-generated from the name.'}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
              <Label>Active</Label>
            </div>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={createCategory.isPending || updateCategory.isPending || !formName || !formSlug}>
              {(createCategory.isPending || updateCategory.isPending) && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>Are you sure? Prompts in this category will become uncategorized.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteCategoryMutation.isPending}>
              {deleteCategoryMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageTransition>
  )
}
