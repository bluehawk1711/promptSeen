import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase-admin'
import { DEFAULT_APP_SETTINGS, APP_NAME } from '@repo/shared/types'
import type { AppSettings, SocialLink } from '@repo/shared/types'

/**
 * GET /api/app-settings — public read of remote app settings.
 *
 * The mobile app fetches this on launch for force-update checks,
 * social links, about text, and the Play Store URL.
 */
export async function GET() {
  try {
    const db = getAdminDb()
    const snap = await db.collection('settings').doc('app').get()

    if (!snap.exists) {
      return NextResponse.json({ settings: { ...DEFAULT_APP_SETTINGS }, appName: APP_NAME })
    }

    const data = snap.data() as Partial<AppSettings>
    return NextResponse.json({
      settings: { ...DEFAULT_APP_SETTINGS, ...data },
      appName: APP_NAME,
    })
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

/** Validate + normalize a social link from the request body. */
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
 * PUT /api/app-settings — admin save for remote app settings.
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

    return NextResponse.json({ settings, ok: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save settings'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
