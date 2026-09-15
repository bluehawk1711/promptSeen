/**
 * Migration Script — converts `categoryId` (string) → `categoryIds` (string[])
 * on all documents in the `prompts` collection.
 *
 * Usage:
 *   node scripts/migrate-category-ids.mjs            # live run
 *   node scripts/migrate-category-ids.mjs --dry-run   # preview without writing
 *
 * Requires:
 *   FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars (or .env.local)
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) {
  console.log("🔍 DRY RUN — no changes will be written\n");
}

// ── Firebase Init ──────────────────────────────────────────────────────────

if (getApps().length === 0) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    console.error("❌ Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY in env");
    process.exit(1);
  }

  initializeApp({
    credential: cert({
      projectId: "promtapp-e6c0e",
      clientEmail,
      privateKey,
    }),
  });
}

const db = getFirestore();

// ── Migration ──────────────────────────────────────────────────────────────

async function migrate() {
  console.log("🔄 Migrating prompts: categoryId → categoryIds\n");

  const snap = await db.collection("prompts").get();
  let migrated = 0;
  let skipped = 0;
  let alreadyMigrated = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    // Already has categoryIds — skip
    if (data.categoryIds && Array.isArray(data.categoryIds)) {
      alreadyMigrated++;
      continue;
    }

    // No categoryId either — skip
    if (!data.categoryId) {
      console.log(`   ⏭️  ${doc.id} — no categoryId found, skipping`);
      skipped++;
      continue;
    }

    // Build update
    const updates = {
      categoryIds: [data.categoryId],
    };

    if (!DRY_RUN) {
      await doc.ref.update(updates);
    }

    console.log(`   ✅ ${doc.id} — categoryId="${data.categoryId}" → categoryIds=["${data.categoryId}"]`);
    migrated++;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Total prompts: ${snap.size}`);
  console.log(`  Migrated:     ${migrated}${DRY_RUN ? " (dry run)" : ""}`);
  console.log(`  Already done: ${alreadyMigrated}`);
  console.log(`  Skipped:      ${skipped}`);

  if (DRY_RUN && migrated > 0) {
    console.log(`\n👉 Run without --dry-run to apply changes`);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  });
