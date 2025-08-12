import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import Link from 'next/link';
import { LayoutDashboard, BookOpen, Users, LogOut } from 'lucide-react';

async function getCurrentInstructor() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const userResult = await db.query('SELECT id, name, role FROM "User" WHERE id = $1', [decoded.id]);
    const user = userResult.rows[0];
    if (!user || user.role !== 'INSTRUCTOR') return null;
    return user;
  } catch {
    return null;
  }
}

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentInstructor();
  if (!user) {
    const callbackUrl = encodeURIComponent('/dashboard/instructor');
    redirect(`/auth/login?callbackUrl=${callbackUrl}`);
  }
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-indigo-800 text-white flex flex-col p-4 flex-shrink-0">
        <div className="text-2xl font-bold mb-6 px-2">Instructor</div>
        <div className="px-2 mb-8">
          <p className="text-sm text-indigo-200">Welcome,</p>
          <p className="font-semibold text-lg">{user.name}</p>
        </div>
        <nav className="flex-grow space-y-2">
          <Link href="/dashboard/instructor" className="flex items-center px-4 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-700 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
          </Link>
          <Link href="/dashboard/instructor/courses" className="flex items-center px-4 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-700 hover:text-white transition-colors">
            <BookOpen className="w-5 h-5 mr-3" /> My Courses
          </Link>
          <Link href="/dashboard/instructor/students" className="flex items-center px-4 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-700 hover:text-white transition-colors">
            <Users className="w-5 h-5 mr-3" /> Students
          </Link>
          {/* Future: assignments, messages */}
        </nav>
        <div className="mt-auto">
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="flex items-center w-full px-4 py-2.5 text-indigo-200 rounded-lg hover:bg-indigo-700 hover:text-white transition-colors">
              <LogOut className="w-5 h-5 mr-3" /> Logout
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
