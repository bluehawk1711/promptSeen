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
 *   - 10 image generation categories
 *   - 30 AI image generation prompts
 *   - 1 admin user
 *   - 5 sample users
 *   - 5 submissions
 *   - 14 days of daily stats
 *   - 3 FCM tokens
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

// ─── Categories ──────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "boys", name: "Boys", slug: "boys", icon: "👦", color: "#3B82F6", order: 0, isActive: true, promptCount: 3 },
  { id: "girls", name: "Girls", slug: "girls", icon: "👧", color: "#EC4899", order: 1, isActive: true, promptCount: 3 },
  { id: "couples", name: "Couples", slug: "couples", icon: "💑", color: "#F43F5E", order: 2, isActive: true, promptCount: 3 },
  { id: "fantasy", name: "Fantasy", slug: "fantasy", icon: "🧙", color: "#8B5CF6", order: 3, isActive: true, promptCount: 3 },
  { id: "anime", name: "Anime", slug: "anime", icon: "🎭", color: "#F97316", order: 4, isActive: true, promptCount: 3 },
  { id: "nature", name: "Nature", slug: "nature", icon: "🌿", color: "#22C55E", order: 5, isActive: true, promptCount: 3 },
  { id: "cyberpunk", name: "Cyberpunk", slug: "cyberpunk", icon: "🤖", color: "#06B6D4", order: 6, isActive: true, promptCount: 3 },
  { id: "vintage", name: "Vintage", slug: "vintage", icon: "📸", color: "#A855F7", order: 7, isActive: true, promptCount: 3 },
  { id: "food", name: "Food & Drinks", slug: "food-drinks", icon: "🍔", color: "#EAB308", order: 8, isActive: true, promptCount: 3 },
  { id: "vehicles", name: "Vehicles", slug: "vehicles", icon: "🚗", color: "#EF4444", order: 9, isActive: true, promptCount: 3 },
];

// ─── Prompts ─────────────────────────────────────────────────────────────────

/**
 * Sample prompt video (YouTube).
 *
 * Mirrors the shape produced by `@repo/shared/video` — the seed script is plain
 * Node so it builds the record inline instead of importing the TS module.
 * Replace these ids with real content videos before shipping.
 */
const SAMPLE_YOUTUBE_VIDEO = (youtubeId) => ({
  type: "youtube",
  url: `https://www.youtube.com/watch?v=${youtubeId}`,
  publicId: "",
  youtubeId,
  thumbnailUrl: `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
});

const PROMPTS = [
  // Boys
  { text: "A young boy standing on a rooftop at sunset, wind blowing through his hair, cinematic lighting, ultra realistic, 8K, shot on Canon EOS R5", categoryId: "boys", tags: ["portrait", "sunset", "cinematic", "realistic"], isPremium: false, order: 0, video: SAMPLE_YOUTUBE_VIDEO("aqz-KE-bpKQ") },
  { text: "Boy sitting in a cozy library surrounded by floating glowing books, magical atmosphere, fantasy art, digital painting, highly detailed", categoryId: "boys", tags: ["fantasy", "library", "glow", "magical"], isPremium: true, order: 1 },
  { text: "Teenage boy skateboarding in an empty urban street at golden hour, motion blur, street photography style, vivid colors, 4K", categoryId: "boys", tags: ["skateboard", "urban", "golden-hour", "action"], isPremium: false, order: 2 },

  // Girls
  { text: "Portrait of a girl with flowers in her hair, soft natural light, dreamy bokeh background, fashion photography, 85mm lens, ultra sharp", categoryId: "girls", tags: ["portrait", "flowers", "bokeh", "fashion"], isPremium: false, order: 3 },
  { text: "Girl in a flowing red dress dancing in the rain on a cobblestone street, cinematic, moody tones, reflections on wet ground, photorealistic", categoryId: "girls", tags: ["rain", "dress", "cinematic", "moody"], isPremium: true, order: 4 },
  { text: "Young girl astronaut floating in zero gravity inside a space station, looking out at Earth, sci-fi, hyper detailed, Unreal Engine 5 render", categoryId: "girls", tags: ["astronaut", "space", "sci-fi", "zero-gravity"], isPremium: false, order: 5 },

  // Couples
  { text: "Couple walking hand in hand through a field of lavender at golden hour, backlit, romantic, soft focus, fine art photography", categoryId: "couples", tags: ["romantic", "lavender", "golden-hour", "fine-art"], isPremium: false, order: 6, video: SAMPLE_YOUTUBE_VIDEO("jNQXAC9IVRw") },
  { text: "Elderly couple sitting on a bench watching the sunset over the ocean, warm tones, emotional, cinematic composition, photorealistic", categoryId: "couples", tags: ["elderly", "sunset", "ocean", "emotional"], isPremium: true, order: 7 },
  { text: "Couple dancing under a canopy of string lights at night, warm ambient glow, shallow depth of field, romantic atmosphere, 4K photography", categoryId: "couples", tags: ["dancing", "string-lights", "night", "romantic"], isPremium: false, order: 8 },

  // Fantasy
  { text: "Majestic dragon perched on a cliff edge overlooking a misty valley, dramatic lighting, epic fantasy art, detailed scales, volumetric fog", categoryId: "fantasy", tags: ["dragon", "cliff", "epic", "fog"], isPremium: true, order: 9 },
  { text: "Enchanted forest with bioluminescent mushrooms and floating fireflies, magical atmosphere, concept art, vibrant colors, highly detailed", categoryId: "fantasy", tags: ["forest", "bioluminescent", "magical", "fireflies"], isPremium: false, order: 10 },
  { text: "Warrior princess standing on a battlefield at dawn, glowing armor, flowing cape, epic pose, cinematic fantasy art, 8K ultra detailed", categoryId: "fantasy", tags: ["warrior", "princess", "battlefield", "epic"], isPremium: true, order: 11 },

  // Anime
  { text: "Anime girl with blue hair sitting on a crescent moon, starry night sky, Studio Ghibli style, soft pastel colors, dreamy atmosphere", categoryId: "anime", tags: ["anime", "moon", "starry", "ghibli"], isPremium: false, order: 12, video: SAMPLE_YOUTUBE_VIDEO("aqz-KE-bpKQ") },
  { text: "Anime boy with white hair and red eyes standing in falling cherry blossoms, dynamic pose, detailed background, Makoto Shinkai style", categoryId: "anime", tags: ["anime", "cherry-blossom", "dynamic", "shinkai"], isPremium: true, order: 13 },
  { text: "Anime mecha robot in a destroyed city, dramatic sky, battle scars, detailed mechanical parts, evangelion inspired, cinematic composition", categoryId: "anime", tags: ["mecha", "robot", "battle", "evangelion"], isPremium: false, order: 14 },

  // Nature
  { text: "Majestic waterfall cascading into a turquoise pool surrounded by lush tropical jungle, long exposure, vibrant colors, National Geographic style", categoryId: "nature", tags: ["waterfall", "tropical", "long-exposure", "vibrant"], isPremium: false, order: 15 },
  { text: "Northern lights dancing over a frozen lake in Iceland, perfect reflection, stars visible, astrophotography, ultra wide angle, 8K", categoryId: "nature", tags: ["aurora", "iceland", "reflection", "astrophotography"], isPremium: true, order: 16 },
  { text: "Lone oak tree in a misty meadow at sunrise, golden light rays breaking through fog, peaceful, minimalist composition, fine art landscape", categoryId: "nature", tags: ["oak-tree", "misty", "sunrise", "minimalist"], isPremium: false, order: 17 },

  // Cyberpunk
  { text: "Cyberpunk street vendor in a neon-lit alley in Tokyo, rain-soaked streets, holographic signs, blade runner aesthetic, photorealistic, 4K", categoryId: "cyberpunk", tags: ["cyberpunk", "neon", "tokyo", "rain"], isPremium: true, order: 18 },
  { text: "Cyborg woman with glowing circuit tattoos, half face mechanical, dark moody lighting, sci-fi portrait, ultra detailed, concept art", categoryId: "cyberpunk", tags: ["cyborg", "circuit", "sci-fi", "portrait"], isPremium: false, order: 19 },
  { text: "Futuristic city skyline at night with flying cars and massive holographic billboards, cyberpunk 2077 style, ultra wide, detailed", categoryId: "cyberpunk", tags: ["city", "flying-cars", "hologram", "futuristic"], isPremium: false, order: 20 },

  // Vintage
  { text: "Vintage 1950s diner scene, neon signs, chrome details, classic car parked outside, Kodachrome film aesthetic, warm tones, nostalgic", categoryId: "vintage", tags: ["1950s", "diner", "neon", "kodachrome"], isPremium: false, order: 21 },
  { text: "Old man with a weathered face sitting in a rustic workshop, Rembrandt lighting, black and white, documentary photography, emotional", categoryId: "vintage", tags: ["portrait", "workshop", "rembrandt", "black-and-white"], isPremium: true, order: 22 },
  { text: "Abandoned Victorian greenhouse overgrown with wildflowers, golden hour light streaming through broken glass, atmospheric, moody, detailed", categoryId: "vintage", tags: ["greenhouse", "abandoned", "golden-hour", "atmospheric"], isPremium: false, order: 23 },

  // Food & Drinks
  { text: "Artisan latte with intricate latte art in a ceramic cup on a wooden table, morning light, overhead shot, food photography, shallow DOF", categoryId: "food-drinks", tags: ["latte", "art", "overhead", "food-photography"], isPremium: false, order: 24 },
  { text: "Gourmet burger with melted cheese dripping, lettuce, tomato, sesame bun, dark background, studio lighting, macro, appetizing, 4K", categoryId: "food-drinks", tags: ["burger", "gourmet", "macro", "studio-lighting"], isPremium: true, order: 25 },
  { text: "Colorful acai bowl topped with fresh berries, granola, coconut flakes, overhead view, bright natural light, clean aesthetic, food styling", categoryId: "food-drinks", tags: ["acai", "berries", "overhead", "healthy"], isPremium: false, order: 26 },

  // Vehicles
  { text: "Classic 1967 Shelby GT500 Mustang in midnight blue, dramatic studio lighting, reflective floor, automotive photography, ultra detailed", categoryId: "vehicles", tags: ["mustang", "classic", "studio", "automotive"], isPremium: false, order: 27 },
  { text: "Futuristic electric hypercar on a desert highway at sunset, motion blur, lens flare, sci-fi automotive concept art, cinematic", categoryId: "vehicles", tags: ["hypercar", "electric", "sunset", "concept-art"], isPremium: true, order: 28 },
  { text: "Vintage motorcycle parked on a scenic mountain road, autumn foliage, warm tones, adventure photography, wide angle, sharp detail", categoryId: "vehicles", tags: ["motorcycle", "mountain", "autumn", "adventure"], isPremium: false, order: 29 },
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
    const { categoryId, ...rest } = prompt;
    batch.set(ref, {
      ...rest,
      categoryIds: [categoryId],
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
    { id: "sub-demo-001", submitterUid: "user-demo-001", submitterName: "John Doe", text: "Portrait of a samurai warrior in cyberpunk Tokyo, neon rain, detailed armor, cinematic lighting, 8K", imageUrl: "", suggestedCategoryId: "cyberpunk", tags: ["samurai", "cyberpunk", "neon", "cinematic"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
    { id: "sub-demo-002", submitterUid: "user-demo-002", submitterName: "Jane Smith", text: "Underwater palace with bioluminescent coral, mermaid silhouette, ethereal glow, fantasy art, highly detailed", imageUrl: "", suggestedCategoryId: "fantasy", tags: ["underwater", "palace", "mermaid", "fantasy"], status: "approved", reviewNote: "Beautiful concept!", reviewedBy: ADMIN_UID, reviewedAt: Date.now() - 43200000, approvedPromptId: null },
    { id: "sub-demo-003", submitterUid: "user-demo-003", submitterName: "Bob Wilson", text: "Buy followers at cheap.com", imageUrl: "", suggestedCategoryId: "boys", tags: ["spam"], status: "rejected", reviewNote: "Spam content.", reviewedBy: ADMIN_UID, reviewedAt: Date.now() - 21600000, approvedPromptId: null },
    { id: "sub-demo-004", submitterUid: "user-demo-004", submitterName: "Alice Chen", text: "Girl in a white dress walking through a field of sunflowers, golden hour, soft focus, dreamy, fine art photography", imageUrl: "", suggestedCategoryId: "girls", tags: ["sunflowers", "golden-hour", "dreamy", "fine-art"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
    { id: "sub-demo-005", submitterUid: "user-demo-005", submitterName: "Charlie Brown", text: "Retro spaceship interior, analog controls, worn metal, sci-fi vintage, detailed, cinematic lighting", imageUrl: "", suggestedCategoryId: "vintage", tags: ["spaceship", "retro", "sci-fi", "vintage"], status: "pending", reviewNote: "", reviewedBy: null, reviewedAt: null, approvedPromptId: null },
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
      topCategoryIds: ["boys", "fantasy", "cyberpunk"],
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
    { id: "notif-demo-001", title: "Welcome to TS Prompt! 🎉", body: "Discover thousands of AI image generation prompts for Midjourney, DALL-E, and more.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 3, sentBy: ADMIN_UID, source: "manual", promptId: null },
    { id: "notif-demo-002", title: "New Fantasy Prompts ✨", body: "Check out 3 new dragon and warrior prompts for your next generation.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 4, sentBy: ADMIN_UID, source: "auto", promptId: "prompt-010" },
    { id: "notif-demo-003", title: "🔥 Trending: Cyberpunk Art", body: "Cyberpunk prompts are getting 3x more copies this week.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 4, openedCount: 2, sentBy: ADMIN_UID, source: "manual", promptId: null },
    { id: "notif-demo-004", title: "New Anime Prompts 🎭", body: "Studio Ghibli and Makoto Shinkai inspired prompts just dropped.", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 3, sentBy: ADMIN_UID, source: "auto", promptId: "prompt-013" },
    { id: "notif-demo-005", title: "Weekly Digest 📊", body: "Your app got 1,250 prompt views this week. Keep generating!", imageUrl: "", target: "all", sentCount: 5, deliveredCount: 5, openedCount: 4, sentBy: ADMIN_UID, source: "manual", promptId: null },
  ];
  for (let i = 0; i < notifications.length; i++) {
    const ref = db.collection("push_notifications").doc(notifications[i].id);
    batch.set(ref, { ...notifications[i], createdAt: Date.now() - i * 86400000 });
  }

  // Seed settings — notifications + app remote config
  console.log("⚙️  Seeding settings...");
  const notifSettingsRef = db.collection("settings").doc("notifications");
  batch.set(notifSettingsRef, { autoNotifyNewPrompt: true }, { merge: true });

  const appSettingsRef = db.collection("settings").doc("app");
  batch.set(
    appSettingsRef,
    {
      latestVersion: "1.0.0",
      minVersion: "1.0.0",
      playStoreUrl: "",
      appStoreUrl: "",
      updateMode: "none",
      aboutText:
        "Prompt Seen is your intelligent AI companion designed to help you explore, create, and innovate. Powered by cutting-edge AI technology.",
      supportEmail: "support@tsprompt.com",
      socialLinks: [
        {
          id: "social-telegram",
          platform: "telegram",
          label: "Telegram",
          subtitle: "Join our Telegram channel",
          url: "https://t.me/tsprompt",
          order: 0,
          isActive: true,
        },
        {
          id: "social-instagram",
          platform: "instagram",
          label: "Instagram",
          subtitle: "Follow us on Instagram",
          url: "https://instagram.com/tsprompt",
          order: 1,
          isActive: true,
        },
        {
          id: "social-whatsapp",
          platform: "whatsapp",
          label: "WhatsApp",
          subtitle: "Join our WhatsApp channel",
          url: "https://whatsapp.com/channel/tsprompt",
          order: 2,
          isActive: true,
        },
      ],
      updatedAt: Date.now(),
    },
    { merge: true }
  );

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
  console.log(`   - 14 days of daily stats`);    console.log(`   - ${tokens.length} FCM tokens`);
    console.log(`   - ${notifications.length} push notifications`);
    console.log(`   - 2 settings documents (notifications + app config)\n`);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
