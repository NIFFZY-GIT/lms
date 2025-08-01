'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { AuthCard } from '@/components/auth/AuthCard';

// Define the validation schema using Zod
const LoginSchema = z.object({
  email: z.string().email({ message: 'A valid email is required' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginData = z.infer<typeof LoginSchema>;

interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'STUDENT';
}

export default function LoginPage() {
  const router = useRouter();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(LoginSchema),
  });

  const loginMutation = useMutation<UserResponse, Error, LoginData>({
    mutationFn: (credentials) => axios.post('/api/auth/login', credentials).then(res => res.data),
    onSuccess: (data) => {
      // On successful login, redirect based on user role
      if (data.role === 'ADMIN') {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/student/courses');
      }
    },
    onError: (error) => {
      // Here you can handle login errors, e.g., show a toast notification
      console.error('Login failed:', error.message);
      // Example: set a form error to display to the user
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Welcome Back"
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
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {loginMutation.isError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                Invalid email or password. Please try again.
            </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
          >
            {loginMutation.isPending ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}