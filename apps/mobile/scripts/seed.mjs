/**
 * Seed script — populates Firestore emulator with sample data.
 *
 * Usage:
 *   pnpm emulators:seed
 *
 * Requires Firebase emulators running on localhost:8080.
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
} from "firebase/firestore";

// ─── Firebase Config (emulator defaults) ────────────────────────────────────

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:000000000000",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Sample Categories ──────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "marketing", name: "Marketing", slug: "marketing", icon: "📈", color: "#007AFF", order: 0, isActive: true, createdAt: Date.now() },
  { id: "creative-writing", name: "Creative Writing", slug: "creative-writing", icon: "✍️", color: "#AF52DE", order: 1, isActive: true, createdAt: Date.now() },
  { id: "coding", name: "Coding", slug: "coding", icon: "💻", color: "#34C759", order: 2, isActive: true, createdAt: Date.now() },
  { id: "business", name: "Business", slug: "business", icon: "💼", color: "#FF9500", order: 3, isActive: true, createdAt: Date.now() },
  { id: "social-media", name: "Social Media", slug: "social-media", icon: "📱", color: "#FF2D92", order: 4, isActive: true, createdAt: Date.now() },
  { id: "education", name: "Education", slug: "education", icon: "📚", color: "#5856D6", order: 5, isActive: true, createdAt: Date.now() },
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

// ─── Sample Admin User ──────────────────────────────────────────────────────

const ADMIN_USER = {
  uid: "admin-demo-001",
  email: "admin@promptseen.com",
  displayName: "Demo Admin",
  isAdmin: true,
  createdAt: Date.now(),
};

// ─── Sample Collections ─────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    id: "col-marketing-essentials",
    ownerId: "admin-demo-001",
    name: "Marketing Essentials",
    description: "Must-have marketing prompts for any campaign",
    color: "#007AFF",
    icon: "📈",
    promptIds: ["prompt-001", "prompt-002", "prompt-003", "prompt-004"],
    promptCount: 4,
    isPublic: true,
    likesCount: 128,
    duplicatesCount: 23,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: "col-coding-collection",
    ownerId: "admin-demo-001",
    name: "Coding Prompts",
    description: "Developer-focused prompts for code generation",
    color: "#34C759",
    icon: "💻",
    promptIds: ["prompt-008", "prompt-009", "prompt-010", "prompt-011"],
    promptCount: 4,
    isPublic: true,
    likesCount: 89,
    duplicatesCount: 15,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

// ─── Sample Submissions ─────────────────────────────────────────────────────

const SUBMISSIONS = [
  {
    id: "sub-demo-001",
    submitterUid: "user-demo-001",
    submitterName: "John Doe",
    text: "Create a Twitter thread about 10 productivity hacks for remote workers.",
    imageUrl: "",
    suggestedCategoryId: "social-media",
    tags: ["twitter", "productivity", "remote-work"],
    status: "pending",
    reviewNote: "",
    reviewedBy: null,
    reviewedAt: null,
    approvedPromptId: null,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "sub-demo-002",
    submitterUid: "user-demo-002",
    submitterName: "Jane Smith",
    text: "Write a LinkedIn post about the future of AI in healthcare.",
    imageUrl: "",
    suggestedCategoryId: "marketing",
    tags: ["linkedin", "ai", "healthcare"],
    status: "approved",
    reviewNote: "Great prompt, approved!",
    reviewedBy: "admin-demo-001",
    reviewedAt: Date.now() - 43200000,
    approvedPromptId: "prompt-021",
    createdAt: Date.now() - 172800000,
  },
  {
    id: "sub-demo-003",
    submitterUid: "user-demo-003",
    submitterName: "Bob Wilson",
    text: "Buy my product at example.com",
    imageUrl: "",
    suggestedCategoryId: "marketing",
    tags: ["spam"],
    status: "rejected",
    reviewNote: "This is spam, not a prompt.",
    reviewedBy: "admin-demo-001",
    reviewedAt: Date.now() - 21600000,
    approvedPromptId: null,
    createdAt: Date.now() - 259200000,
  },
];

// ─── Seed Function ──────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Seeding Firestore...\n");

  const existingPrompts = await getDocs(collection(db, "prompts"));
  if (existingPrompts.size > 0) {
    console.log(`⚠️  Database already has ${existingPrompts.size} prompts. Skipping seed.`);
    return;
  }

  // Seed categories
  console.log(`📂 Seeding ${CATEGORIES.length} categories...`);
  for (const cat of CATEGORIES) {
    const { id, ...data } = cat;
    await setDoc(doc(db, "categories", id), data);
    console.log(`   ✅ ${cat.icon} ${cat.name}`);
  }

  // Update prompt counts on categories
  const categoryPromptCounts = {};
  for (const prompt of PROMPTS) {
    categoryPromptCounts[prompt.categoryId] =
      (categoryPromptCounts[prompt.categoryId] || 0) + 1;
  }
  for (const [catId, count] of Object.entries(categoryPromptCounts)) {
    await setDoc(doc(db, "categories", catId), { promptCount: count }, { merge: true });
  }

  // Seed prompts
  console.log(`\n📝 Seeding ${PROMPTS.length} prompts...`);
  for (let i = 0; i < PROMPTS.length; i++) {
    const prompt = PROMPTS[i];
    const id = `prompt-${String(i + 1).padStart(3, "0")}`;
    const imageUrl = `https://picsum.photos/seed/${id}/1080/1350`;

    await setDoc(doc(db, "prompts", id), {
      ...prompt,
      imageUrl,
      cloudinaryPublicId: "",
      likesCount: Math.floor(Math.random() * 500),
      copiesCount: Math.floor(Math.random() * 200),
      shareCount: Math.floor(Math.random() * 100),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log(`   ✅ ${prompt.tags[0]} — ${prompt.text.slice(0, 50)}...`);
  }

  // Seed admin user
  console.log(`\n👤 Seeding admin user...`);
  const { uid, ...userData } = ADMIN_USER;
  await setDoc(doc(db, "users", uid), userData);
  console.log(`   ✅ ${ADMIN_USER.email}`);

  // Seed collections
  console.log(`\n📁 Seeding ${COLLECTIONS.length} collections...`);
  for (const col of COLLECTIONS) {
    const { id, ...data } = col;
    await setDoc(doc(db, "collections", id), data);
    console.log(`   ✅ ${col.icon} ${col.name}`);
  }

  // Seed submissions
  console.log(`\n📨 Seeding ${SUBMISSIONS.length} submissions...`);
  for (const sub of SUBMISSIONS) {
    const { id, ...data } = sub;
    await setDoc(doc(db, "submissions", id), data);
    console.log(`   ✅ [${sub.status}] ${sub.text.slice(0, 50)}...`);
  }

  // Seed daily stats
  console.log(`\n📊 Seeding daily stats...`);
  const today = new Date().toISOString().split("T")[0];
  await setDoc(doc(db, "daily_stats", today), {
    date: today,
    activeUsers: 42,
    promptViews: 1250,
    likes: 89,
    copies: 56,
    shares: 23,
    adImpressions: 312,
    rewardCompletes: 18,
    submissions: 3,
    newUsers: 7,
    topPromptIds: ["prompt-001", "prompt-005", "prompt-008"],
    topCategoryIds: ["marketing", "coding"],
    createdAt: Date.now(),
  });
  console.log(`   ✅ ${today}`);

  // Seed sample FCM tokens
  console.log(`\n📱 Seeding sample FCM tokens...`);
  const sampleTokens = [
    { id: "token-demo-001", token: "ExpoPushToken[demo-token-001]", userId: "user-demo-001", platform: "android", appVersion: "1.0.0", isActive: true, createdAt: Date.now(), lastSeenAt: Date.now() },
    { id: "token-demo-002", token: "ExpoPushToken[demo-token-002]", userId: "user-demo-002", platform: "ios", appVersion: "1.0.0", isActive: true, createdAt: Date.now(), lastSeenAt: Date.now() },
    { id: "token-demo-003", token: "ExpoPushToken[demo-token-003]", userId: null, platform: "android", appVersion: "1.0.0", isActive: true, createdAt: Date.now(), lastSeenAt: Date.now() },
  ];
  for (const token of sampleTokens) {
    await setDoc(doc(db, "fcm_tokens", token.id), token);
    console.log(`   ✅ ${token.platform} device ${token.id}`);
  }

  // Seed sample push notifications
  console.log(`\n🔔 Seeding sample push notifications...`);
  const sampleNotifications = [
    { id: "notif-demo-001", title: "Welcome to PromptSeen! 🎉", body: "Discover thousands of curated AI prompts.", imageUrl: "", data: {}, target: "all", topic: "", token: "", sentCount: 3, deliveredCount: 3, sentBy: "admin-demo-001", source: "manual", promptId: null, createdAt: Date.now() - 86400000 },
    { id: "notif-demo-002", title: "New Marketing Prompts ✨", body: "Check out 5 new prompts for your next campaign.", imageUrl: "", data: { promptId: "prompt-001" }, target: "all", topic: "", token: "", sentCount: 3, deliveredCount: 3, sentBy: "admin-demo-001", source: "auto", promptId: "prompt-001", createdAt: Date.now() - 43200000 },
  ];
  for (const notif of sampleNotifications) {
    await setDoc(doc(db, "push_notifications", notif.id), notif);
    console.log(`   ✅ ${notif.title}`);
  }

  console.log("\n🎉 Seed complete!");
  console.log(`   ${CATEGORIES.length} categories`);
  console.log(`   ${PROMPTS.length} prompts`);
  console.log(`   1 admin user`);
  console.log(`   ${COLLECTIONS.length} collections`);
  console.log(`   ${SUBMISSIONS.length} submissions`);
  console.log(`   ${sampleNotifications.length} push notifications`);
  console.log(`   ${sampleTokens.length} FCM tokens`);
  console.log(`   1 daily stats entry\n`);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
