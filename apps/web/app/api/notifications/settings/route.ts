/**
 * GET /api/notifications/settings
 * Returns notification settings.
 *
 * POST /api/notifications/settings
 * Updates notification settings.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin')
    const db = getAdminDb()

    const snap = await db.collection('settings').doc('notifications').get()
    const data = snap.exists ? snap.data() : { autoNotifyNewPrompt: true }

    return NextResponse.json(data)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch settings'
    console.error('[api/notifications/settings] GET', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { getAdminDb } = await import('@/lib/firebase-admin')
    const db = getAdminDb()

    const body = await request.json()

    await db.collection('settings').doc('notifications').set(body, { merge: true })

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update settings'
    console.error('[api/notifications/settings] POST', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
