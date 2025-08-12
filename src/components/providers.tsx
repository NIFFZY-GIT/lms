'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider, GlobalToastBridge } from '@/components/ui/toast';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import React from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <GlobalToastBridge />
          {children}
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}