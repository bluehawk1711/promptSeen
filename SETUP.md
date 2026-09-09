# PromptSeen — Setup & Documentation

> **PromptSeen** is a premium AI prompt gallery with a React Native Expo mobile app and a Next.js admin panel, sharing code through a Turborepo monorepo.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Initial Setup](#initial-setup)
4. [Environment Variables](#environment-variables)
5. [Running the Apps](#running-the-apps)
6. [Monorepo Structure](#monorepo-structure)
7. [Tech Stack](#tech-stack)
8. [Data Flow & Caching](#data-flow--caching)
9. [Firestore Collections](#firestore-collections)
10. [Shared Package API](#shared-package-api)
11. [Mobile App Guide](#mobile-app-guide)
12. [Admin Panel Guide](#admin-panel-guide)
13. [GitHub Actions CI/CD](#github-actions-cicd)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
promptSeen/
├── apps/
│   ├── mobile/          # React Native Expo (iOS + Android)
│   └── web/             # Next.js 16 Admin Panel (PWA)
├── packages/
│   └── shared/          # Shared types, utilities, themes
├── .github/workflows/   # CI/CD (Android APK, iOS IPA, Web deploy)
├── AGENTS.md            # AI agent architecture reference
└── pnpm-workspace.yaml  # Workspace config
```

**Data flow:**
```
Admin Panel → Firestore write → Realtime listener → Mobile Zustand store
                                    ↓
                            React Query invalidation
                                    ↓
                            UI re-renders with fresh data
```

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| **pnpm** | ≥ 9.x | `npm i -g pnpm` |
| **Firebase CLI** | ≥ 13.x | `npm i -g firebase-tools` |
| **Expo CLI** | latest | `npm i -g expo-cli` |
| **Java JDK** | 17 | For Android builds |
| **Xcode** | ≥ 15 | For iOS builds (macOS only) |

---

## Initial Setup

### 1. Clone & Install

```bash
git clone <repo-url> promptSeen
cd promptSeen

# Install all dependencies (mobile + web + shared)
pnpm install
```

### 2. Firebase Setup

```bash
# Login to Firebase
firebase login

# Create a Firebase project (or use existing)
# Then update apps/mobile/.firebaserc with your project ID
```

### 3. Start Firebase Emulators (Local Dev)

```bash
cd apps/mobile

# Start emulators (Firestore, Auth, Storage)
pnpm emulators:seed  # Seeds sample data
```

### 4. Seed Sample Data

```bash
cd apps/mobile

# Start emulators first, then seed
pnpm emulators:seed
```

This creates:
- 6 categories (Marketing, Creative Writing, Coding, Business, Social Media, Education)
- 20 sample prompts with images
- 1 admin user (`admin@promptseen.com`)
- 2 sample collections
- 3 sample submissions
- Sample daily stats
- Sample FCM tokens and push notifications

---

## Environment Variables

### Mobile (`apps/mobile/.env.example`)

```bash
# Firebase Config (from Firebase Console → Project Settings)
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
EXPO_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:000000000000

# AdMob (from Google AdMob Console)
EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID=ca-app-pub-xxxxx/xxxxx
EXPO_PUBLIC_ADMOB_REWARD_UNIT_ID=ca-app-pub-xxxxx/xxxxx

# Cloudinary (for image optimization)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Web Admin (`apps/web/.env.example`)

```bash
# Firebase Config
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:000000000000

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

### Copy & Edit

```bash
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env
# Edit both files with your Firebase project credentials
```

---

## Running the Apps

### Mobile App

```bash
cd apps/mobile

# Start Expo dev server
pnpm start

# Run on specific platform
pnpm android
pnpm ios
pnpm web
```

### Web Admin Panel

```bash
cd apps/web

# Start Next.js dev server
pnpm dev
# → http://localhost:3000/admin
```

### Both Simultaneously

```bash
# From root — run both in parallel
pnpm --filter mobile start &
pnpm --filter web dev
```

---

## Monorepo Structure

```
promptSeen/
├── apps/
│   ├── mobile/                    # React Native Expo app
│   │   ├── app/                   # Expo Router screens
│   │   │   ├── (tabs)/           # Tab navigator screens
│   │   │   │   ├── index.tsx     # Home (daily + trending + grid)
│   │   │   │   ├── favorites.tsx # Liked prompts
│   │   │   │   ├── collections.tsx # User collections
│   │   │   │   ├── submissions.tsx # User submissions
│   │   │   │   └── profile.tsx   # Settings + About + Stats
│   │   │   ├── prompt/[id].tsx   # Prompt detail (infinite scroll)
│   │   │   ├── onboarding.tsx    # 3-step parallax onboarding
│   │   │   └── _layout.tsx       # Root layout (splash + providers)
│   │   ├── components/           # Reusable UI components
│   │   ├── lib/                  # Firebase, notifications, queries
│   │   ├── store/                # Zustand stores
│   │   ├── providers/            # React Query, Theme, Mode
│   │   ├── hooks/                # Custom hooks
│   │   ├── theme/                # Colors, globals
│   │   └── scripts/              # Seed script
│   │
│   └── web/                      # Next.js 16 admin panel
│       ├── app/
│       │   ├── admin/
│       │   │   ├── page.tsx      # Dashboard stats
│       │   │   ├── prompts/      # Prompt CRUD
│       │   │   ├── categories/   # Category CRUD
│       │   │   ├── submissions/  # Review submissions
│       │   │   ├── users/        # User management
│       │   │   ├── analytics/    # Engagement analytics
│       │   │   ├── notifications/ # Push notification composer
│       │   │   ├── settings/     # App settings
│       │   │   └── login/        # Admin login
│       │   ├── api/              # API routes
│       │   │   ├── cloudinary/   # Image delete
│       │   │   └── notifications/ # Send FCM notifications
│       │   └── page.tsx          # Landing page
│       ├── components/           # UI components (shadcn)
│       └── lib/                  # Firebase, auth, queries
│
├── packages/
│   └── shared/                   # Shared code
│       └── src/
│           ├── types.ts          # All TypeScript interfaces
│           ├── config.ts         # Firebase config loader
│           ├── firebase.ts       # Firebase init
│           ├── cloudinary.ts     # Image upload + compression
│           ├── daily-prompt.ts   # Deterministic daily selection
│           ├── trending.ts       # Engagement scoring
│           ├── analytics.ts      # Event tracking
│           ├── backup.ts         # Firestore backup
│           ├── errors.ts         # Error messages
│           └── theme/            # Global theme colors
│
└── .github/workflows/           # CI/CD
    ├── build-android.yml        # APK builds
    ├── build-ios.yml            # IPA builds
    └── build-web.yml            # Web deploy
```

---

## Tech Stack

### Mobile App

| Category | Library | Purpose |
|----------|---------|---------|
| **Framework** | Expo SDK 57 | React Native development |
| **Navigation** | Expo Router 57 | File-based routing |
| **State** | Zustand 5 | Global state management |
| **Cache** | TanStack React Query 5 | API caching (2.5 min staleTime) |
| **Lists** | FlashList 2 | High-performance scrolling |
| **Animations** | Reanimated 4 | Smooth 60fps animations |
| **UI** | BNA UI | Pre-built React Native components |
| **Firebase** | Firebase JS SDK 12 | Firestore, Auth, Storage |
| **Ads** | Google Mobile Ads 16 | Banner + Reward ads |
| **Notifications** | Expo Notifications 57 | Push notifications via FCM |
| **Sharing** | Expo Sharing | Native share sheet |
| **Haptics** | Expo Haptics | Tactile feedback |

### Web Admin

| Category | Library | Purpose |
|----------|---------|---------|
| **Framework** | Next.js 16 | React framework with App Router |
| **UI** | shadcn/ui | Component library |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **State** | Zustand 5 | Client-side state |
| **Cache** | TanStack React Query 5 | Data caching (2.5 min staleTime) |
| **Firebase** | Firebase JS SDK 12 | Firestore client |
| **Auth** | Firebase Auth | Email/password admin auth |
| **PWA** | next-pwa | Progressive Web App |

### Shared Package

| Module | Purpose |
|--------|---------|
| `types.ts` | All TypeScript interfaces (Prompt, Category, Collection, etc.) |
| `daily-prompt.ts` | Deterministic date-based prompt selection (djb2 hash) |
| `trending.ts` | Weighted engagement scoring (shares×3 + copies×2 + likes×1) |
| `cloudinary.ts` | Image upload with client-side compression |
| `analytics.ts` | Event tracking and daily stats aggregation |
| `backup.ts` | Firestore data backup utility |
| `theme/colors.ts` | Global orange/dark theme colors |

---

## Data Flow & Caching

### How Caching Works

```
┌─────────────────────────────────────────────────────────┐
│                    CACHE LAYERS                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Layer 1: Firestore Realtime (onSnapshot)               │
│  ├─ Instant sync when admin makes changes               │
│  ├─ Updates Zustand store immediately                   │
│  └─ No polling — event-driven                           │
│                                                         │
│  Layer 2: Zustand Store (in-memory)                     │
│  ├─ Single source of truth for UI state                 │
│  ├─ Subscribes to Firestore realtime                    │
│  └─ Components read directly from store                 │
│                                                         │
│  Layer 3: React Query Cache                             │
│  ├─ staleTime: 2.5 minutes                             │
│  ├─ gcTime: 10 minutes                                 │
│  ├─ Prevents redundant Firestore reads                  │
│  └─ Auto-invalidates when store updates                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Cache Invalidation Flow

```
Admin creates/updates/deletes prompt
    ↓
Firestore write (addDoc/updateDoc/deleteDoc)
    ↓
React Query mutation onSuccess callback
    ↓
queryClient.invalidateQueries({ queryKey: ['prompts'] })
    ↓
React Query marks data as stale
    ↓
Next component render triggers refetch
    ↓
Fresh data displayed

--- Meanwhile, on Mobile ---

Firestore realtime listener (onSnapshot) fires
    ↓
Zustand store updated with new data
    ↓
invalidatePromptQueries() called
    ↓
React Query caches invalidated
    ↓
Components using usePromptsQuery() re-render
```

### Why This Architecture?

1. **No duplicate code** — Zustand stores + React Query hooks read from the same source
2. **Instant admin updates** — Firestore realtime pushes changes to mobile immediately
3. **2.5 min cache** — Eliminates redundant Firestore reads during normal browsing
4. **Offline support** — Zustand store works offline, React Query caches serve stale data
5. **Automatic invalidation** — Admin CRUD triggers cache invalidation via mutation callbacks

---

## Firestore Collections

| Collection | Access | Description |
|------------|--------|-------------|
| `prompts` | Public read, admin write | Prompt documents with text, image, category |
| `categories` | Public read, admin write | Prompt categories with icons and colors |
| `users` | User read/write own, admin all | User profiles with admin flag |
| `collections` | Owner CRUD, public read public | User-created prompt boards |
| `submissions` | User create/read own, admin all | User-submitted prompts for review |
| `analytics_events` | App write, admin read | Individual interaction events |
| `daily_stats` | App write, admin read | Aggregated daily metrics |
| `fcm_tokens` | App write, admin read | Device FCM registration tokens |
| `push_notifications` | Server write, admin read | Sent notification history |

### Security Rules

- **prompts/categories**: `allow read: if true` — public read, `allow write: if isAdmin()` — admin only
- **users**: `allow read/write: if isOwner(userId) || isAdmin()`
- **collections**: Owner CRUD, public can read `isPublic: true`
- **submissions**: Users create + read own, admin reviews
- **fcm_tokens**: App can write its own token, admin can read all
- **analytics_events**: Anyone can write (fire-and-forget), admin reads

---

## Shared Package API

### `@repo/shared/types`

```typescript
import type {
  Prompt,
  Category,
  UserProfile,
  Collection,
  PromptSubmission,
  AnalyticsEvent,
  DailyStats,
  FCMToken,
  PushNotification,
  FirebaseConfig,
  CloudinaryUploadResult,
} from '@repo/shared/types';
```

### `@repo/shared/daily-prompt`

```typescript
import {
  getDailyPrompt,       // (prompts: Prompt[]) => Prompt | null
  getTodayKey,          // () => string "YYYY-MM-DD"
  getTimeUntilRotation, // () => number (ms until midnight UTC)
  formatTimeUntilRotation, // () => string "14h 32m"
} from '@repo/shared/daily-prompt';
```

### `@repo/shared/trending`

```typescript
import {
  getTrendingScore,     // (prompt: Prompt) => number
  getTrendingPrompts,   // (prompts: Prompt[], count: number) => Prompt[]
  formatTrendingScore,  // (score: number) => string
} from '@repo/shared/trending';
```

### `@repo/shared/cloudinary`

```typescript
import {
  compressImage,        // Client-side image compression (1080×1350, JPEG 82%)
  uploadToCloudinary,   // Upload with progress callback
  buildCloudinaryUrl,   // Build optimized URL with transformations
} from '@repo/shared/cloudinary';
```

### `@repo/shared/analytics`

```typescript
import {
  trackEvent,           // Log an analytics event
  getDailyStats,        // Get aggregated daily stats
  getEngagementRate,    // Calculate engagement rate
} from '@repo/shared/analytics';
```

---

## Mobile App Guide

### Screens

| Screen | Route | Description |
|--------|-------|-------------|
| **Home** | `(tabs)/index` | Daily prompt, trending, search, category chips, prompt grid |
| **Favorites** | `(tabs)/favorites` | Liked prompts with premium empty state |
| **Collections** | `(tabs)/collections` | User-created prompt boards |
| **Submissions** | `(tabs)/submissions` | User's submitted prompts with status |
| **Profile** | `(tabs)/profile` | Settings, theme, stats, about |
| **Prompt Detail** | `prompt/[id]` | Full prompt view with infinite scroll |
| **Onboarding** | `onboarding` | 3-step parallax intro |

### Key Features

- **Daily Prompt**: Deterministic selection using djb2 hash — same prompt for all users each day
- **Trending Section**: Top 10 by weighted engagement score (shares×3 + copies×2 + likes×1)
- **Infinite Scroll**: Related prompts load 10 at a time, fetch more on scroll
- **FlashList**: High-performance list replacement for FlatList
- **React Query**: 2.5 min cache eliminates redundant Firestore reads
- **Parallax Onboarding**: 3-step scroll-driven animations with depth effect
- **Animated Splash**: PS logo with orange glow and loading dots
- **AdMob**: Banner ads every 6 cards, reward ads to unlock premium prompts
- **Push Notifications**: FCM token registration, deep linking to prompts
- **Share Card**: Generate branded PNG images for sharing

### State Management

```
Zustand Stores:
├── prompts.ts      — Realtime Firestore sync + daily/trending
├── categories.ts   — Realtime Firestore sync
├── favorites.ts    — Local persistence (AsyncStorage)
├── collections.ts  — Firestore CRUD for user collections
├── submissions.ts  — Firestore sync for user submissions
├── auth.ts         — Admin auth state (persisted)
├── theme.ts        — Light/dark/system mode
└── onboarding.ts   — Onboarding completion state
```

---

## Admin Panel Guide

### Pages

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/admin` | Stats overview (prompts, users, engagement) |
| **Prompts** | `/admin/prompts` | CRUD with image upload pipeline |
| **Categories** | `/admin/categories` | CRUD with color/emoji picker |
| **Submissions** | `/admin/submissions` | Approve/reject user submissions |
| **Users** | `/admin/users` | User management |
| **Analytics** | `/admin/analytics` | Daily engagement breakdown |
| **Notifications** | `/admin/notifications` | Push notification composer + history |
| **Settings** | `/admin/settings` | App configuration |

### Key Features

- **React Query**: All data fetched with 2.5 min cache, auto-invalidated on mutations
- **Image Upload**: Drag-drop with client-side compression → Cloudinary
- **Auto-Notification**: Sends push to all devices when new prompt is created
- **Notification Composer**: Send manual notifications to all/topic/token targets
- **Cloudinary Delete**: Images auto-deleted from Cloudinary when prompt is deleted

---

## GitHub Actions CI/CD

### Workflows

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `build-android.yml` | Manual | Builds APK (dev/release) via Gradle |
| `build-ios.yml` | Manual | Builds IPA via Xcode |
| `build-web.yml` | Push to main | Typechecks, builds, deploys to Vercel |

### How to Trigger

1. Go to **GitHub → Actions** tab
2. Select workflow
3. Click **"Run workflow"**
4. Choose `dev` or `release` build type
5. Download artifact when complete

### Required Secrets

| Secret | Platform | Purpose |
|--------|----------|---------|
| `ANDROID_KEYSTORE_BASE64` | Android | Release signing |
| `ANDROID_KEYSTORE_PASSWORD` | Android | Keystore password |
| `ANDROID_KEY_ALIAS` | Android | Key alias |
| `ANDROID_KEY_PASSWORD` | Android | Key password |
| `IOS_CERTIFICATE_BASE64` | iOS | Signing certificate |
| `IOS_CERTIFICATE_PASSWORD` | iOS | Certificate password |
| `IOS_PROVISIONING_PROFILE_BASE64` | iOS | Provisioning profile |
| `IOS_TEAM_ID` | iOS | Apple Developer Team ID |
| `VERCEL_TOKEN` | Web | Vercel deploy token |
| `VERCEL_ORG_ID` | Web | Vercel org ID |
| `VERCEL_PROJECT_ID` | Web | Vercel project ID |

---

## Deployment

### Mobile App

```bash
# Build APK locally
cd apps/mobile
expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Or use GitHub Actions for CI/CD builds
```

### Web Admin

```bash
# Build
cd apps/web
pnpm build

# Deploy to Vercel
vercel deploy
```

### Firebase Rules

```bash
cd apps/mobile

# Deploy Firestore rules
pnpm deploy:rules

# Deploy Firestore indexes
pnpm deploy:indexes

# Deploy everything
pnpm deploy
```

---

## Troubleshooting

### Common Issues

**"Cannot find module '@repo/shared'"**
```bash
# From root — reinstall workspace dependencies
pnpm install
```

**"Firebase: No Firebase App"**
```bash
# Check .env files exist and have correct values
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env
```

**"expo-dev-client requires a development build"**
```bash
# Use Expo Go for quick testing, or build dev client
expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

**"FlashList: Invalid prop estimatedItemSize"**
```bash
# FlashList v2 auto-estimates sizes — remove estimatedItemSize prop
```

**TypeScript errors after install**
```bash
# Clear TypeScript cache
rm -rf apps/mobile/tsconfig.tsbuildinfo
rm -rf apps/web/tsconfig.tsbuildinfo
pnpm --filter mobile typecheck
pnpm --filter web typecheck
```

### Useful Commands

```bash
# Typecheck both apps
pnpm --filter mobile typecheck
pnpm --filter web typecheck

# Seed sample data
cd apps/mobile && pnpm emulators:seed

# Deploy Firestore rules
cd apps/mobile && pnpm deploy

# Build Android APK
cd apps/mobile && expo prebuild --platform android && cd android && ./gradlew assembleRelease

# Build iOS IPA
cd apps/mobile && expo prebuild --platform ios && cd ios && xcodebuild archive
```

---

## Design System

### Theme Colors

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#FF7A2E` | Buttons, links, highlights |
| `background` | `#0D0500` | App background (dark) |
| `card` | `#1C0E02` | Card backgrounds |
| `text` | `#FFF5EB` | Primary text |
| `muted` | `#B8956A` | Secondary text, borders |
| `border` | `rgba(255,122,46,0.15)` | Subtle borders |

### Component Library

- **Mobile**: BNA UI (BottomSheet, Toast, Skeleton, Tabs, Switch, etc.)
- **Web**: shadcn/ui (Button, Card, Dialog, Table, Badge, etc.)
- **Icons**: Lucide React Native (mobile) + Lucide React (web)

---

*Last updated: September 2026*
