import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db'; // Your database connection
import StudentSidebarLayout from '@/components/student/StudentSidebarLayout';

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
  } catch {
    // Invalid token, etc.
    return null;
  }
}

export default async function StudentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // --- The Protection Logic ---
  const user = await getCurrentUser();

  // If there's no valid student user, redirect to the login page.
  // We can add a 'callbackUrl' to redirect them back after they log in.
  if (!user) {
    const callbackUrl = encodeURIComponent(`/${locale}/dashboard/student/courses`);
    redirect(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  }

  // If the user is valid, render the layout within the client sidebar shell.
  return (
    <StudentSidebarLayout userName={user.name}>
      {children}
    </StudentSidebarLayout>
  );
}