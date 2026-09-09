/**
 * Prompts store — Firestore realtime sync for prompts.
 *
 * Subscribes to the `prompts` collection and keeps the local state in sync.
 */

import { create } from 'zustand';
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

interface PromptsState {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  /** Filter by category slug. */
  categoryFilter: string | null;
  setCategoryFilter: (slug: string | null) => void;
  /** Get prompts for a specific category. */
  getPromptsByCategory: (categoryId: string) => Prompt[];
  /** Get a single prompt by ID. */
  getPromptById: (id: string) => Prompt | undefined;
  /** Get today's daily prompt. */
  getDailyPrompt: () => Prompt | null;
  /** Increment the local like count (optimistic). */
  incrementLikes: (promptId: string) => void;
  /** Increment the local copy count (optimistic). */
  incrementCopies: (promptId: string) => void;
  /** Increment the local share count (optimistic). */
  incrementShares: (promptId: string) => void;
}

let unsubscribe: Unsubscribe | null = null;

export const usePromptsStore = create<PromptsState>((set, get) => ({
  prompts: [],
  loading: true,
  error: null,
  connected: false,
  categoryFilter: null,

  setCategoryFilter: (slug) => set({ categoryFilter: slug }),

  getPromptsByCategory: (categoryId) =>
    get().prompts.filter(
      (p) => p.categoryId === categoryId && p.isActive
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
}));

/**
 * Subscribe to active prompts from Firestore.
 * Call this at app root and clean up on unmount.
 */
export function subscribeToPrompts(): Unsubscribe {
  unsubscribe?.();

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
      });
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
