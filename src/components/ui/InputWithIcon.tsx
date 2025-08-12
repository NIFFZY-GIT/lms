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
    <div className="relative mt-2 rounded-md shadow-sm">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {/* --- THIS IS THE FIX --- */}
        {/* We call the 'icon' function and pass the dynamic className to it. */}
        {icon({
          className: `w-5 h-5 ${error ? 'text-red-500' : 'text-gray-400'}`,
        })}
      </div>
      <input
        id={registration.name}
        {...registration}
        {...props}
        className={twMerge(
            `block w-full rounded-md border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ${
                error ? 'ring-red-300 placeholder:text-red-300 focus:ring-red-500' : 'ring-gray-300 placeholder:text-gray-400 focus:ring-blue-600'
            } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${endAdornment ? 'pr-10' : ''}`,
            className
        )}
      />
      {endAdornment && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {endAdornment}
        </div>
      )}
    </div>
    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
  </div>
);