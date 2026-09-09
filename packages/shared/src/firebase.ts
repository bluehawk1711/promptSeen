/**
 * Shared Firebase initialization.
 *
 * This module provides a platform-agnostic Firebase initialization function.
 * Each app (mobile, web) calls `initFirebase()` with its own config and
 * platform-specific emulator setup.
 *
 * The mobile app uses Expo constants for emulator host discovery;
 * the web app uses localhost directly.
 */

import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  initializeFirestore,
} from 'firebase/firestore';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import type { FirebaseConfig } from './types.js';

export interface InitFirebaseOptions {
  config: FirebaseConfig;
  /** Whether to connect to local emulators. */
  useEmulator?: boolean;
  /** Host for emulator connections (defaults to 'localhost'). */
  emulatorHost?: string;
}

export interface FirebaseServices {
  app: FirebaseApp;
  db: ReturnType<typeof getFirestore>;
  storage: ReturnType<typeof getStorage>;
}

/**
 * Initialize Firebase and return the core services.
 *
 * Idempotent: safe to call multiple times (Fast Refresh, HMR).
 * On subsequent calls, returns the existing instances.
 *
 * @example
 * ```ts
 * // In mobile app:
 * import { initFirebase } from '@repo/shared/firebase';
 * import Constants from 'expo-constants';
 *
 * const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
 * const { db, storage } = initFirebase({
 *   config: loadFirebaseConfig('EXPO_PUBLIC_'),
 *   useEmulator: process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR === '1',
 *   emulatorHost: host,
 * });
 *
 * // In web app:
 * import { initFirebase } from '@repo/shared/firebase';
 * const { db, storage } = initFirebase({
 *   config: loadFirebaseConfig('NEXT_PUBLIC_'),
 *   useEmulator: process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === '1',
 * });
 * ```
 */
export function initFirebase(options: InitFirebaseOptions): FirebaseServices {
  const { config, useEmulator = false, emulatorHost = 'localhost' } = options;

  const firebaseOptions: FirebaseOptions = {
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  };

  // Idempotent: reuse the existing app if one already exists.
  const existing = getApps()[0];
  const app: FirebaseApp = existing ?? initializeApp(firebaseOptions);

  // Firestore: initialize on first call, get on subsequent calls.
  const db = existing
    ? getFirestore(app)
    : initializeFirestore(app, {
        experimentalAutoDetectLongPolling: true,
      });

  // Storage is idempotent per bucket.
  const storage = getStorage(app);

  // Connect to emulators on first initialization only.
  if (!existing && useEmulator) {
    connectFirestoreEmulator(db, emulatorHost, 8080);
    connectStorageEmulator(storage, emulatorHost, 9199);
    console.log(`[firebase] using emulators at ${emulatorHost}`);
  }

  return { app, db, storage };
}
