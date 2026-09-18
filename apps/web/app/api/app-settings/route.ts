import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { getOrFetch, invalidateCache } from '@/lib/redis'
import { DEFAULT_APP_SETTINGS, APP_NAME } from '@repo/shared/types'
import type { AppSettings, SocialLink } from '@repo/shared/types'

const SETTINGS_CACHE_KEY = 'cache:settings:app'
/** Settings rarely change — cache for 5 minutes on the server. */
const SETTINGS_CACHE_TTL = 5 * 60

/**
 * GET /api/app-settings — public read, Redis-cached.
 *
 * The mobile app fetches this on launch for force-update checks.
 * Cached in Redis for 5 minutes. If the admin saves new settings,
 * the cache is invalidated immediately.
 */
export async function GET() {
  try {
    const settings = await getOrFetch<AppSettings>(
      SETTINGS_CACHE_KEY,
      SETTINGS_CACHE_TTL,
      async () => {
        const db = getAdminDb()
        const snap = await db.collection('settings').doc('app').get()
        if (!snap.exists) {
          return { ...DEFAULT_APP_SETTINGS, updatedAt: null }
        }
        const data = snap.data() as Partial<AppSettings>
        return { ...DEFAULT_APP_SETTINGS, ...data } as AppSettings
      },
    )

    return NextResponse.json({ settings, appName: APP_NAME })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface SocialLinkInput {
  platform?: unknown
  label?: unknown
  subtitle?: unknown
  url?: unknown
  order?: unknown
  isActive?: unknown
}

function parseSocialLink(raw: SocialLinkInput, index: number): SocialLink | null {
  if (typeof raw.url !== 'string' || raw.url.trim() === '') return null
  return {
    id: `social-${index}-${Date.now()}`,
    platform: typeof raw.platform === 'string' ? raw.platform : 'website',
    label: typeof raw.label === 'string' ? raw.label : 'Link',
    subtitle: typeof raw.subtitle === 'string' ? raw.subtitle : '',
    url: raw.url.trim(),
    order: typeof raw.order === 'number' ? raw.order : index,
    isActive: raw.isActive !== false,
  }
}

/**
 * PUT /api/app-settings — admin save.
 *
 * Writes to Firestore AND invalidates the Redis cache immediately.
 * This ensures the mobile app gets fresh settings on next fetch,
 * including any version changes that trigger force-update.
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<AppSettings>

    const settings: AppSettings = {
      latestVersion: typeof body.latestVersion === 'string' ? body.latestVersion : DEFAULT_APP_SETTINGS.latestVersion,
      minVersion: typeof body.minVersion === 'string' ? body.minVersion : DEFAULT_APP_SETTINGS.minVersion,
      playStoreUrl: typeof body.playStoreUrl === 'string' ? body.playStoreUrl : '',
      appStoreUrl: typeof body.appStoreUrl === 'string' ? body.appStoreUrl : '',
      updateMode: body.updateMode === 'hard' || body.updateMode === 'soft' ? body.updateMode : 'none',
      aboutText: typeof body.aboutText === 'string' ? body.aboutText : DEFAULT_APP_SETTINGS.aboutText,
      supportEmail: typeof body.supportEmail === 'string' ? body.supportEmail : '',
      socialLinks: Array.isArray(body.socialLinks)
        ? body.socialLinks
            .map((link, i) => parseSocialLink(link as SocialLinkInput, i))
            .filter((link): link is SocialLink => link !== null)
        : DEFAULT_APP_SETTINGS.socialLinks,
      updatedAt: Date.now(),
    }

    const db = getAdminDb()
    await db.collection('settings').doc('app').set(settings, { merge: true })

    // Invalidate Redis cache so mobile app gets fresh settings immediately
    await invalidateCache(SETTINGS_CACHE_KEY)

    return NextResponse.json({ settings, ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
