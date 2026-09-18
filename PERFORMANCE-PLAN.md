# Performance Plan — Zero-Loading Architecture

## Goal

Make the mobile app feel instant. No loading screens, no skeletons, no blank states. Data appears immediately on every launch, every screen, every scroll.

---

## Architecture

```
Mobile App (3-layer cache)
    │
    ├─ Layer 1: AsyncStorage (local, 0ms) — persists 24 hours
    │           ↓ (if stale > 24h)
    ├─ Layer 2: Upstash Redis API (~1-5ms) — via admin panel
    │           ↓ (cache miss)
    │           Firestore direct read (fallback)
    │
    └─ Layer 3: Firestore onSnapshot (realtime, 50-200ms)
                Always subscribed for live updates

Admin Panel
    │
    ├─ Mutations → Firestore (source of truth)
    └─ Mutations → invalidate Redis cache keys

Images
    └─ expo-image disk cache — persists across restarts
        + prefetch first 24 images during splash
```

---

## Phase 1: Client-Side Optimizations — DONE

| Task | Status | Files |
|------|--------|-------|
| Switch all `<Image>` to `expo-image` with `cachePolicy="memory-disk"` | Done | `prompt-card.tsx`, `daily-prompt-card.tsx`, `trending-card.tsx`, `prompt/[id].tsx` |
| FlashList v2 (auto-calculates sizes) | Done | `app/(tabs)/index.tsx` |
| Prefetch first 24 images on mount | Done | `lib/prefetch.ts`, `app/_layout.tsx` |
| Remove 5s loading timeout | Done | `store/prompts.ts` |
| Persist prompts in AsyncStorage via Zustand | Done | `store/prompts.ts` |
| Stale-while-revalidate (24h TTL) | Done | `store/prompts.ts`, `store/categories.ts` |

---

## Phase 2: Upstash Redis Cache Layer — DONE

| Task | Status | Files |
|------|--------|-------|
| Install `@upstash/redis` in admin panel | Done | `apps/web/package.json` |
| Redis cache utility (`getOrFetch`, `invalidateCache`) | Done | `apps/web/lib/redis.ts` |
| Cache keys + TTLs | Done | `apps/web/lib/cache-keys.ts` |
| `GET /api/prompts` — Redis-cached | Done | `apps/web/app/api/prompts/route.ts` |
| `GET /api/categories` — Redis-cached | Done | `apps/web/app/api/categories/route.ts` |
| Cache invalidation in admin mutations | Done | `apps/web/lib/admin-queries.ts` |
| Mobile API client (`fetchPromptsFromApi`, `fetchCategoriesFromApi`) | Done | `apps/mobile/lib/api-client.ts` |
| Mobile stores fetch from Redis API when cache is stale | Done | `apps/mobile/store/prompts.ts`, `apps/mobile/store/categories.ts` |
| Env examples updated | Done | `apps/web/.env.example`, `apps/mobile/.env.example` |

### Redis Cache Strategy

| Key | TTL | Invalidation |
|-----|-----|-------------|
| `cache:prompts:all` | 5 minutes | On create/update/delete prompt, approve submission |
| `cache:categories:all` | 1 hour | On create/update/delete category |

---

## Phase 3: Polish — TODO

- [ ] BlurHash placeholders for all images
- [ ] Prefetch adjacent images on detail screen
- [ ] Preload trending section images

---

## Expected Metrics

| Metric | Before | After Phase 1 | After Phase 2 |
|--------|--------|---------------|---------------|
| Cold start (first paint) | 1-5s skeleton | ~instant (AsyncStorage) | ~instant (AsyncStorage) |
| Cache freshness check | N/A | N/A | ~1-5ms (Redis) or skip if < 24h |
| Image load (scroll) | Network every time | Disk cached | Disk cached |
| 2nd app open | Same as 1st | Instant (persisted) | Instant (persisted) |
| Loading skeleton | Frequent | Only first ever launch | Only first ever launch |
| Background refresh | N/A | Firestore realtime | Redis API + Firestore realtime |
| Admin mutation → mobile update | Realtime Firestore | Realtime Firestore | Redis invalidation + Firestore |

---

## App Settings Cache (Force Update)

### How It Works

| Layer | What | TTL |
|-------|------|-----|
| AsyncStorage | `promptgallery-app-settings` — cached settings | Infinite |
| Redis | `cache:settings:app` — server-side cache | 5 minutes |
| Firestore | `settings/app` document | Source of truth |

### Version Change → Force Update Flow

```
Admin changes version in settings/app (e.g., minVersion: "1.0.15")
  ↓
Admin saves → PUT /api/app-settings
  ↓
API writes to Firestore + invalidates Redis cache (cache:settings:app)
  ↓
Mobile app opens:
  1. AsyncStorage: show cached settings instantly (0ms)
  2. fetchSettings() checks cooldown (1h) → if allowed, fetches from API
  3. API reads from Redis (5min cache) or Firestore (cache miss)
  4. Mobile compares `updatedAt` timestamp → detects change
  5. getUpdateRequirement() compares versions → returns 'hard'
  6. ForceUpdateGate blocks app → shows update screen
```

### Re-check Button

The "Re-check" button calls `forceRefetchSettings()` which:
1. Resets the 1-hour API cooldown
2. Fetches fresh settings from the API
3. If version changed → update screen re-renders with new requirement

### Rate Limiting

- Mobile: at most 1 API fetch per hour (cooldown stored in AsyncStorage)
- Redis: 5-minute cache on server (reduces Firestore reads)
- Admin PUT: invalidates Redis cache immediately (mobile gets fresh data on next fetch)

---

## Setup Instructions

### Upstash Redis

1. Create account at https://console.upstash.com
2. Create a Redis database (choose region closest to your users)
3. Copy the REST URL and token to `apps/web/.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=https://your-region.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

### Mobile API URL

Set `EXPO_PUBLIC_ADMIN_API_URL` in `apps/mobile/.env`:
- Android emulator: `http://10.0.2.2:3000`
- iOS simulator: `http://localhost:3000`
- Physical device: `http://YOUR电脑IP:3000`

---

## How It Works (User Perspective)

### First Launch Ever
1. Splash screen (2.2s)
2. AsyncStorage: empty → show skeleton
3. Firestore listener fires → populate store + AsyncStorage
4. Images prefetch in background during splash
5. Home screen renders with all data

### Every Launch After
1. Splash screen (2.2s)
2. AsyncStorage: instant load → show content immediately (0ms)
3. If cache > 24h old → fetch from Redis API in background (~1-5ms)
4. Firestore listener fires silently → updates store + AsyncStorage
5. Images load from disk cache → instant on scroll

### Admin Updates a Prompt
1. Admin panel writes to Firestore
2. Admin panel invalidates `cache:prompts:all` in Redis
3. Mobile Firestore listener picks up the change → updates store + AsyncStorage
4. User sees updated prompt on next scroll (no refresh needed)
