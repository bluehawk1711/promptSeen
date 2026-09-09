/**
 * Trending — score and rank prompts by recent engagement.
 *
 * Uses a weighted formula:
 *   score = (shares × 3) + (copies × 2) + (likes × 1)
 *
 * Higher weights for shares and copies reflect stronger engagement
 * intent than passive likes.
 */

import type { Prompt } from './types.js';

/**
 * Calculate a trending score for a single prompt.
 *
 * @param prompt - The prompt to score
 * @returns Weighted engagement score
 */
export function getTrendingScore(prompt: Prompt): number {
  const shares = prompt.shareCount ?? 0;
  const copies = prompt.copiesCount ?? 0;
  const likes = prompt.likesCount ?? 0;

  return shares * 3 + copies * 2 + likes;
}

/**
 * Get the top N trending prompts sorted by engagement score.
 *
 * Only includes active prompts. If fewer than N prompts exist,
 * returns all of them sorted.
 *
 * @param prompts - Array of active prompts
 * @param count - Number of trending prompts to return (default 10)
 * @returns Sorted array of prompts with highest trending scores
 */
export function getTrendingPrompts(
  prompts: Prompt[],
  count: number = 10
): Prompt[] {
  return prompts
    .filter((p) => p.isActive)
    .map((p) => ({ prompt: p, score: getTrendingScore(p) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ prompt }) => prompt);
}

/**
 * Format a trending score for display.
 * Scores above 1000 are shown as "X.Xk".
 */
export function formatTrendingScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return String(score);
}
