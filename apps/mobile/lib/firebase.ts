import Constants from 'expo-constants';
import { loadFirebaseConfig } from '@repo/shared/config';
import { initFirebase } from '@repo/shared/firebase';

/**
 * Mobile Firebase initialization.
 *
 * Wraps the shared `initFirebase` with Expo-specific emulator host discovery.
 * The Expo dev server's LAN address is used instead of localhost so that a
 * physical device can reach the emulator.
 */

const config = loadFirebaseConfig('EXPO_PUBLIC_');

const useEmulator = process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATOR === '1';
// `localhost` means the phone itself on a real device, so the emulator would
// be unreachable. Expo already knows the dev server's LAN address — reuse it.
const emulatorHost = useEmulator
  ? (Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost')
  : undefined;

export const { app, db, storage } = initFirebase({
  config,
  useEmulator,
  emulatorHost,
});
