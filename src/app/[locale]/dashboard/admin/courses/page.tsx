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
import { Plus, Edit, Trash2, BookCopy, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
import { ManageContentModal } from '@/components/admin/ManageContentModal';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { toast } from '@/components/ui/toast';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { format, isPast } from 'date-fns';

// --- Zod Schema (Corrected) ---
const courseSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  price: z.coerce.number({ message: 'Price must be a valid number.' }).min(0, { message: "Price cannot be negative." }),
  courseType: z.enum(['ONE_TIME_PURCHASE', 'SUBSCRIPTION'], { message: 'Please select a course type' }),
  tutor: z.string().optional(),
  whatsappGroupLink: z.string().url({ message: 'A valid URL is required' }).optional().or(z.literal('')),
  image: z.custom<FileList>().optional(),
});
type CourseFormData = z.infer<typeof courseSchema>;

type Payment = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  studentName: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  courseType: 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION';
  subscriptionExpiryDate: string | null;
};

type ForceExtendConflict = {
  requiresForce: true;
  error: string;
  conflictPaymentId: string;
  conflictExpiry: string;
};

// --- API Functions ---
const fetchCourses = async (): Promise<Course[]> => (await axios.get('/api/courses')).data;
const fetchPayments = async (): Promise<Payment[]> => (await axios.get('/api/payments')).data;
const createCourse = async (data: FormData): Promise<Course> => (await axios.post('/api/courses', data)).data;
const updateCourse = async ({ id, data }: { id: string; data: FormData }): Promise<Course> => (await axios.patch(`/api/courses/${id}`, data)).data;
const deleteCourse = async (id: string): Promise<void> => (await axios.delete(`/api/courses/${id}`)).data;
const forceExtendSubscription = ({ paymentId, force }: { paymentId: string; force?: boolean }) =>
  axios.patch(`/api/payments/${paymentId}/force-extend`, { force: force ?? false });

export default function AdminCoursesPage() {
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [subscriptionCourse, setSubscriptionCourse] = useState<Course | null>(null);
  const [pricingType, setPricingType] = useState<'PAID' | 'FREE'>('PAID');
  const [courseType, setCourseType] = useState<'ONE_TIME_PURCHASE' | 'SUBSCRIPTION'>('ONE_TIME_PURCHASE');
  const [confirmForceExtendPaymentId, setConfirmForceExtendPaymentId] = useState<string | null>(null);
  const [forceExtendConflict, setForceExtendConflict] = useState<ForceExtendConflict | null>(null);
  const queryClient = useQueryClient();
  
  const { data: courses, isLoading } = useQuery<Course[]>({ queryKey: ['courses'], queryFn: fetchCourses });
  const { data: payments, isLoading: isPaymentsLoading } = useQuery<Payment[]>({
    queryKey: ['payments'],
    queryFn: fetchPayments,
    enabled: !!subscriptionCourse,
  });
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      courseType: 'ONE_TIME_PURCHASE',
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
  const forceExtendMutation = useMutation({
    mutationFn: forceExtendSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setForceExtendConflict(null);
      setConfirmForceExtendPaymentId(null);
      toast.success('Subscription extended by 1 week.');
    },
    onError: (error: AxiosError<ForceExtendConflict & { error?: string }>) => {
      const data = error.response?.data;
      if (data?.requiresForce) {
        setForceExtendConflict(data);
      } else {
        toast.error(data?.error || error.message);
      }
    },
  });

  const openModalForCreate = () => {
    setSelectedCourse(null);
    setPricingType('PAID');
    setCourseType('ONE_TIME_PURCHASE');
    reset({ title: '', description: '', price: 0, courseType: 'ONE_TIME_PURCHASE', tutor: '', whatsappGroupLink: '' });
    setIsCourseModalOpen(true);
  };
  const openModalForEdit = (course: Course) => {
    setSelectedCourse(course);
    setPricingType(course.price === 0 ? 'FREE' : 'PAID');
    setCourseType(course.courseType as 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION');
    setValue('title', course.title);
    setValue('description', course.description);
    setValue('price', course.price);
    setValue('courseType', course.courseType as 'ONE_TIME_PURCHASE' | 'SUBSCRIPTION');
    setValue('tutor', course.tutor || '');
    setValue('whatsappGroupLink', course.whatsappGroupLink || '');
    setIsCourseModalOpen(true);
  };
  const openContentManager = (course: Course) => { setSelectedCourse(course); setIsContentModalOpen(true); };
  const openSubscriptionManager = (course: Course) => {
    setSubscriptionCourse(course);
    setForceExtendConflict(null);
    setConfirmForceExtendPaymentId(null);
  };
  const closeSubscriptionManager = () => {
    setSubscriptionCourse(null);
    setForceExtendConflict(null);
    setConfirmForceExtendPaymentId(null);
  };
  
  const onSubmit = (data: CourseFormData) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    const normalizedPrice = pricingType === 'FREE' ? 0 : data.price;
    formData.append('price', String(normalizedPrice));
    formData.append('courseType', courseType);
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

  const handleForceExtend = (paymentId: string) => {
    setConfirmForceExtendPaymentId(paymentId);
    setForceExtendConflict(null);
    forceExtendMutation.mutate({ paymentId, force: false });
  };

  const handleForceExtendConfirmed = () => {
    if (!confirmForceExtendPaymentId) return;
    forceExtendMutation.mutate({ paymentId: confirmForceExtendPaymentId, force: true });
  };

  const subscriptionPayments = payments?.filter((payment) =>
    payment.courseId === subscriptionCourse?.id &&
    payment.courseType === 'SUBSCRIPTION' &&
    payment.status === 'APPROVED'
  ) ?? [];

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
                      <p className="text-sm font-semibold text-green-600 whitespace-nowrap">{course.price === 0 ? 'Free' : formatCurrency(course.price)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.courseType === 'SUBSCRIPTION' ? '📅 Monthly Subscription' : '🔓 One-Time Purchase'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button onClick={() => openContentManager(course)} className="btn-secondary p-2 w-full sm:w-auto" title="Manage Content"><BookCopy className="w-5 h-5 mx-auto" /></button>
                    {course.courseType === 'SUBSCRIPTION' && (
                      <button
                        onClick={() => openSubscriptionManager(course)}
                        className="btn-secondary p-2 w-full sm:w-auto text-purple-700 border-purple-300 hover:bg-purple-50"
                        title="Manage subscription extensions"
                        type="button"
                      >
                        <RefreshCw className="w-5 h-5 mx-auto" />
                      </button>
                    )}
                    <button onClick={() => openModalForEdit(course)} className="btn-secondary p-2 w-full sm:w-auto" title="Edit Course"><Edit className="w-5 h-5 mx-auto" /></button>
                    <button onClick={() => handleDelete(course.id)} className="btn-danger p-2 w-full sm:w-auto" title="Delete Course"><Trash2 className="w-5 h-5 mx-auto" /></button>
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
                  if (value === 'FREE') {
                    setValue('price', 0, { shouldValidate: true });
                  }
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

      {subscriptionCourse && (
        <Modal isOpen={!!subscriptionCourse} onClose={closeSubscriptionManager} title={`Extend Subscriptions: ${subscriptionCourse.title}`}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Extend approved subscription payments for this course by 1 week.
            </p>

            {isPaymentsLoading ? (
              <div className="py-8 text-sm text-gray-500">Loading subscriptions...</div>
            ) : subscriptionPayments.length === 0 ? (
              <div className="py-8 text-sm text-gray-500">No approved subscription payments found for this course.</div>
            ) : (
              <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {subscriptionPayments.map((payment) => {
                  const isExpired = payment.subscriptionExpiryDate ? isPast(new Date(payment.subscriptionExpiryDate)) : false;
                  const isSubmitting = forceExtendMutation.isPending && confirmForceExtendPaymentId === payment.id;

                  return (
                    <div key={payment.id} className={`border rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isExpired ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'}`}>
                      <div>
                        <div className="font-semibold text-gray-900">{payment.studentName}</div>
                        <div className="text-sm text-gray-500">Payment ID: {payment.id}</div>
                        <div className={`text-sm mt-1 ${isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                          {payment.subscriptionExpiryDate
                            ? `${isExpired ? 'Expired on' : 'Active until'} ${format(new Date(payment.subscriptionExpiryDate), 'PPPp')}`
                            : 'No expiry date set yet'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleForceExtend(payment.id)}
                        disabled={isSubmitting}
                        className="btn-secondary flex items-center justify-center text-purple-700 border-purple-300 hover:bg-purple-50 min-w-36"
                        title="Extend this subscription by 1 week"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Extend 1 Week
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}

      {forceExtendConflict && confirmForceExtendPaymentId && (
        <Modal isOpen={!!forceExtendConflict} onClose={() => { setForceExtendConflict(null); setConfirmForceExtendPaymentId(null); }} title="Subscription Conflict Detected">
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-900">Active subscription already exists</p>
                <p className="text-sm text-orange-800 mt-1">
                  This student already has an active approved subscription for this course that expires on <strong>{format(new Date(forceExtendConflict.conflictExpiry), 'PPP')}</strong>.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Do you want to force-extend this payment anyway? This adds 1 week to the selected payment without changing the other active subscription record.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" className="btn-secondary" onClick={() => { setForceExtendConflict(null); setConfirmForceExtendPaymentId(null); }}>
                Cancel
              </button>
              <button type="button" className="btn-primary bg-orange-600 hover:bg-orange-700 border-orange-600" onClick={handleForceExtendConfirmed} disabled={forceExtendMutation.isPending}>
                {forceExtendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2 inline" /> : null}
                Force Extend Anyway
              </button>
            </div>
          </div>
        </Modal>
      )}

      {selectedCourse && (<ManageContentModal isOpen={isContentModalOpen} onClose={() => setIsContentModalOpen(false)} course={selectedCourse}/>)}
    </div>
  );
}