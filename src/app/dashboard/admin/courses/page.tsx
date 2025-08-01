'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Plus, Edit, Trash2, BookCopy } from 'lucide-react';
import { ManageContentModal } from '@/components/admin/ManageContentModal';

// --- Validation Schema ---
const courseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  
  // This is the definitive, correct way to handle a numeric form input
  price: z.coerce // Use coerce to automatically attempt conversion
    .number({
      // This message is for when the conversion fails (e.g., input is "abc")
      invalid_type_error: "Price must be a valid number.", 
    })
    .min(0, { message: "Price cannot be negative." }), // This checks the value after conversion
    
  tutor: z.string().optional(),
  whatsappGroupLink: z.string().url({ message: 'Must be a valid URL' }).optional().or(z.literal('')),
});
type CourseFormData = z.infer<typeof courseSchema>;

// --- API Functions ---
const fetchCourses = async (): Promise<Course[]> => (await axios.get('/api/courses')).data;
const createCourse = async (data: CourseFormData): Promise<Course> => (await axios.post('/api/courses', data)).data;
const updateCourse = async ({ id, ...data }: CourseFormData & { id: string }): Promise<Course> => (await axios.patch(`/api/courses/${id}`, data)).data;
const deleteCourse = async (id: string): Promise<void> => (await axios.delete(`/api/courses/${id}`)).data;

// --- Main Component ---
export default function AdminCoursesPage() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const queryClient = useQueryClient();
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: fetchCourses });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setIsCourseModalOpen(false);
    },
    onError: (error: AxiosError<{ error?: string }>) => {
      const errorMessage = error.response?.data?.error || error.message;
      alert(`An error occurred: ${errorMessage}`);
    },
  };

  const createMutation = useMutation({ mutationFn: createCourse, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateCourse, ...mutationOptions });
  const deleteMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: mutationOptions.onError,
  });

  const openModalForCreate = () => {
    setSelectedCourse(null);
    reset({ title: '', description: '', tutor: '', whatsappGroupLink: '', price: 0 });
    setIsCourseModalOpen(true);
  };

  const openModalForEdit = (course: Course) => {
    setSelectedCourse(course);
    setValue('title', course.title);
    setValue('description', course.description);
    setValue('price', course.price);
    setValue('tutor', course.tutor || '');
    setValue('whatsappGroupLink', course.whatsappGroupLink || '');
    setIsCourseModalOpen(true);
  };

  const openContentManager = (course: Course) => {
    setSelectedCourse(course);
    setIsContentModalOpen(true);
  };
  
  const onSubmit = (data: CourseFormData) => {
    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this course and all its content?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Courses</h1>
        <button onClick={openModalForCreate} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Add New Course
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? <p>Loading courses...</p> : (
          <div className="space-y-4">
            {courses?.map((course) => (
              <div key={course.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-gray-50">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{course.title}</h3>
                  <p className="text-sm font-semibold text-green-600">
                    Price: ${course.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => openContentManager(course)} className="btn-secondary p-2" title="Manage Content (Quizzes, Materials)">
                    <BookCopy className="w-5 h-5" />
                  </button>
                  <button onClick={() => openModalForEdit(course)} className="btn-secondary p-2" title="Edit Course Details">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(course.id)} className="btn-danger p-2" title="Delete Course">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isCourseModalOpen} onClose={() => setIsCourseModalOpen(false)} title={selectedCourse ? 'Edit Course Details' : 'Create New Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input label="Course Title" registration={register('title')} error={errors.title?.message} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={4} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <Input label="Tutor Name" registration={register('tutor')} error={errors.tutor?.message} />
 <Input 
  label="Price ($)" 
  registration={register('price')} 
  error={errors.price?.message} 
  type="text" // Use text to avoid weird browser number input behavior
  inputMode="decimal" // This brings up the numeric keyboard on mobile devices
  placeholder="e.g., 49.99"
/>
          <div className="md:col-span-2">
            <Input label="WhatsApp Group Link" registration={register('whatsappGroupLink')} error={errors.whatsappGroupLink?.message} placeholder="https://chat.whatsapp.com/..."/>
          </div>
          <div className="md:col-span-2 flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => setIsCourseModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </Modal>

      {selectedCourse && (
        <ManageContentModal 
            isOpen={isContentModalOpen}
            onClose={() => setIsContentModalOpen(false)}
            course={selectedCourse}
        />
      )}
    </div>
  );
}