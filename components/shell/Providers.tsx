'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" is the one global switch for Framer Motion animations */}
      <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
        {children}
      </MotionConfig>
    </QueryClientProvider>
  );
}
