import Link from 'next/link';
import { Course } from '@/types';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/dashboard/student/course/${course.id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2">
        
        {/* --- THIS IS THE UPDATED IMAGE SECTION --- */}
        <div className="relative w-full h-48 bg-gray-100">
          {course.imageUrl ? (
            // If an imageUrl exists, display it
            <Image
              src={course.imageUrl}
              alt={course.title}
              fill
              // --- THE FIX IS HERE ---
              // 'contain' ensures the entire image fits inside the container
              style={{ objectFit: 'contain' }} 
            />
          ) : (
            // Otherwise, show a placeholder
            <div className="w-full h-full flex items-center justify-center bg-blue-500">
                <BookOpen className="w-16 h-16 text-blue-200" />
            </div>
          )}
        </div>
        
        <div className="p-6 flex-grow flex flex-col">
          <h3 className="font-extrabold text-xl text-gray-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
          <p className="text-gray-600 text-sm leading-relaxed flex-grow mb-4">{course.description}</p>
          <p className="text-sm text-gray-500 mb-4"><strong>Tutor:</strong> {course.tutor || 'N/A'}</p>
          <div className="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
            <p className="text-2xl font-bold text-gray-800">{formatCurrency(course.price)}</p>
            <span className="btn-primary text-sm">View Details</span>
          </div>
        </div>
      </div>
    </Link>
  );
}