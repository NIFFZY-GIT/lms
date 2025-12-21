'use client';

import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import { twMerge } from 'tailwind-merge';

// --- UPDATED INTERFACE ---
// The 'icon' prop is now a function that receives props and returns a React node.
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: (props: { className: string }) => React.ReactNode;
  registration: UseFormRegisterReturn;
  error?: string;
  className?: string;
  endAdornment?: React.ReactNode;
}

export const InputWithIcon = ({ icon, registration, error, className, endAdornment, ...props }: InputProps) => (
  <div>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
        {/* --- THIS IS THE FIX --- */}
        {/* We call the 'icon' function and pass the dynamic className to it. */}
        {icon({
          className: `w-5 h-5 transition-colors ${error ? 'text-red-500' : 'text-gray-400'}`,
        })}
      </div>
      <input
        id={registration.name}
        {...registration}
        {...props}
        className={twMerge(
            `block w-full rounded-xl border border-gray-200 py-3.5 pl-12 bg-gray-50/50 text-gray-900 shadow-sm transition-all duration-200 ${
                error ? 'border-red-300 placeholder:text-red-300 focus:border-red-500 focus:ring-red-500/20' : 'placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white'
            } focus:outline-none sm:text-sm ${endAdornment ? 'pr-12' : 'pr-4'}`,
            className
        )}
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4">
          {endAdornment}
        </div>
      )}
    </div>
    {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1"><span className="inline-block w-1 h-1 rounded-full bg-red-500"></span>{error}</p>}
  </div>
);