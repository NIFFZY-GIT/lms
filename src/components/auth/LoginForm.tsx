'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthCard } from '@/components/auth/AuthCard';
import { useAuth } from '@/context/AuthContext';
import { InputWithIcon } from '@/components/ui/InputWithIcon'; // Using the modern input
import { Mail, KeyRound, AlertCircle } from 'lucide-react';

// --- Validation Schema ---
const LoginSchema = z.object({
  email: z.string().email({ message: 'A valid email is required' }),
  password: z.string().min(1, { message: 'Password cannot be empty' }),
});

type LoginData = z.infer<typeof LoginSchema>;

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const callbackUrl = searchParams.get('callbackUrl');

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  });

  const loginMutation = useMutation<UserResponse, AxiosError<{ error: string }>, LoginData>({
    mutationFn: (credentials) => axios.post('/api/auth/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      login(data);
      if (callbackUrl) {
        router.push(callbackUrl);
      } else {
        router.push(data.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student/courses');
      }
    },
    onError: (error) => {
      // Set a generic form error to display to the user
      setError("root", {
        type: "manual",
        message: error.response?.data?.error || "An unexpected error occurred."
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
        <AuthCard
          title="Welcome Back"
          subtitle="Sign in to access your dashboard and courses."
          footerContent={
            <p>
              Don&apos;t have an account?{' '}
              <Link href="/auth/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign up
              </Link>
            </p>
          }
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <InputWithIcon
                    icon={(props) => <Mail {...props} />}
              registration={register('email')}
              error={errors.email?.message}
              id="email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
            />

            <InputWithIcon
                  icon={(props) => <KeyRound {...props} />}
              registration={register('password')}
              error={errors.password?.message}
              id="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
            />
            
            {errors.root && (
                <div className="flex items-center text-sm text-red-700 bg-red-100 p-3 rounded-md">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    {errors.root.message}
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
              >
                {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </AuthCard>
    </div>
  );
}