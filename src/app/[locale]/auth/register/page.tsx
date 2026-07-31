'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthAlert, AuthField, AuthPanel, AuthPhoneField, AuthSubmit } from '@/components/auth/AuthField';
import {
  User, Mail, Lock, MapPin, Eye, EyeOff,
  ArrowRight, Sparkles, Shield, GraduationCap,
} from 'lucide-react';

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  address: z.string().min(10, { message: 'Please enter your full street address' }),
  phone: z.string()
    .min(9, { message: 'Enter the 9 digits after +94' })
    .max(9, { message: 'Enter the 9 digits after +94' })
    .regex(/^[0-9]+$/, { message: 'Phone must contain only numbers' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterData = z.infer<typeof RegisterSchema>;

function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABEL = ['Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLOR = ['bg-red-500', 'bg-amber-500', 'bg-sky-500', 'bg-emerald-500'];

const FEATURES = [
  { icon: GraduationCap, text: 'Expert instructors' },
  { icon: Shield, text: 'Secure learning environment' },
  { icon: Sparkles, text: 'Premium course content' },
];

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, dirtyFields } } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
    mode: 'onChange'
  });

  const pw = watch('password') || '';
  const pwStrength = useMemo(() => getStrength(pw), [pw]);

  const registerMutation = useMutation({
    mutationFn: (data: RegisterData) => axios.post('/api/auth/register', data).then(res => res.data),
    onSuccess: () => router.push(`/${locale}/auth/login?registered=true`),
    onError: (error: AxiosError<{ message?: string; error?: string }>) => {
      setServerError(error.response?.data?.message || 'Email already exists or server error.');
    },
  });

  const onSubmit = (data: RegisterData) => {
    setServerError(null);
    registerMutation.mutate({ ...data, phone: `+94${data.phone}` });
  };

  return (
    <AuthShell
      headline="Start your"
      accent="future today."
      blurb="Create your free account to unlock lessons, quizzes, past papers and progress tracking built for Sri Lankan students."
      features={FEATURES}
    >
      <AuthPanel title="Create account" subtitle="Fill in your details to get started.">
        {serverError && <AuthAlert>{serverError}</AuthAlert>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <AuthField
            label="Full name"
            icon={User}
            autoComplete="name"
            isValid={dirtyFields.name && !errors.name}
            error={errors.name?.message}
            {...register('name')}
          />

          <AuthField
            label="Email address"
            icon={Mail}
            type="email"
            autoComplete="email"
            isValid={dirtyFields.email && !errors.email}
            error={errors.email?.message}
            {...register('email')}
          />

          <AuthPhoneField
            autoComplete="tel"
            isValid={dirtyFields.phone && !errors.phone}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <AuthField
            label="Full home address"
            icon={MapPin}
            autoComplete="street-address"
            isValid={dirtyFields.address && !errors.address}
            error={errors.address?.message}
            {...register('address')}
          />

          <div className="space-y-3">
            <AuthField
              label="Create password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              error={errors.password?.message}
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

            {pw.length > 0 && (
              <div className="px-1">
                <div className="mb-2 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                        i < pwStrength ? STRENGTH_COLOR[pwStrength - 1] : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Password strength: {STRENGTH_LABEL[pwStrength - 1] || 'Too short'}
                </p>
              </div>
            )}
          </div>

          <AuthSubmit pending={registerMutation.isPending} pendingLabel="Creating account...">
            Create account <ArrowRight size={18} />
          </AuthSubmit>
        </form>

        <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            href={`/${locale}/auth/login`}
            className="font-semibold text-sky-400 transition-colors hover:text-sky-300"
          >
            Sign in
          </Link>
        </p>
      </AuthPanel>
    </AuthShell>
  );
}
