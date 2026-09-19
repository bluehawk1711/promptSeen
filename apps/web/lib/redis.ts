/**
 * Upstash Redis — server-side cache for mobile API routes.
 *
 * Provides a thin wrapper around @upstash/redis with helpers for
 * cache-aside pattern: get-or-fetch, and invalidation.
 *
 * Redis is OPTIONAL. If env vars are missing, all operations silently
 * skip caching and fall through to Firestore directly.
 *
 * Env vars (set in Vercel project settings, NOT just GitHub Actions):
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;
let _checked = false;

/**
 * Get the Redis singleton. Returns null if env vars are missing.
 */
export function getRedis(): Redis | null {
  if (_checked) return _redis;
  _checked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn('[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — caching disabled');
    return null;
  }

  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Cache-aside pattern: get from Redis, or fetch + store on miss.
 * Gracefully skips cache when Redis is unavailable.
 */
export async function getOrFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  if (redis) {
    try {
      const cached = await redis.get<T>(key);
      if (cached !== null) return cached;
    } catch {
      // Redis read failed — fall through to fetcher
    }
  }

  const data = await fetcher();

  if (redis) {
    try {
      await redis.set(key, data, { ex: ttl });
    } catch {
      // Redis write failed — data is still valid, just uncached
    }
  }

  return data;
}

/**
 * Invalidate one or more cache keys. No-op when Redis is unavailable.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    if (keys.length === 1) {
      await redis.del(keys[0]);
    } else {
      await redis.del(...keys);
    }
  } catch {
    // Redis invalidation failed — cache will expire naturally via TTL
  }
}
