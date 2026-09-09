/**
 * Collections store — user-created prompt collections.
 *
 * Collections are stored in Firestore under `collections/{id}`.
 * Each collection belongs to a user and contains an ordered list of prompt IDs.
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  arrayRemove,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Collection } from '@repo/shared/types';
import { messageFor } from '@repo/shared/errors';

interface CollectionsState {
  /** All collections owned by the current user. */
  collections: Collection[];
  /** All public collections (for discovery). */
  publicCollections: Collection[];
  loading: boolean;
  error: string | null;

  /** Create a new collection. */
  createCollection: (data: Omit<Collection, 'id' | 'promptCount' | 'likesCount' | 'duplicatesCount' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  /** Delete a collection. */
  deleteCollection: (collectionId: string) => Promise<void>;
  /** Add a prompt to a collection. */
  addPromptToCollection: (collectionId: string, promptId: string) => Promise<void>;
  /** Remove a prompt from a collection. */
  removePromptFromCollection: (collectionId: string, promptId: string) => Promise<void>;
  /** Check if a prompt is in a collection. */
  isPromptInCollection: (collectionId: string, promptId: string) => boolean;
  /** Get collections containing a specific prompt. */
  getCollectionsForPrompt: (promptId: string) => Collection[];
}

let unsubUser: Unsubscribe | null = null;
let unsubPublic: Unsubscribe | null = null;

export const useCollectionsStore = create<CollectionsState>((set, get) => ({
  collections: [],
  publicCollections: [],
  loading: true,
  error: null,

  createCollection: async (data) => {
    const docRef = await addDoc(collection(db, 'collections'), {
      ...data,
      promptCount: 0,
      likesCount: 0,
      duplicatesCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  },

  deleteCollection: async (collectionId) => {
    await deleteDoc(doc(db, 'collections', collectionId));
  },

  addPromptToCollection: async (collectionId, promptId) => {
    await updateDoc(doc(db, 'collections', collectionId), {
      promptIds: arrayUnion(promptId),
      promptCount: increment(1),
      updatedAt: Date.now(),
    });
  },

  removePromptFromCollection: async (collectionId, promptId) => {
    await updateDoc(doc(db, 'collections', collectionId), {
      promptIds: arrayRemove(promptId),
      promptCount: increment(-1),
      updatedAt: Date.now(),
    });
  },

  isPromptInCollection: (collectionId, promptId) => {
    const col = get().collections.find((c) => c.id === collectionId);
    return col?.promptIds.includes(promptId) ?? false;
  },

  getCollectionsForPrompt: (promptId) => {
    return get().collections.filter((c) => c.promptIds.includes(promptId));
  },
}));

/**
 * Subscribe to user's collections.
 */
export function subscribeToUserCollections(userId: string): Unsubscribe {
  unsubUser?.();

  const q = query(
    collection(db, 'collections'),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  unsubUser = onSnapshot(
    q,
    (snapshot) => {
      const collections = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Collection)
      );
      useCollectionsStore.setState({ collections, loading: false });
    },
    (error) => {
      useCollectionsStore.setState({ error: messageFor(error), loading: false });
    }
  );

  return unsubUser;
}

/**
 * Subscribe to public collections for discovery.
 */
export function subscribeToPublicCollections(): Unsubscribe {
  unsubPublic?.();

  const q = query(
    collection(db, 'collections'),
    where('isPublic', '==', true),
    orderBy('likesCount', 'desc'),
  );

  unsubPublic = onSnapshot(
    q,
    (snapshot) => {
      const publicCollections = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Collection)
      );
      useCollectionsStore.setState({ publicCollections });
    },
    (error) => {
      console.warn('Failed to fetch public collections:', error);
    }
  );

  return unsubPublic;
}

export function unsubscribeFromCollections(): void {
  unsubUser?.();
  unsubPublic?.();
  unsubUser = null;
  unsubPublic = null;
}
