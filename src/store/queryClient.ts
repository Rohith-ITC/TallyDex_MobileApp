import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../api/client';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      // A 4xx won't change on retry; network blips might.
      retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status && error.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});
