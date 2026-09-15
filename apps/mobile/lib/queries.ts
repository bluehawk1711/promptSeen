/**
 * Firestore Query Hooks — React Query wrappers for Firestore data.
 *
 * These hooks combine Firestore's realtime capabilities with React Query's
 * caching layer. The flow:
 *
 * 1. Firestore realtime listener (onSnapshot) keeps the Zustand store updated
 * 2. React Query hooks read from the store and cache with staleTime of 2.5 min
 * 3. When admin makes changes, Firestore triggers realtime update
 * 4. Realtime listener updates Zustand store
 * 5. We invalidate React Query cache so components re-render with fresh data
 *
 * This eliminates redundant Firestore reads while keeping data fresh.
 */

import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  getDocs,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePromptsStore } from '@/store/prompts';
import { useCategoriesStore } from '@/store/categories';
import { useCollectionsStore } from '@/store/collections';
import { useSubmissionsStore } from '@/store/submissions';
import type { Prompt, Category, Collection, PromptSubmission } from '@repo/shared/types';
import { getDailyPrompt } from '@repo/shared/daily-prompt';
import { getTrendingPrompts, getTrendingScore } from '@repo/shared/trending';

// ─── Query Keys ─────────────────────────────────────────────────────────────

export const queryKeys = {
  prompts: ['prompts'] as const,
  promptDetail: (id: string) => ['prompts', id] as const,
  relatedPrompts: (categoryId: string, excludeId: string) =>
    ['prompts', 'related', categoryId, excludeId] as const,
  categories: ['categories'] as const,
  dailyPrompt: ['prompts', 'daily'] as const,
  trending: ['prompts', 'trending'] as const,
  favorites: (likedIds: string[]) => ['prompts', 'favorites', likedIds.sort().join(',')] as const,
  collections: (userId: string) => ['collections', userId] as const,
  publicCollections: ['collections', 'public'] as const,
  submissions: (userId: string) => ['submissions', userId] as const,
  submissionStats: (userId: string) => ['submissions', 'stats', userId] as const,
} as const;

// ─── Invalidation Helper ────────────────────────────────────────────────────

/**
 * Call this when the admin panel makes a change.
 * Invalidates all related query caches so UI updates immediately.
 *
 * Usage from Firestore listener:
 *   onSnapshot(q, (snap) => {
 *     usePromptsStore.setState({ prompts: ... });
 *     invalidatePromptQueries();
 *   });
 */
export function invalidatePromptQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.prompts });
  queryClient.invalidateQueries({ queryKey: queryKeys.dailyPrompt });
  queryClient.invalidateQueries({ queryKey: queryKeys.trending });
}

export function invalidateCategoryQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.categories });
}

export function invalidateCollectionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['collections'] });
}

export function invalidateSubmissionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['submissions'] });
}

// ─── Prompts Hooks ──────────────────────────────────────────────────────────

/**
 * Get all active prompts from the Zustand store (realtime-synced).
 * React Query provides caching layer on top.
 */
export function usePromptsQuery() {
  const prompts = usePromptsStore((s) => s.prompts);
  const loading = usePromptsStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.prompts,
    queryFn: () => prompts,
    enabled: !loading,
    staleTime: 2.5 * 60 * 1000,
  });
}

/**
 * Get a single prompt by ID.
 */
export function usePromptQuery(id: string) {
  const prompts = usePromptsStore((s) => s.prompts);
  const loading = usePromptsStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.promptDetail(id),
    queryFn: () => prompts.find((p) => p.id === id),
    enabled: !loading && !!id,
    staleTime: 2.5 * 60 * 1000,
  });
}

/**
 * Get related prompts for a category with pagination (infinite scroll).
 * Fetches 10 items initially, then 10 more on each page.
 *
 * This replaces the old `.slice(0, 6)` in the prompt detail screen.
 */
export function useRelatedPromptsQuery(categoryId: string, excludeId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.relatedPrompts(categoryId, excludeId),
    queryFn: async ({ pageParam }) => {
      const PAGE_SIZE = 10;

      let q;
      if (pageParam) {
        q = query(
          collection(db, 'prompts'),
          where('categoryIds', 'array-contains', categoryId),
          where('isActive', '==', true),
          orderBy('order', 'asc'),
          startAfter(pageParam),
          firestoreLimit(PAGE_SIZE)
        );
      } else {
        q = query(
          collection(db, 'prompts'),
          where('categoryIds', 'array-contains', categoryId),
          where('isActive', '==', true),
          orderBy('order', 'asc'),
          firestoreLimit(PAGE_SIZE)
        );
      }

      const snapshot = await getDocs(q);
      const prompts: Prompt[] = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() } as Prompt))
        .filter((p) => p.id !== excludeId);

      const lastDoc = snapshot.docs[snapshot.docs.length - 1];

      return {
        prompts,
        nextPageParam: snapshot.docs.length === PAGE_SIZE ? lastDoc : undefined,
        hasMore: snapshot.docs.length === PAGE_SIZE,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageParam,
    initialPageParam: undefined as DocumentSnapshot | undefined,
    staleTime: 2.5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Get today's daily prompt from the store.
 */
export function useDailyPromptQuery() {
  const prompts = usePromptsStore((s) => s.prompts);
  const loading = usePromptsStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.dailyPrompt,
    queryFn: () => {
      const active = prompts.filter((p) => p.isActive);
      return getDailyPrompt(active);
    },
    enabled: !loading,
    staleTime: 2.5 * 60 * 1000,
  });
}

/**
 * Get trending prompts from the store.
 */
export function useTrendingQuery(count = 10) {
  const prompts = usePromptsStore((s) => s.prompts);
  const loading = usePromptsStore((s) => s.loading);
  const dailyPrompt = useDailyPromptQuery();

  return useQuery({
    queryKey: queryKeys.trending,
    queryFn: () => {
      const excludeIds = dailyPrompt.data?.id ? [dailyPrompt.data.id] : [];
      const eligible = prompts.filter(
        (p) => p.isActive && !excludeIds.includes(p.id)
      );
      return getTrendingPrompts(eligible, count).map((p) => ({
        prompt: p,
        score: getTrendingScore(p),
      }));
    },
    enabled: !loading && !dailyPrompt.isLoading,
    staleTime: 2.5 * 60 * 1000,
  });
}

// ─── Categories Hooks ───────────────────────────────────────────────────────

/**
 * Get all active categories from the Zustand store.
 */
export function useCategoriesQuery() {
  const categories = useCategoriesStore((s) => s.categories);
  const loading = useCategoriesStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categories.filter((c) => c.isActive),
    enabled: !loading,
    staleTime: 2.5 * 60 * 1000,
  });
}

// ─── Collections Hooks ──────────────────────────────────────────────────────

/**
 * Get user's collections from the store.
 */
export function useCollectionsQuery(userId: string) {
  const collections = useCollectionsStore((s) => s.collections);
  const loading = useCollectionsStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.collections(userId),
    queryFn: () => collections,
    enabled: !loading && !!userId,
    staleTime: 2.5 * 60 * 1000,
  });
}

// ─── Submissions Hooks ──────────────────────────────────────────────────────

/**
 * Get user's submissions from the store.
 */
export function useSubmissionsQuery(userId: string) {
  const mySubmissions = useSubmissionsStore((s) => s.mySubmissions);
  const loading = useSubmissionsStore((s) => s.loading);

  return useQuery({
    queryKey: queryKeys.submissions(userId),
    queryFn: () => mySubmissions,
    enabled: !loading && !!userId,
    staleTime: 2.5 * 60 * 1000,
  });
}

/**
 * Get submission stats for the current user.
 */
export function useSubmissionStatsQuery(userId: string) {
  const mySubmissions = useSubmissionsStore((s) => s.mySubmissions);
  const loading = useSubmissionsStore((s) => s.loading);
  const getMyStats = useSubmissionsStore((s) => s.getMyStats);

  return useQuery({
    queryKey: queryKeys.submissionStats(userId),
    queryFn: getMyStats,
    enabled: !loading && !!userId,
    staleTime: 2.5 * 60 * 1000,
  });
}
