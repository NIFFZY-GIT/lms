import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db'; // Your database connection
import Link from 'next/link';
import { BookOpen, BarChart3, User } from 'lucide-react';

// This is a Server Component, so we can directly access cookies and the database.

// Helper function to get the current user on the server
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    return null;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userResult = await db.query('SELECT id, name, role FROM "User" WHERE id = $1', [decoded.id]);
    const user = userResult.rows[0];
    
    // Ensure the user is a student
    if (!user || user.role !== 'STUDENT') {
      return null;
    }
    
    return user;
  } catch (error) {
    // Invalid token, etc.
    return null;
  }
}

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // --- The Protection Logic ---
  const user = await getCurrentUser();

  // If there's no valid student user, redirect to the login page.
  // We can add a 'callbackUrl' to redirect them back after they log in.
  if (!user) {
    const callbackUrl = encodeURIComponent('/dashboard/student/courses');
    redirect(`/auth/login?callbackUrl=${callbackUrl}`);
  }

  // If the user is valid, render the layout with the page content.
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation for the Student Dashboard */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 flex-shrink-0">
        <div className="text-2xl font-bold mb-4 px-4">Student Panel</div>
        <div className="px-4 mb-8">
            <p className="text-sm text-gray-400">Welcome,</p>
            <p className="font-semibold text-lg">{user.name}</p>
        </div>
        <nav className="flex-grow space-y-2">
          <Link href="/dashboard/student/courses" className="flex items-center px-4 py-2.5 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
            <BookOpen className="w-5 h-5 mr-3" />
            My Courses
          </Link>
          <Link href="/dashboard/student/results" className="flex items-center px-4 py-2.5 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5 mr-3" />
            My Results
          </Link>
        </nav>
        {/* You can add a logout button or profile link here */}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}