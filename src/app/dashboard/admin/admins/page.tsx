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
import { useAuth } from '@/context/AuthContext'; // To get the current user

// --- Type Definition ---
interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// --- Zod Schema ---
const adminSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type AdminFormData = z.infer<typeof adminSchema>;

// --- API Functions ---
const fetchAdmins = async (): Promise<AdminUser[]> => (await axios.get('/api/admin/admins')).data;
const createAdmin = async (data: AdminFormData) => (await axios.post('/api/admin/admins/create', data)).data;
const deleteAdmin = async (id: string) => (await axios.delete(`/api/users/${id}`)).data;

// --- Main Component ---
export default function ManageAdminsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth(); // Get the currently logged-in admin

    const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminFormData>({
        resolver: zodResolver(adminSchema)
    });
    
    const { data: admins, isLoading } = useQuery<AdminUser[]>({
        queryKey: ['admins'],
        queryFn: fetchAdmins,
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setIsModalOpen(false);
            reset();
        },
        onError: (error: AxiosError<{ error?: string }>) => alert(`Error: ${error.response?.data?.error || error.message}`),
    };

    const createMutation = useMutation({ mutationFn: createAdmin, ...mutationOptions });
    const deleteMutation = useMutation({ mutationFn: deleteAdmin, ...mutationOptions });

    const onSubmit = (data: AdminFormData) => {
        createMutation.mutate(data);
    };
    
    const handleDelete = (adminId: string, adminName: string) => {
        // --- SECURITY FEATURE: Prevent self-deletion ---
        if (currentUser?.id === adminId) {
            alert("For security reasons, you cannot delete your own account.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete the admin account for "${adminName}"? This action cannot be undone.`)) {
            deleteMutation.mutate(adminId);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Manage Admins</h1>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center">
                    <Plus className="w-5 h-5 mr-2" /> Add New Admin
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left ...">Admin Name</th>
                            <th className="px-6 py-3 text-left ...">Email</th>
                            <th className="px-6 py-3 text-left ...">Date Added</th>
                            <th className="relative px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={4} className="text-center p-8">Loading admins...</td></tr>}
                        {admins?.map(admin => (
                            <tr key={admin.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{admin.name}</td>
                                <td className="px-6 py-4 text-gray-500">{admin.email}</td>
                                <td className="px-6 py-4 text-gray-500">{format(new Date(admin.createdAt), 'PP')}</td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(admin.id, admin.name)} 
                                        className="p-2 text-gray-500 hover:text-red-600 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title={currentUser?.id === admin.id ? "Cannot delete yourself" : "Delete Admin"}
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

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Admin">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Full Name" registration={register('name')} error={errors.name?.message} />
                    <Input label="Email Address" registration={register('email')} error={errors.email?.message} type="email" />
                    <Input label="Password" registration={register('password')} error={errors.password?.message} type="password" />
                    <p className="text-xs text-gray-500">The new user will be created with an &quot;ADMIN&quot; role. They should be instructed to change their password upon first login.</p>
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                            {createMutation.isPending ? 'Creating...' : 'Create Admin'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}