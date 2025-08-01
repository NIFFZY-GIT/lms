import Link from 'next/link';
import { Course } from '@/types'; // Import the main Course type

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 flex flex-col">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{course.title}</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">{course.description}</p>
        <p className="text-sm text-gray-500">Tutor: {course.tutor || 'N/A'}</p>
      </div>
      <div className="p-6 bg-gray-50 mt-auto flex justify-between items-center">
        {/* DISPLAY THE PRICE */}
        <p className="text-2xl font-bold text-gray-800">${course.price.toFixed(2)}</p>
        
        <Link 
          href={`/dashboard/student/course/${course.id}`}
          className="btn-primary" // Use the global button style
        >
          View Details
        </Link>
      </div>
    </div>
  );
}