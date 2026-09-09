/**
 * Categories store — Firestore realtime sync for prompt categories.
 */

import { create } from 'zustand';
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

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  /** Get a category by slug. */
  getCategoryBySlug: (slug: string) => Category | undefined;
  /** Get a category by ID. */
  getCategoryById: (id: string) => Category | undefined;
}

let unsubscribe: Unsubscribe | null = null;

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  loading: true,
  error: null,

  getCategoryBySlug: (slug) =>
    get().categories.find((c) => c.slug === slug && c.isActive),

  getCategoryById: (id) =>
    get().categories.find((c) => c.id === id),
}));

export function subscribeToCategories(): Unsubscribe {
  unsubscribe?.();

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
      });
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
