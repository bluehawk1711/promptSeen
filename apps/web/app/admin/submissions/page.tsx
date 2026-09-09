"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  addDoc,
  doc,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import type { PromptSubmission, Category } from "@repo/shared/types";

const STATUS_CONFIG = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  approved: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
} as const;

/**
 * Admin Submissions page — review and approve/reject user-submitted prompts.
 */
export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<PromptSubmission[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [reviewDialog, setReviewDialog] = useState<PromptSubmission | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [subSnap, catSnap] = await Promise.all([
        getDocs(query(collection(db, "submissions"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "categories"), orderBy("order", "asc"))),
      ]);

      setSubmissions(
        subSnap.docs.map((d) => ({ id: d.id, ...d.data() } as PromptSubmission))
      );
      setCategories(
        catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
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

  const openReview = (submission: PromptSubmission) => {
    setReviewDialog(submission);
    setReviewNote("");
    setCategoryId(submission.suggestedCategoryId || categories[0]?.id || "");
  };

  const handleApprove = async () => {
    if (!reviewDialog) return;
    setReviewing(true);

    try {
      // Create the actual prompt
      const promptRef = await addDoc(collection(db, "prompts"), {
        text: reviewDialog.text,
        imageUrl: reviewDialog.imageUrl || "",
        cloudinaryPublicId: "",
        categoryId,
        order: 999,
        likesCount: 0,
        copiesCount: 0,
        shareCount: 0,
        tags: reviewDialog.tags,
        isActive: true,
        isPremium: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update submission status
      await updateDoc(doc(db, "submissions", reviewDialog.id), {
        status: "approved",
        reviewNote,
        reviewedBy: "admin",
        reviewedAt: Date.now(),
        approvedPromptId: promptRef.id,
      });

      setReviewDialog(null);
      fetchData();
    } catch (error) {
      console.error("Failed to approve:", error);
    } finally {
      setReviewing(false);
    }
  };

  const handleReject = async () => {
    if (!reviewDialog) return;
    setReviewing(true);

    try {
      await updateDoc(doc(db, "submissions", reviewDialog.id), {
        status: "rejected",
        reviewNote,
        reviewedBy: "admin",
        reviewedAt: Date.now(),
      });

      setReviewDialog(null);
      fetchData();
    } catch (error) {
      console.error("Failed to reject:", error);
    } finally {
      setReviewing(false);
    }
  };

  const filteredSubmissions =
    filter === "all"
      ? submissions
      : submissions.filter((s) => s.status === filter);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Submissions</h1>
        <p className="text-muted-foreground mt-1">
          {pendingCount} pending review, {submissions.length} total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["pending", "all", "approved", "rejected"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && pendingCount > 0 && (
              <Badge className="ml-2" variant="secondary">
                {pendingCount}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submitter</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No {filter === "all" ? "" : filter} submissions found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => {
                  const config = STATUS_CONFIG[sub.status];
                  const StatusIcon = config.icon;
                  return (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{sub.submitterName}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {sub.submitterUid.slice(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm truncate max-w-[300px]">{sub.text}</p>
                        {sub.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {sub.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categories.find((c) => c.id === sub.suggestedCategoryId)?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${config.color}`}>
                          <StatusIcon size={14} />
                          <span className="text-sm capitalize">{sub.status}</span>
                        </div>
                        {sub.reviewNote && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                            {sub.reviewNote}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {sub.createdAt
                          ? new Date(sub.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {sub.status === "pending" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openReview(sub)}
                          >
                            <MessageSquare size={14} className="mr-1" />
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog !== null} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
            <DialogDescription>
              Review this prompt submission and approve or reject it.
            </DialogDescription>
          </DialogHeader>

          {reviewDialog && (
            <div className="flex flex-col gap-4 py-4">
              {/* Preview */}
              <div className="rounded-lg border p-4 bg-muted/50">
                <p className="text-sm font-medium">{reviewDialog.text}</p>
                {reviewDialog.imageUrl && (
                  <img
                    src={reviewDialog.imageUrl}
                    alt="Preview"
                    className="mt-2 h-20 w-20 rounded object-cover"
                  />
                )}
              </div>

              {/* Submitter info */}
              <div className="text-sm text-muted-foreground">
                Submitted by <span className="font-medium text-foreground">{reviewDialog.submitterName}</span>
              </div>

              {/* Category selection */}
              <div className="flex flex-col gap-2">
                <Label>Assign Category</Label>
                <Input
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder="Category ID"
                />
              </div>

              {/* Review note */}
              <div className="flex flex-col gap-2">
                <Label>Review Note (optional)</Label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note for the submitter..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleReject()}
                  disabled={reviewing}
                >
                  <XCircle size={14} className="mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove()}
                  disabled={reviewing || !categoryId}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle size={14} className="mr-1" />
                  Approve & Publish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
