/**
 * React Query provider — global cache config for the PromptSeen mobile app.
 *
 * Cache strategy:
 * - staleTime: 2.5 minutes — data is considered fresh for 2.5 minutes
 *   before React Query refetches on mount/focus.
 * - gcTime: 10 minutes — garbage collect unused cache entries after 10 min.
 * - refetchOnWindowFocus: false — React Native doesn't have window focus.
 * - refetchOnReconnect: true — refetch when device reconnects to network.
 * - retry: 2 — retry failed requests twice with exponential backoff.
 *
 * Invalidation flow:
 *   Admin makes change → Firestore write → Mobile realtime listener fires
 *   → store updated → React Query invalidation triggered via queryClient
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRef } from 'react';

/**
 * Create a stable QueryClient instance.
 * Using useRef ensures we don't create a new client on every render.
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is fresh for 2.5 minutes — no refetch during this window
        staleTime: 2.5 * 60 * 1000,

        // Garbage collect unused cache entries after 10 minutes
        gcTime: 10 * 60 * 1000,

        // Don't refetch on window focus (React Native doesn't have it)
        refetchOnWindowFocus: false,

        // Refetch when device regains network connection
        refetchOnReconnect: true,

        // Retry failed requests twice with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // Don't refetch on component mount if data is stale
        refetchOnMount: 'always',
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server — always make a new query client
    return makeQueryClient();
  }
  // Browser — make a new client if we don't already have one
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClientRef = useRef(getQueryClient());

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}

/**
 * Get the QueryClient instance for invalidation from anywhere.
 * Usage: import { getQueryClient } from '@/providers/query-provider';
 *        getQueryClient().invalidateQueries({ queryKey: ['prompts'] });
 */
export { getQueryClient };
