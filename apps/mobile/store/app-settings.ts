/**
 * App settings store — remote config fetched from the admin API.
 *
 * Holds version/force-update config, social links, and about text.
 * The whole app re-brands from ONE Firestore doc.
 */

import { create } from 'zustand';
import { DEFAULT_APP_SETTINGS, APP_NAME } from '@repo/shared/types';
import type { AppSettings } from '@repo/shared/types';
import { getUpdateRequirement, type UpdateRequirement } from '@repo/shared/app-update';
import Constants from 'expo-constants';

/** App version from app.json (fallback to a safe default). */
export const APP_VERSION: string =
  Constants.expoConfig?.version ?? '1.0.0';

/**
 * Admin panel base URL — the Next.js server that serves /api/app-settings.
 * Android emulators reach host machines via 10.0.2.2; set EXPO_PUBLIC_ADMIN_API_URL
 * to override in production builds.
 */
const ADMIN_API_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL ?? 'http://10.0.2.2:3000';

interface AppSettingsState {
  settings: AppSettings;
  appName: string;
  loading: boolean;
  loaded: boolean;
  fetchSettings: () => Promise<void>;
  /** What update prompt (if any) the current install should see. */
  updateRequirement: () => UpdateRequirement;
}

export const useAppSettingsStore = create<AppSettingsState>()((set, get) => ({
  settings: { ...DEFAULT_APP_SETTINGS, updatedAt: null },
  appName: APP_NAME,
  loading: false,
  loaded: false,

  fetchSettings: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
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
        set({
          settings: {
            ...DEFAULT_APP_SETTINGS,
            ...data.settings,
            updatedAt: data.settings?.updatedAt ?? null,
          },
          appName: data.appName ?? APP_NAME,
          loaded: true,
        });
      }
    } catch {
      // Offline — keep defaults, mark as loaded so we don't block
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },

  updateRequirement: () =>
    getUpdateRequirement(APP_VERSION, get().settings),
}));
