/**
 * Analytics — lightweight event tracking for PromptSeen.
 *
 * Events are written to the `analytics_events` collection in Firestore.
 * Daily aggregation runs periodically to produce `daily_stats` documents.
 *
 * The mobile app tracks screen views, likes, copies, shares, and ad events.
 * The web admin panel reads aggregated stats for the dashboard.
 */

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  increment,
  type Firestore,
} from 'firebase/firestore';
import type { AnalyticsEvent, AnalyticsEventType, DailyStats } from './types.js';

// ─── Event Logging ──────────────────────────────────────────────────────────

export interface LogEventOptions {
  type: AnalyticsEventType;
  userId: string;
  promptId?: string;
  collectionId?: string;
  metadata?: Record<string, string | number | boolean>;
  platform: string;
  appVersion: string;
}

/**
 * Log an analytics event to Firestore.
 *
 * Fire-and-forget: errors are logged but never thrown, so analytics
 * never blocks the UI.
 */
export async function logAnalyticsEvent(
  db: Firestore,
  options: LogEventOptions
): Promise<void> {
  try {
    const event: Omit<AnalyticsEvent, 'id'> = {
      type: options.type,
      userId: options.userId,
      platform: options.platform,
      appVersion: options.appVersion,
      createdAt: Date.now(),
    };

    if (options.promptId) event.promptId = options.promptId;
    if (options.collectionId) event.collectionId = options.collectionId;
    if (options.metadata) event.metadata = options.metadata;

    await addDoc(collection(db, 'analytics_events'), event);
  } catch (error) {
    // Analytics failures should never break the app
    console.warn('[analytics] Failed to log event:', error);
  }
}

// ─── Daily Stats ────────────────────────────────────────────────────────────

/**
 * Get today's date key in YYYY-MM-DD format (UTC).
 */
export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date key for comparison.
 */
export function getYesterdayDateKey(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Increment a daily stat counter.
 *
 * Uses Firestore `increment()` for atomic counter updates.
 * Creates the document if it doesn't exist.
 */
export async function incrementDailyStat(
  db: Firestore,
  field: keyof Omit<DailyStats, 'id' | 'date' | 'topPromptIds' | 'topCategoryIds' | 'createdAt'>,
  amount: number = 1
): Promise<void> {
  try {
    const dateKey = getTodayDateKey();
    const docRef = doc(db, 'daily_stats', dateKey);

    await setDoc(
      docRef,
      {
        date: dateKey,
        [field]: increment(amount),
        createdAt: Date.now(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[analytics] Failed to increment daily stat:', error);
  }
}

/**
 * Track unique active users for the day.
 *
 * Uses a subcollection `daily_stats/{date}/active_users/{uid}`
 * to deduplicate user counts.
 */
export async function trackActiveUser(
  db: Firestore,
  userId: string
): Promise<void> {
  try {
    const dateKey = getTodayDateKey();
    const userDocRef = doc(db, 'daily_stats', dateKey, 'active_users', userId);

    // Check if already tracked today
    const { getDoc } = await import('firebase/firestore');
    const existing = await getDoc(userDocRef);

    if (!existing.exists()) {
      const docRef = doc(db, 'daily_stats', dateKey);
      await setDoc(
        docRef,
        {
          date: dateKey,
          activeUsers: increment(1),
          createdAt: Date.now(),
        },
        { merge: true }
      );
      // Write the marker doc
      await setDoc(userDocRef, { trackedAt: Date.now() });
    }
  } catch (error) {
    console.warn('[analytics] Failed to track active user:', error);
  }
}

// ─── Query Helpers ──────────────────────────────────────────────────────────

/**
 * Get daily stats for a date range.
 */
export async function getDailyStatsRange(
  db: Firestore,
  startDate: string,
  endDate: string
): Promise<DailyStats[]> {
  const q = query(
    collection(db, 'daily_stats'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as DailyStats));
}

/**
 * Get recent analytics events of a specific type.
 */
export async function getRecentEvents(
  db: Firestore,
  eventType: AnalyticsEventType,
  count: number = 50
): Promise<AnalyticsEvent[]> {
  const q = query(
    collection(db, 'analytics_events'),
    where('type', '==', eventType),
    orderBy('createdAt', 'desc'),
    limit(count)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as AnalyticsEvent));
}

/**
 * Get engagement summary for a date range.
 */
export async function getEngagementSummary(
  db: Firestore,
  startDate: string,
  endDate: string
): Promise<{
  totalViews: number;
  totalLikes: number;
  totalCopies: number;
  totalShares: number;
  totalAdImpressions: number;
  avgDailyUsers: number;
}> {
  const stats = await getDailyStatsRange(db, startDate, endDate);

  return {
    totalViews: stats.reduce((sum, s) => sum + (s.promptViews || 0), 0),
    totalLikes: stats.reduce((sum, s) => sum + (s.likes || 0), 0),
    totalCopies: stats.reduce((sum, s) => sum + (s.copies || 0), 0),
    totalShares: stats.reduce((sum, s) => sum + (s.shares || 0), 0),
    totalAdImpressions: stats.reduce((sum, s) => sum + (s.adImpressions || 0), 0),
    avgDailyUsers: stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + (s.activeUsers || 0), 0) / stats.length)
      : 0,
  };
}
