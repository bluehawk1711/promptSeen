import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getOrFetch } from '@/lib/redis';
import { cacheKeys, cacheTTL } from '@/lib/cache-keys';
import type { Prompt } from '@repo/shared/types';

/**
 * GET /api/prompts — public, Redis-cached endpoint for mobile app.
 *
 * Returns all active prompts ordered by `order` asc.
 * Cached in Upstash Redis for 5 minutes. On cache miss, reads from
 * Firestore and stores the result.
 *
 * The mobile app hits this instead of Firestore directly, giving it
 * ~1-5ms response times from Redis edge nodes.
 */
export async function GET() {
  try {
    const prompts = await getOrFetch<Prompt[]>(
      cacheKeys.prompts,
      cacheTTL.prompts,
      async () => {
        const db = getAdminDb();
        const snap = await db
          .collection('prompts')
          .where('isActive', '==', true)
          .orderBy('order', 'asc')
          .limit(200)
          .get();

        return snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Prompt[];
      },
    );

    return NextResponse.json({ prompts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load prompts';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
