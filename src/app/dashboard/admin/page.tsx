import { StatCard } from '@/components/admin/StatCard';
import { BookOpen, Banknote, Users, CheckCircle } from 'lucide-react';

// In a real app, you would fetch this data from your API
async function getDashboardStats() {
  // const totalCourses = await db.query('SELECT COUNT(*) FROM "Course"');
  // const totalStudents = await db.query('SELECT COUNT(*) FROM "User" WHERE role = \'STUDENT\'');
  // etc...
  return {
    totalCourses: 12,
    totalStudents: 152,
    pendingPayments: 5,
    totalRevenue: '€8,450', // This would be calculated
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, Admin! Here&apos;s an overview of your platform.</p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Courses" 
          value={stats.totalCourses}
          icon={<BookOpen className="w-6 h-6" />}
          description="Number of active courses"
        />
        <StatCard 
          title="Total Students" 
          value={stats.totalStudents}
          icon={<Users className="w-6 h-6" />}
          description="Total registered students"
        />
        <StatCard 
          title="Pending Payments" 
          value={stats.pendingPayments}
          icon={<Banknote className="w-6 h-6" />}
          description="Receipts needing approval"
        />
        <StatCard 
          title="Total Revenue" 
          value={stats.totalRevenue}
          icon={<CheckCircle className="w-6 h-6" />}
          description="Estimated total earnings"
        />
      </div>

      {/* Placeholder for Recent Activity Table */}
      <div className="mt-10 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
        <p className="text-gray-500">A table showing recent enrollments or payments would go here.</p>
        {/* You would map over recent payments/enrollments here to build a table */}
      </div>
    </div>
  );
}