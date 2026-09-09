/**
 * React Query provider for the PromptSeen admin panel.
 *
 * Same cache strategy as mobile: 2.5 min staleTime, 10 min gcTime.
 * Admin panel benefits from caching because:
 * 1. Multiple CRUD operations on the same page don't refetch
 * 2. Switching between pages doesn't re-fetch data that's still fresh
 * 3. Realtime Firestore listeners still push updates immediately
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const STALE_TIME = 2.5 * 60 * 1000; // 2.5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME,
        gcTime: GC_TIME,
        refetchOnWindowFocus: true, // Admin wants fresh data
        refetchOnReconnect: true,
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Get the query client for manual invalidation.
 * Usage: import { getQueryClient } from '@/lib/query-provider';
 */
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = makeQueryClient();
  }
  return queryClientInstance;
}
