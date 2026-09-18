/**
 * Mobile analytics helpers.
 *
 * Wraps the shared analytics functions with mobile-specific defaults
 * (platform, appVersion, userId from auth store).
 *
 * All functions are fire-and-forget — errors are caught silently so
 * analytics never blocks the UI.
 */

import Constants from 'expo-constants';
import {
  logAnalyticsEvent,
  incrementDailyStat,
  trackActiveUser as sharedTrackActiveUser,
  type LogEventOptions,
} from '@repo/shared/analytics';
import type { AnalyticsEventType } from '@repo/shared/types';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/auth';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

interface TrackEventOptions
  extends Omit<LogEventOptions, 'platform' | 'appVersion' | 'userId' | 'type'> {}

/**
 * Log an analytics event with mobile defaults filled in.
 *
 * userId is pulled from the auth store automatically.
 */
export function trackEvent(
  type: AnalyticsEventType,
  options?: TrackEventOptions
): void {
  try {
    const userId = useAuthStore.getState().user?.uid ?? 'anonymous';
    logAnalyticsEvent(db, {
      type,
      userId,
      platform: 'mobile',
      appVersion: APP_VERSION,
      ...options,
    }).catch(() => {});
  } catch {
    // Analytics not available — silent
  }
}

/**
 * Increment a daily stat counter.
 */
export function trackStat(
  field: Parameters<typeof incrementDailyStat>[1],
  amount?: number
): void {
  try {
    incrementDailyStat(db, field, amount).catch(() => {});
  } catch {
    // Silent
  }
}

/**
 * Track unique active user for the day.
 */
export function trackActiveUser(userId: string): void {
  try {
    sharedTrackActiveUser(db, userId).catch(() => {});
  } catch {
    // Silent
  }
}
