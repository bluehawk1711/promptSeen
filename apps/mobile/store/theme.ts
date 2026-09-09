/**
 * Theme store — global theme state that can be switched instantly.
 *
 * Uses Zustand with AsyncStorage persistence. The theme mode is read
 * by the ModeProvider and useColorScheme hook.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'promptgallery-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
