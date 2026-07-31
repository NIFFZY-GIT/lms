import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Loader2 } from 'lucide-react';

// A simple loading skeleton for the Suspense fallback
// Matches the signed-out screen's dark shell so the fallback doesn't flash a
// white page before the form mounts.
function LoginSkeleton() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950">
            <Loader2 className="h-10 w-10 animate-spin text-sky-400" />
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