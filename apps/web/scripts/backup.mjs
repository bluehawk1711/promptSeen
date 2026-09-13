/**
 * Backup Script — exports Firestore data as a JSON file.
 *
 * Usage:
 *   node scripts/backup.mjs                          # Backup all collections
 *   node scripts/backup.mjs --collection prompts     # Backup specific collection
 *   node scripts/backup.mjs --collection prompts,categories,users
 *   node scripts/backup.mjs --exclude fcm_tokens,push_notifications
 *
 * Outputs: tsprompt-backup-YYYY-MM-DD.json in the current directory.
 *
 * Requires:
 *   FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars (or .env.local)
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { writeFileSync } from "fs";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : undefined;
}

const collectionArg = getArg("collection");
const excludeArg = getArg("exclude");

// ─── Initialize Firebase Admin ───────────────────────────────────────────────

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "❌ Missing Firebase Admin credentials.\n" +
      "   Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in apps/web/.env.local"
  );
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore();

// ─── All available collections ───────────────────────────────────────────────

const ALL_COLLECTIONS = [
  "prompts",
  "categories",
  "users",
  "submissions",
  "collections",
  "daily_stats",
  "analytics_events",
  "fcm_tokens",
  "push_notifications",
  "settings",
];

// Determine which collections to back up
let collectionsToBackup = ALL_COLLECTIONS;

if (collectionArg) {
  // Explicit inclusion list
  collectionsToBackup = collectionArg.split(",").map((c) => c.trim());
  console.log(`📋 Backing up specified collections: ${collectionsToBackup.join(", ")}\n`);
} else if (excludeArg) {
  // Exclude specific collections
  const excluded = excludeArg.split(",").map((c) => c.trim());
  collectionsToBackup = ALL_COLLECTIONS.filter((c) => !excluded.includes(c));
  console.log(`📋 Backing up all collections except: ${excluded.join(", ")}\n`);
} else {
  console.log("📋 Backing up all collections\n");
}

// ─── Backup Function ────────────────────────────────────────────────────────

async function backup() {
  console.log("📦 Starting Firestore backup...\n");

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      projectId,
      counts: {},
      collections: collectionsToBackup,
    },
  };

  let totalDocs = 0;

  for (const collectionName of collectionsToBackup) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      backupData[collectionName] = docs;
      backupData.metadata.counts[collectionName] = docs.length;
      totalDocs += docs.length;

      console.log(`   ✅ ${collectionName}: ${docs.length} documents`);
    } catch (error) {
      console.warn(`   ⚠️  ${collectionName}: skipped (${error.message})`);
      backupData[collectionName] = [];
      backupData.metadata.counts[collectionName] = 0;
    }
  }

  // Write to file
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `tsprompt-backup-${dateStr}.json`;
  const filepath = join(process.cwd(), filename);

  writeFileSync(filepath, JSON.stringify(backupData, null, 2));

  console.log(`\n🎉 Backup complete!`);
  console.log(`   ${totalDocs} total documents across ${collectionsToBackup.length} collections`);
  console.log(`   Saved to: ${filename}\n`);
}

backup().catch((error) => {
  console.error("❌ Backup failed:", error);
  process.exit(1);
});
