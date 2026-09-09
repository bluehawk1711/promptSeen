/**
 * Admin Panel Query Hooks — React Query wrappers for Firestore data.
 *
 * These hooks provide caching and automatic invalidation after CRUD operations.
 * The admin panel uses one-shot Firestore reads (getDocs) instead of realtime
 * listeners, so React Query is the primary data layer.
 *
 * Cache strategy:
 * - staleTime: 2.5 minutes — data is fresh for 2.5 minutes
 * - After any mutation (create/update/delete), invalidate related queries
 * - This triggers a refetch which gets the latest data from Firestore
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Prompt, Category, UserProfile, PromptSubmission } from '@repo/shared/types';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const adminQueryKeys = {
  prompts: ['admin', 'prompts'] as const,
  categories: ['admin', 'categories'] as const,
  users: ['admin', 'users'] as const,
  submissions: ['admin', 'submissions'] as const,
  stats: ['admin', 'stats'] as const,
  notifications: ['admin', 'notifications'] as const,
} as const;

// ─── Prompts Hooks ──────────────────────────────────────────────────────────

export function useAdminPrompts() {
  return useQuery({
    queryKey: adminQueryKeys.prompts,
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'prompts'), orderBy('order', 'asc'))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Prompt));
    },
    staleTime: 2.5 * 60 * 1000,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
      const docRef = await addDoc(collection(db, 'prompts'), {
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.prompts });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
      // Also invalidate mobile app queries via Firestore realtime
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Prompt> }) => {
      await updateDoc(doc(db, 'prompts', id), {
        ...data,
        updatedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.prompts });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'prompts', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.prompts });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

// ─── Categories Hooks ───────────────────────────────────────────────────────

export function useAdminCategories() {
  return useQuery({
    queryKey: adminQueryKeys.categories,
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'categories'), orderBy('order', 'asc'))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
    },
    staleTime: 2.5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Category, 'id' | 'promptCount' | 'createdAt'>) => {
      const docRef = await addDoc(collection(db, 'categories'), {
        ...data,
        createdAt: Date.now(),
      });
      return docRef.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
      await updateDoc(doc(db, 'categories', id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, 'categories', id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.categories });
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.stats });
    },
  });
}

// ─── Users Hooks ────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: adminQueryKeys.users,
    queryFn: async () => {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
    },
    staleTime: 2.5 * 60 * 1000,
  });
}

// ─── Submissions Hooks ──────────────────────────────────────────────────────

export function useAdminSubmissions() {
  return useQuery({
    queryKey: adminQueryKeys.submissions,
    queryFn: async () => {
      const snap = await getDocs(
        query(collection(db, 'submissions'), orderBy('createdAt', 'desc'))
      );
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromptSubmission));
    },
    staleTime: 2.5 * 60 * 1000,
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNote,
      reviewedBy,
    }: {
      id: string;
      status: 'approved' | 'rejected';
      reviewNote: string;
      reviewedBy: string;
    }) => {
      await updateDoc(doc(db, 'submissions', id), {
        status,
        reviewNote,
        reviewedBy,
        reviewedAt: Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminQueryKeys.submissions });
    },
  });
}

// ─── Stats Hook ─────────────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: adminQueryKeys.stats,
    queryFn: async () => {
      const [promptsSnap, categoriesSnap, usersSnap, submissionsSnap] =
        await Promise.all([
          getDocs(collection(db, 'prompts')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'submissions')),
        ]);

      const prompts = promptsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Prompt)
      );
      const submissions = submissionsSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PromptSubmission)
      );

      return {
        totalPrompts: prompts.length,
        activePrompts: prompts.filter((p) => p.isActive).length,
        premiumPrompts: prompts.filter((p) => p.isPremium).length,
        totalCategories: categoriesSnap.size,
        totalUsers: usersSnap.size,
        totalLikes: prompts.reduce((sum, p) => sum + (p.likesCount ?? 0), 0),
        totalCopies: prompts.reduce((sum, p) => sum + (p.copiesCount ?? 0), 0),
        totalShares: prompts.reduce((sum, p) => sum + (p.shareCount ?? 0), 0),
        pendingSubmissions: submissions.filter((s) => s.status === 'pending').length,
        totalSubmissions: submissions.length,
      };
    },
    staleTime: 2.5 * 60 * 1000,
  });
}
