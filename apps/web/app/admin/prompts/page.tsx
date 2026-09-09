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
  Eye,
  EyeOff,
  Star,
  Search,
  Share2,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ImageUpload } from "@/components/image-upload";
import type { Prompt, Category } from "@repo/shared/types";

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "ml_default";

/**
 * Admin Prompts management page — CRUD for prompt documents
 * with integrated image upload pipeline.
 */
export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formText, setFormText] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formCloudinaryId, setFormCloudinaryId] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formOrder, setFormOrder] = useState("0");
  const [formTags, setFormTags] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPremium, setFormIsPremium] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [promptsSnap, categoriesSnap] = await Promise.all([
        getDocs(query(collection(db, "prompts"), orderBy("order", "asc"))),
        getDocs(query(collection(db, "categories"), orderBy("order", "asc"))),
      ]);

      setPrompts(
        promptsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Prompt))
      );
      setCategories(
        categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
      );
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setEditingPrompt(null);
    setFormText("");
    setFormImageUrl("");
    setFormCloudinaryId("");
    setFormCategoryId(categories[0]?.id ?? "");
    setFormOrder(String(prompts.length));
    setFormTags("");
    setFormIsActive(true);
    setFormIsPremium(false);
    setUploadError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormText(prompt.text);
    setFormImageUrl(prompt.imageUrl);
    setFormCloudinaryId(prompt.cloudinaryPublicId);
    setFormCategoryId(prompt.categoryId);
    setFormOrder(String(prompt.order));
    setFormTags(prompt.tags.join(", "));
    setFormIsActive(prompt.isActive);
    setFormIsPremium(prompt.isPremium);
    setUploadError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Omit<Prompt, "id" | "createdAt" | "updatedAt"> = {
        text: formText,
        imageUrl: formImageUrl,
        cloudinaryPublicId: formCloudinaryId,
        categoryId: formCategoryId,
        order: Number(formOrder),
        likesCount: editingPrompt?.likesCount ?? 0,
        copiesCount: editingPrompt?.copiesCount ?? 0,
        shareCount: editingPrompt?.shareCount ?? 0,
        tags: formTags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        isActive: formIsActive,
        isPremium: formIsPremium,
      };

      if (editingPrompt) {
        await updateDoc(doc(db, "prompts", editingPrompt.id), {
          ...data,
          updatedAt: Date.now(),
        });
      } else {
        await addDoc(collection(db, "prompts"), {
          ...data,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save prompt:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const prompt = prompts.find((p) => p.id === id);
      if (prompt?.cloudinaryPublicId && CLOUD_NAME) {
        try {
          await fetch(`/api/cloudinary/delete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ publicId: prompt.cloudinaryPublicId }),
          });
        } catch {
          console.warn("Failed to delete Cloudinary image:", prompt.cloudinaryPublicId);
        }
      }

      await deleteDoc(doc(db, "prompts", id));
      setDeleteConfirm(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
    }
  };

  const getCategoryName = (categoryId: string) =>
    categories.find((c) => c.id === categoryId)?.name ?? "Unknown";

  const filteredPrompts = prompts.filter(
    (p) =>
      p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((tag) => tag.includes(searchQuery.toLowerCase()))
  );

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
          <h1 className="text-3xl font-bold">Prompts</h1>
          <p className="text-muted-foreground mt-1">
            {prompts.length} prompts total, {prompts.filter((p) => p.isActive).length} active
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus size={16} className="mr-2" />
          Add Prompt
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Likes</TableHead>
                <TableHead className="text-center">Copies</TableHead>
                <TableHead className="text-center">Shares</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrompts.map((prompt, i) => (
                <TableRow key={prompt.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {prompt.imageUrl && (
                        <img
                          src={prompt.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate max-w-[280px]">
                          {prompt.text}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {prompt.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryName(prompt.categoryId)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {prompt.likesCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {prompt.copiesCount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground">
                      <Share2 size={12} />
                      {(prompt.shareCount ?? 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {prompt.isActive ? (
                        <Eye size={14} className="text-green-500" />
                      ) : (
                        <EyeOff size={14} className="text-muted-foreground" />
                      )}
                      {prompt.isPremium && (
                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(prompt)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(prompt.id)}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPrompt ? "Edit Prompt" : "Create Prompt"}
            </DialogTitle>
            <DialogDescription>
              {editingPrompt
                ? "Update the prompt details below."
                : "Fill in the details to create a new prompt."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Image Upload */}
            <div className="flex flex-col gap-2">
              <Label>Image *</Label>
              <ImageUpload
                currentImageUrl={editingPrompt?.imageUrl}
                currentPublicId={editingPrompt?.cloudinaryPublicId}
                onUploadComplete={(data) => {
                  setFormImageUrl(data.imageUrl);
                  setFormCloudinaryId(data.publicId);
                  setUploadError(null);
                }}
                onRemove={() => {
                  setFormImageUrl("");
                  setFormCloudinaryId("");
                }}
                onError={setUploadError}
                cloudName={CLOUD_NAME}
                uploadPreset={UPLOAD_PRESET}
              />
              {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
              )}
              {!CLOUD_NAME && (
                <p className="text-xs text-muted-foreground">
                  Set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in your .env to enable image uploads
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Prompt Text *</Label>
              <Textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Enter the prompt text..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category *</Label>
                <Select value={formCategoryId} onValueChange={(v) => setFormCategoryId(v ?? '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formOrder}
                  onChange={(e) => setFormOrder(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tags (comma separated)</Label>
              <Input
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                placeholder="marketing, copywriting, social media"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formIsActive}
                  onCheckedChange={setFormIsActive}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formIsPremium}
                  onCheckedChange={setFormIsPremium}
                />
                <Label>Premium (requires ad)</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !formText || !formImageUrl}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editingPrompt ? "Save Changes" : "Create Prompt"}
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
            <DialogTitle>Delete Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this prompt? The associated image will
              also be removed from Cloudinary. This action cannot be undone.
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
