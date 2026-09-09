import type { FirebaseConfig } from './types.js';

/**
 * Load Firebase config from environment variables.
 *
 * Works with both `EXPO_PUBLIC_*` (React Native/Expo) and `NEXT_PUBLIC_*`
 * (Next.js) environment variable prefixes.
 *
 * @param prefix - The env var prefix to use ('EXPO_PUBLIC_' or 'NEXT_PUBLIC_')
 * @returns Validated Firebase configuration
 * @throws If required environment variables are missing
 */
export function loadFirebaseConfig(
  prefix: 'EXPO_PUBLIC_' | 'NEXT_PUBLIC_' = 'EXPO_PUBLIC_'
): FirebaseConfig {
  const config: FirebaseConfig = {
    apiKey: getEnv(`${prefix}FIREBASE_API_KEY`),
    authDomain: getEnv(`${prefix}FIREBASE_AUTH_DOMAIN`),
    projectId: getEnv(`${prefix}FIREBASE_PROJECT_ID`),
    storageBucket: getEnv(`${prefix}FIREBASE_STORAGE_BUCKET`),
    messagingSenderId: getEnv(`${prefix}FIREBASE_MESSAGING_SENDER_ID`),
    appId: getEnv(`${prefix}FIREBASE_APP_ID`),
  };

  if (!config.apiKey || !config.projectId) {
    throw new Error(
      `Missing Firebase environment variables. Set ${prefix}FIREBASE_API_KEY ` +
        `and ${prefix}FIREBASE_PROJECT_ID in your .env file.`
    );
  }

  return config;
}

function getEnv(key: string): string {
  const value =
    typeof process !== 'undefined' ? process.env[key] : undefined;
  return value ?? '';
}
