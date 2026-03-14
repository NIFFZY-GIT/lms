'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Trash2, Edit, Layers, BookCopy } from 'lucide-react';
import Image from 'next/image';
import type { Course as FullCourse } from '@/types';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { ManageContentModal } from '@/components/admin/ManageContentModal';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/Input';
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string | null;
  tutor?: string | null;
  whatsappGroupLink?: string | null;
  courseType?: string | null;
}

const schema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.coerce.number().min(0, { message: 'Price cannot be negative.' }),
  courseType: z.enum(['ONE_TIME_PURCHASE', 'SUBSCRIPTION'], { message: 'Please select a course type' }),
  tutor: z.string().optional(),
  whatsappGroupLink: z.string().url({ message: 'A valid URL is required' }).optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export default function InstructorCoursesPage() {
  const { data: courses, isLoading, refetch } = useQuery<Course[]>({
    queryKey: ['instructor-courses'],
    queryFn: async () => (await axios.get('/api/courses?mine=1')).data,
  });

  const [open, setOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [manageCourse, setManageCourse] = useState<Course | null>(null);
  const [pricingType, setPricingType] = useState<'PAID' | 'FREE'>('PAID');
  const [courseType, setCourseType] = useState<'ONE_TIME_PURCHASE' | 'SUBSCRIPTION'>('ONE_TIME_PURCHASE');
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', price: 0, courseType: 'ONE_TIME_PURCHASE', tutor: '', whatsappGroupLink: '' },
  });

  const confirm = useConfirm();

  const closeModal = () => {
    setOpen(false);
    setEditingCourse(null);
    reset();
    setImageFile(null);
    setPreview(null);
    setRemoveImage(false);
    setPricingType('PAID');
    setCourseType('ONE_TIME_PURCHASE');
  };

  const onSubmit = async (data: FormData) => {
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      const normalizedPrice = pricingType === 'FREE' ? 0 : data.price;
      formData.append('price', String(normalizedPrice));
      formData.append('courseType', courseType);
      if (data.tutor) formData.append('tutor', data.tutor);
      if (data.whatsappGroupLink) formData.append('whatsappGroupLink', data.whatsappGroupLink);
      if (imageFile) formData.append('image', imageFile);
      if (removeImage) formData.append('removeImage', '1');
      if (editingCourse) {
        await axios.patch(`/api/courses/${editingCourse.id}`, formData);
        toast.success('Course updated successfully');
      } else {
        if (!imageFile) { toast.error('A poster image is required for new courses.'); setCreating(false); return; }
        await axios.post('/api/courses', formData);
        toast.success('Course created successfully');
      }
      closeModal();
      refetch();
    } catch {
      toast.error(`Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    const ct = (course.courseType as 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION') || 'ONE_TIME_PURCHASE';
    setCourseType(ct);
    setPricingType(course.price === 0 ? 'FREE' : 'PAID');
    reset({
      title: course.title,
      description: course.description,
      price: course.price,
      courseType: ct,
      tutor: course.tutor || '',
      whatsappGroupLink: course.whatsappGroupLink || '',
    });
    setPreview(course.imageUrl || null);
    setImageFile(null);
    setRemoveImage(false);
    setOpen(true);
  };

  const handleDelete = async (course: Course) => {
    const ok = await confirm({ title: 'Delete Course', description: `Delete "${course.title}"? This cannot be undone.`, confirmText: 'Delete', destructive: true });
    if (!ok) return;
    try {
      await axios.delete(`/api/courses/${course.id}`);
      toast.success('Course deleted');
      refetch();
    } catch {
      toast.error('Failed to delete course');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <button
          onClick={() => { setEditingCourse(null); reset(); setPricingType('PAID'); setCourseType('ONE_TIME_PURCHASE'); setOpen(true); }}
          className="btn-primary flex items-center justify-center w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" /> New Course
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {!isLoading && courses?.length === 0 && <p className="text-gray-500">No courses yet.</p>}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="space-y-4">
          {courses?.map(c => (
            <div key={c.id} className="p-4 border rounded-md hover:bg-gray-50">
              <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="relative h-16 w-28 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                    {c.imageUrl ? (
                      <Image src={c.imageUrl} alt={c.title} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-50"><BookCopy className="w-8 h-8 text-indigo-200" /></div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-gray-800 truncate">{c.title}</h3>
                    <p className="text-sm font-semibold text-green-600 whitespace-nowrap">{c.price === 0 ? 'Free' : formatCurrency(c.price)}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {c.courseType === 'SUBSCRIPTION' ? '📅 Monthly Subscription' : '🔓 One-Time Purchase'}
                    </p>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button onClick={() => setManageCourse(c)} className="btn-secondary p-2 w-full sm:w-auto" title="Manage Content"><Layers className="w-5 h-5 mx-auto" /></button>
                  <button onClick={() => handleEdit(c)} className="btn-secondary p-2 w-full sm:w-auto" title="Edit Course"><Edit className="w-5 h-5 mx-auto" /></button>
                  <button onClick={() => handleDelete(c)} className="btn-danger p-2 w-full sm:w-auto" title="Delete Course"><Trash2 className="w-5 h-5 mx-auto" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={open} onClose={closeModal} title={editingCourse ? 'Edit Course Details' : 'Create New Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Course Title" registration={register('title')} error={errors.title?.message} />
            <Input label="Tutor Name" registration={register('tutor')} error={errors.tutor?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea {...register('description')} rows={3} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" />
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Type</label>
              <select
                value={courseType}
                onChange={(e) => {
                  const value = e.target.value as 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
                  setCourseType(value);
                  setValue('courseType', value, { shouldValidate: true });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ONE_TIME_PURCHASE">One-Time Purchase</option>
                <option value="SUBSCRIPTION">Subscription (Monthly)</option>
              </select>
              {errors.courseType && <p className="text-sm text-red-600 mt-1">{errors.courseType.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pricing</label>
              <select
                value={pricingType}
                onChange={(e) => {
                  const value = e.target.value as 'PAID' | 'FREE';
                  setPricingType(value);
                  if (value === 'FREE') setValue('price', 0, { shouldValidate: true });
                }}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="PAID">Paid</option>
                <option value="FREE">Free</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Price (LKR)" registration={register('price')} error={errors.price?.message} type="number" step="0.01" disabled={pricingType === 'FREE'} />
            <Input label="WhatsApp Group Link" registration={register('whatsappGroupLink')} error={errors.whatsappGroupLink?.message} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Course Poster Image</label>
            {editingCourse?.imageUrl && !removeImage && !imageFile && (
              <p className="text-xs text-gray-500 mb-1">Leave blank to keep current image.</p>
            )}
            {preview && !removeImage && (
              <div className="mb-2 relative group inline-block">
                <Image src={preview} alt="Preview" width={160} height={90} className="rounded border object-cover h-24 w-40" />
                <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); setPreview(null); }} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition">Remove</button>
              </div>
            )}
            {removeImage && <p className="text-xs text-amber-600 mb-2">Image will be removed when you save.</p>}
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                setRemoveImage(false);
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">
              {creating ? 'Saving...' : (editingCourse ? 'Save Changes' : 'Create Course')}
            </button>
          </div>
        </form>
      </Modal>

      {manageCourse && (
        <ManageContentModal
          isOpen={!!manageCourse}
          onClose={() => setManageCourse(null)}
          course={manageCourse as unknown as FullCourse}
        />
      )}
    </div>
  );
}
