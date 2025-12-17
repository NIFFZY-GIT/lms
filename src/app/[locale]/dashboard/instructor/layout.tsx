import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import InstructorSidebarLayout from '@/components/instructor/InstructorSidebarLayout';

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

export default async function InstructorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentInstructor();
  if (!user) {
    const callbackUrl = encodeURIComponent(`/${locale}/dashboard/instructor`);
    redirect(`/${locale}/auth/login?callbackUrl=${callbackUrl}`);
  }
  return (
    <InstructorSidebarLayout userName={user.name}>
      {children}
    </InstructorSidebarLayout>
  );
}
