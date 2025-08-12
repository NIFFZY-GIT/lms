import React from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerContent: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footerContent }: AuthCardProps) {
  return (
    <div className="flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="glass-card shadow-2xl rounded-2xl p-8 sm:p-10 space-y-6 border border-white/20">
          <div className="h-1.5 w-16 rounded-full gradient-brand mx-auto" />
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{title}</h2>
            {subtitle && (
                <p className="mt-2 text-gray-600">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
        <div className="mt-6 text-center text-sm text-gray-600">
          {footerContent}
        </div>
      </div>
    </div>
  );
}