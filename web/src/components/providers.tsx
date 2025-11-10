'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ToastProvider } from '@/components/ui/toast';
import { CacheProvider } from '@/contexts/CacheContext';
import { useState, useEffect } from 'react';

// Create a stable QueryClient instance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CacheProvider>
        <ToastProvider defaultPosition="top-right">
          {children}
          {mounted && <ReactQueryDevtools initialIsOpen={false} />}
        </ToastProvider>
      </CacheProvider>
    </QueryClientProvider>
  );
}
