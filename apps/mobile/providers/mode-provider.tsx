import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';
import { useThemeStore, type ThemeMode } from '@/store/theme';

export type Mode = ThemeMode;

export type ModeStorage = {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
};

type ModeContextValue = {
  mode: Mode;
  setMode: (mode: Mode) => void;
  scheme: 'light' | 'dark';
};

const ModeContext = createContext<ModeContextValue | null>(null);

function syncNativeAppearance(mode: Mode) {
  if (typeof Appearance.setColorScheme !== 'function') return;
  Appearance.setColorScheme(mode === 'system' ? 'unspecified' : mode);
}

/**
 * ModeProvider — reads from and writes to the Zustand theme store.
 *
 * This is the bridge between the Zustand persistence layer and the
 * React context that useColorScheme reads from. The Zustand store
 * is the single source of truth for theme mode.
 */
export const ModeProvider = ({
  children,
  storage,
  storageKey = 'promptgallery-theme',
}: {
  children: React.ReactNode;
  storage?: ModeStorage;
  storageKey?: string;
}) => {
  const { mode: storeMode, setMode: setStoreMode } = useThemeStore();
  const systemScheme = useRNColorScheme() === 'dark' ? 'dark' : 'light';

  // Sync Zustand → native Appearance on mount and when store changes
  useEffect(() => {
    syncNativeAppearance(storeMode);
  }, [storeMode]);

  // If legacy storage is provided, sync from it once (migration path)
  useEffect(() => {
    if (!storage) return;
    let cancelled = false;

    Promise.resolve()
      .then(() => storage.getItem(storageKey))
      .then((saved) => {
        if (cancelled) return;
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setStoreMode(saved);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [storage, storageKey, setStoreMode]);

  const setMode = useCallback(
    (next: Mode) => {
      setStoreMode(next);
      syncNativeAppearance(next);
    },
    [setStoreMode]
  );

  const value = useMemo<ModeContextValue>(
    () => ({
      mode: storeMode,
      setMode,
      scheme: storeMode === 'system' ? systemScheme : storeMode,
    }),
    [storeMode, setMode, systemScheme]
  );

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export function useModeContext(): ModeContextValue | null {
  return useContext(ModeContext);
}
