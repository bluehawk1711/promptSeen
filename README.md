# Prompt View

A curated AI prompt gallery app. Users browse prompts with images, like favorites, copy prompts, and unlock premium content via reward ads. The admin panel manages prompts, categories, and user feedback.

## Tech Stack

- **Mobile:** React Native (Expo 57) + TypeScript
- **Admin Panel:** Next.js 16 + React 19 + Tailwind CSS 4
- **Database:** Firestore (Firebase)
- **Cache:** Upstash Redis
- **Images/Videos:** Cloudinary
- **Ads:** AdMob (Banner + Reward)
- **Monorepo:** pnpm workspaces

## Project Structure

```
promptSeen/
├── apps/
│   ├── mobile/                  # React Native Expo app
│   │   ├── app/                 # Expo Router screens
│   │   ├── components/          # UI components
│   │   ├── lib/                 # Utilities, API client, notifications
│   │   ├── store/               # Zustand stores
│   │   ├── hooks/               # Custom hooks
│   │   ├── theme/               # Colors, typography, spacing
│   │   └── assets/              # Images, fonts
│   └── web/                     # Next.js admin panel
│       ├── app/                 # Next.js App Router pages
│       │   └── admin/           # Admin dashboard pages
│       │       ├── prompts/     # Prompt CRUD
│       │       ├── categories/  # Category CRUD
│       │       ├── feedback/    # User feedback viewer
│       │       ├── analytics/   # Analytics dashboard
│       │       ├── notifications/ # Push notification manager
│       │       └── settings/    # Backup/restore, config
│       ├── components/          # UI components
│       └── lib/                 # Firebase, queries, cache
├── packages/
│   └── shared/                  # Shared types, Firebase init, Cloudinary, backup
├── .github/workflows/           # CI/CD pipelines
├── AGENTS.md                    # Architecture guide for AI agents
└── PERFORMANCE-PLAN.md          # Zero-loading architecture plan
```

## Environments

| Environment | Firebase Project | Package | Purpose |
|-------------|-----------------|---------|---------|
| **dev** | `promtapp-e6c0e` | `com.promptgallery.app` | Local development + debug builds |
| **production** | `prompt-view-e59bc` | `com.promptgallery.app` | Release builds + Vercel deploy |

### GitHub Environments

| Environment | Secrets | Used By |
|-------------|---------|---------|
| `dev` | Firebase (dev project), Cloudinary, Upstash, Firebase Admin SDK | `build-android.yml` (dev builds), `build-web.yml` |
| `production` | Firebase (prod project), AdMob (prod), Admin API URL | `build-android.yml` (release builds), `build-android-production.yml` |

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI (`npm install -g expo-cli`)
- Firebase CLI (`npm install -g firebase-tools`)

### Installation

```bash
# Clone the repo
git clone https://github.com/bluehawk1711/promptSeen.git
cd promptSeen

# Install all dependencies
pnpm install

# Copy env files
cp apps/mobile/.env.example apps/mobile/.env
cp apps/web/.env.example apps/web/.env

# Build shared package
pnpm --filter @repo/shared build
```

### Development

```bash
# Start mobile app (Expo)
cd apps/mobile
pnpm start

# Start admin panel (Next.js)
cd apps/web
pnpm dev

# Start Firebase emulators
cd apps/mobile
pnpm emulators
pnpm emulators:seed  # Seed sample data
```

### Typecheck

```bash
pnpm --filter web typecheck
pnpm --filter mobile typecheck
```

## CI/CD Workflows

### Android Builds

| Workflow | Trigger | Environment | Artifact |
|----------|---------|-------------|----------|
| `build-android.yml` | Manual (dev/release choice) | `dev` or `production` | Debug or Release APK |
| `build-android-production.yml` | Manual | `production` | Signed Release APK |

### Web Builds

| Workflow | Trigger | Environment | Deploy |
|----------|---------|-------------|--------|
| `build-web.yml` | Push to main + manual | `production` | Vercel (auto on push) |

### Build Secrets

**Dev environment** (`dev`):
- Firebase client config (dev project)
- Cloudinary credentials
- Upstash Redis credentials
- Firebase Admin SDK (dev project)

**Production environment** (`production`):
- Firebase client config (prod project)
- AdMob production app IDs
- Admin panel API URL (`https://ts-prompt.vercel.app`)

## Mobile App Screens

| Route | Screen | Description |
|-------|--------|-------------|
| `/(tabs)/` | Home | Prompt grid, daily prompt, trending, search, categories |
| `/(tabs)/favorites` | Favorites | Liked prompts grid |
| `/(tabs)/videos` | Videos | Video prompts (YouTube + uploaded) |
| `/(tabs)/profile` | Profile | Settings, theme, feedback, social links |
| `/prompt/[id]` | Detail | Hero image, prompt text, copy, share, AI buttons |
| `/feedback` | Feedback | Submit bug reports, feature requests, ratings |
| `/onboarding` | Onboarding | 3-step premium intro |
| `/privacy-policy` | Privacy | Privacy policy |

## Admin Panel Pages

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | Dashboard | Stats: prompts, categories, users, engagement, feedback |
| `/admin/prompts` | Prompts | CRUD with image upload, category filter |
| `/admin/categories` | Categories | CRUD with color picker |
| `/admin/feedback` | Feedback | View user feedback (new/read/archived) |
| `/admin/analytics` | Analytics | Usage analytics and trends |
| `/admin/notifications` | Notifications | Send push notifications |
| `/admin/app-settings` | App Settings | Remote config (social links, about, version) |
| `/admin/settings` | Settings | Backup/restore, Firebase info |

## Firebase Collections

| Collection | Purpose |
|------------|---------|
| `prompts` | AI prompts with images, tags, categories |
| `categories` | Prompt categories with icons and colors |
| `users` | User profiles (admin flag) |
| `feedback` | User-submitted feedback (bug/feature/improvement) |
| `fcm_tokens` | Push notification tokens |
| `push_notifications` | Sent notification history |
| `settings/app` | Remote app configuration |
| `submissions` | User-submitted prompts (legacy) |

## Push Notifications

- **Registration:** Automatic on app open via `expo-notifications`
- **Token storage:** Firestore `fcm_tokens` collection
- **Channels:** `default` (all), `prompts` (new prompts)
- **Delivery:** Expo Push Notification API
- **Auto-notify:** New prompts trigger notification to all users
- **Admin:** Manual send from `/admin/notifications`

## Performance Architecture

See [PERFORMANCE-PLAN.md](PERFORMANCE-PLAN.md) for the full zero-loading architecture.

**3-Layer Cache:**
1. **AsyncStorage** (0ms) — persists 24 hours
2. **Upstash Redis** (~1-5ms) — via admin panel API
3. **Firestore realtime** (50-200ms) — always subscribed for live updates

## Environment Variables

### Mobile (`apps/mobile/.env`)

```bash
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

# AdMob
EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID=
EXPO_PUBLIC_ADMOB_REWARD_AD_UNIT_ID=

# Admin Panel API
EXPO_PUBLIC_ADMIN_API_URL=
```

### Web (`apps/web/.env`)

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## License

Private — All rights reserved.
