// components/auth/withAdminAuth.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ComponentType } from 'react';

// This is a Higher-Order Component (HOC)
export function withAdminAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAdminAuth = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Don't redirect while the initial user check is happening
      if (isLoading) return;
      if (!user) {
        router.replace('/auth/login?next=/dashboard/admin'); // Redirect to login
      } else if (user.role !== 'ADMIN') {
        router.replace('/'); // Redirect non-admins to the home page
      }
    }, [user, isLoading, router]);

    // Show a full-page loading screen while checking auth state
  if (isLoading || !user || user.role !== 'ADMIN') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">Loading Dashboard...</p>
            <p className="text-sm text-gray-500">Verifying credentials</p>
          </div>
        </div>
      );
    }

    // If authenticated and authorized, render the actual layout/page
    return <WrappedComponent {...props} />;
  };

  return WithAdminAuth;
}