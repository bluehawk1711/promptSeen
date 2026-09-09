/**
 * Auth store — admin authentication state.
 *
 * The admin panel uses email/password auth to manage prompts.
 * Regular users don't need to sign in.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@repo/shared/types';

interface AuthState {
  user: UserProfile | null;
  isAdmin: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAdmin: false,

      setUser: (user) =>
        set({
          user,
          isAdmin: user?.isAdmin ?? false,
        }),

      logout: () =>
        set({
          user: null,
          isAdmin: false,
        }),
    }),
    {
      name: 'promptgallery-auth',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
