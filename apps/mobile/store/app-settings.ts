/**
 * App settings store — remote config with local cache.
 *
 * Cache strategy:
 * - Settings persist to AsyncStorage (survives app restarts)
 * - On launch: show cached settings instantly, fetch in background
 * - If fetched settings have a different `updatedAt` than cached → update
 * - Re-check button resets `loaded` to force a fresh fetch
 * - If admin changes the version → mobile detects via `updatedAt` mismatch
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_APP_SETTINGS, APP_NAME } from '@repo/shared/types';
import type { AppSettings } from '@repo/shared/types';
import { getUpdateRequirement, type UpdateRequirement } from '@repo/shared/app-update';
import Constants from 'expo-constants';

/** App version from app.json. */
export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '1.0.0';

const ADMIN_API_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL ?? 'http://10.0.2.2:3000';

/** API cooldown — at most 1 fetch per hour. */
const API_COOLDOWN_MS = 60 * 60 * 1000;

interface AppSettingsState {
  settings: AppSettings;
  appName: string;
  /** Whether settings have been fetched at least once this session. */
  loaded: boolean;
  /** Timestamp of the last API fetch. Rate-limits fetches. */
  lastApiFetchAt: number;
  /** Fetch settings from the admin API. Respects cooldown. */
  fetchSettings: () => Promise<void>;
  /** Force a fresh fetch (resets cooldown + loaded guard). Used by Re-check button. */
  forceRefetchSettings: () => Promise<void>;
  /** What update prompt (if any) the current install should see. */
  updateRequirement: () => UpdateRequirement;
}

export const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_APP_SETTINGS, updatedAt: null },
      appName: APP_NAME,
      loaded: false,
      lastApiFetchAt: 0,

      fetchSettings: async () => {
        const state = get();
        // Respect cooldown — don't fetch if done < 1h ago
        if (state.loaded && Date.now() - state.lastApiFetchAt < API_COOLDOWN_MS) {
          return;
        }
        await doFetch(set, get);
      },

      forceRefetchSettings: async () => {
        // Reset cooldown and re-fetch (for Re-check button)
        set({ lastApiFetchAt: 0 });
        await doFetch(set, get);
      },

      updateRequirement: () =>
        getUpdateRequirement(APP_VERSION, get().settings),
    }),
    {
      name: 'promptgallery-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        settings: state.settings,
        appName: state.appName,
        lastApiFetchAt: state.lastApiFetchAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.settings) {
          state.loaded = true;
        }
      },
    }
  )
);

/** Internal fetch logic — shared between fetchSettings and forceRefetchSettings. */
async function doFetch(
  set: (partial: Partial<AppSettingsState>) => void,
  get: () => AppSettingsState,
): Promise<void> {
  set({ loaded: false });
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${ADMIN_API_URL}/api/app-settings`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = (await res.json()) as {
        settings?: Partial<AppSettings>;
        appName?: string;
      };
      const newSettings: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...data.settings,
        updatedAt: data.settings?.updatedAt ?? null,
      };

      // Only update if settings actually changed (version bump, etc.)
      const oldUpdatedAt = get().settings.updatedAt;
      const newUpdatedAt = newSettings.updatedAt;
      const changed = oldUpdatedAt !== newUpdatedAt;

      set({
        settings: newSettings,
        appName: data.appName ?? APP_NAME,
        loaded: true,
        lastApiFetchAt: Date.now(),
      });

      // If version-related fields changed, the update requirement may have changed
      // Components will re-render because `settings` reference changed
      if (changed) {
        // Force re-evaluation of updateRequirement
        // (Zustand triggers re-render on setState, which re-calls updateRequirement)
      }
    } else {
      set({ loaded: true });
    }
  } catch {
    // Offline — keep cached settings, mark as loaded
    set({ loaded: true });
  }
}
