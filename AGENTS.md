# Prompt View — Architecture & Development Guide

## Overview

Prompt View is a curated AI prompt gallery app. Users browse prompts with images, like favorites, copy prompts, and unlock premium content via reward ads. The admin panel manages prompts, categories, and user feedback.

**Stack:** React Native (Expo 57) + Next.js 16 + Firebase + Cloudinary + pnpm monorepo

## Design System

### Color Palette
- **Primary:** Purple `#7C3AED`
- **Background:** Dark purple `#0D0A14` (dark) / Cream `#FFFBF5` (light)
- **Accent:** Purple glow effects with ambient lighting
- **Text:** Warm white `#FFF5EB` (dark) / Dark brown `#1A0A00` (light)

### Design Principles
1. **Warm & Premium** — Purple accent with warm brown undertones
2. **Glow Effects** — Subtle ambient glows around interactive elements
3. **Gradient System** — Reusable gradient components (Button, Card, Badge, Overlay, Header)
4. **Smooth Animations** — Spring-based transitions via Reanimated

## Monorepo Structure

```
promptSeen/
├── apps/
│   ├── mobile/              # React Native Expo app (users)
│   └── web/                 # Next.js admin panel (admins)
├── packages/
│   └── shared/              # Shared types, Firebase, Cloudinary, backup
├── .github/workflows/       # CI/CD pipelines
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # Workspace: apps/*, packages/*
├── tsconfig.base.json       # Shared TS config
├── AGENTS.md                # This file
├── README.md                # Project overview + setup guide
└── PERFORMANCE-PLAN.md      # Zero-loading architecture plan
```

## Shared Package (`packages/shared`)

Single source of truth for domain types and utilities.

### Exports
- **Types:** `Prompt`, `Category`, `UserProfile`, `Feedback`, `PromptSubmission`, `CloudinaryUploadResult`, `BackupData`
- **Firebase:** `initFirebase()` — platform-agnostic initialization with emulator support
- **Config:** `loadFirebaseConfig(prefix)` — loads `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` env vars
- **Errors:** `messageFor(error)` — user-friendly Firebase error messages
- **Cloudinary:** `uploadImagePipeline()`, `compressImage()`, `validateImageFile()`, `getCloudinaryUrl()`
- **Video:** `uploadVideoPipeline()`, `validateVideoFile()`, `parseYouTubeId()`, `createYouTubeVideo()`, `createUploadedVideo()`, `getYouTubeEmbedUrl()`, `hasPlayableVideo()`
- **Backup:** `exportFirestoreData()`, `importFirestoreData()`, `downloadBackup()`, `parseBackupFile()`
- **Theme:** `Colors`, `darkColors`, `lightColors`, `SPACING`, `FONT_SIZE`, etc.

### Import Paths
```ts
import { Prompt, Category, Feedback } from '@repo/shared/types';
import { initFirebase } from '@repo/shared/firebase';
import { loadFirebaseConfig } from '@repo/shared/config';
import { messageFor } from '@repo/shared/errors';
import { uploadImagePipeline } from '@repo/shared/cloudinary';
import { createYouTubeVideo } from '@repo/shared/video';
import { Colors } from '@repo/shared/theme';
```

## Mobile App (`apps/mobile`)

### Screens
| Route | Screen | Description |
|-------|--------|-------------|
| `/(tabs)/` | Home | Prompt grid with daily prompt, trending, search, categories |
| `/(tabs)/favorites` | Favorites | Liked prompts grid |
| `/(tabs)/videos` | Videos | Video prompts (YouTube + uploaded) |
| `/(tabs)/profile` | Profile | Settings, theme, feedback, social links, about |
| `/prompt/[id]` | Detail | Hero image, prompt text, copy, share, AI buttons (ChatGPT/Gemini) |
| `/feedback` | Feedback | Submit bug reports, feature requests, star ratings |
| `/onboarding` | Onboarding | 3-step premium intro with tilted image cards |
| `/privacy-policy` | Privacy | Privacy policy |

### State Management (Zustand)
- **`theme`** — Persisted theme mode (light/dark/system) → drives `ModeProvider` → `useColorScheme()`
- **`prompts`** — Firestore realtime sync, category filter, search
- **`categories`** — Firestore realtime sync
- **`favorites`** — Local persisted (AsyncStorage), toggle like, premium unlock
- **`feedback`** — Firestore write for user feedback submission
- **`onboarding`** — Persisted first-launch tracking + current step
- **`auth`** — Admin auth state (persisted)

### Key Components
- **`PromptCard`** — Premium card with gradient overlay, glass-like button, haptic feedback
- **`DailyPromptCard`** — Featured daily prompt with gradient overlay
- **`TrendingCard`** — Horizontal trending prompt card with rank badge
- **`CategoryChips`** — Animated horizontal filter pills
- **`VideoPlayer`** — WebView player for prompt videos (YouTube embed + Cloudinary MP4)
- **`AdBanner`** — AdMob banner (every 6 cards)
- **`RewardAd`** — Hook for reward ads to unlock premium prompts
- **`GradientButton`** — Animated CTA with expo-linear-gradient + Reanimated spring
- **`GradientCard`** — Border/solid/glow card variants
- **`GradientBadge`** — Purple gradient pill badge
- **`GradientOverlay`** — Reusable image gradient overlay
- **`GradientHeader`** — LinearGradient page header

### Theme Flow
```
Settings → useThemeStore.setMode() → Zustand (persisted)
    ↓
ModeProvider reads store → sets native Appearance
    ↓
useColorScheme() → Colors[colorScheme] → all components
```

### Premium Prompt Flow
- **Non-premium:** Direct copy (no ad, no blur/badge)
- **Premium locked:** Ad required to unlock → `useRewardAd` → `unlockPremium(promptId)`
- **Premium unlocked:** Direct copy (no ad again)
- **Persisted:** `unlockedPremiumIds` in Zustand/AsyncStorage

### Dependencies
- Expo 57, React Native 0.86
- `react-native-reanimated` — animations
- `react-native-google-mobile-ads` — AdMob (BannerAd, RewardedAd)
- `expo-clipboard` — copy prompts
- `expo-haptics` — haptic feedback
- `expo-image` — optimized image rendering with disk cache
- `bna-ui` — UI components (bottom-sheet, skeleton, spinner, etc.)
- `zustand` — state management
- `@react-native-async-storage/async-storage` — persistence

## Admin Panel (`apps/web`)

### Pages
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Stats: prompts, categories, engagement, feedback, notifications |
| `/admin/login` | Login | Email/password admin authentication |
| `/admin/prompts` | Prompts | CRUD table with image upload, category filter |
| `/admin/categories` | Categories | CRUD with color picker and emoji |
| `/admin/feedback` | Feedback | View user feedback (new/read/archived), mark as read |
| `/admin/analytics` | Analytics | Usage analytics and trends |
| `/admin/notifications` | Notifications | Send push notifications (all/specific token/topic) |
| `/admin/app-settings` | App Settings | Remote config (social links, about text, version) |
| `/admin/settings` | Settings | Backup/restore, Firebase info |

### Auth Flow
```
Login page → Firebase Auth (email/password)
    ↓
AuthProvider checks Firestore users/{uid} for isAdmin
    ↓
AdminLayout redirects to /admin/login if not authenticated
```

### Image Upload Pipeline
```
Select/Drop image → validate (type, size)
    ↓
Compress (Canvas API: resize to 1080x1350, JPEG 82%)
    ↓
Upload to Cloudinary (unsigned, with progress)
    ↓
Save URL + publicId to Firestore
```

### Key Components
- **`ImageUpload`** — Drag-drop with compression preview and Cloudinary upload
- **`VideoUpload`** — YouTube URL or file upload with Cloudinary video storage
- 18 shadcn/ui components (button, card, table, dialog, input, select, etc.)
- **`GradientButton`** — Tailwind CSS gradient CTA with direction prop
- **`GradientCard`** — Border/solid/glow card variants
- **`GradientBadge`** — Purple gradient pill badge
- **`GradientOverlay`** — CSS gradient overlay
- **`GradientHeader`** — Page header with gradient background
- PWA support via `next-pwa`

### Dependencies
- Next.js 16, React 19
- Firebase (client SDK)
- shadcn/ui + Tailwind CSS 4
- `zustand` — state management
- `@tanstack/react-query` — server state
- `next-pwa` — Progressive Web App

## Firebase Collections

### `prompts`
```ts
{
  id: string;                    // Firestore doc ID
  text: string;                  // Prompt text to copy
  imageUrl: string;              // Cloudinary URL
  cloudinaryPublicId: string;    // For management/deletion
  categoryIds: string[];         // References to categories (multi-category)
  order: number;                 // Display order
  likesCount: number;            // Denormalized counter
  copiesCount: number;           // Denormalized counter
  shareCount: number;            // Denormalized counter
  tags: string[];                // Search tokens
  isActive: boolean;             // Visibility toggle
  isPremium: boolean;            // Requires reward ad to unlock
  video?: {                      // Optional — null/absent = image-only prompt
    type: 'upload' | 'youtube';  // Cloudinary file or YouTube embed
    url: string;                 // MP4 delivery URL (upload) or YT link
    publicId: string;            // Cloudinary public_id ('' for YouTube)
    youtubeId: string;           // YouTube video id ('' for uploads)
    thumbnailUrl: string;        // Poster frame shown before playback
  } | null;
  createdAt: number;             // Epoch ms
  updatedAt: number;             // Epoch ms
}
```

### `categories`
```ts
{
  id: string;
  name: string;                  // "Marketing"
  slug: string;                  // "marketing"
  icon: string;                  // Emoji
  color: string;                 // Hex
  order: number;
  promptCount: number;           // Denormalized
  isActive: boolean;
  createdAt: number;
}
```

### `users`
```ts
{
  uid: string;                   // Firebase Auth UID
  email: string;
  displayName: string;
  isAdmin: boolean;
  createdAt: number;
}
```

### `feedback`
```ts
{
  id: string;                    // Firestore doc ID
  userId: string;                // User UID or 'anonymous'
  userName: string;              // Display name
  userEmail: string;             // Email (optional)
  category: 'bug' | 'feature' | 'improvement' | 'other';
  message: string;               // Feedback text
  rating: number | null;         // Star rating 1-5
  status: 'new' | 'read' | 'archived';
  adminNote: string;             // Admin notes
  createdAt: number;             // Epoch ms
}
```

### `fcm_tokens`
```ts
{
  token: string;                 // Expo push token
  userId: string | null;         // Associated user UID
  platform: 'ios' | 'android';
  appVersion: string;
  isActive: boolean;
  createdAt: number;
  lastSeenAt: number;
}
```

### `push_notifications`
```ts
{
  title: string;
  body: string;
  imageUrl: string;
  data: Record<string, string>;
  target: 'all' | 'topic' | 'token';
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  sentBy: string;
  source: 'manual' | 'auto';
  promptId: string | null;
  createdAt: number;
}
```

## Cloudinary Configuration

- **Target:** 1080x1350 (4:5 portrait), JPEG 82% quality
- **Upload:** Unsigned preset `prompts` (configurable)
- **Video:** Unsigned upload to `/video/upload` (folder `prompts/videos`, max 100MB), delivered as MP4 via `q_auto:good,vc_h264`
- **Transforms:** Server-side `c_fill,w_1080,h_1350,q_82,f_auto` as safety net
- **Delete:** Signed API route at `/api/cloudinary/delete` (`resourceType: 'image' | 'video'`)

### Required Env Vars
| Var | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Web | Client upload |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Web | Upload preset |
| `CLOUDINARY_CLOUD_NAME` | Web (server) | Delete API |
| `CLOUDINARY_API_KEY` | Web (server) | Delete API |
| `CLOUDINARY_API_SECRET` | Web (server) | Delete API |

## AdMob Configuration

- **Banner:** Every 6th card in the grid + prompt detail page
- **Reward:** Watch ad to unlock premium prompts
- **Production App ID:** `ca-app-pub-4814079986644290~8071437379`

### Required Env Vars
| Var | Where | Purpose |
|-----|-------|---------|
| `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID` | Mobile | Banner ads |
| `EXPO_PUBLIC_ADMOB_REWARD_AD_UNIT_ID` | Mobile | Reward ads |

## Push Notifications

- **Registration:** Automatic on app open via `expo-notifications`
- **Token storage:** Firestore `fcm_tokens` collection
- **Channels:** `default` (all), `prompts` (new prompts)
- **Delivery:** Expo Push Notification API with `extra.eas.projectId`
- **Auto-notify:** New prompts trigger notification to all users
- **Admin:** Manual send from `/admin/notifications`
- **Cleanup:** Stale tokens (DeviceNotRegistered) auto-deactivated on send failure

## Performance Architecture

See [PERFORMANCE-PLAN.md](PERFORMANCE-PLAN.md) for the full zero-loading architecture.

**3-Layer Cache:**
1. **AsyncStorage** (0ms) — persists 24 hours
2. **Upstash Redis** (~1-5ms) — via admin panel API
3. **Firestore realtime** (50-200ms) — always subscribed for live updates

**Image Optimization:**
- `expo-image` with `cachePolicy="memory-disk"` for all images
- Prefetch first 24 images on app mount
- Adjacent image prefetch on detail screen

## CI/CD

### GitHub Environments

| Environment | Firebase | Secrets |
|-------------|----------|---------|
| `dev` | `promtapp-e6c0e` | Firebase (dev), Cloudinary, Upstash, Admin SDK |
| `production` | `prompt-view-e59bc` | Firebase (prod), AdMob (prod), Admin API URL |

### Workflows

| Workflow | Trigger | Environment |
|----------|---------|-------------|
| `build-android.yml` | Manual (dev/release) | `dev` or `production` |
| `build-android-production.yml` | Manual | `production` |
| `build-web.yml` | Push to main / manual | `production` |

## Development

### Prerequisites
- Node.js 20+
- pnpm 9+
- Firebase CLI (`npm install -g firebase-tools`)

### Getting Started
```bash
# Install all dependencies
pnpm install

# Copy env files
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env

# Build shared package
pnpm --filter @repo/shared build

# Start mobile app
cd apps/mobile && pnpm start

# Start admin panel
cd apps/web && pnpm dev

# Start Firebase emulators
cd apps/mobile && pnpm emulators
```

### Typecheck
```bash
pnpm --filter web typecheck
pnpm --filter mobile typecheck
```

### Firebase Emulators
```bash
cd apps/mobile
pnpm emulators          # Start emulators
pnpm emulators:seed     # Seed sample data
```

## Backup & Restore

The admin panel Settings page provides:
- **Export:** Downloads all Firestore data as JSON
- **Import:** Uploads a backup file and restores documents
- **Scope:** prompts, categories, users, feedback collections

## Design Principles

1. **Zero duplication** — All shared logic lives in `packages/shared`
2. **Instant theme switching** — Zustand store drives all theme decisions
3. **Offline-first** — Favorites persist locally, Firestore syncs when available
4. **Premium feel** — Reanimated animations, haptic feedback, gradient components
5. **Accessible** — Safe area insets, proper contrast, semantic HTML
6. **Warm & inviting** — Purple accent with warm brown tones
