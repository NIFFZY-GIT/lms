'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/toast';

interface InstructorUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  courseCount?: number;
  courseTitles?: string[];
}

const instructorSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type InstructorFormData = z.infer<typeof instructorSchema>;

const fetchInstructors = async (): Promise<InstructorUser[]> => (await axios.get('/api/admin/instructors')).data;
const createInstructor = async (data: InstructorFormData) => (await axios.post('/api/admin/instructors/create', data)).data;
const deleteInstructor = async (id: string) => (await axios.delete(`/api/users/${id}`)).data;

export default function ManageInstructorsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema)
  });

  const { data: instructors, isLoading } = useQuery<InstructorUser[]>({
    queryKey: ['instructors'],
    queryFn: fetchInstructors,
  });

  const mutationOptions = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instructors'] });
      setIsModalOpen(false);
      reset();
    },
  onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message),
  };

  const createMutation = useMutation({ mutationFn: createInstructor, ...mutationOptions });
  const deleteMutation = useMutation({ mutationFn: deleteInstructor, ...mutationOptions });

  const onSubmit = (data: InstructorFormData) => {
    createMutation.mutate(data);
  };

  const handleDelete = (instructorId: string, instructorName: string) => {
  if (currentUser?.id === instructorId) { toast.warning('You cannot delete your own account.'); return; }
    if (window.confirm(`Delete instructor "${instructorName}"? This cannot be undone.`)) {
      deleteMutation.mutate(instructorId);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <h1 className="text-3xl font-bold">Manage Instructors</h1>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center w-full sm:w-auto">
          <Plus className="w-5 h-5 mr-2" /> Add Instructor
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Desktop/Tablet table view */}
        <div className="hidden sm:block w-full overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Courses</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date Added</th>
                <th className="relative px-4 sm:px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && <tr><td colSpan={5} className="text-center p-8">Loading instructors...</td></tr>}
              {!isLoading && (!instructors || instructors.length === 0) && (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-gray-500">No instructors found.</td>
                </tr>
              )}
              {instructors?.map(instr => (
                <tr key={instr.id}>
                  <td className="px-4 sm:px-6 py-4 font-medium text-gray-900 break-words">{instr.name}</td>
                  <td className="px-4 sm:px-6 py-4 text-gray-500 break-words">{instr.email}</td>
                  <td className="px-4 sm:px-6 py-4 text-gray-500">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{instr.courseCount ?? 0}</span>
                      {instr.courseTitles && instr.courseTitles.length > 0 && (
                        <span className="text-xs text-gray-400 line-clamp-2" title={instr.courseTitles.join(', ')}>
                          {instr.courseTitles.slice(0,3).join(', ')}
                          {instr.courseTitles.length > 3 && '…'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap">{format(new Date(instr.createdAt), 'PP')}</td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(instr.id, instr.name)}
                      className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                      title={currentUser?.id === instr.id ? 'Cannot delete yourself' : 'Delete Instructor'}
                      disabled={currentUser?.id === instr.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="sm:hidden">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">Loading instructors...</div>
          )}
          {!isLoading && (!instructors || instructors.length === 0) && (
            <div className="p-6 text-center text-gray-500">No instructors found.</div>
          )}
          <ul className="divide-y divide-gray-200">
            {instructors?.map((instr) => (
              <li key={instr.id} className="p-4">
                <div className="font-semibold text-gray-900">{instr.name}</div>
                <div className="text-sm text-gray-500 break-words">{instr.email}</div>
                <div className="mt-3 text-sm text-gray-700">
                  <div><span className="text-gray-500">Courses: </span><span className="font-medium">{instr.courseCount ?? 0}</span></div>
                  {instr.courseTitles && instr.courseTitles.length > 0 && (
                    <div className="text-xs text-gray-500 break-words mt-1">
                      {instr.courseTitles.slice(0,3).join(', ')}{instr.courseTitles.length > 3 && '…'}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-500">Added: <span className="text-gray-900">{format(new Date(instr.createdAt), 'PP')}</span></div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleDelete(instr.id, instr.name)}
                    className="btn-danger w-full disabled:opacity-60 disabled:cursor-not-allowed"
                    title={currentUser?.id === instr.id ? 'Cannot delete yourself' : 'Delete Instructor'}
                    disabled={currentUser?.id === instr.id}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Instructor">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full Name" registration={register('name')} error={errors.name?.message} />
          <Input label="Email Address" registration={register('email')} error={errors.email?.message} type="email" />
          <Input label="Password" registration={register('password')} error={errors.password?.message} type="password" />
          <p className="text-xs text-gray-500">User will be created with an &quot;INSTRUCTOR&quot; role.</p>
          <div className="flex flex-col sm:flex-row justify-end pt-4 gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary w-full sm:w-auto">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full sm:w-auto">
              {createMutation.isPending ? 'Creating...' : 'Create Instructor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
