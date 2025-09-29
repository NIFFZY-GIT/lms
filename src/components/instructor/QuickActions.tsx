'use client';
import Link from 'next/link';
import React from 'react';

export function QuickActions() {
  // Get current locale from pathname
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const match = pathname.match(/^\/([a-zA-Z-]+)(\/|$)/);
  const locale = match ? match[1] : 'en';
  
  return (
    <div className="bg-white rounded-lg shadow border p-5 space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">Quick Actions</h3>
      <div className="flex flex-col space-y-2">
        <Link href={`/${locale}/dashboard/instructor/courses`} className="btn-primary text-center text-sm">Create / Manage Courses</Link>
        <Link href={`/${locale}/dashboard/instructor/students`} className="btn-secondary text-center text-sm">View Students</Link>
        <Link href={`/${locale}/dashboard/instructor/courses`} className="btn-secondary text-center text-sm">Add Recording / Quiz</Link>
      </div>
    </div>
  );
}
