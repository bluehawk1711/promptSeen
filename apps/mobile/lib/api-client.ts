/**
 * API client for the admin panel's Redis-cached endpoints.
 *
 * Mobile app uses these to get prompts/categories faster than Firestore
 * direct reads (~1-5ms from Redis edge vs ~50-200ms from Firestore).
 *
 * Falls back silently if the API is unreachable (e.g., dev without backend).
 */

import type { Prompt, Category } from '@repo/shared/types';

/** Admin panel base URL. Defaults to localhost for Android emulator. */
const ADMIN_API_URL =
  process.env.EXPO_PUBLIC_ADMIN_API_URL ?? 'http://10.0.2.2:3000';

/** Timeout for API calls (8 seconds). */
const API_TIMEOUT_MS = 8000;

/**
 * Fetch prompts from the Redis-cached API endpoint.
 * Returns null on failure so the caller can fall back to Firestore.
 */
export async function fetchPromptsFromApi(): Promise<Prompt[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch(`${ADMIN_API_URL}/api/prompts`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data.prompts ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch categories from the Redis-cached API endpoint.
 * Returns null on failure.
 */
export async function fetchCategoriesFromApi(): Promise<Category[] | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    const res = await fetch(`${ADMIN_API_URL}/api/categories`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    return data.categories ?? null;
  } catch {
    return null;
  }
}
