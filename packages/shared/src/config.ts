import type { FirebaseConfig } from './types.js';

/**
 * Load Firebase config from environment variables.
 *
 * Uses static property access so Metro/Expo can replace
 * `process.env.EXPO_PUBLIC_*` tokens at bundle time.
 *
 * @param prefix - The env var prefix to use ('EXPO_PUBLIC_' or 'NEXT_PUBLIC_')
 * @returns Validated Firebase configuration
 * @throws If required environment variables are missing
 */
export function loadFirebaseConfig(
  prefix: 'EXPO_PUBLIC_' | 'NEXT_PUBLIC_' = 'EXPO_PUBLIC_'
): FirebaseConfig {
  const config: FirebaseConfig =
    prefix === 'EXPO_PUBLIC_'
      ? {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
          storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
          messagingSenderId:
            process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
          appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
        }
      : {
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
          messagingSenderId:
            process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
        };

  if (!config.apiKey || !config.projectId) {
    throw new Error(
      `Missing Firebase environment variables. Set ${prefix}FIREBASE_API_KEY ` +
        `and ${prefix}FIREBASE_PROJECT_ID in your .env file.`
    );
  }

  return config;
}
