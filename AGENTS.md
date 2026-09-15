# TS Prompt — Architecture & Development Guide

## Overview

TS Prompt is a curated AI prompt gallery app. Users browse prompts with images, like favorites, copy prompts, and unlock premium content via reward ads. The admin panel manages prompts, categories, and users.

**Stack:** React Native (Expo) + Next.js 16 + Firebase + Cloudinary + pnpm monorepo

## Design System

### Color Palette
- **Primary:** Warm orange `#F26522` (light) / `#FF7A2E` (dark)
- **Background:** Dark brown `#0D0500` (dark mode default) / Cream `#FFFBF5` (light)
- **Accent:** Orange glow effects with ambient lighting
- **Text:** Warm white `#FFF5EB` (dark) / Dark brown `#1A0A00` (light)

### Design Principles
1. **Warm & Premium** — Orange accent with brown undertones, never cold grays
2. **Glow Effects** — Subtle ambient glows around interactive elements
3. **Cinematic Shadows** — Deep shadows with orange tint for depth
4. **Smooth Animations** — Spring-based transitions via Reanimated

## Monorepo Structure

```
promptSeen/
├── apps/
│   ├── mobile/              # React Native Expo app (users)
│   └── web/                 # Next.js admin panel (admins)
├── packages/
│   └── shared/              # Shared types, Firebase, Cloudinary, backup
├── package.json             # Root workspace config
├── pnpm-workspace.yaml      # Workspace: apps/*, packages/*
├── tsconfig.base.json       # Shared TS config
└── AGENTS.md                # This file
```

## Shared Package (`packages/shared`)

Single source of truth for domain types and utilities.

### Exports
- **Types:** `Prompt`, `Category`, `CategoryCreateInput`, `UserProfile`, `CloudinaryUploadResult`, `BackupData`
- **Firebase:** `initFirebase()` — platform-agnostic initialization with emulator support
- **Config:** `loadFirebaseConfig(prefix)` — loads `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` env vars
- **Errors:** `messageFor(error)` — user-friendly Firebase error messages
- **Cloudinary:** `uploadImagePipeline()`, `compressImage()`, `validateImageFile()`, `getCloudinaryUrl()`
- **Video:** `uploadVideoPipeline()`, `validateVideoFile()`, `parseYouTubeId()`, `createYouTubeVideo()`, `createUploadedVideo()`, `getYouTubeEmbedUrl()`, `hasPlayableVideo()`
- **Backup:** `exportFirestoreData()`, `importFirestoreData()`, `downloadBackup()`, `parseBackupFile()`
- **Theme:** `Colors`, `darkColors`, `lightColors`, `SPACING`, `FONT_SIZE`, etc.

### Import Paths
```ts
import { Prompt, Category } from '@repo/shared/types';
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
| `/(tabs)/` | Home | Prompt grid with search, categories, banner ads |
| `/(tabs)/favorites` | Favorites | Liked prompts grid |
| `/(tabs)/settings` | Settings | Theme toggle, data management |
| `/(tabs)/about` | About | App info and features |
| `/prompt/[id]` | Detail | Hero image, prompt text, copy, share, related prompts |
| `/onboarding` | Onboarding | 3-step premium intro with tilted image cards |

### Onboarding Design
1. **Step 1 — "Find Powerful AI Prompts"**: 4 tilted floating cards with ambient glow
2. **Step 2 — "Generate Trending"**: Single large card with tags
3. **Step 3 — "Enjoying TS Prompt?"**: Heart icon, 5 stars, rate button

### State Management (Zustand)
- **`theme`** — Persisted theme mode (light/dark/system) → drives `ModeProvider` → `useColorScheme()`
- **`prompts`** — Firestore realtime sync, category filter, search
- **`categories`** — Firestore realtime sync
- **`favorites`** — Local persisted (AsyncStorage), toggle like, premium unlock
- **`onboarding`** — Persisted first-launch tracking + current step
- **`auth`** — Admin auth state (persisted)

### Key Components
- **`PromptCard`** — Premium card with gradient overlay, glass like button, haptic feedback
- **`CategoryChips`** — Animated horizontal filter pills
- **`VideoPlayer`** — WebView player for prompt videos (YouTube embed + Cloudinary MP4)
- **`AdBanner`** — AdMob banner (every 6 cards)
- **`RewardAd`** — Hook for reward ads to unlock premium prompts

### Theme Flow
```
Settings → useThemeStore.setMode() → Zustand (persisted)
    ↓
ModeProvider reads store → sets native Appearance
    ↓
useColorScheme() → Colors[colorScheme] → all components
```

### Dependencies
- Expo 57, React Native 0.86
- `react-native-reanimated` — animations
- `react-native-google-mobile-ads` — AdMob (BannerAd, RewardedAd)
- `expo-clipboard` — copy prompts
- `expo-haptics` — haptic feedback
- `bna-ui` — UI components (bottom-sheet, skeleton, spinner, etc.)
- `zustand` — state management
- `@react-native-async-storage/async-storage` — persistence

## Admin Panel (`apps/web`)

### Pages
| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Stats overview (prompts, categories, users, likes) |
| `/admin/login` | Login | Email/password admin authentication |
| `/admin/prompts` | Prompts | CRUD table with image upload pipeline |
| `/admin/categories` | Categories | CRUD with color picker and emoji |
| `/admin/users` | Users | View users, toggle admin role |
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
Compress (Canvas API: resize to 1080×1350, JPEG 82%)
    ↓
Upload to Cloudinary (unsigned, with progress)
    ↓
Save URL + publicId to Firestore
```

### Key Components
- **`ImageUpload`** — Drag-drop with compression preview and Cloudinary upload
- 18 shadcn/ui components (button, card, table, dialog, input, select, etc.)
- PWA support via `next-pwa`

### Dependencies
- Next.js 16, React 19
- Firebase (client SDK)
- shadcn/ui + Tailwind CSS 4
- `zustand` — state management
- `next-pwa` — Progressive Web App

## Firebase Collections

### `prompts`
```ts
{
  id: string;                    // Firestore doc ID
  text: string;                  // Prompt text to copy
  imageUrl: string;              // Cloudinary URL
  cloudinaryPublicId: string;    // For management/deletion
  categoryId: string;            // Reference to category
  order: number;                 // Display order
  likesCount: number;            // Denormalized counter
  copiesCount: number;           // Denormalized counter
  tags: string[];                // Search tokens
  isActive: boolean;             // Visibility toggle
  isPremium: boolean;            // Requires reward ad
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

## Cloudinary Configuration

- **Target:** 1080×1350 (4:5 portrait), JPEG 82% quality
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
- **Test IDs:** Currently using Google test ad units

### Required Env Vars
| Var | Where | Purpose |
|-----|-------|---------|
| `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID` | Mobile | Banner ads |
| `EXPO_PUBLIC_ADMOB_REWARD_AD_UNIT_ID` | Mobile | Reward ads |

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
- **Scope:** prompts, categories, users collections

## Design Principles

1. **Zero duplication** — All shared logic lives in `packages/shared`
2. **Instant theme switching** — Zustand store drives all theme decisions
3. **Offline-first** — Favorites persist locally, Firestore syncs when available
4. **Premium feel** — Reanimated animations, haptic feedback, cinematic shadows
5. **Accessible** — Safe area insets, proper contrast, semantic HTML
6. **Warm & inviting** — Orange accent with brown tones, never cold grays
