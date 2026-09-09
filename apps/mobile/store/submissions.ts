/**
 * Submissions store — user-submitted prompts with admin approval workflow.
 *
 * Users can submit prompts for review. Admins approve or reject them.
 * Submissions are stored in `submissions/{id}` in Firestore.
 */

import { create } from 'zustand';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PromptSubmission } from '@repo/shared/types';
import { messageFor } from '@repo/shared/errors';

interface SubmissionsState {
  /** Current user's submissions. */
  mySubmissions: PromptSubmission[];
  /** All submissions (admin only). */
  allSubmissions: PromptSubmission[];
  loading: boolean;
  error: string | null;

  /** Submit a new prompt for review. */
  submitPrompt: (data: {
    submitterUid: string;
    submitterName: string;
    text: string;
    imageUrl: string;
    suggestedCategoryId: string;
    tags: string[];
  }) => Promise<string>;

  /** Get submission stats for the current user. */
  getMyStats: () => {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

let unsubMy: Unsubscribe | null = null;
let unsubAll: Unsubscribe | null = null;

export const useSubmissionsStore = create<SubmissionsState>((set, get) => ({
  mySubmissions: [],
  allSubmissions: [],
  loading: true,
  error: null,

  submitPrompt: async (data) => {
    const docRef = await addDoc(collection(db, 'submissions'), {
      ...data,
      status: 'pending' as const,
      reviewNote: '',
      reviewedBy: null,
      reviewedAt: null,
      approvedPromptId: null,
      createdAt: Date.now(),
    });
    return docRef.id;
  },

  getMyStats: () => {
    const submissions = get().mySubmissions;
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    };
  },
}));

/**
 * Subscribe to current user's submissions.
 */
export function subscribeToMySubmissions(userId: string): Unsubscribe {
  unsubMy?.();

  const q = query(
    collection(db, 'submissions'),
    where('submitterUid', '==', userId),
    orderBy('createdAt', 'desc')
  );

  unsubMy = onSnapshot(
    q,
    (snapshot) => {
      const mySubmissions = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PromptSubmission)
      );
      useSubmissionsStore.setState({ mySubmissions, loading: false });
    },
    (error) => {
      useSubmissionsStore.setState({ error: messageFor(error), loading: false });
    }
  );

  return unsubMy;
}

/**
 * Subscribe to all submissions (admin only).
 */
export function subscribeToAllSubmissions(): Unsubscribe {
  unsubAll?.();

  const q = query(
    collection(db, 'submissions'),
    orderBy('createdAt', 'desc')
  );

  unsubAll = onSnapshot(
    q,
    (snapshot) => {
      const allSubmissions = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PromptSubmission)
      );
      useSubmissionsStore.setState({ allSubmissions, loading: false });
    },
    (error) => {
      useSubmissionsStore.setState({ error: messageFor(error), loading: false });
    }
  );

  return unsubAll;
}

export function unsubscribeFromSubmissions(): void {
  unsubMy?.();
  unsubAll?.();
  unsubMy = null;
  unsubAll = null;
}
