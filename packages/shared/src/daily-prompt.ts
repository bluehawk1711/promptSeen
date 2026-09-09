/**
 * Daily Prompt — deterministic date-based prompt selection.
 *
 * Uses a simple hash of the current date to pick one prompt per day.
 * The same prompt is shown to all users on the same day, and changes
 * at midnight UTC. No server state needed — purely client-side.
 */

import type { Prompt } from './types.js';

/**
 * Simple string hash (djb2) — fast, deterministic, well-distributed.
 */
function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

/**
 * Get today's date string in UTC (YYYY-MM-DD).
 */
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the daily prompt from a list of active prompts.
 *
 * The selection is deterministic: given the same list of prompts on the
 * same day, it always returns the same prompt. If the list changes
 * (new prompts added, others removed), the selection may shift, but
 * it will still be stable within a single day.
 *
 * @param prompts - Array of active prompts (should be pre-filtered)
 * @param dateKey - Optional custom date key (defaults to today UTC)
 * @returns The daily prompt, or null if no prompts available
 */
export function getDailyPrompt(
  prompts: Prompt[],
  dateKey?: string
): Prompt | null {
  if (prompts.length === 0) return null;

  const key = dateKey ?? getTodayKey();
  const hash = djb2Hash(`daily-${key}`);
  const index = hash % prompts.length;

  return prompts[index];
}

/**
 * Get the time remaining until the next daily prompt rotation.
 * Returns milliseconds until midnight UTC.
 */
export function getTimeUntilRotation(): number {
  const now = new Date();
  const tomorrow = new Date(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  );
  return tomorrow.getTime() - now.getTime();
}

/**
 * Format the time remaining as a human-readable string.
 */
export function formatTimeUntilRotation(): string {
  const ms = getTimeUntilRotation();
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
