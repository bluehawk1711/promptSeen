/**
 * Feedback store — users send feedback (bug reports, feature requests, etc.)
 * stored in `feedback/{id}` in Firestore.
 */

import { create } from 'zustand';
import {
  collection,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Feedback, FeedbackStatus } from '@repo/shared/types';
import { messageFor } from '@repo/shared/errors';

interface FeedbackState {
  sending: boolean;
  error: string | null;

  sendFeedback: (data: {
    userId: string;
    userName: string;
    userEmail: string;
    category: Feedback['category'];
    message: string;
    rating: number | null;
  }) => Promise<string>;

  clearError: () => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  sending: false,
  error: null,

  sendFeedback: async (data) => {
    set({ sending: true, error: null });
    try {
      const docRef = await addDoc(collection(db, 'feedback'), {
        ...data,
        status: 'new' as FeedbackStatus,
        adminNote: '',
        createdAt: Date.now(),
      });
      set({ sending: false });
      return docRef.id;
    } catch (err) {
      const message = messageFor(err);
      set({ sending: false, error: message });
      throw new Error(message);
    }
  },

  clearError: () => set({ error: null }),
}));
