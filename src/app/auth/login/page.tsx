import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

// A simple loading skeleton for the Suspense fallback
function LoginSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="p-10">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
        </div>
    );
}

export default function LoginPage() {
  return (
    // This Suspense boundary is required by Next.js because LoginForm uses useSearchParams
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}