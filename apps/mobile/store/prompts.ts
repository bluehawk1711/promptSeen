/**
 * Prompts store — 3-layer cache with strict rate limiting.
 *
 * Cache layers (fastest → slowest):
 * 1. AsyncStorage (local, 0ms) — persists across app restarts, 24h TTL
 * 2. Upstash Redis API (~1-5ms) — via admin panel /api/prompts
 * 3. Firestore realtime (50-200ms) — only when cache is stale
 *
 * Rate limits:
 * - Firestore listener: only when cache > 24h old
 * - Redis API fetch: at most once per hour (even if cache is > 24h old)
 * - No reads at all if cache is fresh (< 24h)
 *
 * Opening the app 50 times in a day = maybe 1-2 API calls total.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  limit as firestoreLimit,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Prompt } from '@repo/shared/types';
import { messageFor } from '@repo/shared/errors';
import { getDailyPrompt } from '@repo/shared/daily-prompt';
import { getQueryClient } from '@/providers/query-provider';
import { queryKeys } from '@/lib/query-keys';
import { fetchPromptsFromApi } from '@/lib/api-client';

/** Cache is fresh for 24 hours. No Firestore reads during this time. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** API fetch cooldown — at most once per hour. */
const API_COOLDOWN_MS = 60 * 60 * 1000;

interface PromptsState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastSyncedAt: number;
  /** Timestamp of the last Redis API fetch. Rate-limits API calls. */
  lastApiFetchAt: number;
  isFirstLoad: boolean;
  categoryFilter: string | null;
  setCategoryFilter: (slug: string | null) => void;
  getPromptsByCategory: (categoryId: string) => Prompt[];
  getPromptById: (id: string) => Prompt | undefined;
  getDailyPrompt: () => Prompt | null;
  incrementLikes: (promptId: string) => void;
  decrementLikes: (promptId: string) => void;
  incrementCopies: (promptId: string) => void;
  incrementShares: (promptId: string) => void;
}

let unsubscribe: Unsubscribe | null = null;

export const usePromptsStore = create<PromptsState>()(
  persist(
    (set, get) => ({
      prompts: [],
      loading: true,
      error: null,
      connected: false,
      lastSyncedAt: 0,
      lastApiFetchAt: 0,
      isFirstLoad: true,
      categoryFilter: null,

      setCategoryFilter: (slug) => set({ categoryFilter: slug }),

      getPromptsByCategory: (categoryId) =>
        get().prompts.filter(
          (p) => p.categoryIds?.includes(categoryId) && p.isActive
        ),

      getPromptById: (id) =>
        get().prompts.find((p) => p.id === id),

      getDailyPrompt: () =>
        getDailyPrompt(get().prompts.filter((p) => p.isActive)),

      incrementLikes: (promptId) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, likesCount: p.likesCount + 1 } : p
          ),
        })),

      decrementLikes: (promptId) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, likesCount: Math.max(0, p.likesCount - 1) } : p
          ),
        })),

      incrementCopies: (promptId) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, copiesCount: p.copiesCount + 1 } : p
          ),
        })),

      incrementShares: (promptId) =>
        set((state) => ({
          prompts: state.prompts.map((p) =>
            p.id === promptId ? { ...p, shareCount: (p.shareCount ?? 0) + 1 } : p
          ),
        })),
    }),
    {
      name: 'promptgallery-prompts',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        prompts: state.prompts,
        lastSyncedAt: state.lastSyncedAt,
        lastApiFetchAt: state.lastApiFetchAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.prompts && state.prompts.length > 0) {
          state.loading = false;
          state.isFirstLoad = false;
        }
      },
    }
  )
);

function isCacheFresh(): boolean {
  const { prompts, lastSyncedAt } = usePromptsStore.getState();
  if (prompts.length === 0 || lastSyncedAt === 0) return false;
  return Date.now() - lastSyncedAt < CACHE_TTL_MS;
}

function canFetchFromApi(): boolean {
  const { lastApiFetchAt } = usePromptsStore.getState();
  return Date.now() - lastApiFetchAt >= API_COOLDOWN_MS;
}

/**
 * Subscribe to active prompts from Firestore.
 *
 * Rate-limited behavior:
 * - Cache < 24h → NO-OP. Zero reads.
 * - Cache > 24h + API fetched < 1h ago → NO-OP. Skip redundant fetch.
 * - Cache > 24h + API fetched > 1h ago → Fetch from Redis API, subscribe Firestore.
 * - No cache → Subscribe to Firestore (first launch).
 */
export function subscribeToPrompts(): Unsubscribe {
  unsubscribe?.();

  const state = usePromptsStore.getState();
  const hasCache = state.prompts.length > 0;
  const cacheIsFresh = isCacheFresh();

  // Show cached data immediately
  if (hasCache) {
    usePromptsStore.setState({ loading: false, isFirstLoad: false });
  }

  // Cache is fresh — skip everything
  if (hasCache && cacheIsFresh) {
    return () => {};
  }

  // Cache is stale but API was fetched < 1h ago — skip redundant fetch
  if (hasCache && !cacheIsFresh && !canFetchFromApi()) {
    return () => {};
  }

  // Cache is stale and API cooldown has passed — fetch from Redis API
  if (hasCache && !cacheIsFresh && canFetchFromApi()) {
    usePromptsStore.setState({ lastApiFetchAt: Date.now() });
    fetchPromptsFromApi().then((prompts) => {
      if (prompts && prompts.length > 0) {
        usePromptsStore.setState({ prompts, lastSyncedAt: Date.now() });
        try {
          const qc = getQueryClient();
          qc.invalidateQueries({ queryKey: queryKeys.prompts });
          qc.invalidateQueries({ queryKey: queryKeys.dailyPrompt });
          qc.invalidateQueries({ queryKey: queryKeys.trending });
        } catch {}
      }
    });
  }

  // No cache — subscribe to Firestore (first launch only)
  if (!db) return () => {};

  const q = query(
    collection(db, 'prompts'),
    where('isActive', '==', true),
    orderBy('order', 'asc'),
    firestoreLimit(200)
  );

  unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const prompts: Prompt[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Prompt[];

      usePromptsStore.setState({
        prompts,
        loading: false,
        connected: !snapshot.metadata.fromCache,
        lastSyncedAt: Date.now(),
        isFirstLoad: false,
      });

      try {
        const qc = getQueryClient();
        qc.invalidateQueries({ queryKey: queryKeys.prompts });
        qc.invalidateQueries({ queryKey: queryKeys.dailyPrompt });
        qc.invalidateQueries({ queryKey: queryKeys.trending });
      } catch {}
    },
    (error) => {
      usePromptsStore.setState({
        error: messageFor(error),
        loading: false,
        connected: false,
      });
    }
  );

  return unsubscribe;
}

export function unsubscribeFromPrompts(): void {
  unsubscribe?.();
  unsubscribe = null;
}
