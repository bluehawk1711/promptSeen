/**
 * GET /api/analytics
 *
 * Returns daily stats and top prompts using firebase-admin SDK
 * (bypasses Firestore security rules that require isAdmin()).
 *
 * Query params:
 *   limit: number of daily stats to return (default 30)
 *   topPrompts: number of top prompts to return (default 10)
 */

import { NextRequest, NextResponse } from 'next/server'
import type { DailyStats, Prompt } from '@repo/shared/types'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const statsLimit = parseInt(url.searchParams.get('limit') ?? '30', 10)
    const promptsLimit = parseInt(url.searchParams.get('topPrompts') ?? '10', 10)

    const { getAdminDb } = await import('@/lib/firebase-admin')
    const db = getAdminDb()

    // Fetch daily stats
    const statsSnap = await db
      .collection('daily_stats')
      .orderBy('date', 'desc')
      .limit(statsLimit)
      .get()

    const dailyStats: DailyStats[] = statsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as DailyStats,
    )

    // Fetch top prompts by likes
    const promptsSnap = await db
      .collection('prompts')
      .where('isActive', '==', true)
      .orderBy('likesCount', 'desc')
      .limit(promptsLimit)
      .get()

    const topPrompts: Prompt[] = promptsSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Prompt,
    )

    return NextResponse.json({ dailyStats, topPrompts })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch analytics'
    console.error('[api/analytics]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
