/**
 * Admin Seed Script — populates Firestore with sample data using firebase-admin SDK.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requires:
 *   FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY env vars (or .env.local)
 *
 * This script seeds:
 *   - 6 categories
 *   - 20 prompts with images
 *   - 1 admin user
 *   - 2 sample collections
 *   - 5 submissions
 *   - 14 days of daily stats
 *   - 3 FCM tokens
 *   - 5 sample users
 *   - 5 push notifications
 *   - 1 settings document
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from web directory
config({ path: join(__dirname, "..", ".env.local") });
config({ path: join(__dirname, "..", ".env") });

// ─── Initialize Firebase Admin ───────────────────────────────────────────────

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "❌ Missing Firebase Admin credentials.\n" +
      "   Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in apps/web/.env.local\n" +
      "   You can generate a service account key from Firebase Console → Project Settings → Service Accounts"
  );
  process.exit(1);
}

let app;
if (getApps().length > 0) {
  app = getApps()[0];
} else {
  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const db = getFirestore(app);

// ─── Sample Categories ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "marketing", name: "Marketing", slug: "marketing", icon: "📈", color: "#007AFF", order: 0, isActive: true, promptCount: 4 },
  { id: "creative-writing", name: "Creative Writing", slug: "creative-writing", icon: "✍️", color: "#AF52DE", order: 1, isActive: true, promptCount: 4 },
  { id: "coding", name: "Coding", slug: "coding", icon: "💻", color: "#34C759", order: 2, isActive: true, promptCount: 4 },
  { id: "business", name: "Business", slug: "business", icon: "💼", color: "#FF9500", order: 3, isActive: true, promptCount: 3 },
  { id: "social-media", name: "Social Media", slug: "social-media", icon: "📱", color: "#FF2D92", order: 4, isActive: true, promptCount: 3 },
  { id: "education", name: "Education", slug: "education", icon: "📚", color: "#5856D6", order: 5, isActive: true, promptCount: 2 },
];

// ─── Sample Prompts ─────────────────────────────────────────────────────────

const PROMPTS = [
  { text: "Create a compelling email subject line for a Black Friday sale that increases open rates.", categoryId: "marketing", tags: ["email", "subject-line", "black-friday"], isPremium: false, order: 0 },
  { text: "Write a 30-second elevator pitch for a SaaS product that helps small businesses automate social media.", categoryId: "marketing", tags: ["elevator-pitch", "saas", "social-media"], isPremium: false, order: 1 },
  { text: "Generate a week-long Instagram content calendar for a fitness brand.", categoryId: "marketing", tags: ["instagram", "content-calendar", "fitness"], isPremium: true, order: 2 },
  { text: "Create a viral LinkedIn post template about overcoming imposter syndrome in tech.", categoryId: "marketing", tags: ["linkedin", "viral", "storytelling"], isPremium: false, order: 3 },
  { text: "Write the opening paragraph of a mystery novel set in a cyberpunk city.", categoryId: "creative-writing", tags: ["mystery", "cyberpunk", "opening"], isPremium: false, order: 4 },
  { text: "Write a haiku collection about the four seasons.", categoryId: "creative-writing", tags: ["haiku", "poetry", "seasons"], isPremium: false, order: 5 },
  { text: "Create a character profile for a reluctant hero in a fantasy world.", categoryId: "creative-writing", tags: ["character", "fantasy", "hero"], isPremium: true, order: 6 },
  { text: "Write a TypeScript function that debounces any async function with configurable delay.", categoryId: "coding", tags: ["typescript", "debounce", "async"], isPremium: false, order: 7 },
  { text: "Create a React custom hook for infinite scroll pagination with error handling.", categoryId: "coding", tags: ["react", "hook", "infinite-scroll"], isPremium: true, order: 8 },
  { text: "Write a SQL query that finds the top 5 customers by total spend in the last 90 days.", categoryId: "coding", tags: ["sql", "analytics", "customers"], isPremium: false, order: 9 },
  { text: "Create a Python script that validates email addresses using regex and checks MX records.", categoryId: "coding", tags: ["python", "email", "validation"], isPremium: false, order: 10 },
  { text: "Create a one-page business plan template for a subscription-based meal planning app.", categoryId: "business", tags: ["business-plan", "subscription"], isPremium: true, order: 11 },
  { text: "Write a professional cold outreach email for B2B SaaS sales.", categoryId: "business", tags: ["cold-email", "b2b", "sales"], isPremium: false, order: 12 },
  { text: "Create a SWOT analysis framework for a new coffee shop.", categoryId: "business", tags: ["swot", "coffee-shop", "analysis"], isPremium: false, order: 13 },
  { text: "Write 10 engaging TikTok video scripts for a skincare brand.", categoryId: "social-media", tags: ["tiktok", "skincare", "video-scripts"], isPremium: true, order: 14 },
  { text: "Create a Twitter/X thread template about lessons learned from building a startup.", categoryId: "social-media", tags: ["twitter", "thread", "startup"], isPremium: false, order: 15 },
  { text: "Write 5 Pinterest pin descriptions for a home decor brand.", categoryId: "social-media", tags: ["pinterest", "home-decor", "seo"], isPremium: false, order: 16 },
  { text: "Create a study guide template for learning a new programming language.", categoryId: "education", tags: ["study-guide", "programming"], isPremium: false, order: 17 },
  { text: "Write a Socratic dialogue about the ethics of artificial intelligence.", categoryId: "education", tags: ["socratic", "ai-ethics", "dialogue"], isPremium: true, order: 18 },
  { text: "Create a quiz with 10 multiple-choice questions about world geography.", categoryId: "education", tags: ["quiz", "geography", "trivia"], isPremium: false, order: 19 },
];

// ─── Seed Function ──────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding Firestore with firebase-admin SDK...\n");

  // Check if data already exists
  const existingPrompts = await db.collection("prompts").limit(1).get();
  if (existingPrompts.size > 0) {
    console.log("⚠️  Database already has data. Skipping seed.");
    console.log("   To re-seed, delete existing data first or use --force flag.");
    if (!process.argv.includes("--force")) {
      process.exit(0);
    }
    console.log("   --force flag detected. Re-seeding...\n");
  }

  const batch = db.batch();

  // Seed categories
  console.log(`📂 Seeding ${CATEGORIES.length} categories...`);
  for (const cat of CATEGORIES) {
    const ref = db.collection("categories").doc(cat.id);
    batch.set(ref, { ...cat, createdAt: Date.now() });
  }

  // Seed prompts
  console.log(`📝 Seeding ${PROMPTS.length} prompts...`);
  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const id = `prompt-${String(i + 1).padStart(3, "0")}`;
    const imageUrl = `https://picsum.photos/seed/${id}/1080/1350`;

    const ref = db.collection("prompts").doc(id);
    batch.set(ref, {
      ...prompt,
      imageUrl,
      cloudinaryPublicId: "",
      likesCount: Math.floor(Math.random() * 500) + 10,
      copiesCount: Math.floor(Math.random() * 200) + 5,
      shareCount: Math.floor(Math.random() * 100) + 2,
      isActive: true,
      createdAt: Date.now() - Math.floor(Math.random() * 604800000),
      updatedAt: Date.now(),
    });
  }

  // Seed admin user
  console.log("👤 Seeding admin user...");
  // Use the actual Firebase Auth UID so isAdmin() rule works
  const ADMIN_UID = "lRfHy36MNfY6Fnw73i1BA8M01W63";
  const adminRef = db.collection("users").doc(ADMIN_UID);
  batch.set(adminRef, {
    email: "admin@tsprompt.com",
    displayName: "Demo Admin",
    isAdmin: true,
    createdAt: Date.now(),
  });

  // Seed sample users
  console.log("👥 Seeding sample users...");
  const users = [
    { uid: "user-demo-001", email: "john@example.com", displayName: "John Doe", favorites: ["prompt-001", "prompt-005"] },
    { uid: "user-demo-002", email: "jane@example.com", displayName: "Jane Smith", favorites: ["prompt-003", "prompt-008"] },
    { uid: "user-demo-003", email: "bob@example.com", displayName: "Bob Wilson", favorites: ["prompt-012"] },
    { uid: "user-demo-004", email: "alice@example.com", displayName: "Alice Chen", favorites: ["prompt-002", "prompt-007", "prompt-015"] },
    { uid: "user-demo-005", email: "charlie@example.com", displayName: "Charlie Brown", favorites: [] },
  ];
  for (const user of users) {
    const ref = db.collection("users").doc(user.uid);
    batch.set(ref, { ...user, createdAt: Date.now() - Math.floor(Math.random() * 604800000) });
  }

  // Seed submissions
  console.log("📨 Seeding submissions...");
  const submissions = [
    { id: "sub-demo-001", submitterUid: "user-demo-001", submitterName: "John Doe", text: "Create a Twitter thread about 10 productivity hacks for remote workers.", imageUrl: "", suggestedCategoryId: "social-media", tags: ["twitter", "productivity", "remote-work"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
    { id: "sub-demo-002", submitterUid: "user-demo-002", submitterName: "Jane Smith", text: "Write a LinkedIn post about the future of AI in healthcare.", imageUrl: "", suggestedCategoryId: "marketing", tags: ["linkedin", "ai", "healthcare"], status: "approved", reviewNote: "Great prompt, approved!", reviewedBy: "admin-demo-001", reviewedAt: Date.now() - 43200000, approvedPromptId: "prompt-021" },
    { id: "sub-demo-003", submitterUid: "user-demo-003", submitterName: "Bob Wilson", text: "Buy my product at example.com", imageUrl: "", suggestedCategoryId: "marketing", tags: ["spam"], status: "rejected", reviewNote: "This is spam, not a prompt.", reviewedBy: "admin-demo-001", reviewedAt: Date.now() - 21600000, approvedPromptId: null },
    { id: "sub-demo-004", submitterUid: "user-demo-004", submitterName: "Alice Chen", text: "Write a Python script to automate social media posting across platforms.", imageUrl: "", suggestedCategoryId: "coding", tags: ["python", "automation", "social-media"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
    { id: "sub-demo-005", submitterUid: "user-demo-005", submitterName: "Charlie Brown", text: "Create a business proposal template for freelancers.", imageUrl: "", suggestedCategoryId: "business", tags: ["proposal", "freelancer", "template"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
  ];
  for (const sub of submissions) {
    const ref = db.collection("submissions").doc(sub.id);
    batch.set(ref, { ...sub, createdAt: Date.now() - Math.floor(Math.random() * 259200000) });
  }

  // Seed daily stats (14 days)
  console.log("📊 Seeding daily stats (14 days)...");
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const ref = db.collection("daily_stats").doc(dateStr);
    batch.set(ref, {
      date: dateStr,
      activeUsers: 20 + Math.floor(Math.random() * 60),
      promptViews: 400 + Math.floor(Math.random() * 800),
      likes: 20 + Math.floor(Math.random() * 80),
      copies: 10 + Math.floor(Math.random() * 40),
      shares: 5 + Math.floor(Math.random() * 25),
      adImpressions: 100 + Math.floor(Math.random() * 300),
      rewardCompletes: 5 + Math.floor(Math.random() * 20),
      submissions: Math.floor(Math.random() * 5),
      newUsers: 2 + Math.floor(Math.random() * 8),
      topPromptIds: ["prompt-001", "prompt-005", "prompt-008"],
      topCategoryIds: ["marketing", "coding"],
      createdAt: d.getTime(),
    });
  }

  // Seed FCM tokens
  console.log("📱 Seeding FCM tokens...");
  const tokens = [
    { id: "token-demo-001", token: "ExpoPushToken[demo-token-001]", userId: "user-demo-001", platform: "android", appVersion: "1.0.0", isActive: true },
    { id: "token-demo-002", token: "ExpoPushToken[demo-token-002]", userId: "user-demo-002", platform: "ios", appVersion: "1.0.0", isActive: true },
    { id: "token-demo-003", token: "ExpoPushToken[demo-token-003]", userId: null, platform: "android", appVersion: "1.0.0", isActive: true },
  ];
  for (const token of tokens) {
    const ref = db.collection("fcm_tokens").doc(token.id);
    batch.set(ref, { ...token, createdAt: Date.now(), lastSeenAt: Date.now() });
  }

  // Seed push notifications
  console.log("🔔 Seeding push notifications...");
  const notifications = [
    { id: "notif-demo-001", title: "Welcome to TS Prompt! 🎉", body: "Discover thousands of curated AI prompts for marketing, coding, and more.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 3, sentBy: ADMIN_UID, source: "manual", promptId: null },
    { id: "notif-demo-002", title: "New Marketing Prompts ✨", body: "Check out 5 new prompts for your next campaign.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 4, sentBy: ADMIN_UID, source: "auto", promptId: "prompt-001" },
    { id: "notif-demo-003", title: "🔥 Trending: Coding Prompts", body: "These coding prompts are getting 3x more copies this week.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 4, openedCount: 2, sentBy: ADMIN_UID, source: "manual", promptId: null },
    { id: "notif-demo-004", title: "New Creative Writing Prompts", body: "Unleash your creativity with 8 new writing prompts.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 3, sentBy: ADMIN_UID, source: "auto", promptId: "prompt-005" },
    { id: "notif-demo-005", title: "Weekly Digest 📊", body: "Your app got 1,250 prompt views this week. Keep it up!", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 4, sentBy: ADMIN_UID, source: "manual", promptId: null },
  ];
  for (let i = 0; i < notifications.length; i++) {
    const ref = db.collection("push_notifications").doc(notifications[i].id);
    batch.set(ref, { ...notifications[i], createdAt: Date.now() - i * 86400000 });
  }

  // Seed settings
  console.log("⚙️  Seeding settings...");
  const settingsRef = db.collection("settings").doc("notifications");
  batch.set(settingsRef, { autoNotifyNewPrompt: true }, { merge: true });

  // Commit batch
  console.log("\n⏳ Committing batch...");
  await batch.commit();

  console.log("\n🎉 Seed complete!\n");
  console.log("   Summary:");
  console.log(`   - ${CATEGORIES.length} categories`);
  console.log(`   - ${PROMPTS.length} prompts`);
  console.log(`   - 1 admin user (admin@tsprompt.com)`);
  console.log(`   - ${users.length} sample users`);
  console.log(`   - ${submissions.length} submissions`);
  console.log(`   - 14 days of daily stats`);
  console.log(`   - ${tokens.length} FCM tokens`);
  console.log(`   - ${notifications.length} push notifications`);
  console.log(`   - 1 settings document\n`);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
