/**
 * Firestore backup and restore utilities.
 *
 * Exports all collections to a JSON file and provides import functionality.
 * Designed to run from the admin panel (browser) or a Node.js script.
 *
 * Collections included:
 *   prompts, categories, users, collections, submissions
 */

import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore';
import type {
  BackupData,
  BackupMetadata,
  Prompt,
  Category,
  UserProfile,
  Collection,
  PromptSubmission,
} from './types.js';

/** All collections that are part of the backup. */
const BACKUP_COLLECTIONS = ['prompts', 'categories', 'users', 'collections', 'submissions'] as const;

/**
 * Export all Firestore data to a BackupData object.
 *
 * @param db - Firestore database instance
 * @returns Complete backup data with metadata
 */
export async function exportFirestoreData(
  db: import('firebase/firestore').Firestore
): Promise<BackupData> {

  const counts: Record<string, number> = {};
  const prompts: Prompt[] = [];
  const categories: Category[] = [];
  const users: UserProfile[] = [];
  const userCollections: Collection[] = [];
  const submissions: PromptSubmission[] = [];

  // Export prompts
  const promptsSnap = await getDocs(collection(db, 'prompts'));
  promptsSnap.forEach((docSnap) => {
    prompts.push({ id: docSnap.id, ...docSnap.data() } as Prompt);
  });
  counts['prompts'] = prompts.length;

  // Export categories
  const categoriesSnap = await getDocs(collection(db, 'categories'));
  categoriesSnap.forEach((docSnap) => {
    categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
  });
  counts['categories'] = categories.length;

  // Export users
  const usersSnap = await getDocs(collection(db, 'users'));
  usersSnap.forEach((docSnap) => {
    users.push({ uid: docSnap.id, ...docSnap.data() } as UserProfile);
  });
  counts['users'] = users.length;

  // Export collections
  const collectionsSnap = await getDocs(collection(db, 'collections'));
  collectionsSnap.forEach((docSnap) => {
    userCollections.push({ id: docSnap.id, ...docSnap.data() } as Collection);
  });
  counts['collections'] = userCollections.length;

  // Export submissions
  const submissionsSnap = await getDocs(collection(db, 'submissions'));
  submissionsSnap.forEach((docSnap) => {
    submissions.push({ id: docSnap.id, ...docSnap.data() } as PromptSubmission);
  });
  counts['submissions'] = submissions.length;

  const metadata: BackupMetadata = {
    timestamp: new Date().toISOString(),
    counts,
    collections: [...BACKUP_COLLECTIONS],
  };

  return { metadata, prompts, categories, users, userCollections, submissions };
}

/**
 * Download backup data as a JSON file.
 *
 * Triggers a browser download. In Node.js, write to a file instead.
 */
export function downloadBackup(backup: BackupData): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `promptseen-backup-${backup.metadata.timestamp.replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup data into Firestore.
 *
 * Uses batched writes (max 500 per batch) for efficiency.
 * Overwrites existing documents with the same ID.
 *
 * @param db - Firestore database instance
 * @param backup - The backup data to restore
 * @param onProgress - Optional callback with (current, total) counts
 */
export async function importFirestoreData(
  db: import('firebase/firestore').Firestore,
  backup: BackupData,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const collections: [string, (Prompt | Category | UserProfile | Collection | PromptSubmission)[]][] = [
    ['prompts', backup.prompts],
    ['categories', backup.categories],
    ['users', backup.users],
  ];

  // Handle new collections (backward compatible with older backups)
  if (backup.userCollections) {
    collections.push(['collections', backup.userCollections]);
  }
  if (backup.submissions) {
    collections.push(['submissions', backup.submissions]);
  }

  let totalProcessed = 0;
  const totalItems = collections.reduce((sum, [, docs]) => sum + docs.length, 0);

  for (const [collectionName, docs] of collections) {
    // Firestore batch limit is 500 operations
    const BATCH_SIZE = 500;

    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_SIZE);

      for (const docData of chunk) {
        // UserProfile uses 'uid', others use 'id'
        const docId = (docData as any).id ?? (docData as any).uid;
        const { id: _, uid: __, ...data } = docData as any;
        batch.set(doc(db, collectionName, docId), data);
      }

      await batch.commit();
      totalProcessed += chunk.length;
      onProgress?.(totalProcessed, totalItems);
    }
  }
}

/**
 * Parse a backup JSON file from a File input.
 */
export async function parseBackupFile(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string) as BackupData;

        // Basic validation
        if (!data.metadata || !data.prompts || !data.categories) {
          throw new Error('Invalid backup format');
        }

        // Ensure backward compatibility
        if (!data.userCollections) data.userCollections = [];
        if (!data.submissions) data.submissions = [];

        resolve(data);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read backup file'));
    reader.readAsText(file);
  });
}
