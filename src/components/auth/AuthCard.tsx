import React from 'react';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footerContent: React.ReactNode;
}

export function AuthCard({ title, children, footerContent }: AuthCardProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">{title}</h2>
          </div>
          {children}
        </div>
        <div className="text-center text-sm text-gray-600">
          {footerContent}
        </div>
      </div>
    </div>
  );
}