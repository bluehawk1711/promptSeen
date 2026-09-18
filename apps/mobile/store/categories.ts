/**
 * Categories store — cached with strict rate limiting.
 *
 * Same strategy as prompts: 24h cache TTL, 1h API cooldown.
 * Categories change rarely, so this is especially effective.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Category } from '@repo/shared/types';
import { messageFor } from '@repo/shared/errors';
import { getQueryClient } from '@/providers/query-provider';
import { queryKeys } from '@/lib/query-keys';
import { fetchCategoriesFromApi } from '@/lib/api-client';

/** Cache is fresh for 24 hours. */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** API fetch cooldown — at most once per hour. */
const API_COOLDOWN_MS = 60 * 60 * 1000;

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  lastSyncedAt: number;
  lastApiFetchAt: number;
  getCategoryBySlug: (slug: string) => Category | undefined;
  getCategoryById: (id: string) => Category | undefined;
}

let unsubscribe: Unsubscribe | null = null;

export const useCategoriesStore = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: [],
      loading: true,
      error: null,
      lastSyncedAt: 0,
      lastApiFetchAt: 0,

      getCategoryBySlug: (slug) =>
        get().categories.find((c) => c.slug === slug && c.isActive),

      getCategoryById: (id) =>
        get().categories.find((c) => c.id === id),
    }),
    {
      name: 'promptgallery-categories',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        categories: state.categories,
        lastSyncedAt: state.lastSyncedAt,
        lastApiFetchAt: state.lastApiFetchAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.categories && state.categories.length > 0) {
          state.loading = false;
        }
      },
    }
  )
);

function isCacheFresh(): boolean {
  const { categories, lastSyncedAt } = useCategoriesStore.getState();
  if (categories.length === 0 || lastSyncedAt === 0) return false;
  return Date.now() - lastSyncedAt < CACHE_TTL_MS;
}

function canFetchFromApi(): boolean {
  const { lastApiFetchAt } = useCategoriesStore.getState();
  return Date.now() - lastApiFetchAt >= API_COOLDOWN_MS;
}

/**
 * Subscribe to categories from Firestore.
 * Rate-limited: at most 1 API call per hour, no Firestore if cache < 24h.
 */
export function subscribeToCategories(): Unsubscribe {
  unsubscribe?.();

  const state = useCategoriesStore.getState();
  const hasCache = state.categories.length > 0;
  const cacheIsFresh = isCacheFresh();

  if (hasCache) {
    useCategoriesStore.setState({ loading: false });
  }

  // Cache is fresh — skip everything
  if (hasCache && cacheIsFresh) {
    return () => {};
  }

  // Cache stale but API fetched < 1h ago — skip
  if (hasCache && !cacheIsFresh && !canFetchFromApi()) {
    return () => {};
  }

  // Cache stale and cooldown passed — fetch from Redis API
  if (hasCache && !cacheIsFresh && canFetchFromApi()) {
    useCategoriesStore.setState({ lastApiFetchAt: Date.now() });
    fetchCategoriesFromApi().then((categories) => {
      if (categories && categories.length > 0) {
        useCategoriesStore.setState({ categories, lastSyncedAt: Date.now() });
        try {
          const qc = getQueryClient();
          qc.invalidateQueries({ queryKey: queryKeys.categories });
        } catch {}
      }
    });
  }

  // No cache — subscribe to Firestore
  if (!db) return () => {};

  const q = query(
    collection(db, 'categories'),
    orderBy('order', 'asc')
  );

  unsubscribe = onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const categories: Category[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Category[];

      useCategoriesStore.setState({
        categories,
        loading: false,
        lastSyncedAt: Date.now(),
      });

      try {
        const qc = getQueryClient();
        qc.invalidateQueries({ queryKey: queryKeys.categories });
      } catch {}
    },
    (error) => {
      useCategoriesStore.setState({
        error: messageFor(error),
        loading: false,
      });
    }
  );

  return unsubscribe;
}

export function unsubscribeFromCategories(): void {
  unsubscribe?.();
  unsubscribe = null;
}
