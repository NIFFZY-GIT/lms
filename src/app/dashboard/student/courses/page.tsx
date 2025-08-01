// src/app/dashboard/student/courses/page.tsx
'use client'; 

import { CourseCard } from '@/components/ui/CourseCard';
import { Container } from '@/components/ui/Container';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Course } from '@/types'; // Import the type

// API fetching function
const fetchCourses = async (): Promise<Course[]> => {
  const { data } = await axios.get('/api/courses'); 
  return data;
};

export default function StudentCoursesPage() {
  const { data: courses, isLoading, isError, error } = useQuery<Course[], Error>({
    queryKey: ['courses'],
    queryFn: fetchCourses,
  });

  if (isLoading) {
    return (
      <Container>
        <div className="text-center py-20">
          <h1 className="text-2xl font-semibold">Loading courses...</h1>
        </div>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <div className="text-center py-20 text-red-600">
          <h1 className="text-2xl font-semibold">Error loading courses</h1>
          <p>{error.message}</p>
        </div>
      </Container>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen py-12">
      <Container>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Available Courses
        </h1>
        {courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">No courses are available at the moment. Please check back later!</p>
          </div>
        )}
      </Container>
    </main>
  );
}