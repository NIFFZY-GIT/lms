'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext'; // To get the current user
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';

// --- Type Definition ---
interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
    courseCount?: number; // only for instructors
    courseTitles?: string[]; // only for instructors
}

// --- Zod Schema ---
const adminSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['ADMIN', 'INSTRUCTOR']),
});
type AdminFormData = z.infer<typeof adminSchema>;

// --- API Functions ---
const fetchAdmins = async (): Promise<AdminUser[]> => (await axios.get('/api/admin/admins')).data;
const fetchInstructors = async (): Promise<AdminUser[]> => (await axios.get('/api/admin/instructors')).data;
const createAdmin = async (data: AdminFormData) => (await axios.post('/api/admin/admins/create', data)).data;
const deleteAdmin = async (id: string) => (await axios.delete(`/api/users/${id}`)).data;

// --- Main Component ---
export default function ManageAdminsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roleFilter, setRoleFilter] = useState<'ADMIN' | 'INSTRUCTOR'>('ADMIN');
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth(); // Get the currently logged-in admin
    const confirm = useConfirm();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminFormData>({
        resolver: zodResolver(adminSchema)
    });
    
    const { data: admins, isLoading } = useQuery<AdminUser[]>({
        queryKey: ['manage-users', roleFilter],
        queryFn: () => (roleFilter === 'ADMIN' ? fetchAdmins() : fetchInstructors()),
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setIsModalOpen(false);
            reset();
        },
    onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message || 'Operation failed'),
    };

    const createMutation = useMutation({ mutationFn: createAdmin, ...mutationOptions });
    const deleteMutation = useMutation({ mutationFn: deleteAdmin, ...mutationOptions });

    const onSubmit = (data: AdminFormData) => {
        createMutation.mutate(data);
    };
    
    const handleDelete = async (userId: string, userName: string) => {
        if (currentUser?.id === userId) {
            toast.error('You cannot delete your own account.');
            return;
        }
        const ok = await confirm({
            title: `Delete ${roleFilter === 'ADMIN' ? 'Admin' : 'Instructor'}`,
            description: `Are you sure you want to delete the ${roleFilter === 'ADMIN' ? 'admin' : 'instructor'} account for "${userName}"? This cannot be undone.`,
            confirmText: 'Delete',
            destructive: true,
        });
        if (ok) deleteMutation.mutate(userId);
    };

    // When switching to INSTRUCTOR, default role in form to INSTRUCTOR; to ADMIN otherwise
    useEffect(() => {
        // set default role in form (only affects new opens)
        // react-hook-form: setValue if modal open
        // We just reset when toggling filter and modal is closed
        if (!isModalOpen) {
            reset({ name: '', email: '', password: '', role: roleFilter });
        }
    }, [roleFilter, isModalOpen, reset]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                                <div className="space-y-2">
                                    <h1 className="text-3xl font-bold">Manage {roleFilter === 'ADMIN' ? 'Admins' : 'Instructors'}</h1>
                                    <div>
                                        <select
                                            value={roleFilter}
                                            onChange={e => setRoleFilter(e.target.value as 'ADMIN' | 'INSTRUCTOR')}
                                            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-indigo-200"
                                        >
                                            <option value="ADMIN">Show Admins</option>
                                            <option value="INSTRUCTOR">Show Instructors</option>
                                        </select>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center">
                                        <Plus className="w-5 h-5 mr-2" /> {roleFilter === 'ADMIN' ? 'Add Admin' : 'Add Instructor'}
                                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left ...">{roleFilter === 'ADMIN' ? 'Admin Name' : 'Instructor Name'}</th>
                              <th className="px-6 py-3 text-left ...">Email</th>
                              {roleFilter === 'INSTRUCTOR' && <th className="px-6 py-3 text-left ...">Courses</th>}
                            <th className="px-6 py-3 text-left ...">Date Added</th>
                            <th className="relative px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={4} className="text-center p-8">Loading {roleFilter === 'ADMIN' ? 'admins' : 'instructors'}...</td></tr>}
                        {admins?.map(admin => (
                            <tr key={admin.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{admin.name}</td>
                                <td className="px-6 py-4 text-gray-500">{admin.email}</td>
                                                                {roleFilter === 'INSTRUCTOR' && (
                                                                    <td className="px-6 py-4 text-gray-500">
                                                                        <div className="flex flex-col gap-1">
                                                                            <span className="font-medium">{admin.courseCount ?? 0}</span>
                                                                            {admin.courseTitles && admin.courseTitles.length > 0 && (
                                                                                <span className="text-xs text-gray-400 line-clamp-2" title={admin.courseTitles.join(', ')}>
                                                                                    {admin.courseTitles.slice(0,3).join(', ')}
                                                                                    {admin.courseTitles.length > 3 && '…'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                )}
                                <td className="px-6 py-4 text-gray-500">{format(new Date(admin.createdAt), 'PP')}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(admin.id, admin.name)} 
                                        className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title={currentUser?.id === admin.id ? "Cannot delete yourself" : (roleFilter === 'ADMIN' ? 'Delete Admin' : 'Delete Instructor')}
                                        disabled={currentUser?.id === admin.id}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

                        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={roleFilter === 'ADMIN' ? 'Add New Admin' : 'Add New Instructor'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Full Name" registration={register('name')} error={errors.name?.message} />
                    <Input label="Email Address" registration={register('email')} error={errors.email?.message} type="email" />
                                        <Input label="Password" registration={register('password')} error={errors.password?.message} type="password" />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                {...register('role')}
                                                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:ring-indigo-200"
                                                defaultValue={roleFilter}
                                            >
                                                <option value="ADMIN">Admin</option>
                                                <option value="INSTRUCTOR">Instructor</option>
                                            </select>
                                            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role.message}</p>}
                                        </div>
                                        <p className="text-xs text-gray-500">Select the appropriate role. Instructors have limited permissions.</p>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                                                        {createMutation.isPending ? 'Creating...' : (roleFilter === 'ADMIN' ? 'Create Admin' : 'Create Instructor')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}