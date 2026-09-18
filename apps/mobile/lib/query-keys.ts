/**
 * React Query cache keys — shared across stores and hooks.
 *
 * Extracted here to avoid require cycles between lib/queries and store/*.
 */

export const queryKeys = {
  prompts: ['prompts'] as const,
  promptDetail: (id: string) => ['prompts', id] as const,
  relatedPrompts: (categoryId: string, excludeId: string) =>
    ['prompts', 'related', categoryId, excludeId] as const,
  categories: ['categories'] as const,
  dailyPrompt: ['prompts', 'daily'] as const,
  trending: ['prompts', 'trending'] as const,
  favorites: (likedIds: string[]) => ['prompts', 'favorites', likedIds.sort().join(',')] as const,
  collections: (userId: string) => ['collections', userId] as const,
  publicCollections: ['collections', 'public'] as const,
  submissions: (userId: string) => ['submissions', userId] as const,
  submissionStats: (userId: string) => ['submissions', 'stats', userId] as const,
} as const;
