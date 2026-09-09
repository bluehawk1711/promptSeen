"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  query,
} from "firebase/firestore";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  GripVertical,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { Category, CategoryCreateInput } from "@repo/shared/types";

/**
 * Admin Categories management page — CRUD for category documents.
 */
export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formIcon, setFormIcon] = useState("");
  const [formColor, setFormColor] = useState("#007AFF");
  const [formOrder, setFormOrder] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "categories"), orderBy("order", "asc"))
      );
      setCategories(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
      );
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("");
    setFormIcon("📂");
    setFormColor("#007AFF");
    setFormOrder(String(categories.length));
    setFormIsActive(true);
    setDialogOpen(true);
  };

  const openEditDialog = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setFormOrder(String(cat.order));
    setFormIsActive(cat.isActive);
    setDialogOpen(true);
  };

  const handleSlugGenerate = (name: string) => {
    setFormSlug(
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = {
        name: formName,
        slug: formSlug,
        icon: formIcon,
        color: formColor,
        order: Number(formOrder),
        isActive: formIsActive,
      };

      if (editingCategory) {
        await updateDoc(doc(db, "categories", editingCategory.id), data);
      } else {
        await addDoc(collection(db, "categories"), {
          ...data,
          promptCount: 0,
          createdAt: Date.now(),
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "categories", id));
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">
            {categories.length} categories total
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus size={16} className="mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Color</TableHead>
                <TableHead className="text-center">Prompts</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat, i) => (
                <TableRow key={cat.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="font-medium">{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{cat.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm text-muted-foreground">{cat.color}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{cat.promptCount}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={cat.isActive ? "default" : "secondary"}>
                      {cat.isActive ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(cat)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(cat.id)}
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details."
                : "Add a new category for prompts."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Name *</Label>
              <Input
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  if (!editingCategory) handleSlugGenerate(e.target.value);
                }}
                placeholder="e.g., Marketing"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Slug *</Label>
              <Input
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                placeholder="e.g., marketing"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Icon (emoji)</Label>
                <Input
                  value={formIcon}
                  onChange={(e) => setFormIcon(e.target.value)}
                  placeholder="📂"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label>Active</Label>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-lg border p-3 flex items-center gap-3">
              <span className="text-2xl">{formIcon || "📂"}</span>
              <div>
                <p className="font-medium">{formName || "Category Name"}</p>
                <p className="text-sm text-muted-foreground">{formSlug || "slug"}</p>
              </div>
              <Badge
                className="ml-auto"
                style={{ backgroundColor: formColor + "20", color: formColor }}
              >
                0 prompts
              </Badge>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formName || !formSlug}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure? Prompts in this category will become uncategorized.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
