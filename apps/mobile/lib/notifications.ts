/**
 * Push Notification Service — FCM token management and notification handling.
 *
 * Handles:
 * - Requesting notification permissions
 * - Registering FCM tokens in Firestore
 * - Handling foreground/background notifications
 * - Deep linking from notification taps
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Notification Handler ───────────────────────────────────────────────────

/**
 * Configure how notifications appear when the app is in the foreground.
 */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// ─── Permission & Token ─────────────────────────────────────────────────────

/**
 * Request notification permissions and register the FCM token.
 *
 * Returns the token if successful, null otherwise.
 * Safe to call multiple times — idempotent.
 */
export async function registerForPushNotifications(
  userId?: string
): Promise<string | null> {
  try {
    // Only works on physical devices
    if (!Device.isDevice) {
      console.log('[notifications] Push notifications require a physical device');
      return null;
    }

    // Check existing permission status
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[notifications] Permission not granted');
      return null;
    }

    // Get the FCM token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    const token = tokenData.data;

    // Store token in Firestore
    await storeFCMToken(token, userId);

    // Android needs a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#EE6123',
      });

      await Notifications.setNotificationChannelAsync('prompts', {
        name: 'New Prompts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250],
        lightColor: '#EE6123',
        description: 'Notifications about new prompts and daily picks',
      });
    }

    console.log('[notifications] Token registered:', token.slice(0, 20) + '...');
    return token;
  } catch (error) {
    // Notifications not configured — silent in dev
    return null;
  }
}

// ─── Token Storage ──────────────────────────────────────────────────────────

/**
 * Store or update an FCM token in Firestore.
 *
 * Deduplicates by token — if the token already exists, updates lastSeenAt.
 */
async function storeFCMToken(token: string, userId?: string) {
  try {
    const appVersion =
      Constants.expoConfig?.version ?? '1.0.0';

    // Check if token already exists
    const existingQuery = query(
      collection(db, 'fcm_tokens'),
      where('token', '==', token)
    );
    const existingDocs = await getDocs(existingQuery);

    if (!existingDocs.empty) {
      // Update existing token
      const docRef = existingDocs.docs[0].ref;
      await updateDoc(docRef, {
        lastSeenAt: Date.now(),
        isActive: true,
        ...(userId ? { userId } : {}),
      });
    } else {
      // Create new token doc
      const docId = token.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 128);
      await setDoc(doc(db, 'fcm_tokens', docId), {
        token,
        userId: userId ?? null,
        platform: Platform.OS,
        appVersion,
        isActive: true,
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      });
    }
  } catch (error) {
    console.error('[notifications] Failed to store token:', error);
  }
}

// ─── Notification Listeners ─────────────────────────────────────────────────

export type NotificationResponseHandler = (promptId: string | null) => void;

let foregroundSubscription: Notifications.Subscription | null = null;
let responseSubscription: Notifications.Subscription | null = null;

/**
 * Track notification receive (foreground) — increments deliveredCount.
 */
async function trackNotificationReceive(notification: Notifications.Notification) {
  try {
    const notifId = notification.request.content.data?.notifId as string | undefined;
    if (notifId) {
      const notifRef = doc(db, 'push_notifications', notifId);
      await updateDoc(notifRef, {
        openedCount: increment(1),
        openedBy: arrayUnion('foreground'),
      }).catch(() => {
        // Document may not exist yet — ignore
      });
    }
  } catch {
    // Fire-and-forget tracking
  }
}

/**
 * Track notification open (tap) — increments openedCount and records platform.
 */
async function trackNotificationOpen(notification: Notifications.Notification) {
  try {
    const notifId = notification.request.content.data?.notifId as string | undefined;
    if (notifId) {
      const notifRef = doc(db, 'push_notifications', notifId);
      await updateDoc(notifRef, {
        openedCount: increment(1),
        openedBy: arrayUnion(Platform.OS),
      }).catch(() => {
        // Document may not exist yet — ignore
      });
    }
  } catch {
    // Fire-and-forget tracking
  }
}

/**
 * Set up notification listeners.
 *
 * - Foreground: shows alert + tracks receive
 * - Response: handles taps + tracks open + deep linking
 *
 * @param onNotificationTap - Called with the prompt ID from notification data
 */
export function setupNotificationListeners(
  onNotificationTap?: NotificationResponseHandler
) {
  // Remove existing listeners
  removeNotificationListeners();

  // Foreground notification listener — track receive
  foregroundSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log('[notifications] Foreground:', notification.request.content.title);
      trackNotificationReceive(notification);
    }
  );

  // Notification tap handler (background/killed state) — track open + deep link
  responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      const promptId = data?.promptId as string | undefined;

      // Track the open event
      trackNotificationOpen(response.notification);

      if (promptId && onNotificationTap) {
        onNotificationTap(promptId);
      }
    }
  );
}

/**
 * Remove all notification listeners.
 */
export function removeNotificationListeners() {
  foregroundSubscription?.remove();
  responseSubscription?.remove();
  foregroundSubscription = null;
  responseSubscription = null;
}

// ─── Badge Management ───────────────────────────────────────────────────────

/**
 * Reset the badge count to zero.
 */
export async function clearBadgeCount() {
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Badge clearing not supported on all platforms
  }
}

// ─── Token Cleanup ──────────────────────────────────────────────────────────

/**
 * Mark a token as inactive (e.g., on logout).
 */
export async function deactivateFCMToken(token: string) {
  try {
    const q = query(
      collection(db, 'fcm_tokens'),
      where('token', '==', token)
    );
    const docs = await getDocs(q);

    for (const docSnap of docs.docs) {
      await updateDoc(docSnap.ref, { isActive: false });
    }
  } catch (error) {
    console.warn('[notifications] Failed to deactivate token:', error);
  }
}
