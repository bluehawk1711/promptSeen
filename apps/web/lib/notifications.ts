/**
 * Server-side notification utilities for the admin panel.
 *
 * Uses Expo Push Notification API to send notifications.
 * No Firebase Admin SDK needed — Expo handles FCM delivery.
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';
import type { FCMToken, PushNotification } from '@repo/shared/types';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// ─── Token Management ──────────────────────────────────────────────────────

/**
 * Get all active FCM tokens from Firestore.
 */
export async function getActiveTokens(
  db: Firestore
): Promise<FCMToken[]> {
  const q = query(
    collection(db, 'fcm_tokens'),
    where('isActive', '==', true)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FCMToken));
}

/**
 * Get the count of active tokens.
 */
export async function getActiveTokenCount(db: Firestore): Promise<number> {
  const tokens = await getActiveTokens(db);
  return tokens.length;
}

// ─── Send Notifications ─────────────────────────────────────────────────────

export interface SendNotificationOptions {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
  target: 'all' | 'topic' | 'token';
  topic?: string;
  token?: string;
  sentBy: string;
  source: 'manual' | 'auto';
  promptId?: string;
}

/**
 * Send a push notification via Expo Push API.
 *
 * Expo handles FCM/APNs delivery — we just send to Expo's endpoint.
 * Supports batching (max 100 per request).
 */
export async function sendPushNotification(
  db: Firestore,
  options: SendNotificationOptions
): Promise<PushNotification> {
  const {
    title,
    body,
    imageUrl,
    data = {},
    target,
    topic,
    token,
    sentBy,
    source,
    promptId,
  } = options;

  let tokens: string[] = [];
  let sentCount = 0;

  // Get target tokens
  if (target === 'all') {
    const allTokens = await getActiveTokens(db);
    tokens = allTokens.map((t) => t.token);
  } else if (target === 'topic' && topic) {
    // For topic-based, we send a single message with to: topic
    tokens = [`Topic:${topic}`];
  } else if (target === 'token' && token) {
    tokens = [token];
  }

  sentCount = tokens.length;

  // Build Expo push messages
  const messages = tokens
    .filter((t) => !t.startsWith('Topic:'))
    .map((t) => ({
      to: t,
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
      data,
      sound: 'default',
      badge: 1,
      channelId: 'prompts',
    }));

  // Handle topic messages separately
  const topicMessages = tokens
    .filter((t) => t.startsWith('Topic:'))
    .map((t) => ({
      to: `/topics/${t.replace('Topic:', '')}`,
      title,
      body,
      ...(imageUrl ? { imageUrl } : {}),
      data,
      sound: 'default',
      badge: 1,
      channelId: 'prompts',
    }));

  const allMessages = [...messages, ...topicMessages];

  // Send in batches of 100
  let deliveredCount = 0;
  const BATCH_SIZE = 100;

  for (let i = 0; i < allMessages.length; i += BATCH_SIZE) {
    const batch = allMessages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      const result = await response.json();

      // Count successful sends
      if (result.data) {
        deliveredCount += result.data.filter(
          (r: any) => r.status === 'ok'
        ).length;
      }
    } catch (error) {
      console.error('[notifications] Batch send failed:', error);
    }
  }

  // Record the notification in Firestore
  const notificationRecord: Omit<PushNotification, 'id'> = {
    title,
    body,
    imageUrl: imageUrl ?? '',
    data,
    target,
    topic: topic ?? '',
    token: token ?? '',
    sentCount,
    deliveredCount,
    openedCount: 0,
    sentBy,
    source,
    promptId: promptId ?? null,
    createdAt: Date.now(),
  };

  const docRef = await addDoc(
    collection(db, 'push_notifications'),
    notificationRecord
  );

  return { id: docRef.id, ...notificationRecord };
}

// ─── Auto-Notification on New Prompt ────────────────────────────────────────

/**
 * Send an automatic notification when a new prompt is uploaded.
 * Called from the admin prompts page after a prompt is created.
 */
export async function notifyNewPrompt(
  db: Firestore,
  promptId: string,
  promptText: string,
  categoryName: string,
  imageUrl: string,
  sentBy: string
): Promise<PushNotification | null> {
  // Truncate body to 100 chars
  const truncatedText =
    promptText.length > 100
      ? promptText.slice(0, 97) + '...'
      : promptText;

  return sendPushNotification(db, {
    title: `New ${categoryName} Prompt`,
    body: truncatedText,
    imageUrl,
    data: { promptId, screen: 'prompt' },
    target: 'all',
    sentBy,
    source: 'auto',
    promptId,
  });
}
