'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios, { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';

// --- UPDATED ZOD SCHEMA (NO OPTIONALS) ---
const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'A valid email is required' }),
  // Address and Phone are now required with minimum length validation
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

// A simple spinner component for the button's loading state
const Spinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


export default function RegisterPage() {
  const router = useRouter();
  // --- COMPONENT STATE FOR SERVER ERRORS ---
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(RegisterSchema),
  });

  // --- UPDATED MUTATION FOR BETTER ERROR HANDLING ---
  const registerMutation = useMutation<RegisterResponse, AxiosError<{ message: string }>, RegisterData>({
    mutationFn: (data) => axios.post('/api/auth/register', data).then(res => res.data),
    onSuccess: () => {
      router.push('/auth/login?registered=true');
    },
    onError: (error) => {
      // Set a specific error message from the API response, or a generic one
      const message = error.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setServerError(message);
      console.error('Registration failed:', message);
    },
  });

  const onSubmit = (data: RegisterData) => {
    // Clear previous server errors before a new submission
    setServerError(null);
    registerMutation.mutate(data);
  };

  return (
    <AuthCard
      title="Create an Account"
      footerContent={
        <p className="text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      }
    >
      {/* --- RE-DESIGNED & RE-STRUCTURED FORM --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Fieldset for Contact Details */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 w-full">
            Contact Details
          </legend>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register('name')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              id="phone"
              type="tel"
              placeholder="e.g., (123) 456-7890"
              {...register('phone')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Full Address</label>
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

        {/* Fieldset for Account Credentials */}
        <fieldset className="space-y-4 pt-4">
           <legend className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4 w-full">
            Account Credentials
          </legend>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register('email')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              {...register('password')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
          </div>
        </fieldset>
        
        {/* --- DYNAMIC SERVER ERROR DISPLAY --- */}
        {serverError && (
            <div className="text-sm text-red-700 bg-red-100 p-3 rounded-md border border-red-200">
                {serverError}
            </div>
        )}

        <div>
          <button
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition"
          >
            {registerMutation.isPending && <Spinner />}
            {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </AuthCard>
  );
}