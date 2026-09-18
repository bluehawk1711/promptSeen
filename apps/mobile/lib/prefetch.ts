/**
 * Image prefetching utilities.
 *
 * Prefetches prompt images on app mount so they're cached on disk
 * before the user scrolls to them.
 */

import { Image } from 'expo-image';
import type { Prompt } from '@repo/shared/types';

const PREFETCH_BATCH_SIZE = 6;
const PREFETCH_DELAY_MS = 150;

/**
 * Prefetch prompt images in staggered batches to avoid bandwidth contention.
 * Skips images already in the expo-image disk cache (no-op for cached URLs).
 */
export async function prefetchPromptImages(prompts: Prompt[]): Promise<void> {
  const urls = prompts
    .filter((p) => p.imageUrl && !p.video)
    .map((p) => p.imageUrl)
    .slice(0, 24); // Cap at 24 images total

  for (let i = 0; i < urls.length; i += PREFETCH_BATCH_SIZE) {
    const batch = urls.slice(i, i + PREFETCH_BATCH_SIZE);
    await Promise.allSettled(
      batch.map((url) =>
        Image.prefetch(url).catch(() => {
          // Silently skip failed prefetches — image will load on demand
        })
      )
    );
    // Small delay between batches to keep the UI thread responsive
    if (i + PREFETCH_BATCH_SIZE < urls.length) {
      await delay(PREFETCH_DELAY_MS);
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
