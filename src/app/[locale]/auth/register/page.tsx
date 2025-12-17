'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { InputWithIcon } from '@/components/ui/InputWithIcon';
import { User, Phone as PhoneIcon, Mail, KeyRound, MapPin, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

// --- UPDATED ZOD SCHEMA (NO OPTIONALS) ---
const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'A valid email is required' }),
  address: z.string().min(10, { message: 'A valid address of at least 10 characters is required' }),
  phone: z.string().min(10, { message: 'A valid phone number of at least 10 digits is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type RegisterData = z.infer<typeof RegisterSchema>;

interface RegisterResponse {
  id: string;
  email: string;
  name: string;
}

// Simple password strength indicator
function getStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}

const strengthLabel = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-600'];

// A simple spinner component for the button's loading state
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
  });

  const pw = watch('password') || '';
  const pwStrength = useMemo(() => getStrength(pw), [pw]);

  const registerMutation = useMutation<RegisterResponse, AxiosError<{ message?: string; error?: string }>, RegisterData>({
    mutationFn: (data) => axios.post('/api/auth/register', data).then(res => res.data),
    onSuccess: () => {
      router.push(`/${locale}/auth/login?registered=true`);
    },
    onError: (error) => {
      const status = error.response?.status;
      const server = error.response?.data;
      const message = server?.message || server?.error || (status === 409 ? 'This email is already registered' : 'An unexpected error occurred. Please try again.');
      setServerError(message);
    },
  });

  const onSubmit = (data: RegisterData) => {
    setServerError(null);
    registerMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Create an Account"
      footerContent={
        <p className="text-center">
          Already have an account?{' '}
          <Link href={`/${locale}/auth/login`} className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="flex items-center justify-center mb-2">
        <div className="h-1 w-16 rounded-full bg-indigo-600/70" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Details */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 w-full flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Contact Details
          </legend>

          <InputWithIcon
            icon={(props) => <User {...props} />}
            registration={register('name')}
            error={errors.name?.message}
            id="name"
            type="text"
            placeholder="Full Name"
            autoComplete="name"
          />

          <InputWithIcon
            icon={(props) => <PhoneIcon {...props} />}
            registration={register('phone')}
            error={errors.phone?.message}
            id="phone"
            type="tel"
            placeholder="Phone Number"
            autoComplete="tel"
          />

          <div>
            <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-gray-700"><MapPin className="w-4 h-4 text-gray-400" /> Full Address</label>
            <textarea
              id="address"
              rows={3}
              placeholder="123 Main St, Anytown, USA 12345"
              {...register('address')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {errors.address && <p className="mt-2 text-sm text-red-600">{errors.address.message}</p>}
          </div>
        </fieldset>

        {/* Account Credentials */}
        <fieldset className="space-y-4 pt-4">
          <legend className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 w-full">Account Credentials</legend>

          <InputWithIcon
            icon={(props) => <Mail {...props} />}
            registration={register('email')}
            error={errors.email?.message}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />

          <div>
            <InputWithIcon
              icon={(props) => <KeyRound {...props} />}
              registration={register('password')}
              error={errors.password?.message}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
            <div className="mt-2">
              <div className="flex items-center gap-2">
                {[0,1,2,3,4].map((i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded ${i < pwStrength ? strengthColor[pwStrength-1] : 'bg-gray-200'}`} />
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-500">Strength: {pw ? strengthLabel[pwStrength-1] || 'Very weak' : '—'}</p>
            </div>
          </div>
        </fieldset>

        {serverError && (
          <div className="flex items-center text-sm text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
            <AlertCircle className="w-5 h-5 mr-2" />
            {serverError}
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
          >
            {registerMutation.isPending && <Spinner />}
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}