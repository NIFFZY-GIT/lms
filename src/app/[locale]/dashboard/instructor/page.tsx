import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { QuickActions } from '@/components/instructor/QuickActions';

export const dynamic = 'force-dynamic';

async function getInstructorId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role?: string };
    if (!decoded?.id) return null;
    // Light check (layout already performed role validation):
    return decoded.id;
  } catch {
    return null;
  }
}

async function getDashboardData(instructorId: string) {
  // Run queries in parallel
  const [coursesCountQ, enrollmentsQ, quizzesCountQ, quizStatsQ, recentEnrollmentsQ, recentCoursesQ, recentQuizAttemptsQ] = await Promise.all([
    db.query('SELECT COUNT(*)::int AS count FROM "Course" WHERE "createdById" = $1', [instructorId]),
    db.query(`SELECT COUNT(*)::int AS count FROM "Payment" p JOIN "Course" c ON p."courseId" = c.id WHERE c."createdById" = $1 AND p.status = 'APPROVED'`, [instructorId]),
    db.query(`SELECT COUNT(*)::int AS count FROM "Quiz" q JOIN "Course" c ON q."courseId" = c.id WHERE c."createdById" = $1`, [instructorId]),
    db.query(`SELECT COALESCE(ROUND(AVG(qa.score)::numeric,1),0) AS avg, COALESCE(MAX(qa.score),0) AS max
              FROM "QuizAttempt" qa
              JOIN "Quiz" q ON qa."quizId" = q.id
              JOIN "Course" c ON q."courseId" = c.id
              WHERE c."createdById" = $1`, [instructorId]),
    db.query(`SELECT u.name, u.email, c.title AS "courseTitle", p."createdAt" AS "enrolledAt"
              FROM "Payment" p
              JOIN "User" u ON u.id = p."studentId"
              JOIN "Course" c ON c.id = p."courseId"
              WHERE c."createdById" = $1 AND p.status='APPROVED'
              ORDER BY p."createdAt" DESC LIMIT 5`, [instructorId]),
    db.query(`SELECT c.id, c.title, c."createdAt", (
                SELECT COUNT(*) FROM "Payment" p WHERE p."courseId" = c.id AND p.status='APPROVED'
              ) AS enrolled
              FROM "Course" c
              WHERE c."createdById" = $1
              ORDER BY c."createdAt" DESC LIMIT 5`, [instructorId]),
    db.query(`SELECT qa.id, qa.score, qa."createdAt", q.title AS "quizTitle", u.name AS "studentName"
              FROM "QuizAttempt" qa
              JOIN "Quiz" q ON qa."quizId" = q.id
              JOIN "Course" c ON q."courseId" = c.id
              JOIN "User" u ON u.id = qa."studentId"
              WHERE c."createdById" = $1
              ORDER BY qa."createdAt" DESC LIMIT 5`, [instructorId]),
  ]);

  return {
    totalCourses: coursesCountQ.rows[0]?.count || 0,
    totalEnrollments: enrollmentsQ.rows[0]?.count || 0,
    totalQuizzes: quizzesCountQ.rows[0]?.count || 0,
    avgQuizScore: parseFloat(quizStatsQ.rows[0]?.avg) || 0,
    maxQuizScore: parseFloat(quizStatsQ.rows[0]?.max) || 0,
  recentEnrollments: recentEnrollmentsQ.rows,
  recentCourses: recentCoursesQ.rows,
  recentQuizAttempts: recentQuizAttemptsQ.rows.map(r => ({ ...r, score: typeof r.score === 'number' ? r.score : parseFloat(String(r.score)) || 0 })),
  };
}

export default async function InstructorHome() {
  const instructorId = await getInstructorId();
  if (!instructorId) {
    return <div className="p-8 text-sm text-red-600">Unauthorized</div>;
  }
  const data = await getDashboardData(instructorId);

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
        <p className="text-gray-600">Quick overview of your teaching activity.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courses" value={data.totalCourses} />
        <StatCard label="Enrollments" value={data.totalEnrollments} />
        <StatCard label="Quizzes" value={data.totalQuizzes} />
        <StatCard label="Avg Quiz %" value={data.avgQuizScore.toFixed(1)} sub={`High ${data.maxQuizScore.toFixed(1)}%`} />
      </section>

      <section className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Recent Enrollments" empty="No recent enrollments" items={data.recentEnrollments} render={(e: EnrollmentItem) => (
            <li key={`${e.email}-${e.courseTitle}-${e.enrolledAt}`} className="flex items-center justify-between py-2">
              <div className="min-w-0 pr-4">
                <p className="font-medium text-sm truncate">{e.name || 'Student'}</p>
                <p className="text-xs text-gray-500 truncate">{e.email}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-indigo-600 font-medium truncate max-w-[140px]">{e.courseTitle}</p>
                <p className="text-[10px] text-gray-400">{new Date(e.enrolledAt).toLocaleDateString()}</p>
              </div>
            </li>
          )} />

  <Panel title="Recent Quiz Attempts" empty="No attempts yet" items={data.recentQuizAttempts} render={(q: QuizAttemptItem) => (
    <li key={q.id} className="flex items-center justify-between py-2">
              <div className="min-w-0 pr-4">
                <p className="font-medium text-sm truncate">{q.quizTitle}</p>
                <p className="text-xs text-gray-500 truncate">{q.studentName}</p>
              </div>
              <div className="text-right">
        <p className="text-xs font-semibold text-gray-700">{(typeof q.score === 'number' ? q.score : parseFloat(String(q.score)) || 0).toFixed(1)}%</p>
                <p className="text-[10px] text-gray-400">{new Date(q.createdAt).toLocaleDateString()}</p>
              </div>
            </li>
          )} />
        </div>

        <div className="space-y-6">
          <Panel title="Recent Courses" empty="No courses" items={data.recentCourses} render={(c: CourseItem) => (
            <li key={c.id} className="flex items-center justify-between py-2">
              <div className="min-w-0 pr-4">
                <p className="font-medium text-sm truncate">{c.title}</p>
                <p className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{c.enrolled} enrolled</span>
            </li>
          )} />

          <QuickActions />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-lg shadow border p-5 flex flex-col">
      <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-800">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-gray-400">{sub}</p>}
    </div>
  );
}

interface EnrollmentItem { name: string; email: string; courseTitle: string; enrolledAt: string; }
interface QuizAttemptItem { id: string; score: number; createdAt: string; quizTitle: string; studentName: string; }
interface CourseItem { id: string; title: string; createdAt: string; enrolled: number; }

type PanelItem = EnrollmentItem | QuizAttemptItem | CourseItem;

function Panel<T extends PanelItem>({ title, items, empty, render }: { title: string; items: T[]; empty: string; render: (item: T) => React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
      </div>
      <ul className="px-5 divide-y">
        {(!items || items.length === 0) && <li className="py-6 text-center text-xs text-gray-400">{empty}</li>}
        {items?.map(i => render(i))}
      </ul>
    </div>
  );
}
