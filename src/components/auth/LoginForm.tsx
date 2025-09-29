'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { InputWithIcon } from '@/components/ui/InputWithIcon';
import { Mail, KeyRound, AlertCircle, Phone as PhoneIcon, Eye, EyeOff } from 'lucide-react';

// Schemas for each mode
const EmailSchema = z.object({
  email: z.string().email({ message: 'A valid email is required' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});

const PhoneSchema = z.object({
  phone: z.string().min(7, { message: 'A valid phone is required' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});

// Unified fields for the form
type LoginFields = { email?: string; phone?: string; password: string };

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl');
  
  // Get current locale from URL
  let locale = 'en';
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/^\/([a-zA-Z-]+)(\/|$)/);
    if (match) locale = match[1];
  }

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [idleMessage, setIdleMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo<Resolver<LoginFields>>(() => {
    const r = mode === 'email' ? zodResolver(EmailSchema) : zodResolver(PhoneSchema);
    return r as unknown as Resolver<LoginFields>;
  }, [mode]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver,
  });

  const loginMutation = useMutation<UserResponse, AxiosError<{ error: string }>, LoginFields>({
    mutationFn: (credentials) => axios.post('/api/auth/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data);
      // Get current locale from URL or default to 'en'
      let locale = 'en';
      if (typeof window !== 'undefined') {
        const match = window.location.pathname.match(/^\/([a-zA-Z-]+)(\/|$)/);
        if (match) locale = match[1];
      }
      const roleDefault = data.role === 'ADMIN'
        ? `/${locale}/dashboard/admin`
        : data.role === 'INSTRUCTOR'
          ? `/${locale}/dashboard/instructor`
          : `/${locale}/dashboard/student/courses`;

      let target = roleDefault;
      if (callbackUrl) {
        // Accept both /en/dashboard/... and /dashboard/... (will redirect via middleware if needed)
        const allowed = (
          (data.role === 'ADMIN' && /([a-zA-Z-]+\/)?dashboard\/admin/.test(callbackUrl)) ||
          (data.role === 'INSTRUCTOR' && /([a-zA-Z-]+\/)?dashboard\/instructor/.test(callbackUrl)) ||
          (data.role === 'STUDENT' && /([a-zA-Z-]+\/)?dashboard\/student/.test(callbackUrl))
        );
        if (allowed) target = callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`;
      }
      router.push(target);
    },
    onError: (error) => {
      setFormError(error.response?.data?.error || 'An unexpected error occurred.');
    },
  });

  const onSubmit = (data: LoginFields) => {
    setFormError(null);
    loginMutation.mutate(data);
  };

  // Show idle logout message if redirected after inactivity
  useEffect(() => {
    try {
      const v = sessionStorage.getItem('idle-logout');
      if (v) {
        setIdleMessage('You were logged out due to inactivity for security reasons. Please sign in again.');
        sessionStorage.removeItem('idle-logout');
      }
    } catch {}
  }, []);

  const switchMode = (next: 'email' | 'phone') => {
    setMode(next);
    reset();
  };

  return (
    <div className="min-h-screen bg-white">
      <AuthCard
        title="Welcome Back"
        subtitle="Sign in to access your dashboard and courses."
        footerContent={
          <p>
            Don&apos;t have an account?{' '}
            <Link href={`/${locale}/auth/register`} className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        }
      >
        <div className="flex items-center justify-center mb-2">
          <div className="h-1 w-16 rounded-full bg-blue-600/70" />
        </div>
        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => switchMode('email')}
            className={`py-2 rounded-md border text-sm transition ${mode === 'email' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Sign in with Email
          </button>
          <button
            type="button"
            onClick={() => switchMode('phone')}
            className={`py-2 rounded-md border text-sm transition ${mode === 'phone' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            Sign in with Phone
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {idleMessage && (
            <div className="flex items-center text-sm text-yellow-800 bg-yellow-100 p-3 rounded-md">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-700" />
              <div className="flex-1">{idleMessage}</div>
              <button type="button" onClick={() => setIdleMessage(null)} className="ml-3 text-sm text-yellow-700 underline">Dismiss</button>
            </div>
          )}
          {mode === 'email' ? (
            <InputWithIcon
              icon={(props) => <Mail {...props} />}
              registration={register('email')}
              error={errors.email?.message}
              id="email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
            />
          ) : (
            <InputWithIcon
              icon={(props) => <PhoneIcon {...props} />}
              registration={register('phone')}
              error={errors.phone?.message}
              id="phone"
              type="tel"
              placeholder="Phone Number"
              autoComplete="tel"
            />
          )}

          <InputWithIcon
            icon={(props) => <KeyRound {...props} />}
            registration={register('password')}
            error={errors.password?.message}
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            endAdornment={
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            }
          />

          <div className="flex justify-between text-sm">
            <div />
            <Link href={`/${locale}/auth/reset`} className="text-blue-600 hover:text-blue-500">Forgot password?</Link>
          </div>

          {formError && (
            <div className="flex items-center text-sm text-red-700 bg-red-100 p-3 rounded-md">
              <AlertCircle className="w-5 h-5 mr-2" />
              {formError}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}