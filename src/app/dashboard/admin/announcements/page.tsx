'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Announcement } from '@/types';
import Image from 'next/image';
import { Plus, Trash2, Edit } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { Input } from '@/components/ui/Input';

// --- Zod Schema (Updated for Edit) ---
// For editing, the image is optional.
const announcementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  image: z.custom<FileList>()
    .refine(files => files?.length <= 1, 'You can only upload one image.')
    .optional(), // Image is not required on update
});
type AnnouncementFormData = z.infer<typeof announcementSchema>;

// --- API Functions (Updated) ---
const fetchAnnouncements = async (): Promise<Announcement[]> => (await axios.get('/api/announcements')).data;
const createAnnouncement = async (data: FormData): Promise<Announcement> => (await axios.post('/api/announcements', data)).data;
const updateAnnouncement = async ({ id, data }: { id: string, data: FormData }): Promise<Announcement> => (await axios.patch(`/api/announcements/${id}`, data)).data;
const deleteAnnouncement = async (id: string): Promise<void> => (await axios.delete(`/api/announcements/${id}`)).data;

export default function AdminAnnouncementsPage() {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null); // State to track which item is being edited
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<AnnouncementFormData>({ resolver: zodResolver(announcementSchema) });
  
  const { data: announcements, isLoading } = useQuery<Announcement[]>({ queryKey: ['announcements'], queryFn: fetchAnnouncements });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      toast.success(editingAnnouncement ? 'Announcement updated' : 'Announcement created');
      closeModal();
    },
    onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message || 'Action failed'),
  };
  
  const createMutation = useMutation({ mutationFn: createAnnouncement, ...mutationOptions });
  const updateMutation = useMutation({ mutationFn: updateAnnouncement, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteAnnouncement, ...mutationOptions });
  
  const onSubmit = (data: AnnouncementFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    if (data.image && data.image.length > 0) {
      formData.append('image', data.image[0]);
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };
  
  const openModalForCreate = () => {
    setEditingAnnouncement(null);
    reset({ title: '', description: '' });
    setIsModalOpen(true);
  };
  
  const openModalForEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setValue('title', announcement.title);
    setValue('description', announcement.description);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAnnouncement(null);
    reset();
  };
  
  const handleDelete = async (id: string) => {
    const ok = await confirm({ title: 'Delete announcement', description: 'This action cannot be undone.', destructive: true, confirmText: 'Delete' });
    if (!ok) return;
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['announcements'] });
        toast.success('Announcement deleted');
      },
      onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message || 'Delete failed')
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Announcements</h1>
        <button onClick={openModalForCreate} className="btn-primary flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Announcement</button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && Array.from({length: 3}).map((_, i) => <div key={i} className="bg-white rounded-lg shadow-md h-64 animate-pulse"></div>)}
        {announcements?.map(announcement => (
          <div key={announcement.id} className="bg-white rounded-lg shadow-md overflow-hidden group relative">
            <Image src={announcement.imageUrl} alt={announcement.title} width={400} height={200} className="w-full h-40 object-cover"/>
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-800 mb-2 truncate">{announcement.title}</h3>
              <p className="text-gray-600 text-sm">{announcement.description}</p>
            </div>
            {/* Edit and Delete Buttons */}
            <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModalForEdit(announcement)} className="p-2 bg-white/70 text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white">
                    <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(announcement.id)} className="p-2 bg-white/70 text-red-600 rounded-full hover:bg-red-600 hover:text-white">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div><Input label="Title" registration={register('title')} error={errors.title?.message as string} /></div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register('description')} rows={4} className="mt-1 w-full border-gray-300 rounded-md shadow-sm"/>
            {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Image</label>
            {editingAnnouncement && <p className="text-xs text-gray-500 mb-1">Leave blank to keep the current image.</p>}
            <input type="file" {...register('image')} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 ..."/>
            {errors.image && <p className="text-sm text-red-600 mt-1">{errors.image.message as string}</p>}
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingAnnouncement ? 'Save Changes' : 'Publish Announcement')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}