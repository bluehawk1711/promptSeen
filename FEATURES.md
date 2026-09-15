# TS Prompt — Features & Functionalities

## Mobile App (React Native / Expo)

### Home Screen
- **Prompt Grid** — 2-column FlashList with animated cards (FadeInDown spring animations)
- **Daily Prompt** — Rotating featured prompt with hero card design
- **Trending Section** — Top 10 prompts by weighted engagement score (likes, copies, shares)
- **Search** — Real-time text search across prompt content and tags
- **Category Filters** — Horizontal scrollable pill chips with haptic feedback
- **Ad Banners** — AdMob banner ads inserted every 6 cards
- **Pull to Refresh** — Native refresh control for data sync
- **Connection Indicator** — Live/offline WiFi status icon

### Prompt Detail
- **Hero Image** — Full-width image with golden border frame
- **Gradient Overlay** — LinearGradient from transparent to dark for text legibility
- **Prompt Text** — Display with copy button and character stats
- **Premium Lock** — Blurred text overlay for premium prompts with unlock button
- **Reward Ad Unlock** — Watch a rewarded ad to unlock premium content
- **Copy to Clipboard** — One-tap copy with haptic success feedback
- **Share** — Native share sheet or branded share card generation
- **Like/Unlike** — Heart toggle with animation and persistence
- **Related Prompts** — Infinite scroll grid of same-category prompts (10 per page)
- **Bookmark** — Add to bookmarks (UI placeholder)
- **Category Badge** — Color-coded category label on image

### Favorites
- **Liked Prompts Grid** — All favorited prompts in a 2-column layout
- **Local Persistence** — Favorites stored locally via AsyncStorage (works offline)
- **Toggle Like** — Remove from favorites with swipe or tap

### Collections
- **Create Collection** — Modal with Lucide icon picker (8 icons) and name input
- **Collection Cards** — Preview thumbnails, prompt count, public/private indicator
- **Delete Collection** — Confirmation dialog before deletion
- **Add/Remove Prompts** — Manage prompts within collections

### Submissions
- **Submit Prompt** — Form with text input, tag input, and category picker
- **Submission Status** — Visual badges for pending/approved/rejected states
- **Review Notes** — Admin feedback displayed on rejected submissions
- **Stats Overview** — Pending, approved, rejected counts

### Profile / Settings
- **Theme Toggle** — Light/Dark/System with instant switching
- **Stats Dashboard** — Favorites, collections, submissions counts
- **Submission Status** — Breakdown by status with colored indicators
- **Reset Onboarding** — Replay the onboarding experience
- **Clear Favorites** — Remove all favorites with confirmation dialog
- **App Info** — Version display

### Onboarding
- **3-Step Intro** — Animated card carousel with parallax effects
- **Step 1** — "Find Powerful AI Prompts" with tilted floating cards
- **Step 2** — "Generate Trending" with single large card
- **Step 3** — "Rate Us Now" with heart animation and App Store link
- **Skip/Next** — Navigation with smooth scroll transitions
- **First Launch Detection** — Only shows once, persisted via AsyncStorage

### Notifications
- **Push Registration** — FCM token registration via Expo Push Service
- **Foreground Handling** — In-app notification display with sound
- **Background/Quit** — Deep linking to prompt detail on tap
- **Notification Channels** — Android default + "New Prompts" channel
- **Badge Management** — Auto-clear badge count on app open
- **Token Lifecycle** — Store, update, and deactivate tokens

### Analytics (Mobile → Firestore)
- **Screen Views** — Home, prompt detail, favorites, collections, submissions
- **Prompt Events** — View, copy, share, like, unlike, premium unlock
- **Search Tracking** — Search queries logged
- **Category Filter** — Filter selections tracked
- **Ad Events** — Banner impressions, reward completions
- **Daily Stats** — Aggregated counters in `daily_stats` collection
- **Active Users** — Unique daily user tracking via subcollection deduplication

### Design System
- **Warm Orange Theme** — Primary #F26522 / #FF7A2E with brown undertones
- **Dark Mode Default** — Background #0D0500, text #FFF5EB
- **Light Mode** — Background #FFFBF5, text #1A0A00
- **Glow Effects** — Ambient orange glows on interactive elements
- **Cinematic Shadows** — Deep shadows with orange tint
- **Reanimated Animations** — Spring-based transitions throughout
- **Haptic Feedback** — Light/Medium/Heavy impacts on interactions
- **Linear Gradients** — Real gradients on cards via expo-linear-gradient
- **Lucide Icons** — Consistent icon set across all screens (no emojis)

---

## Admin Panel (Next.js)

### Dashboard (`/admin`)
- **Stats Overview** — Total prompts, categories, users, likes
- **Quick Actions** — Links to manage content

### Prompts Management (`/admin/prompts`)
- **CRUD Table** — Create, read, update, delete prompts
- **Image Upload** — Drag-drop with Cloudinary compression pipeline
- **Category Assignment** — Dropdown category selector
- **Premium Toggle** — Mark prompts as premium (requires reward ad)
- **Active Toggle** — Show/hide prompts from the app
- **Tag Management** — Comma-separated tag input
- **Auto-Notification** — Optional push notification on new prompt creation
- **Delete with Cloudinary Cleanup** — Removes image from Cloudinary on delete

### Categories Management (`/admin/categories`)
- **CRUD Table** — Create, read, update, delete categories
- **Color Picker** — Visual color selection with hex input
- **Emoji Icon** — Custom icon per category (displayed in app)
- **Order Control** — Numeric ordering for display sequence
- **Active Toggle** — Show/hide categories
- **React Query Caching** — Optimistic updates with cache invalidation

### Users Management (`/admin/users`)
- **User Table** — List all registered users
- **Admin Toggle** — Grant/revoke admin privileges
- **React Query Hooks** — Cached data fetching with `useAdminUsers()`

### Submissions Review (`/admin/submissions`)
- **Review Queue** — Filter by pending/all/approved/rejected
- **Approve Flow** — Create prompt from submission, assign category
- **Reject Flow** — Mark rejected with review note
- **React Query Hooks** — `useAdminSubmissions()`, `useReviewSubmission()`

### Notifications (`/admin/notifications`)
- **Composer** — Title, body, image URL, target selection (all/topic/token)
- **Send Push** — Sends via Expo Push API
- **Analytics Dashboard** — Total sent, delivered, opened with rates
- **Daily Chart** — CSS-based bar chart (14-day breakdown)
- **Source Breakdown** — Manual vs auto-notification stats
- **Platform Breakdown** — iOS vs Android device counts
- **History Table** — All sent notifications with open rates
- **Auto-Notification Toggle** — Persisted to Firestore `settings/notifications`

### Analytics (`/admin/analytics`)
- **Metric Cards** — Active users, prompt views, likes, copies, shares, ad impressions
- **Date Range Filter** — 7-day or 30-day view
- **Daily Breakdown** — Per-day stats with Lucide icons
- **Top Prompts** — Ranked table by likes with copies/shares

### Settings (`/admin/settings`)
- **Backup/Restore** — Export/import all Firestore data as JSON
- **Firebase Info** — Project configuration display

### Authentication
- **Email/Password Login** — Firebase Auth
- **Admin Guard** — Firestore `users/{uid}.isAdmin` check
- **Protected Routes** — Redirect to login if not authenticated

### Image Upload Pipeline
- **Validation** — File type and size checks
- **Compression** — Canvas API resize to 1080x1350, JPEG 82%
- **Cloudinary Upload** — unsigned preset with progress tracking
- **Delete API** — Signed server-side deletion route (`image` or `video` resource type)

### Video Support
- **Prompt videos** — Optional per-prompt video: Cloudinary MP4 upload (max 100 MB) or YouTube link
- **Admin Editor** — `VideoUpload` component with none / upload / YouTube modes, progress, preview, discard-cleanup
- **Mobile Playback** — WebView player on prompt detail (YouTube embed + HTML5 MP4), premium-gated via reward ad
- **Badges** — `VIDEO` badge on cards and detail hero when a prompt has a video
- **Lifecycle** — Old Cloudinary video deleted only after a successful save (orphan-safe)

---

## Shared Package (`packages/shared`)

### Types
- `Prompt`, `Category`, `CategoryCreateInput`
- `UserProfile`, `FCMToken`
- `PromptSubmission`, `Collection`
- `PushNotification`, `NotificationAnalytics`, `NotificationPreferences`
- `AnalyticsEvent`, `AnalyticsEventType`, `DailyStats`
- `CloudinaryUploadResult`, `BackupData`
- `PromptVideo`, `PromptVideoType` — optional video payload on `Prompt`

### Firebase
- `initFirebase()` — Platform-agnostic initialization with emulator support

### Config
- `loadFirebaseConfig(prefix)` — Load env vars for Expo or Next.js

### Cloudinary
- `uploadImagePipeline()` — Validate → compress → upload
- `compressImage()` — Canvas-based resize
- `validateImageFile()` — Type/size validation
- `getCloudinaryUrl()` — URL with transforms

### Video
- `uploadVideoPipeline()` — Validate → upload MP4 to Cloudinary (H.264 delivery)
- `validateVideoFile()` — Type/size validation (max 100 MB)
- `parseYouTubeId()` — Extract video ID from any YouTube URL shape (regex, RN-safe)
- `createYouTubeVideo()` / `createUploadedVideo()` — Build `PromptVideo` payloads
- `getYouTubeEmbedUrl()` / `getCloudinaryVideoUrl()` / `getCloudinaryVideoThumbnailUrl()`
- `hasPlayableVideo()` — Guard for UI playback affordances
- `isPromptVideo()` — Runtime type guard
- `formatVideoDuration()` — Human-readable duration

### Backup
- `exportFirestoreData()` — Dump all collections
- `importFirestoreData()` — Restore from JSON
- `downloadBackup()` — Trigger file download
- `parseBackupFile()` — Validate backup structure

### Analytics
- `logAnalyticsEvent()` — Write event to Firestore
- `incrementDailyStat()` — Atomic counter updates
- `trackActiveUser()` — Deduplicated daily user tracking

### Trending
- `getTrendingPrompts()` — Weighted engagement scoring
- `getTrendingScore()` — Calculate composite score

### Theme
- `Colors`, `darkColors`, `lightColors`
- `SPACING`, `FONT_SIZE` constants

---

## Data Flow

```
Mobile App (Expo)
    ↓ Firestore Realtime Listeners
    ↓ Analytics Events → analytics_events collection
    ↓ Daily Stats → daily_stats collection
    ↓ FCM Tokens → fcm_tokens collection
    ↓
Firebase Firestore
    ↑
Admin Panel (Next.js) — reads stats, manages content
    ↓ Expo Push API → FCM → Device
```

---

## AdMob Integration

- **Banner Ads** — Every 6th card in the grid + prompt detail page
- **Reward Ads** — Watch ad to unlock premium prompts
- **Env Vars** — `EXPO_PUBLIC_ADMOB_BANNER_AD_UNIT_ID`, `EXPO_PUBLIC_ADMOB_REWARD_AD_UNIT_ID`
- **Test IDs** — Fallback to Google test ads if env vars not set

---

## Push Notification Architecture

```
Mobile: registerForPushNotifications()
    ↓ Gets ExpoPushToken via expo-notifications
    ↓ Stores in fcm_tokens collection
    ↓
Admin: sendPushNotification()
    ↓ Sends to https://exp.host/--/api/v2/push/send
    ↓ Expo relays to FCM (Android) / APNs (iOS)
    ↓
Device: receives notification
    ↓ Foreground: in-app alert
    ↓ Background: system notification → deep link on tap
```

---

## Deployment

### Mobile (EAS Build)
```bash
eas build --profile development  # Dev client
eas build --profile preview      # TestFlight / internal
eas build --profile production   # App Store / Play Store
```

### Admin Panel (Vercel / Netlify)
```bash
cd apps/web && pnpm build
```

### Firebase
- Firestore rules in `apps/mobile/firestore.rules`
- Emulator suite for local development
