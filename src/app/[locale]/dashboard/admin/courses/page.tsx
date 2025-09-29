'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Course } from '@/types';
import { Input } from '@/components/ui/Input';
import { Plus, Edit, Trash2, BookCopy } from 'lucide-react';
import { ManageContentModal } from '@/components/admin/ManageContentModal';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

// --- Zod Schema (Corrected) ---
const courseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.coerce.number({ message: 'Price must be a valid number.' }).min(0, { message: "Price cannot be negative." }),
  tutor: z.string().optional(),
  whatsappGroupLink: z.string().url({ message: 'A valid URL is required' }).optional().or(z.literal('')),
  image: z.custom<FileList>().optional(),
});
type CourseFormData = z.infer<typeof courseSchema>;

// --- API Functions ---
const fetchCourses = async (): Promise<Course[]> => (await axios.get('/api/courses')).data;
const createCourse = async (data: FormData): Promise<Course> => (await axios.post('/api/courses', data)).data;
const updateCourse = async ({ id, data }: { id: string; data: FormData }): Promise<Course> => (await axios.patch(`/api/courses/${id}`, data)).data;
const deleteCourse = async (id: string): Promise<void> => (await axios.delete(`/api/courses/${id}`)).data;

export default function AdminCoursesPage() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: fetchCourses });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      tutor: '',
      whatsappGroupLink: ''
    }
  });

  const closeModal = () => { setIsCourseModalOpen(false); setSelectedCourse(null); reset(); };
  const confirm = useConfirm();
  const mutationOptions = { onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); closeModal(); }, onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message), };
  
  const createMutation = useMutation({ mutationFn: createCourse, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateCourse, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteCourse, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['courses'] }); } });

  const openModalForCreate = () => { setSelectedCourse(null); reset({ title: '', description: '', price: 0, tutor: '', whatsappGroupLink: '' }); setIsCourseModalOpen(true); };
  const openModalForEdit = (course: Course) => { setSelectedCourse(course); setValue('title', course.title); setValue('description', course.description); setValue('price', course.price); setValue('tutor', course.tutor || ''); setValue('whatsappGroupLink', course.whatsappGroupLink || ''); setIsCourseModalOpen(true); };
  const openContentManager = (course: Course) => { setSelectedCourse(course); setIsContentModalOpen(true); };
  
  const onSubmit = (data: CourseFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('price', String(data.price));
    if (data.tutor) formData.append('tutor', data.tutor);
    if (data.whatsappGroupLink) formData.append('whatsappGroupLink', data.whatsappGroupLink);
    if (data.image && data.image.length > 0) {
      formData.append('image', data.image[0]);
    }

    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, data: formData });
    } else {
      if (!data.image || data.image.length === 0) { toast.error('A poster image is required for new courses.'); return; }
      createMutation.mutate(formData);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete Course', description: 'Are you sure you want to delete this course? This cannot be undone.', confirmText: 'Delete', destructive: true });
    if (ok) deleteMutation.mutate(id);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Manage Courses</h1>
        <button type="button" onClick={openModalForCreate} className="btn-primary flex items-center justify-center w-full sm:w-auto"><Plus className="w-5 h-5 mr-2" /> Add New Course</button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        {isLoading ? <p>Loading courses...</p> : (
          <div className="space-y-4">
            {courses?.map((course) => (
              <div key={course.id} className="p-4 border rounded-md hover:bg-gray-50">
                <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative h-16 w-28 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                      {course.imageUrl ? (
                        <Image src={course.imageUrl} alt={course.title} fill style={{ objectFit: 'cover' }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-indigo-50"><BookCopy className="w-8 h-8 text-indigo-200" /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-gray-800 truncate">{course.title}</h3>
                      <p className="text-sm font-semibold text-green-600 whitespace-nowrap">{formatCurrency(course.price)}</p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto grid grid-cols-3 gap-2">
                    <button onClick={() => openContentManager(course)} className="btn-secondary p-2 w-full" title="Manage Content"><BookCopy className="w-5 h-5 mx-auto" /></button>
                    <button onClick={() => openModalForEdit(course)} className="btn-secondary p-2 w-full" title="Edit Course"><Edit className="w-5 h-5 mx-auto" /></button>
                    <button onClick={() => handleDelete(course.id)} className="btn-danger p-2 w-full" title="Delete Course"><Trash2 className="w-5 h-5 mx-auto" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={isCourseModalOpen} onClose={closeModal} title={selectedCourse ? 'Edit Course Details' : 'Create New Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Course Title" registration={register('title')} error={errors.title?.message} />
            <Input label="Tutor Name" registration={register('tutor')} error={errors.tutor?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Price (LKR)" registration={register('price')} error={errors.price?.message} type="number" step="0.01" />
            <Input label="WhatsApp Group Link" registration={register('whatsappGroupLink')} error={errors.whatsappGroupLink?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Course Poster Image</label>
            {selectedCourse?.imageUrl && <p className="text-xs text-gray-500 mb-1">Leave blank to keep current image.</p>}
            <input type="file" {...register('image')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
            {errors.image && <p className="text-sm text-red-600 mt-1">{errors.image.message as string}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (selectedCourse ? 'Save Changes' : 'Create Course')}
            </button>
          </div>
        </form>
      </Modal>

      {selectedCourse && (<ManageContentModal isOpen={isContentModalOpen} onClose={() => setIsContentModalOpen(false)} course={selectedCourse}/>)}
    </div>
  );
}