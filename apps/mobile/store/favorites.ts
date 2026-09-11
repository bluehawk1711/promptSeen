/**
 * Favorites store — local device favorites with persistence.
 *
 * Favorites are stored locally (not in Firestore) so the app works
 * without authentication. Users like prompts by tapping the heart icon.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesState {
  /** IDs of prompts the user has liked. */
  likedIds: string[];
  /** IDs of premium prompts unlocked via reward ad. */
  unlockedPremiumIds: string[];
  /** Toggle like on a prompt. Returns the new liked state. */
  toggleLike: (promptId: string) => boolean;
  /** Check if a prompt is liked. */
  isLiked: (promptId: string) => boolean;
  /** Unlock a premium prompt. */
  unlockPremium: (promptId: string) => void;
  /** Check if a premium prompt is unlocked. */
  isUnlocked: (promptId: string) => boolean;
  /** Clear all favorites. */
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      likedIds: [],
      unlockedPremiumIds: [],

      toggleLike: (promptId) => {
        const isLiked = get().likedIds.includes(promptId);
        set((state) => ({
          likedIds: isLiked
            ? state.likedIds.filter((id) => id !== promptId)
            : [...state.likedIds, promptId],
        }));
        return !isLiked;
      },

      isLiked: (promptId) => get().likedIds.includes(promptId),

      unlockPremium: (promptId) =>
        set((state) => ({
          unlockedPremiumIds: state.unlockedPremiumIds.includes(promptId)
            ? state.unlockedPremiumIds
            : [...state.unlockedPremiumIds, promptId],
        })),

      isUnlocked: (promptId) => get().unlockedPremiumIds.includes(promptId),

      clearFavorites: () => set({ likedIds: [] }),
    }),
    {
      name: 'promptgallery-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
