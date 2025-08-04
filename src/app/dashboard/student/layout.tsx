// Example student layout with a sidebar
import Link from 'next/link';
import { BookOpen, BarChart3, LogOut } from 'lucide-react'; // Added BarChart3 for results

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  // ...
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <div className="text-2xl font-bold mb-10">Student Panel</div>
        <nav className="space-y-2">
          <Link href="/dashboard/student/courses" className="flex items-center ...">
            <BookOpen className="w-5 h-5 mr-3" /> My Courses
          </Link>
          {/* --- NEW LINK --- */}
          <Link href="/dashboard/student/results" className="flex items-center ...">
            <BarChart3 className="w-5 h-5 mr-3" /> My Results
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-10 bg-gray-50">{children}</main>
    </div>
  );
}