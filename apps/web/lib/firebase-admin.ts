/**
 * Firebase Admin SDK — server-side only.
 *
 * Used by API routes that need to bypass Firestore security rules
 * (e.g., analytics, notifications). Never import this in client code.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

let _db: Firestore | null = null

/**
 * Get a Firestore instance that bypasses security rules.
 * Uses firebase-admin SDK with a service account.
 */
export function getAdminDb(): Firestore {
  if (_db) return _db

  if (getApps().length > 0) {
    _db = getFirestore(getApps()[0])
    return _db
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin credentials. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in .env.local',
    )
  }

  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  })

  _db = getFirestore()
  return _db
}
