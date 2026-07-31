'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthShell } from './AuthShell';
import { AuthAlert, AuthField, AuthPanel, AuthPhoneField, AuthSubmit } from './AuthField';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Shield, GraduationCap } from 'lucide-react';

// Schemas
const EmailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

const PhoneSchema = z.object({
  phone: z.string()
    .min(9, { message: 'Phone must be 9 digits' })
    .max(9, { message: 'Phone must be 9 digits' })
    .regex(/^[0-9]+$/, { message: 'Phone must contain only numbers' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFields = { email?: string; phone?: string; password: string };

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
}

const FEATURES = [
  { icon: Sparkles, text: 'Interactive live classes' },
  { icon: Shield, text: 'Secure learning environment' },
  { icon: GraduationCap, text: 'Expert instructors' },
];

export function LoginForm() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl') ?? searchParams.get('next');

  const localeParam = (params as { locale?: string | string[] } | null)?.locale;
  const locale = typeof localeParam === 'string' ? localeParam : Array.isArray(localeParam) ? (localeParam[0] ?? 'en') : 'en';

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [formError, setFormError] = useState<string | null>(null);
  const [idleMessage, setIdleMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const resolver = useMemo<Resolver<LoginFields>>(() => {
    const r = mode === 'email' ? zodResolver(EmailSchema) : zodResolver(PhoneSchema);
    return r as unknown as Resolver<LoginFields>;
  }, [mode]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LoginFields>({ resolver });

  const loginMutation = useMutation<UserResponse, AxiosError<{ error: string }>, LoginFields>({
    mutationFn: (credentials) => axios.post('/api/auth/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data);
      const roleDefault = data.role === 'ADMIN'
        ? `/${locale}/dashboard/admin`
        : data.role === 'INSTRUCTOR'
          ? `/${locale}/dashboard/instructor`
          : `/${locale}/dashboard/student/courses`;

      let target = roleDefault;
      if (callbackUrl) {
        const allowed = (
          (data.role === 'ADMIN' && /([a-zA-Z-]+\/)?dashboard\/admin/.test(callbackUrl)) ||
          (data.role === 'ADMIN' && /([a-zA-Z-]+\/)?dashboard\/student/.test(callbackUrl)) ||
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
    // Prepend +94 to phone if logging in with phone
    const credentials = mode === 'phone' && data.phone
      ? { ...data, phone: `+94${data.phone}` }
      : data;
    loginMutation.mutate(credentials);
  };

  useEffect(() => {
    try {
      const v = sessionStorage.getItem('idle-logout');
      if (v) {
        setIdleMessage('You were logged out due to inactivity. Please sign in again.');
        sessionStorage.removeItem('idle-logout');
      }
    } catch {}
  }, []);

  const switchMode = (next: 'email' | 'phone') => {
    setMode(next);
    setFormError(null);
    reset();
  };

  return (
    <AuthShell
      headline="Welcome back to your"
      accent="learning journey"
      blurb="Continue where you left off. Access your courses, track your progress, and achieve your goals."
      features={FEATURES}
    >
      <AuthPanel title="Sign in" subtitle="Welcome back! Please enter your details.">
        {/* Email / phone switcher */}
        <div
          role="tablist"
          aria-label="Sign in method"
          className="mb-6 flex rounded-xl border border-white/10 bg-white/5 p-1.5"
        >
          {(['email', 'phone'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200 ${
                mode === m
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'email' ? 'Email' : 'Phone'}
            </button>
          ))}
        </div>

        {idleMessage && (
          <AuthAlert tone="warning" onDismiss={() => setIdleMessage(null)}>{idleMessage}</AuthAlert>
        )}
        {formError && <AuthAlert>{formError}</AuthAlert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {mode === 'email' ? (
            <AuthField
              label="Email address"
              icon={Mail}
              type="email"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
          ) : (
            <AuthPhoneField
              error={errors.phone?.message}
              autoComplete="tel"
              {...register('phone')}
            />
          )}

          <AuthField
            label="Password"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            error={errors.password?.message}
            autoComplete="current-password"
            {...register('password')}
            endAdornment={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="p-1 text-slate-400 transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          <div className="flex items-center justify-between">
            <label className="group flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-sm text-slate-400 transition-colors group-hover:text-white">Remember me</span>
            </label>
            <Link
              href={`/${locale}/auth/reset`}
              className="text-sm font-semibold text-sky-400 transition-colors hover:text-sky-300"
            >
              Forgot password?
            </Link>
          </div>

          <AuthSubmit pending={loginMutation.isPending} pendingLabel="Signing in...">
            Sign in <ArrowRight size={18} />
          </AuthSubmit>
        </form>

        <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            href={`/${locale}/auth/register`}
            className="font-semibold text-sky-400 transition-colors hover:text-sky-300"
          >
            Create account
          </Link>
        </p>
      </AuthPanel>
    </AuthShell>
  );
}
