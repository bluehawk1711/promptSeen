/**
 * Cache keys for Upstash Redis.
 *
 * Centralized key definitions to avoid typos and ensure consistency
 * between cache writes (API routes) and cache invalidation (mutations).
 */

export const cacheKeys = {
  /** All active prompts, ordered by `order` asc. */
  prompts: 'cache:prompts:all',
  /** All active categories, ordered by `order` asc. */
  categories: 'cache:categories:all',
  /** Single prompt by ID. */
  prompt: (id: string) => `cache:prompts:${id}`,
} as const;

/** Cache TTLs in seconds. */
export const cacheTTL = {
  /** Prompts refresh every 5 minutes on the server side. */
  prompts: 5 * 60,
  /** Categories change rarely — cache for 1 hour. */
  categories: 60 * 60,
} as const;
