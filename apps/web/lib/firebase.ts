/**
 * Web (admin panel) Firebase initialization.
 *
 * Wraps the shared `initFirebase` with Next.js environment variables.
 * The admin panel uses NEXT_PUBLIC_ prefix for client-side Firebase config.
 */

import { getAuth } from 'firebase/auth';
import { loadFirebaseConfig } from '@repo/shared/config';
import { initFirebase } from '@repo/shared/firebase';

const config = loadFirebaseConfig('NEXT_PUBLIC_');

const useEmulator = process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATOR === '1';

const { app, db, storage } = initFirebase({
  config,
  useEmulator,
  emulatorHost: 'localhost',
});

export { app, db, storage };
export const auth = getAuth(app);
