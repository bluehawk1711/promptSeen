/**
 * Upstash Redis — server-side cache for mobile API routes.
 *
 * Provides a thin wrapper around @upstash/redis with helpers for
 * cache-aside pattern: get-or-fetch, and invalidation.
 *
 * Env vars required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

/**
 * Get the Redis singleton. Throws if env vars are missing.
 */
export function getRedis(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Upstash Redis credentials. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local',
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

/**
 * Cache-aside pattern: get from Redis, or fetch + store on miss.
 *
 * @param key - Redis key
 * @param ttl - Time-to-live in seconds
 * @param fetcher - Function to call on cache miss
 * @returns The cached or freshly fetched data
 */
export async function getOrFetch<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const redis = getRedis();

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) return cached;
  } catch {
    // Redis unavailable — fall through to fetcher
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttl });
  } catch {
    // Redis write failed — data is still valid, just uncached
  }

  return data;
}

/**
 * Invalidate one or more cache keys.
 */
export async function invalidateCache(...keys: string[]): Promise<void> {
  const redis = getRedis();
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
