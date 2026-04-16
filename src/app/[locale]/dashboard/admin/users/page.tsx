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
import { Course, Role } from '@/types';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';

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
    role: Role;
  courses: StudentCourseInfo[];
}

const formatStudentDisplayId = (id: string): string => {
    let hash = 0;

    for (const char of id) {
        hash = (hash * 31 + char.charCodeAt(0)) % 90000;
    }

    return String(hash + 10000);
};

// --- Zod Schema for the Form ---
const studentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    role: z.nativeEnum(Role).optional(),
});
type StudentFormData = z.infer<typeof studentSchema>;

interface CreatedStudentResponse {
    id: string;
    email: string;
    name: string;
}

interface ManualEnrollResponse {
    message: string;
    enrolledCourseIds: string[];
    skippedCourseIds: string[];
    invalidCourseIds: string[];
}

const MONTH_OPTIONS = [
    { value: 'all', label: 'All Months' },
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
] as const;

// --- API Functions ---
const fetchStudents = async (searchTerm: string, courseId: string, month: string): Promise<Student[]> => (
    await axios.get(`/api/admin/students?search=${searchTerm}&courseId=${courseId}&month=${month}`)
).data;
const createStudent = async (data: StudentFormData) => (await axios.post('/api/auth/register', data)).data;
const updateStudent = async ({ id, data }: { id: string, data: StudentFormData }) => (await axios.patch(`/api/users/${id}`, data)).data;
const deleteStudent = async (id: string) => (await axios.delete(`/api/users/${id}`)).data;
const manualEnrollStudent = async ({ studentId, courseIds, duration }: { studentId: string; courseIds: string[]; duration?: string }): Promise<ManualEnrollResponse> => (
    await axios.post('/api/admin/students/manual-enroll', { studentId, courseIds, duration })
).data;

// --- Main Component ---
export default function AdminStudentsPage() {
    // --- RESTORED LOGIC ---
    const { user } = useAuth();
    const isAdmin = user?.role === Role.ADMIN;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
    const [enrollDuration, setEnrollDuration] = useState<'1_week' | '1_month'>('1_month');
    const [searchTerm, setSearchTerm] = useState('');
    const [courseFilter, setCourseFilter] = useState('all');
    const [monthFilter, setMonthFilter] = useState('all');
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
        queryKey: ['allCoursesForFilter', user?.role],
        queryFn: async () => {
            const endpoint = user?.role === Role.INSTRUCTOR ? '/api/courses?mine=1' : '/api/courses';
            return (await axios.get(endpoint)).data;
        },
    });

    const { data: students, isLoading } = useQuery<Student[]>({
        queryKey: ['adminStudents', debouncedSearchTerm, courseFilter, monthFilter],
        queryFn: () => fetchStudents(
            debouncedSearchTerm,
            courseFilter === 'all' ? '' : courseFilter,
            monthFilter === 'all' ? '' : monthFilter
        ),
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
            closeModal();
        },
    onError: (error: AxiosError<{ error?: string }>) => toast.error(error.response?.data?.error || error.message),
    };

    const createMutation = useMutation<
        { student: CreatedStudentResponse; enrollment: ManualEnrollResponse | null },
        AxiosError<{ error?: string }>,
        { data: StudentFormData; courseIds: string[] }
    >({
        mutationFn: async ({ data, courseIds }) => {
            const student = await createStudent(data) as CreatedStudentResponse;
            if (!courseIds.length) {
                return { student, enrollment: null };
            }
            const enrollment = await manualEnrollStudent({ studentId: student.id, courseIds });
            return { student, enrollment };
        },
        onSuccess: ({ enrollment }) => {
            queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
            if (enrollment) {
                const enrolledCount = enrollment.enrolledCourseIds.length;
                const skippedCount = enrollment.skippedCourseIds.length;
                toast.success(`Student created. ${enrolledCount} course(s) enrolled${skippedCount ? `, ${skippedCount} already active` : ''}.`);
            } else {
                toast.success('Student created successfully.');
            }
            closeModal();
        },
        onError: (error) => toast.error(error.response?.data?.error || error.message),
    });
    const updateMutation = useMutation({ mutationFn: updateStudent, ...mutationOptions });
    const deleteMutation = useMutation({ mutationFn: deleteStudent, ...mutationOptions });

    const openModalForCreate = () => {
        setEditingStudent(null);
        setSelectedCourseIds([]);
        reset({ name: '', email: '', phone: '', address: '', password: '', role: Role.STUDENT });
        setIsModalOpen(true);
    };

    const openModalForEdit = (student: Student) => {
        setEditingStudent(student);
        setSelectedCourseIds([]);
        setEnrollDuration('1_month');
        setValue('name', student.name);
        setValue('email', student.email);
        setValue('phone', student.phone || '');
        setValue('address', student.address || '');
        setValue('role', student.role);
        setIsModalOpen(true);
    };
    
    const closeModal = () => {
        setIsModalOpen(false);
        setEditingStudent(null);
        setSelectedCourseIds([]);
    };

    const toggleCourseSelection = (courseId: string) => {
        setSelectedCourseIds((current) =>
            current.includes(courseId)
                ? current.filter((id) => id !== courseId)
                : [...current, courseId]
        );
    };

    const onSubmit = async (data: StudentFormData) => {
        const payload: StudentFormData = { ...data, role: data.role ?? Role.STUDENT };
        if (editingStudent) {
            updateMutation.mutate({ id: editingStudent.id, data: payload });
            if (selectedCourseIds.length > 0) {
                try {
                    const result = await manualEnrollStudent({ studentId: editingStudent.id, courseIds: selectedCourseIds, duration: enrollDuration });
                    const enrolledCount = result.enrolledCourseIds.length;
                    const skippedCount = result.skippedCourseIds.length;
                    if (enrolledCount > 0) toast.success(`Enrolled in ${enrolledCount} course(s)${skippedCount ? `, ${skippedCount} already active` : ''}.`);
                    else toast.warning(`No new enrollments. ${skippedCount} course(s) already active.`);
                } catch {
                    toast.error('Failed to enroll student in selected courses.');
                }
            }
        } else {
            if (!payload.password) { toast.warning('Password is required for new students.'); return; }
            createMutation.mutate({ data: payload, courseIds: selectedCourseIds });
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <h1 className="text-3xl font-bold">Student Management</h1>
                <div className="flex flex-wrap items-center gap-3">
                    <select value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white min-w-[160px]">
                        <option value="all">All Courses</option>
                        {courses?.map(course => (<option key={course.id} value={course.id}>{course.title}</option>))}
                    </select>
                    <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="border rounded-lg px-3 py-2 bg-white min-w-[160px]">
                        {MONTH_OPTIONS.map(month => (<option key={month.value} value={month.value}>{month.label}</option>))}
                    </select>
                    <div className="relative w-full sm:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email..." className="pl-10 pr-4 py-2 border rounded-lg w-full sm:w-64"/>
                    </div>
                    <button type="button" onClick={openModalForCreate} className="btn-primary flex items-center justify-center w-full sm:w-auto"><Plus className="w-5 h-5 mr-2" /> Add Student</button>
                </div>
            </div>
            {/* Mobile course filter pills */}
            <div className="sm:hidden flex gap-2 overflow-x-auto border-b border-gray-200 pb-2 -mx-2 px-2">
                <button
                    type="button"
                    onClick={() => setCourseFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${courseFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                >
                    All
                </button>
                {courses?.map(course => (
                    <button
                        key={course.id}
                        type="button"
                        onClick={() => setCourseFilter(course.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${courseFilter === course.id ? 'bg-blue-600 text-white shadow' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
                        title={course.title}
                    >
                        {course.title}
                    </button>
                ))}
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="hidden sm:block w-full overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses & Scores</th>
                            <th className="relative px-4 sm:px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading && <tr><td colSpan={4} className="text-center p-8">Loading students...</td></tr>}
                        {!isLoading && (!students || students.length === 0) && (
                            <tr>
                                <td colSpan={4} className="text-center p-8 text-gray-500">No students found.</td>
                            </tr>
                        )}
                        {students?.map(student => (
                            <tr key={student.id}>
                                <td className="px-4 sm:px-6 py-4 whitespace-normal break-words">
                                    <div className="font-bold">{student.name}</div>
                                    <div className="text-sm font-bold text-gray-700" title={student.id}>Student ID: {formatStudentDisplayId(student.id)}</div>
                                    <div className="text-sm text-gray-500">{student.email}</div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm">
                                    <div className="text-gray-900">{student.phone || 'N/A'}</div>
                                    <div className="text-gray-500 max-w-[200px] sm:max-w-xs truncate">{student.address || 'N/A'}</div>
                                </td>
                                <td className="px-4 sm:px-6 py-4 text-sm">
                                    {student.courses.length > 0 ? (
                                        <ul className="space-y-1 list-disc list-inside">
                                            {student.courses.map(c => (
                                                <li key={c.courseTitle}>{c.courseTitle}: <span className="font-semibold">{c.highestScore?.toFixed(0) ?? 'N/A'}%</span></li>
                                            ))}
                                        </ul>
                                    ) : <span className="text-gray-400">No enrollments</span>}
                                </td>
                                <td className="px-4 sm:px-6 py-4 flex items-center space-x-2">
                                    {isAdmin ? (
                                        <>
                                            <button type="button" onClick={() => openModalForEdit(student)} className="p-2 text-gray-500 hover:text-blue-600"><Edit className="w-4 h-4" /></button>
                                            <button type="button" onClick={() => handleDelete(student.id)} className="p-2 text-gray-500 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                                        </>
                                    ) : (
                                        <span className="text-xs text-gray-400">View only</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
                {/* Mobile card view */}
                <div className="sm:hidden">
                    {isLoading && (
                        <div className="p-4 text-center text-gray-500">Loading students...</div>
                    )}
                    {!isLoading && (!students || students.length === 0) && (
                        <div className="p-6 text-center text-gray-500">No students found.</div>
                    )}
                    <ul className="divide-y divide-gray-200">
                        {students?.map((student) => (
                            <li key={student.id} className="p-4">
                                <div className="font-semibold text-gray-900">{student.name}</div>
                                <div className="text-sm font-bold text-gray-700" title={student.id}>Student ID: {formatStudentDisplayId(student.id)}</div>
                                <div className="text-sm text-gray-500 break-words">{student.email}</div>
                                <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                                    <div><span className="text-gray-500">Phone: </span><span className="text-gray-900">{student.phone || 'N/A'}</span></div>
                                    <div><span className="text-gray-500">Address: </span><span className="text-gray-900 break-words">{student.address || 'N/A'}</span></div>
                                </div>
                                <div className="mt-3">
                                    <div className="text-sm text-gray-500 mb-1">Courses & Scores</div>
                                    {student.courses.length > 0 ? (
                                        <ul className="text-sm list-disc list-inside space-y-1">
                                            {student.courses.map((c) => (
                                                <li key={c.courseTitle} className="break-words">
                                                    {c.courseTitle}: <span className="font-semibold">{c.highestScore?.toFixed(0) ?? 'N/A'}%</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-gray-400">No enrollments</div>
                                    )}
                                </div>
                                {isAdmin ? (
                                    <div className="mt-4 grid grid-cols-2 gap-2">
                                        <button type="button" onClick={() => openModalForEdit(student)} className="btn-secondary w-full">Edit</button>
                                        <button type="button" onClick={() => handleDelete(student.id)} className="btn-danger w-full">Delete</button>
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </div>
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
                    {editingStudent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enroll in Additional Courses</label>
                            <div className="mb-2">
                                <label className="block text-xs text-gray-500 mb-1">Access Duration</label>
                                <select
                                    value={enrollDuration}
                                    onChange={(e) => setEnrollDuration(e.target.value as '1_week' | '1_month')}
                                    className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                >
                                    <option value="1_week">1 Week</option>
                                    <option value="1_month">1 Month</option>
                                </select>
                            </div>
                            <div className="max-h-44 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
                                {courses && courses.length > 0 ? courses.map((course) => (
                                    <label key={course.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourseIds.includes(course.id)}
                                            onChange={() => toggleCourseSelection(course.id)}
                                        />
                                        <span className="text-sm text-gray-700">{course.title}</span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-gray-500 px-2 py-1">No courses available.</p>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Selected courses will be approved instantly for the chosen duration. Already-active enrollments will be skipped.</p>
                        </div>
                    )}
                    {editingStudent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                            <select
                                {...register('role')}
                                defaultValue={editingStudent.role}
                                disabled={!isAdmin}
                                className="w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value={Role.STUDENT}>Student</option>
                                <option value={Role.INSTRUCTOR}>Instructor</option>
                                <option value={Role.ADMIN}>Admin</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-500">Changing role will immediately update this user&apos;s access. Promoted users will no longer appear in the student list.</p>
                        </div>
                    )}
                    {!editingStudent ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Enroll Courses (Optional, multiple)</label>
                            <div className="max-h-44 overflow-auto rounded-md border border-gray-200 p-2 space-y-1">
                                {courses && courses.length > 0 ? courses.map((course) => (
                                    <label key={course.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={selectedCourseIds.includes(course.id)}
                                            onChange={() => toggleCourseSelection(course.id)}
                                        />
                                        <span className="text-sm text-gray-700">{course.title}</span>
                                    </label>
                                )) : (
                                    <p className="text-sm text-gray-500 px-2 py-1">No courses available.</p>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Selected courses will be approved instantly so the student can access them directly.</p>
                        </div>
                    ) : null}
                    {!editingStudent && (<Input label="Password" registration={register('password')} error={errors.password?.message} type="password" />)}
                    <div className="flex flex-col sm:flex-row justify-end pt-4 gap-2">
                        <button type="button" onClick={closeModal} className="btn-secondary w-full sm:w-auto">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary w-full sm:w-auto">
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}