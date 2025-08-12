import React from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
}

export const Input = ({ label, registration, error, ...props }: InputProps) => (
  <div>
    <label htmlFor={registration.name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <input
      id={registration.name}
      {...registration}
      {...props}
  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
  </div>
);