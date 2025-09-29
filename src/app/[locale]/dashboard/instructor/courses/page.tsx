'use client';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Trash2, Edit, Layers } from 'lucide-react';
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
  zoomLink?: string | null;
}

const schema = z.object({
  title: z.string().min(2, 'Title required'),
  description: z.string().min(5, 'Description too short'),
  price: z.preprocess(val => (typeof val === 'string' ? parseFloat(val) : val), z.number().min(0, 'Price must be >= 0')),
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
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const [creating, setCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const confirm = useConfirm();
  const onSubmit = async (raw: unknown) => {
    const data = raw as FormData; // safe by schema
    setCreating(true);
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('price', String(data.price));
      if (imageFile) formData.append('image', imageFile);
      if (removeImage) formData.append('removeImage', '1');
      if (editingCourse) {
        await axios.patch(`/api/courses/${editingCourse.id}`, formData);
      } else {
        await axios.post('/api/courses', formData);
      }
      reset();
      setOpen(false);
      setEditingCourse(null);
      setImageFile(null); setPreview(null); setRemoveImage(false);
      refetch();
    } catch {
      toast.error(`Failed to ${editingCourse ? 'update' : 'create'} course`);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
  reset({ title: course.title, description: course.description, price: course.price });
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Courses</h1>
        <button onClick={() => { setEditingCourse(null); reset(); setOpen(true); }} className="btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> New Course
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {!isLoading && courses?.length === 0 && <p className="text-gray-500">No courses yet.</p>}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses?.map(c => (
          <div key={c.id} className="bg-white shadow rounded-lg overflow-hidden border flex flex-col">
            {c.imageUrl && (
              <Image
                src={c.imageUrl}
                alt={c.title}
                width={400}
                height={160}
                className="h-40 w-full object-cover"
              />
            )}
            <div className="p-4 space-y-2 flex-1">
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">{c.description}</p>
              <div className="text-sm font-medium">{formatCurrency(c.price)}</div>
            </div>
            <div className="px-4 pb-4 flex gap-2 flex-wrap">
              <button onClick={() => setManageCourse(c)} className="btn-secondary flex items-center text-xs"><Layers className="w-4 h-4 mr-1"/>Manage</button>
              <button onClick={() => handleEdit(c)} className="btn-secondary flex items-center text-xs"><Edit className="w-4 h-4 mr-1"/>Edit</button>
              <button onClick={() => handleDelete(c)} className="btn-danger flex items-center text-xs"><Trash2 className="w-4 h-4 mr-1"/>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={open} onClose={() => { setOpen(false); setEditingCourse(null); }} title={editingCourse ? 'Edit Course' : 'Create Course'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" registration={register('title')} error={errors.title?.message} />
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea {...register('description')} className="w-full border rounded px-3 py-2 min-h-28" />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <Input label="Price" registration={register('price')} error={errors.price?.message} type="number" />
          <div>
            <label className="block text-sm font-medium mb-1">Course Image</label>
            {preview && !removeImage && (
              <div className="mb-2 relative group inline-block">
                <Image src={preview} alt="Preview" width={160} height={90} className="rounded border object-cover h-24 w-40" />
                <button type="button" onClick={() => { setRemoveImage(true); setImageFile(null); }} className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1 rounded opacity-0 group-hover:opacity-100 transition">Remove</button>
              </div>
            )}
            {removeImage && <p className="text-xs text-amber-600 mb-2">Image will be removed when you save.</p>}
            <input
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                setRemoveImage(false);
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button type="button" onClick={() => { setOpen(false); setEditingCourse(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary">{creating ? (editingCourse ? 'Saving...' : 'Creating...') : (editingCourse ? 'Save Changes' : 'Create')}</button>
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
