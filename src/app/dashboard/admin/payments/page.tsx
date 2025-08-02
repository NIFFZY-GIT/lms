'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Image from 'next/image'; // Import the Next.js Image component for optimization

// --- Type Definitions ---
type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
interface Payment {
  id: string;
  status: PaymentStatus;
  receiptUrl: string;
  createdAt: string;
  studentName: string;
  courseTitle: string;
}

// --- API Functions ---
const fetchPayments = async (): Promise<Payment[]> => (await axios.get('/api/payments')).data;
const approvePayment = ({ paymentId, referenceNumber }: { paymentId: string, referenceNumber: string }) => 
  axios.patch(`/api/payments/${paymentId}/approve`, { referenceNumber });
const rejectPayment = (paymentId: string) => 
  axios.patch(`/api/payments/${paymentId}/reject`);


// --- Helper Components ---
const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const styles = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
  };
  const icons = {
    PENDING: <Clock className="w-4 h-4 mr-1.5" />,
    APPROVED: <CheckCircle className="w-4 h-4 mr-1.5" />,
    REJECTED: <XCircle className="w-4 h-4 mr-1.5" />,
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};


// --- Main Component ---
export default function AdminPaymentsPage() {
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
    const [refNumber, setRefNumber] = useState('');
    const [filter, setFilter] = useState<PaymentStatus | 'ALL'>('PENDING');
    const queryClient = useQueryClient();

    const { data: payments, isLoading } = useQuery<Payment[]>({
        queryKey: ['payments'],
        queryFn: fetchPayments,
    });

    const mutationOptions = {
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            setSelectedPayment(null);
            setRefNumber('');
        },
        onError: (error: AxiosError<{ error?: string }>) => {
            const errorMessage = error.response?.data?.error || error.message;
            alert(`Action failed: ${errorMessage}`);
        }
    };

    const approveMutation = useMutation({ mutationFn: approvePayment, ...mutationOptions });
    const rejectMutation = useMutation({ mutationFn: rejectPayment, ...mutationOptions });

    const handleApprove = () => {
        if (!selectedPayment) return;
        approveMutation.mutate({ paymentId: selectedPayment.id, referenceNumber: refNumber });
    };

    const handleReject = () => {
        if (!selectedPayment) return;
        if (window.confirm('Are you sure you want to reject this payment?')) {
            rejectMutation.mutate(selectedPayment.id);
        }
    };

    const filteredPayments = payments?.filter(p => filter === 'ALL' || p.status === filter);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Payment Management</h1>

            {/* Filter Buttons */}
            <div className="flex space-x-2 mb-6 border-b pb-4">
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        {status.charAt(0) + status.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* Payments Table/List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {isLoading && <p>Loading payments...</p>}
                {!isLoading && filteredPayments?.length === 0 && (
                    <p className="text-gray-500">No payments found for this status.</p>
                )}
                <div className="space-y-4">
                    {filteredPayments?.map(payment => (
                        <div key={payment.id} className="p-4 border rounded-lg flex flex-wrap justify-between items-center gap-4">
                            <div className="flex-grow">
                                <p className="font-bold text-gray-800">{payment.studentName}</p>
                                <p className="text-gray-600">{payment.courseTitle}</p>
                                <p className="text-sm text-gray-500 mt-1">Submitted: {format(new Date(payment.createdAt), 'PPpp')}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <StatusBadge status={payment.status} />
                                {payment.status === 'PENDING' && (
                                    <button onClick={() => setSelectedPayment(payment)} className="btn-secondary flex items-center">
                                        <Eye className="w-4 h-4 mr-2" /> Review
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- REVIEW MODAL --- (The main changes are here) */}
            {selectedPayment && (
                <Modal 
                    isOpen={!!selectedPayment} 
                    onClose={() => setSelectedPayment(null)} 
                    title="Review Payment"
                    // Make the modal wider to fit the image
                    size="3xl" 
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Side: Receipt Image */}
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900">Uploaded Receipt</h3>
                            <div className="border rounded-lg p-2 bg-gray-100">
                                {/* Using a standard <img> tag is simplest for external URLs. */}
                                {/* If your URLs are from a known domain, you can configure next.config.js to use <Image> */}
                                <img
                                    src={selectedPayment.receiptUrl} 
                                    alt="Payment Receipt" 
                                    className="w-full h-auto rounded-md object-contain max-h-[400px]"
                                />
                            </div>
                            <a href={selectedPayment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">
                                Open image in new tab
                            </a>
                        </div>

                        {/* Right Side: Details and Actions */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">Submission Details</h3>
                                <p><strong>Student:</strong> {selectedPayment.studentName}</p>
                                <p><strong>Course:</strong> {selectedPayment.courseTitle}</p>
                                <p className="text-sm text-gray-500"><strong>Submitted At:</strong> {format(new Date(selectedPayment.createdAt), 'PPpp')}</p>
                            </div>
                            <hr />
                            <div>
                                <label htmlFor="refNumber" className="block text-sm font-medium text-gray-700">Bank Reference Number</label>
                                <input 
                                    id="refNumber"
                                    type="text"
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="Enter Ref# from receipt..."
                                />
                                <p className="text-xs text-gray-500 mt-1">This is required for approval and fraud prevention.</p>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4">
                                <button onClick={handleReject} disabled={rejectMutation.isPending} className="btn-danger">
                                   {rejectMutation.isPending ? 'Rejecting...' : 'Reject'}
                                </button>
                                <button onClick={handleApprove} disabled={!refNumber || approveMutation.isPending} className="btn-primary">
                                    {approveMutation.isPending ? 'Approving...' : 'Approve Payment'}
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}