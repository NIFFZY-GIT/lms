import { Container } from '@/components/ui/Container';
import { Course } from '@/types';
import { getBaseUrl } from '@/lib/utils';
import { CourseCard } from '@/components/ui/CourseCard';
import { BookOpen } from 'lucide-react';

// This function runs on the server to fetch the data
async function getCourses(): Promise<Course[]> {
  try {
    const baseUrl = getBaseUrl();
    const res = await fetch(`${baseUrl}/api/courses`, { 
      cache: 'no-store' // Always fetch the latest list of courses
    });
    
    if (!res.ok) {
      console.error("Failed to fetch courses:", res.statusText);
      return [];
    }
    
    return res.json();
  } catch (error) {
    console.error("Error in getCourses:", error);
    return [];
  }
}

// The main page is an async Server Component
export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="bg-gray-50 min-h-screen">
      <Container className="py-20 md:py-28">
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl tracking-tighter">
            Explore Our Courses
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Find the perfect course to advance your skills and achieve your goals. Expert-led content, available anytime.
          </p>
        </div>

        {/* Courses Grid */}
        <div className="mt-16">
          {courses && courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          ) : (
            // Empty State: Shown if there are no courses
            <div className="text-center py-20 px-6 bg-white rounded-lg shadow-md max-w-lg mx-auto">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300" />
              <h2 className="mt-4 text-2xl font-bold text-gray-800">No Courses Available Yet</h2>
              <p className="mt-2 text-gray-500">Our instructors are hard at work. Please check back soon for new course listings!</p>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}