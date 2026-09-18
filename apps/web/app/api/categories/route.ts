import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { getOrFetch } from '@/lib/redis';
import { cacheKeys, cacheTTL } from '@/lib/cache-keys';
import type { Category } from '@repo/shared/types';

/**
 * GET /api/categories — public, Redis-cached endpoint for mobile app.
 *
 * Returns all categories ordered by `order` asc.
 * Cached in Upstash Redis for 1 hour (categories change rarely).
 */
export async function GET() {
  try {
    const categories = await getOrFetch<Category[]>(
      cacheKeys.categories,
      cacheTTL.categories,
      async () => {
        const db = getAdminDb();
        const snap = await db
          .collection('categories')
          .orderBy('order', 'asc')
          .get();

        return snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Category[];
      },
    );

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to load categories';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
