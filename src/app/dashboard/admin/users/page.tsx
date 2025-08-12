'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Course } from '@/types';
import { toast } from '@/components/ui/toast';

// --- Type Definitions ---
interface StudentCourseInfo {
    courseTitle: string;
    enrollmentStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    highestScore: number | null;
}
interface Student {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  courses: StudentCourseInfo[];
}

// --- Zod Schema for the Form ---
const studentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});
type StudentFormData = z.infer<typeof studentSchema>;

// --- API Functions ---
const fetchStudents = async (searchTerm: string, courseId: string): Promise<Student[]> => (await axios.get(`/api/admin/students?search=${searchTerm}&courseId=${courseId}`)).data;
const fetchCourses = async (): Promise<Course[]> => (await axios.get('/api/courses')).data;
const createStudent = async (data: StudentFormData) => (await axios.post('/api/auth/register', data)).data;
const updateStudent = async ({ id, data }: { id: string, data: StudentFormData }) => (await axios.patch(`/api/users/${id}`, data)).data;
const deleteStudent = async (id: string) => (await axios.delete(`/api/users/${id}`)).data;

// --- Main Component ---
export default function AdminStudentsPage() {
    // --- RESTORED LOGIC ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema)
    });
    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: courses } = useQuery<Course[]>({
        queryKey: ['allCoursesForFilter'],
        queryFn: fetchCourses,
    });

    const { data: students, isLoading } = useQuery<Student[]>({
        queryKey: ['adminStudents', debouncedSearchTerm, courseFilter],
        queryFn: () => fetchStudents(debouncedSearchTerm, courseFilter === 'all' ? '' : courseFilter),
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
            closeModal();
        },
    onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message),
    };

    const createMutation = useMutation({ mutationFn: createStudent, ...mutationOptions });
    const updateMutation = useMutation({ mutationFn: updateStudent, ...mutationOptions });
    const deleteMutation = useMutation({ mutationFn: deleteStudent, ...mutationOptions });

    const openModalForCreate = () => {
        setEditingStudent(null);
        reset({ name: '', email: '', phone: '', address: '', password: '' });
        setIsModalOpen(true);
    };

    const openModalForEdit = (student: Student) => {
        setEditingStudent(student);
        setValue('name', student.name);
        setValue('email', student.email);
        setValue('phone', student.phone || '');
        setValue('address', student.address || '');
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
    };

    const onSubmit = (data: StudentFormData) => {
        if (editingStudent) {
            updateMutation.mutate({ id: editingStudent.id, data });
        } else {
            if (!data.password) { toast.warning('Password is required for new students.'); return; }
            createMutation.mutate(data);
        }
    };
    
    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            deleteMutation.mutate(id);
        }
    };
    // --- END OF RESTORED LOGIC ---

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Student Management</h1>
                <div className="flex items-center space-x-4">
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white">
                        <option value="all">All Courses</option>
                        {courses?.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
                    </select>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email..." className="pl-10 pr-4 py-2 border rounded-lg w-64"/>
                    </div>
                    <button onClick={openModalForCreate} className="btn-primary flex items-center"><Plus className="w-5 h-5 mr-2" /> Add Student</button>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses & Scores</th>
                            <th className="relative px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={4} className="text-center p-8">Loading students...</td></tr>}
                        {students?.map(student => (
                            <tr key={student.id}>
                                <td className="px-6 py-4">
                                    <div className="font-bold">{student.name}</div>
                                    <div className="text-sm text-gray-500">{student.email}</div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="text-gray-900">{student.phone || 'N/A'}</div>
                                    <div className="text-gray-500 max-w-xs truncate">{student.address || 'N/A'}</div>
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    {student.courses.length > 0 ? (
                                        <ul className="space-y-1 list-disc list-inside">
                                            {student.courses.map(c => (
                                                <li key={c.courseTitle}>{c.courseTitle}: <span className="font-semibold">{c.highestScore?.toFixed(0) ?? 'N/A'}%</span></li>
                                            ))}
                                        </ul>
                                    ) : <span className="text-gray-400">No enrollments</span>}
                                </td>
                                <td className="px-6 py-4 flex items-center space-x-2">
                                    {/* --- CORRECTED JSX --- */}
                                    <button onClick={() => openModalForEdit(student)} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(student.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingStudent ? 'Edit Student' : 'Add New Student'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Full Name" registration={register('name')} error={errors.name?.message} />
                    <Input label="Email Address" registration={register('email')} error={errors.email?.message} type="email" />
                    <Input label="Phone Number" registration={register('phone')} error={errors.phone?.message} />
                    <div>
                        <label className="block text-sm">Address</label>
                        <textarea {...register('address')} rows={3} className="mt-1 w-full border-gray-300 rounded-md" />
                    </div>
                    {!editingStudent && (<Input label="Password" registration={register('password')} error={errors.password?.message} type="password" />)}
                    <div className="flex justify-end pt-4 space-x-2">
                        <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}